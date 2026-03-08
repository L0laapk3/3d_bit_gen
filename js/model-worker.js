/**
 * Web Worker for JSCAD model generation + STL serialization.
 */

let jscad = null;
let serializer = null;
let bitTypesMap = null;

async function init() {
  jscad = await import('https://esm.sh/@jscad/modeling@2.12.2');
  serializer = await import('https://esm.sh/@jscad/stl-serializer@2.1.17');
  postMessage({ type: 'ready' });
}

// ---- Text helpers ----
function getTextPolylines(text, charHeight, lineWidth) {
  // letterSpacing > 1 ensures the inter-character gap stays at least one stroke width
  // after the hullChain expansion fills each stroke outward by lineWidth/2 on both sides.
  // Extra advance needed = lineWidth; expressed as a fraction of the typical glyph advance (~charHeight).
  const letterSpacing = 1 + lineWidth / 2 / charHeight;
  try { return jscad.text.vectorText({ input: text, height: charHeight, xOffset: 0, yOffset: 0, letterSpacing }); }
  catch { return null; }
}

function measurePolylines(polylines) {
  if (!polylines || polylines.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const pl of polylines) for (const p of pl) {
    if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1];
  }
  return { width: maxX - minX, height: maxY - minY, minX, maxX, minY, maxY };
}

function normalizePolylines(polylines, mirror) {
  let mirrorCx = 0;
  if (mirror) {
    let minX = Infinity, maxX = -Infinity;
    for (const pl of polylines) for (const p of pl) {
      if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
    }
    mirrorCx = (minX + maxX) / 2;
  }
  const norm = [];
  for (const pl of polylines) {
    if (pl.length < 2) continue;
    const pts = pl.map(p => [mirror ? (2 * mirrorCx - p[0]) : p[0], p[1]]);
    if (mirror) pts.reverse();
    norm.push(pts);
  }
  return norm;
}

// Build a single unified 2D shape for all text polylines.
// Uses the official JSCAD approach from their own text.js example:
// place a circle at every vertex, then hullChain consecutive circles.
// hullChain produces clean convex capsule segments with no shared/zero-thickness
// edges at joints — the root cause of one-sided walls in letters like "8".
function buildTextGeom2D(polylines, lineWidth) {
  const { circle } = jscad.primitives;
  const { hullChain } = jscad.hulls;
  const { union } = jscad.booleans;
  const { translate } = jscad.transforms;
  if (!polylines || polylines.length === 0) return null;

  const r = Math.max(lineWidth, 0.05) / 2;
  const dot = circle({ radius: r, segments: 16 });
  const shapes = [];

  for (const pts of polylines) {
    if (!pts || pts.length < 2) continue;
    try {
      const corners = pts.map(([x, y]) => translate([x, y], dot));
      shapes.push(hullChain(...corners));
    } catch { }
  }

  if (shapes.length === 0) return null;
  try {
    return shapes.length === 1 ? shapes[0] : union(...shapes);
  } catch {
    return shapes[0];
  }
}


// ---- Built Shape 2D ----
function buildBitShape2D(geomArr, scale) {
  const { polygon, circle, ellipse } = jscad.primitives;
  const { union, subtract } = jscad.booleans;
  const { translate } = jscad.transforms;
  const { expand } = jscad.expansions;

  let base = null;
  let cuts = [];

  for (const g of geomArr) {
    let shape = null;
    if (g.type === 'line') {
      const p1 = [(g.x1 - 12) * scale, -(g.y1 - 12) * scale];
      const p2 = [(g.x2 - 12) * scale, -(g.y2 - 12) * scale];
      const lw = g.w * scale;
      shape = expand({ delta: lw/2, corners: 'round', segments: 16 }, jscad.primitives.line([p1, p2]));
    } else if (g.type === 'polygon') {
      const pts = g.points.map(p => [(p[0] - 12) * scale, -(p[1] - 12) * scale]).reverse();
      shape = polygon({ points: pts });
    } else if (g.type === 'circle' || g.type === 'circle_cut') {
      shape = translate([(g.cx - 12) * scale, -(g.cy - 12) * scale], circle({ radius: g.r * scale, segments: 32 }));
    } else if (g.type === 'ellipse') {
      shape = translate([(g.cx - 12) * scale, -(g.cy - 12) * scale], ellipse({ radius: [g.rx * scale, g.ry * scale], segments: 32 }));
    }

    if (shape) {
      if (g.type === 'circle_cut') cuts.push(shape);
      else base = base ? union(base, shape) : shape;
    }
  }

  if (base && cuts.length > 0) {
    base = subtract(base, ...cuts);
  }
  return base;
}

