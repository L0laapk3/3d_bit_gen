/**
 * Bit type definitions organized by category.
 * Each type has abstract metric geometry (based on a 24x24 viewBox, center at 12,12).
 * This defines both the SVG HTML ui and the 3D JSCAD geometry perfectly predictably.
 */

// Helper functions for common point arrays
function regularPolygonPoints(cx, cy, r, sides, rotationDeg = 0) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2 + (rotationDeg * Math.PI) / 180;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts;
}

function starPoints(cx, cy, outerR, innerR, points, rotationDeg = 0) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * i) / points - Math.PI / 2 + (rotationDeg * Math.PI) / 180;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts;
}

const BIT_TYPES = [
  {
    category: 'Standard',
    types: [
      {
        id: 'phillips', name: 'Phillips',
        geom: [
          { type: 'line', x1: 12, y1: 5, x2: 12, y2: 19, w: 2.2 },
          { type: 'line', x1: 5, y1: 12, x2: 19, y2: 12, w: 2.2 }
        ]
      },
      {
        id: 'flathead', name: 'Flathead / Slotted',
        geom: [
          { type: 'line', x1: 6, y1: 12, x2: 18, y2: 12, w: 2.2 }
        ]
      },
      {
        id: 'pozidrive', name: 'Pozidrive',
        geom: [
          { type: 'line', x1: 12, y1: 5, x2: 12, y2: 19, w: 2.2 },
          { type: 'line', x1: 5, y1: 12, x2: 19, y2: 12, w: 2.2 },
          { type: 'line', x1: 7.05, y1: 7.05, x2: 16.95, y2: 16.95, w: 0.9 },
          { type: 'line', x1: 7.05, y1: 16.95, x2: 16.95, y2: 7.05, w: 0.9 }
        ]
      },
      {
        id: 'robertson', name: 'Robertson / Square',
        geom: [
          { type: 'polygon', points: regularPolygonPoints(12, 12, 4.5, 4, 45) }
        ]
      },
      {
        id: 'combination', name: 'Combination (+/−)',
        geom: [
          { type: 'line', x1: 12, y1: 6, x2: 12, y2: 18, w: 2 },
          { type: 'line', x1: 6, y1: 12, x2: 18, y2: 12, w: 3.5 }
        ]
      }
    ]
  },
  {
    category: 'Torx Family',
    types: [
      {
        id: 'torx', name: 'Torx',
        geom: [ { type: 'polygon', points: starPoints(12, 12, 6.5, 3.5, 6) } ]
      },
      {
        id: 'security_torx', name: 'Security Torx',
        geom: [
          { type: 'polygon', points: starPoints(12, 12, 6.5, 3.5, 6) },
          { type: 'circle_cut', cx: 12, cy: 12, r: 1.8 } // Wait, circle_cut means subtract from previous. Let's just use 'circle_cut' as a special type.
        ]
      },
      {
        id: 'torx_plus', name: 'Torx Plus',
        geom: [ { type: 'polygon', points: starPoints(12, 12, 6.5, 4.2, 6) } ]
      }
    ]
  },
  {
    category: 'Hex',
    types: [
      {
        id: 'hex', name: 'Hex / Allen',
        geom: [ { type: 'polygon', points: regularPolygonPoints(12, 12, 6, 6) } ]
      },
      {
        id: 'security_hex', name: 'Security Hex',
        geom: [
          { type: 'polygon', points: regularPolygonPoints(12, 12, 6, 6) },
          { type: 'circle_cut', cx: 12, cy: 12, r: 1.8 }
        ]
      }
    ]
  },
  {
    category: 'Specialty',
    types: [
      {
        id: 'tri_wing', name: 'Tri-Wing',
        geom: [0, 120, 240].map(deg => {
          const rad = (deg - 90) * Math.PI / 180;
          return { type: 'line', x1: 12, y1: 12, x2: 12 + 6 * Math.cos(rad), y2: 12 + 6 * Math.sin(rad), w: 2 };
        })
      },
      {
        id: 'tri_point', name: 'Tri-Point / Y-Type',
        geom: [0, 120, 240].map(deg => {
          const rad = (deg - 90) * Math.PI / 180;
          return { type: 'line', x1: 12, y1: 12, x2: 12 + 6 * Math.cos(rad), y2: 12 + 6 * Math.sin(rad), w: 1.5 };
        })
      },
      {
        id: 'spanner', name: 'Spanner',
        geom: [
          { type: 'circle', cx: 8.5, cy: 12, r: 1.8 },
          { type: 'circle', cx: 15.5, cy: 12, r: 1.8 }
        ]
      },
      {
        id: 'triangle', name: 'Triangle',
        geom: [ { type: 'polygon', points: regularPolygonPoints(12, 12, 6, 3) } ]
      },
      {
        id: 'pentalobe', name: 'Pentalobe',
        geom: regularPolygonPoints(12, 12, 5.5, 5).map(p => ({ type: 'circle', cx: p[0], cy: p[1], r: 2.2 }))
      },
      {
        id: 'clutch_a', name: 'Clutch Type A',
        geom: [ { type: 'ellipse', cx: 12, cy: 12, rx: 6, ry: 2.5 } ]
      },
      {
        id: 'clutch_g', name: 'Clutch Type G',
        geom: [
          { type: 'ellipse', cx: 12, cy: 12, rx: 2.5, ry: 5 },
          { type: 'ellipse', cx: 12, cy: 12, rx: 5, ry: 2.5 }
        ]
      },
      {
        id: 'torq_set', name: 'Torq-Set',
        geom: [
          { type: 'line', x1: 12, y1: 4, x2: 12, y2: 11, w: 2 },
          { type: 'line', x1: 12, y1: 13, x2: 12, y2: 20, w: 2 },
          { type: 'line', x1: 4, y1: 12, x2: 11, y2: 12, w: 2 },
          { type: 'line', x1: 13, y1: 12, x2: 20, y2: 12, w: 2 }
        ]
      },
      {
        id: 'bristol', name: 'Bristol',
        geom: [
          { type: 'circle', cx: 12, cy: 12, r: 3 },
          ...Array.from({length: 6}, (_, i) => {
            const a1 = (i * 60 - 90) * Math.PI / 180;
            const a2 = ((i + 0.4) * 60 - 90) * Math.PI / 180;
            return { type: 'line', x1: 12 + 3 * Math.cos(a1), y1: 12 + 3 * Math.sin(a1), x2: 12 + 6 * Math.cos(a2), y2: 12 + 6 * Math.sin(a2), w: 1.5 };
          })
        ]
      },
      {
        id: 'twelve_point', name: '12-Point',
        geom: [ { type: 'polygon', points: starPoints(12, 12, 7, 5, 12) } ]
      },
      {
        id: 'polydrive', name: 'Polydrive',
        geom: [ { type: 'polygon', points: starPoints(12, 12, 6.5, 4.5, 6, 30) } ]
      }
    ]
  },
  {
    category: 'Drill / Other',
    types: [
      {
        id: 'wood_drill', name: 'Wood Drill',
        geom: [
          { type: 'line', x1: 12, y1: 5, x2: 12, y2: 19, w: 2 },
          { type: 'line', x1: 9, y1: 8, x2: 12, y2: 5, w: 1.5 },
          { type: 'line', x1: 15, y1: 8, x2: 12, y2: 5, w: 1.5 },
          { type: 'circle', cx: 12, cy: 12, r: 3.5 }
        ]
      },
      {
        id: 'stone_drill', name: 'Stone Drill',
        geom: [
          { type: 'line', x1: 12, y1: 5, x2: 12, y2: 19, w: 2 },
          { type: 'line', x1: 7, y1: 7, x2: 17, y2: 7, w: 3 },
          { type: 'line', x1: 9.5, y1: 10, x2: 14.5, y2: 10, w: 1.5 },
          { type: 'line', x1: 10, y1: 13, x2: 14, y2: 13, w: 1.5 }
        ]
      },
      {
        id: 'metal_drill', name: 'Metal Drill',
        geom: [
          { type: 'line', x1: 12, y1: 5, x2: 12, y2: 19, w: 2 },
          { type: 'line', x1: 9, y1: 6.5, x2: 12, y2: 8.5, w: 1.5 },
          { type: 'line', x1: 15, y1: 6.5, x2: 12, y2: 8.5, w: 1.5 },
          { type: 'line', x1: 10, y1: 10, x2: 12, y2: 11, w: 1 },
          { type: 'line', x1: 14, y1: 10, x2: 12, y2: 11, w: 1 }
        ]
      },
      {
        id: 'nut_driver', name: 'Nut Driver',
        geom: [
          { type: 'polygon', points: regularPolygonPoints(12, 12, 7, 6) },
          { type: 'circle_cut', cx: 12, cy: 12, r: 3.5 }
        ]
      }
    ]
  }
];

