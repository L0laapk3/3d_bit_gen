/**
 * JSCAD-based 3D model generator for screw bit holders.
 *
 * Coordinate system:
 *   X = width (along row of bits)
 *   Y = height/thickness (vertical, thin dimension)
 *   Z = depth (front-to-back, grows with double row)
 *
 * The holder lies flat with hex holes opening from the top (Y+).
 * Labels go on the front (Z+) and back (Z-) faces.
 */

let jscad = null;

export async function initModeling() {
  if (jscad) return;
  jscad = await import('https://esm.sh/@jscad/modeling@2.12.2');
}

import { getBitType } from './bit-types.js';

// ---- 2D shape builders for bit type logos ----

function createCrossShape(size) {
  const { rectangle } = jscad.primitives;
  const { union } = jscad.booleans;
  const w = size * 0.28, h = size * 0.9;
  return union(rectangle({ size: [w, h] }), rectangle({ size: [h, w] }));
}

function createSlotShape(size) {
  return jscad.primitives.rectangle({ size: [size * 0.9, size * 0.25] });
}

function createPozidriveShape(size) {
  const { rectangle } = jscad.primitives;
  const { union } = jscad.booleans;
  const { rotate } = jscad.transforms;
  const w = size * 0.25, h = size * 0.9;
  return union(
    rectangle({ size: [w, h] }), rectangle({ size: [h, w] }),
    rotate([0, 0, Math.PI / 4], rectangle({ size: [size * 0.12, size * 0.6] })),
    rotate([0, 0, -Math.PI / 4], rectangle({ size: [size * 0.12, size * 0.6] }))
  );
}

function createSquareShape(size) {
  return jscad.primitives.rectangle({ size: [size * 0.55, size * 0.55] });
}

function createRegularPolygon2D(size, sides, scale = 0.45) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = (Math.PI * 2 * i) / sides - Math.PI / 2;
    pts.push([size * scale * Math.cos(a), size * scale * Math.sin(a)]);
  }
  return jscad.primitives.polygon({ points: pts });
}

function createStarShape2D(size, points, innerRatio) {
  const pts = [];
  const outerR = size * 0.45, innerR = outerR * innerRatio;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return jscad.primitives.polygon({ points: pts });
}

function createTriWingShape(size) {
  const { rectangle } = jscad.primitives;
  const { union } = jscad.booleans;
  const { rotate, translate } = jscad.transforms;
  const wing = translate([0, size * 0.22, 0], rectangle({ size: [size * 0.15, size * 0.45] }));
  return union(wing, rotate([0, 0, 2 * Math.PI / 3], wing), rotate([0, 0, 4 * Math.PI / 3], wing));
}

function createSpannerShape(size) {
  const { circle } = jscad.primitives;
  const { union } = jscad.booleans;
  const { translate } = jscad.transforms;
  const dot = circle({ radius: size * 0.1, segments: 16 });
  return union(translate([size * 0.2, 0, 0], dot), translate([-size * 0.2, 0, 0], dot));
}

function createPentalobeShape(size) {
  const { circle } = jscad.primitives;
  const { union } = jscad.booleans;
  const { translate } = jscad.transforms;
  const dot = circle({ radius: size * 0.12, segments: 16 });
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return [size * 0.3 * Math.cos(a), size * 0.3 * Math.sin(a)];
  });
  return union(...pts.map(p => translate([p[0], p[1], 0], dot)));
}