// ---- Model builder ----

function buildModel(config) {
  const { cuboid, cylinder, roundedRectangle, circle } = jscad.primitives;
  const { subtract, union, intersect } = jscad.booleans;
  const { translate, rotate, scale } = jscad.transforms;
  const { extrudeLinear } = jscad.extrusions;

  const {
    rowMode, labelBothSides,
    row1SlotCount, row2SlotCount,
    padding, holeDepth, hexWidth, labelDepth,
    cornerRadius = 1, plateHeight: cfgPlateHeight,
    textLineWidth = 0.5,
    row1Slots, row2Slots
  } = config;

  const isDouble = rowMode === 'double';
  const edgeMargin = padding;
  const hexFlatToFlat = hexWidth;
  const hexTipToTip = hexWidth / Math.cos(Math.PI / 6);
  const hexRadius = hexTipToTip / 2;
  const effLabelDepth = Math.max(labelDepth, 0.1);
  const baseThickness = 2;

  const row1Count = row1SlotCount;
  const row2Count = isDouble ? row2SlotCount : 0;
  const maxCount = Math.max(row1Count, row2Count);
  const slotPitch = hexTipToTip + padding;

  // Ensure minimum dimensional bounding even for 0 slots.
  const plateWidth = Math.max(0.1, maxCount * slotPitch + padding);
  const plateHeight = Math.max(1, cfgPlateHeight || (holeDepth + baseThickness));
  const plateDepth = Math.max(0.1, isDouble
    ? 2 * hexFlatToFlat + 3 * padding
    : hexFlatToFlat + 2 * padding);

  // Base setup
  const effCornerRadius = Math.min(Math.max(cornerRadius, 0), plateWidth / 2 - 0.1, plateDepth / 2 - 0.1, 10);
  let model;
  if (effCornerRadius > 0.05) {
    const profile = roundedRectangle({ size: [plateWidth, plateDepth], roundRadius: effCornerRadius, segments: 16 });
    let block = extrudeLinear({ height: plateHeight }, profile);
    block = translate([0, 0, -plateHeight / 2], block);
    // Rotate so Z->Y
    // Old Y [-pD/2, pD/2] -> new -Z. Old Z [-pH/2, pH/2] -> new Y.
    // X -> X.
    model = rotate([Math.PI / 2, 0, 0], block);
  } else {
    model = cuboid({ size: [plateWidth, plateHeight, plateDepth] });
  }

  model = translate([0, plateHeight / 2, 0], model);

  const toSubtract = [];
  const toAdd = [];

  function getSlotXPositions(count) {
    const totalWidth = count * slotPitch - padding;
    const startX = -totalWidth / 2 + hexTipToTip / 2;
    return Array.from({ length: count }, (_, i) => startX + i * slotPitch);
  }

  const row1Z = isDouble ? plateDepth / 2 - edgeMargin - hexFlatToFlat / 2 : 0;
  const row2Z = isDouble ? -plateDepth / 2 + edgeMargin + hexFlatToFlat / 2 : 0;

  function addHexHole(x, z) {
    let hex = cylinder({ radius: hexRadius, height: holeDepth + 1, segments: 6 });
    hex = rotate([Math.PI / 2, 0, 0], hex);
    const holeTopY = plateHeight + 0.5;
    const holeCenterY = holeTopY - (holeDepth + 1) / 2;
    hex = translate([x, holeCenterY, z], hex);
    toSubtract.push(hex);
  }

  const textGap = 1.0;
  const charH = Math.min(hexFlatToFlat * 0.28, plateHeight * 0.3);
  const maxTextW = hexFlatToFlat + padding * 0.5;

  let globalTextH = 0;
  function measureTextH(text) {
    if (!text || !text.trim()) return 0;
    let polylines = getTextPolylines(text.trim(), charH, textLineWidth);
    if (!polylines) return 0;
    let m = measurePolylines(polylines);
    if (!m || m.width <= 0) return 0;
    if (m.width > maxTextW) {
      const sx = maxTextW / m.width;
      polylines = polylines.map(pl => pl.map(p => [p[0]*sx, p[1]]));
      m = measurePolylines(polylines);
    }
    return m.height;
  }

  const allSlots = [...row1Slots.slice(0, row1Count)];
  if (isDouble && row2Count > 0) allSlots.push(...row2Slots.slice(0, row2Count));
  for (const slot of allSlots) {
    if (slot && slot.label) globalTextH = Math.max(globalTextH, measureTextH(slot.label));
  }

  function createPillGroup(bitTypeId, labelText) {
    const logoSize = hexFlatToFlat * 0.85;
    let textW = 0, textH = 0, text2Ds = null, textYStart = 0;

    if (labelText && labelText.trim()) {
      let polylines = getTextPolylines(labelText.trim(), charH, textLineWidth);
      if (polylines) {
        let m = measurePolylines(polylines);
        if (m && m.width > 0) {
          if (m.width > maxTextW) {
             const sx = maxTextW / m.width;
             polylines = polylines.map(pl => pl.map(p => [p[0]*sx, p[1]]));
             m = measurePolylines(polylines);
          }
          polylines = normalizePolylines(polylines, false); // NO MIRROR HERE, DONE AT PLACEMENT
          // Center text horizontally around X=0
          const cx = -(m.minX + m.width / 2);
          polylines = polylines.map(pl => pl.map(p => [p[0] + cx, p[1]]));

          text2Ds = buildTextGeom2D(polylines, textLineWidth);
          textW = m.width;
          textH = m.height;
          textYStart = -m.maxY; // Top of text sits at Local Y=0
        }
      }
    }

    const totalH = globalTextH > 0 ? logoSize + textGap + globalTextH : logoSize;
    let groupScale = Math.max(0.05, Math.min(1, (plateHeight - 2.5) / totalH));

    const logoY = globalTextH > 0 ? (totalH / 2) - (logoSize / 2) : 0;
    const textContainerTopY = globalTextH > 0 ? logoY - (logoSize / 2) - textGap : 0;

    // Cutouts are double the inset depth, centered on the face plane to avoid coplanar z-fighting.
    // In local group space, Z=0 is the face surface. Shapes extend ±(effLabelDepth + epsilon).
    const cutHalf = effLabelDepth + 0.1;
    const cutHeight = cutHalf * 2;

    // 1. Negative Circle (Logo background subtracted)
    let circleSub3D = circle({ radius: (logoSize / 2) * groupScale, segments: 32 });
    circleSub3D = translate([0, logoY * groupScale, 0], circleSub3D);
    circleSub3D = extrudeLinear({ height: cutHeight }, circleSub3D);
    circleSub3D = translate([0, 0, -cutHalf], circleSub3D);

    const subParts = [circleSub3D];

    // 2. Negative Text (subtracted) — single unified 2D shape extruded once
    if (text2Ds) {
      let t = scale([groupScale, groupScale, 1], text2Ds);
      t = translate([0, (textContainerTopY + textYStart) * groupScale, 0], t);
      const t3d = extrudeLinear({ height: cutHeight }, t);
      subParts.push(translate([0, 0, -cutHalf], t3d));
    }

    // 3. Positive Symbol (added inside the negative circle — clipped to circle bounds)
    let symbolAdd3D = null;
    const bType = bitTypesMap[bitTypeId] || bitTypesMap['phillips'];
    if (bType && bType.geom) {
       const b2D = buildBitShape2D(bType.geom, (logoSize / 20) * groupScale);
       if (b2D) {
          const sym2D = translate([0, logoY * groupScale, 0], b2D);
          let symExtruded = extrudeLinear({ height: cutHalf }, sym2D);
          symExtruded = translate([0, 0, -cutHalf], symExtruded);

          // Clip symbol strictly to the logo circle so it cannot fill adjacent text engravings
          const clipCircle2D = circle({ radius: (logoSize / 2) * groupScale, segments: 32 });
          const clipCircle2DPos = translate([0, logoY * groupScale, 0], clipCircle2D);
          let clipCyl = extrudeLinear({ height: cutHalf }, clipCircle2DPos);
          clipCyl = translate([0, 0, -cutHalf], clipCyl);

          symbolAdd3D = intersect(symExtruded, clipCyl);
       }
    }

    return { sub3D: subParts, add3D: symbolAdd3D };
  }

  function placePill(x, z, isFront, bitTypeId, labelText) {
    const pGroup = createPillGroup(bitTypeId, labelText);
    const faceZ = isFront ? plateDepth / 2 : -plateDepth / 2;
    const rotY = isFront ? 0 : Math.PI;
    // Cutouts are centered on the face plane (startZ = faceZ); the group geometry
    // already extends ±effLabelDepth around Z=0 in local space.
    const startZ = faceZ;

    // Z extrude directions:
    // With 0 rotation: extrude goes +Z (so z=0 to z=effLabelDepth)
    // If we want it on front face (Z+), we want it extending outwards from faceZ - effLabelDepth.
    // Meaning z=0 is faceZ - effLabelDepth, z=h is faceZ. Perfect.
    // For back face (Z-): we rotate 180 degrees.
    // Extrude of +Z rotated by 180 degrees becomes -Z extrude!
    // So if placed at z = startZ (which is faceZ + effLabelDepth), it goes in -Z direction to faceZ! Perfect.

    const applyTransform = (geom) => {
      if (!geom) return null;
      let g = geom;
      if (rotY) g = rotate([0, rotY, 0], g); // Rotations mirror X correctly for text!
      g = translate([x, plateHeight / 2, startZ], g);
      return g;
    };

    if (pGroup.sub3D) {
      for (const s of pGroup.sub3D) {
        toSubtract.push(applyTransform(s));
      }
    }
    if (pGroup.add3D) toAdd.push(applyTransform(pGroup.add3D));
  }

  const row1Xs = getSlotXPositions(row1Count);
  for (let i = 0; i < row1Count; i++) {
    addHexHole(row1Xs[i], row1Z);
    const slot = row1Slots[i] || {};
    placePill(row1Xs[i], row1Z, true, slot.bitType, slot.label);
    if (!isDouble && labelBothSides) {
      placePill(row1Xs[i], row1Z, false, slot.bitType, slot.label);
    }
  }

  if (isDouble && row2Count > 0) {
    const row2Xs = getSlotXPositions(row2Count);
    for (let i = 0; i < row2Count; i++) {
      addHexHole(row2Xs[i], row2Z);
      const slot = row2Slots[i] || {};
      placePill(row2Xs[i], row2Z, false, slot.bitType, slot.label);
    }
  }

  if (toSubtract.length > 0) {
    try { model = subtract(model, toSubtract.length === 1 ? toSubtract[0] : union(...toSubtract)); }
    catch (e) {
      console.warn('Batch subtract failed, sequential:', e.message);
      for (const s of toSubtract) { try { model = subtract(model, s); } catch { } }
    }
  }
  if (toAdd.length > 0) {
    try { model = union(model, ...toAdd); }
    catch (e) {
      console.warn('Batch add failed, sequential:', e.message);
      for (const a of toAdd) { try { model = union(model, a); } catch { } }
    }
  }

  // User requested slicers expect Z up. Rotate around X by +90 deg.
  model = rotate([Math.PI / 2, 0, 0], model);
  return model;
}

function geometryToSTLBuffer(geometry) {
  const rawData = serializer.serialize({ binary: true }, geometry);
  if (rawData.length === 1) return rawData[0];
  const totalLen = rawData.reduce((sum, buf) => sum + buf.byteLength, 0);
  const merged = new Uint8Array(totalLen);
  let offset = 0;
  for (const buf of rawData) { merged.set(new Uint8Array(buf), offset); offset += buf.byteLength; }
  return merged.buffer;
}

self.onmessage = async (e) => {
  const { type, config, bitTypes } = e.data;
  if (type === 'build') {
    if (bitTypes) {
      bitTypesMap = {};
      for (const bt of bitTypes) { bitTypesMap[bt.id] = bt; }
    }
    try {
      if (!jscad) await init();
      const geometry = buildModel(config);
      const stlBuffer = geometryToSTLBuffer(geometry);
      postMessage({ type: 'result', stlBuffer }, [stlBuffer]);
    } catch (err) {
      postMessage({ type: 'error', message: err.message || String(err) });
    }
  }
};

init().catch(err => postMessage({ type: 'error', message: 'Worker init failed: ' + err.message }));