const _typesMap = new Map();
const _allTypes = [];
for (const cat of BIT_TYPES) {
  for (const t of cat.types) {
    _typesMap.set(t.id, t);
    _allTypes.push(t);
  }
}

export function getAllBitCategories() { return BIT_TYPES; }
export function getAllBitTypes() { return _allTypes; }
export function getBitType(id) { return _typesMap.get(id); }

/**
 * Returns a complete SVG string for a bit type icon (for UI display).
 * Generates identical geometric shapes to the 3D model.
 */
export function getBitTypeSVG(id, size = 24) {
  const bt = _typesMap.get(id);
  if (!bt) return '';

  const CIRCLE = '<circle cx="12" cy="12" r="10" fill="none" class="bit-hud-outline" stroke="currentColor" stroke-width="1.5"/>';

  let inner = '';
  for (const g of bt.geom) {
    if (g.type === 'line') {
      inner += `<line x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}" stroke="currentColor" stroke-width="${g.w}" stroke-linecap="round"/>`;
    } else if (g.type === 'polygon') {
      const pts = g.points.map(p => `${p[0]},${p[1]}`).join(' ');
      inner += `<polygon points="${pts}" fill="currentColor"/>`;
    } else if (g.type === 'circle') {
      inner += `<circle cx="${g.cx}" cy="${g.cy}" r="${g.r}" fill="currentColor"/>`;
    } else if (g.type === 'circle_cut') {
      // SVG doesn't easily subtraction without masks, but in visually overlapping, we can just draw white/background color.
      // Since our UI icons are on light or dark bg, we can draw stroke or use mask.
      // But actually, for ui simplicity, let's just draw the cut as background color!
      // In CSS we will ensure .bit-hud-cut is var(--bg-panel).
      inner += `<circle cx="${g.cx}" cy="${g.cy}" r="${g.r}" fill="var(--bg-panel, #fff)"/>`;
    } else if (g.type === 'ellipse') {
      inner += `<ellipse cx="${g.cx}" cy="${g.cy}" rx="${g.rx}" ry="${g.ry}" fill="currentColor"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" style="color:currentColor">${CIRCLE}${inner}</svg>`;
}