function get2DShape(shapeType, size) {
  switch (shapeType) {
    case 'cross': return createCrossShape(size);
    case 'slot': return createSlotShape(size);
    case 'pozidrive': return createPozidriveShape(size);
    case 'square': return createSquareShape(size);
    case 'hexagon': return createRegularPolygon2D(size, 6);
    case 'torx': return createStarShape2D(size, 6, 0.5);
    case 'security_torx': {
      const { union } = jscad.booleans;
      return union(createStarShape2D(size, 6, 0.5), jscad.primitives.circle({ radius: size * 0.1, segments: 16 }));
    }
    case 'torx_plus': return createStarShape2D(size, 6, 0.65);
    case 'security_hex': {
      const { union } = jscad.booleans;
      return union(createRegularPolygon2D(size, 6), jscad.primitives.circle({ radius: size * 0.1, segments: 16 }));
    }
    case 'tri_wing': case 'tri_point': return createTriWingShape(size);
    case 'spanner': return createSpannerShape(size);
    case 'triangle': return createRegularPolygon2D(size, 3);
    case 'pentalobe': return createPentalobeShape(size);
    case 'clutch_a': return jscad.primitives.ellipse({ radius: [size * 0.4, size * 0.18], segments: 32 });
    case 'clutch_g': {
      const { union } = jscad.booleans;
      const { rotate } = jscad.transforms;
      const e = jscad.primitives.ellipse({ radius: [size * 0.15, size * 0.35], segments: 32 });
      return union(e, rotate([0, 0, Math.PI / 2], e));
    }
    case 'bristol': return createStarShape2D(size, 6, 0.45);
    case 'torq_set': return createCrossShape(size);
    case 'twelve_point': return createStarShape2D(size, 12, 0.72);
    case 'polydrive': return createStarShape2D(size, 6, 0.7);
    case 'twelve_spline': return createStarShape2D(size, 12, 0.65);
    case 'wood_drill': case 'stone_drill': case 'metal_drill':
      return jscad.primitives.circle({ radius: size * 0.35, segments: 32 });
    case 'nut_driver': return createRegularPolygon2D(size, 6);
    default: return createCrossShape(size);
  }
}

// ---- Text helpers ----

function getTextPolylines(text, charHeight) {
  try {
    return jscad.text.vectorText({ input: text, height: charHeight, xOffset: 0, yOffset: 0 });
  } catch { return null; }
}

function measurePolylines(polylines) {
  if (!polylines || polylines.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const pl of polylines) {
    for (const p of pl) {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    }
  }
  return { width: maxX - minX, height: maxY - minY, minX, maxX, minY, maxY };
}

/**
 * Create a 3D text geometry from polylines.
 * Text is created in XY plane and extruded along Z.
 * If mirror=true, flip X for back-face readability.
 */
function buildTextGeometry(polylines, charHeight, mirror) {
  if (!polylines || polylines.length === 0) return null;

  const { line } = jscad.primitives;
  const { extrudeRectangular } = jscad.extrusions;
  const { union } = jscad.booleans;

  let mirrorCx = 0;
  if (mirror) {
    let minX = Infinity, maxX = -Infinity;
    for (const pl of polylines) for (const p of pl) {
      if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
    }
    mirrorCx = (minX + maxX) / 2;
  }

  const lineWidth = Math.max(charHeight * 0.08, 0.12);
  const segments = [];
  for (const pl of polylines) {
    if (pl.length < 2) continue;
    const pts = pl.map(p => [mirror ? (2 * mirrorCx - p[0]) : p[0], p[1]]);
    if (mirror) pts.reverse();
    try {
      segments.push(extrudeRectangular({ size: lineWidth, height: lineWidth }, line(pts)));
    } catch { /* skip bad segments */ }
  }
  if (segments.length === 0) return null;
  return segments.length === 1 ? segments[0] : union(...segments);
}

// ---- Main model builder ----

export function buildModel(config) {
  if (!jscad) throw new Error('JSCAD not initialized');

  const { cuboid, cylinder, roundedCuboid, roundedRectangle } = jscad.primitives;
  const { subtract, union } = jscad.booleans;
  const { translate, rotate } = jscad.transforms;
  const { extrudeLinear } = jscad.extrusions;

  const {
    rowMode, labelBothSides,
    row1SlotCount, row2SlotCount,
    spacing, holeDepth, hexWidth, labelDepth,
    cornerRadius = 1,
    row1Slots, row2Slots
  } = config;

  const isDouble = rowMode === 'double';
  const edgeMargin = spacing;
  const hexFlatToFlat = hexWidth;
  const hexRadius = hexFlatToFlat / 2 / Math.cos(Math.PI / 6); // circumradius from flat-to-flat
  const effLabelDepth = Math.max(labelDepth, 0.1);
  const baseThickness = 2; // mm below holes

  // Layout: X = width (along bits), Z = depth (front-back)
  const row1Count = row1SlotCount;
  const row2Count = isDouble ? row2SlotCount : 0;
  const maxCount = Math.max(row1Count, row2Count || 1);
  const slotPitch = hexFlatToFlat + spacing;

  const plateWidth = maxCount * slotPitch - spacing + 2 * edgeMargin;
  const plateHeight = holeDepth + baseThickness; // Y dimension (thin, vertical)
  const singleRowDepth = hexFlatToFlat + 2 * edgeMargin;
  const plateDepth = isDouble
    ? 2 * hexFlatToFlat + 3 * edgeMargin // two rows of holes + spacing
    : singleRowDepth;

  // ---- Create base plate with rounded vertical edges ----
  // Use roundedRectangle (2D in XY) extruded along Z, then rotate to get Y=height
  const effCornerRadius = Math.min(cornerRadius, plateWidth / 2 - 0.1, plateDepth / 2 - 0.1, 10);
  let model;
  if (effCornerRadius > 0.05) {
    // Create 2D profile in XY (will become XZ after rotation)
    const profile = roundedRectangle({
      size: [plateWidth, plateDepth],
      roundRadius: effCornerRadius,
      segments: 16
    });
    // Extrude upward (Z), then rotate so Z→Y
    const extruded = extrudeLinear({ height: plateHeight }, profile);
    // Rotate -90° around X: Z→Y, Y→-Z
    model = rotate([Math.PI / 2, 0, 0], extruded);
    // Now model goes from Y=0 to Y=plateHeight after rotation...
    // Actually after rotate(-π/2, X): old Z→new Y, so Y goes 0..plateHeight
    // Need to center it: translate Y down by half
    model = translate([0, plateHeight / 2, 0], model);
    // After rotation: old Y→new -Z, old Z(0..pH)→new Y
    // Actually let me think... rotate([π/2, 0, 0]) rotates +90° around X:
    // old Y → old Z dir, old Z → old -Y dir
    // So: new X = old X, new Y = -old Z, new Z = old Y
    // Extruded shape: X=[-pW/2,pW/2], Y=[-pD/2,pD/2], Z=[0,pH]
    // After rotate +π/2 around X:
    //   new X = X: [-pW/2, pW/2] ✓
    //   new Y = -Z: [-pH, 0]  ← needs centering
    //   new Z = Y: [-pD/2, pD/2] ✓
    // So translate Y by +pH/2 to center
    // Wait I already did translate above. Let me redo this cleanly.
  } else {
    model = cuboid({ size: [plateWidth, plateHeight, plateDepth] });
  }

  // Let me just use a clean approach: build with cuboid, then round edges
  // Actually, let me redo the rounded profile approach cleanly:
  if (effCornerRadius > 0.05) {
    const profile = roundedRectangle({
      size: [plateWidth, plateDepth],
      roundRadius: effCornerRadius,
      segments: 16
    });
    // Extrude along Z from 0 to plateHeight
    let block = extrudeLinear({ height: plateHeight }, profile);
    // Center Z: translate down by plateHeight/2
    block = translate([0, 0, -plateHeight / 2], block);
    // Rotate so that Z goes to Y (height becomes vertical)
    // rotate([π/2, 0, 0]): X→X, Y→-Z, Z→Y
    // Wait no: rotation matrix for +θ around X: Y'=Y·cosθ - Z·sinθ, Z'=Y·sinθ + Z·cosθ
    // For θ=π/2: Y'=-Z, Z'=Y
    // So old Z (centered [-pH/2,pH/2]) → new Y [-pH/2,pH/2] ← what we want!
    // And old Y ([-pD/2,pD/2]) → new -Z → Z=[-pD/2,pD/2] but negated
    // Wait: Y'=-Z, Z'=Y. So old Y([-pD/2,pD/2])→new Z([-pD/2,pD/2]). ✓
    // And old Z([-pH/2,pH/2])→ new -Y... no wait.
    // Let me be precise. For rotation by angle θ around X:
    // | 1    0      0   |   | x |   | x        |
    // | 0  cosθ  -sinθ | × | y | = | y·cosθ - z·sinθ |
    // | 0  sinθ   cosθ |   | z |   | y·sinθ + z·cosθ |
    // θ = π/2: cosθ=0, sinθ=1
    // y' = -z, z' = y
    // So: point at (x, y, z) → (x, -z, y)
    // Old shape: X in [-pW/2, pW/2], Y in [-pD/2, pD/2], Z in [-pH/2, pH/2]
    // New: X in [-pW/2, pW/2], Y = -old_Z in [-pH/2, pH/2], Z = old_Y in [-pD/2, pD/2]
    // Perfect! Y is now height (thin), Z is depth. ✓
    model = rotate([Math.PI / 2, 0, 0], block);
  }

  // Now: model centered at origin
  // X in [-plateWidth/2, plateWidth/2]
  // Y in [-plateHeight/2, plateHeight/2] (height, vertical, thin)
  // Z in [-plateDepth/2, plateDepth/2] (depth, front-back)
  // Top face: Y = +plateHeight/2
  // Front face: Z = +plateDepth/2
  // Back face: Z = -plateDepth/2

  // ---- Collect all geometries for batched CSG ----
  const toSubtract = [];
  const toAdd = [];

  // ---- Helper: X positions for a row centered in the plate ----
  function getSlotXPositions(count) {
    const totalWidth = count * slotPitch - spacing;
    const startX = -totalWidth / 2 + hexFlatToFlat / 2;
    return Array.from({ length: count }, (_, i) => startX + i * slotPitch);
  }

  // ---- Row Z positions ----
  const row1Z = isDouble ? -plateDepth / 2 + edgeMargin + hexFlatToFlat / 2 : 0;
  const row2Z = isDouble ? plateDepth / 2 - edgeMargin - hexFlatToFlat / 2 : 0;

  // ---- Add hex holes (cylinders along Y, entering from top) ----
  function addHexHole(x, z) {
    // Cylinder defaults to Z axis, rotate to Y axis
    let hex = cylinder({ radius: hexRadius, height: holeDepth + 1, segments: 6 });
    hex = rotate([Math.PI / 2, 0, 0], hex);
    // After rotation: cylinder along Y axis, centered at origin
    // Position: top of hole at Y = plateHeight/2 + 0.5 (poke through top surface)
    const holeTopY = plateHeight / 2 + 0.5;
    const holeCenterY = holeTopY - (holeDepth + 1) / 2;
    hex = translate([x, holeCenterY, z], hex);
    toSubtract.push(hex);
  }

  // ---- Add logo on a face ----
  function addLogoOnFace(x, z, isFront, bitType) {
    const bt = getBitType(bitType);
    if (!bt) return;

    const logoSize = hexFlatToFlat * 0.85;
    const logoRadius = logoSize * 0.5;
    const faceZ = isFront ? plateDepth / 2 : -plateDepth / 2;

    // Circle indent: thin cylinder along Z at the face
    let circle = cylinder({ radius: logoRadius, height: effLabelDepth + 0.02, segments: 32 });
    // Position: center of the indent sits at the face, going inward
    const indentCenterZ = isFront
      ? faceZ - effLabelDepth / 2
      : faceZ + effLabelDepth / 2;
    // Logo Y position: center of plate height
    const logoY = 0;
    circle = translate([x, logoY, indentCenterZ], circle);
    toSubtract.push(circle);

    // Shape inside the indent (raised back)
    try {
      const shape2d = get2DShape(bt.shapeType, logoSize);
      if (shape2d) {
        let shape3d = extrudeLinear({ height: effLabelDepth + 0.02 }, shape2d);
        // extrudeLinear goes from z=0 to z=h. Need to rotate to lie on the face.
        // For front face: shape at z = faceZ-effLabelDepth to z = faceZ
        // For back face: shape at z = faceZ to z = faceZ+effLabelDepth
        // The 2D shape is in XY, extruded along Z. We need it on the Z face.
        // For front: rotate 2D shape so X→X, Y stays → but the shape is in XY already
        // and the extrusion goes in Z which is the face normal direction.
        // Just translate so it starts at the bottom of the indent.
        const shapeStartZ = isFront ? faceZ - effLabelDepth : faceZ;
        // But extrudeLinear goes z=0..h so we need the XY of the shape
        // to be the "face plane" content. For front face, the face plane is XY
        // when looking from +Z. The 2D shape is in XY. Perfect!
        // For back face, the shape would appear mirrored from behind.
        // Since most logo shapes are symmetric, this is fine.
        shape3d = translate([x, logoY, shapeStartZ], shape3d);
        toAdd.push(shape3d);
      }
    } catch (e) {
      console.warn('Logo shape failed:', bitType, e.message);
    }
  }

  // ---- Add text label on a face ----
  function addTextOnFace(x, z, isFront, labelText) {
    if (!labelText || labelText.trim() === '') return;
    try {
      const charHeight = Math.min(hexFlatToFlat * 0.28, plateHeight * 0.35);
      const maxWidth = hexFlatToFlat + spacing * 0.3;

      const polylines = getTextPolylines(labelText, charHeight);
      if (!polylines || polylines.length === 0) return;

      const m = measurePolylines(polylines);
      if (!m || m.width <= 0) return;

      // Scale polylines if too wide
      let scaled = polylines;
      if (m.width > maxWidth) {
        const sx = maxWidth / m.width;
        scaled = polylines.map(pl => pl.map(p => [p[0] * sx, p[1]]));
      }

      // Build text geometry (mirror for back face)
      let textGeom = buildTextGeometry(scaled, charHeight, !isFront);
      if (!textGeom) return;

      // Measure scaled polylines for centering
      const ms = measurePolylines(scaled);
      if (!ms) return;
      const cx = -(ms.minX + ms.width / 2);
      const cy = -(ms.minY + ms.height / 2);

      // Text Y position: below the logo
      const textY = -plateHeight / 4;
      const faceZ = isFront ? plateDepth / 2 : -plateDepth / 2;

      // The text geometry is in XY plane extruded a bit in Z.
      // Rotate it so it lies on the face:
      // For front face (Z+ face): text content in XY, need it in XY plane at Z position
      // The text is already in XY! Just rotate so Y→Y (vertical on face).
      // But wait — the text Y should map to the model's Y (vertical).
      // This is already correct since the text is in XY and we want X=across, Y=vertical.

      // Position: text at the face surface, indented inward
      const textStartZ = isFront ? faceZ - effLabelDepth : faceZ;
      textGeom = translate([x + cx, textY + cy, textStartZ], textGeom);
      toSubtract.push(textGeom);
    } catch (e) {
      console.warn('Text failed:', labelText, e.message);
    }
  }

  // ---- Process Row 1 ----
  const row1Xs = getSlotXPositions(row1Count);
  for (let i = 0; i < row1Count; i++) {
    const x = row1Xs[i];
    addHexHole(x, row1Z);

    // Front face labels
    addLogoOnFace(x, row1Z, true, row1Slots[i]?.bitType || 'phillips');
    addTextOnFace(x, row1Z, true, row1Slots[i]?.label || '');

    // Back face labels (single row with both sides)
    if (!isDouble && labelBothSides) {
      addLogoOnFace(x, row1Z, false, row1Slots[i]?.bitType || 'phillips');
      addTextOnFace(x, row1Z, false, row1Slots[i]?.label || '');
    }
  }

  // ---- Process Row 2 (double row only) ----
  if (isDouble && row2Count > 0) {
    const row2Xs = getSlotXPositions(row2Count);
    for (let i = 0; i < row2Count; i++) {
      const x = row2Xs[i];
      addHexHole(x, row2Z);

      // Back face labels for row 2
      addLogoOnFace(x, row2Z, false, row2Slots[i]?.bitType || 'phillips');
      addTextOnFace(x, row2Z, false, row2Slots[i]?.label || '');
    }
  }

  // ---- Batched CSG operations (minimal operations on model for performance) ----
  if (toSubtract.length > 0) {
    try {
      const allSubs = toSubtract.length === 1 ? toSubtract[0] : union(...toSubtract);
      model = subtract(model, allSubs);
    } catch (e) {
      console.warn('Batch subtract failed, doing sequential:', e.message);
      for (const s of toSubtract) {
        try { model = subtract(model, s); } catch { /* skip */ }
      }
    }
  }

  if (toAdd.length > 0) {
    try {
      model = union(model, ...toAdd);
    } catch (e) {
      console.warn('Batch add failed, doing sequential:', e.message);
      for (const a of toAdd) {
        try { model = union(model, a); } catch { /* skip */ }
      }
    }
  }

  return model;
}
