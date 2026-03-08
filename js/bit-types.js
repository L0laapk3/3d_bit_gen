/**
 * Bit type definitions organized by category.
 * Each type has an SVG path for the UI icon and geometry data for 3D modeling.
 * SVG icons are drawn inside a 24x24 viewBox centered circle.
 */

// Helper: generate points for a regular polygon
function regularPolygonPoints(cx, cy, r, sides, rotationDeg = 0) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2 + (rotationDeg * Math.PI) / 180;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts;
}

function polygonToPath(pts) {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ') + ' Z';
}

// Helper: star shape path
function starPath(cx, cy, outerR, innerR, points, rotationDeg = 0) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * i) / points - Math.PI / 2 + (rotationDeg * Math.PI) / 180;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return polygonToPath(pts);
}

// SVG circle outline (common to all icons)
const CIRCLE = '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/>';

const BIT_TYPES = [
  // ===== Standard =====
  {
    category: 'Standard',
    types: [
      {
        id: 'phillips',
        name: 'Phillips',
        svgInner: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
        shapeType: 'cross',
      },
      {
        id: 'flathead',
        name: 'Flathead / Slotted',
        svgInner: '<path d="M6 12h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
        shapeType: 'slot',
      },
      {
        id: 'pozidrive',
        name: 'Pozidrive',
        svgInner: `<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                   <path d="M7.05 7.05l9.9 9.9M16.95 7.05l-9.9 9.9" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>`,
        shapeType: 'pozidrive',
      },
      {
        id: 'robertson',
        name: 'Robertson / Square',
        svgInner: '<rect x="8.5" y="8.5" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1.5"/>',
        shapeType: 'square',
      },
      {
        id: 'combination',
        name: 'Combination (+/−)',
        svgInner: `<path d="M12 6v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                   <path d="M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                   <path d="M6.5 12h11" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3"/>`,
        shapeType: 'cross',
      },
    ],
  },
  // ===== Torx Family =====
  {
    category: 'Torx Family',
    types: [
      {
        id: 'torx',
        name: 'Torx',
        svgInner: `<path d="${starPath(12, 12, 6.5, 3.5, 6)}" fill="none" stroke="currentColor" stroke-width="1.3"/>`,
        shapeType: 'torx',
      },
      {
        id: 'security_torx',
        name: 'Security Torx',
        svgInner: `<path d="${starPath(12, 12, 6.5, 3.5, 6)}" fill="none" stroke="currentColor" stroke-width="1.3"/>
                   <circle cx="12" cy="12" r="1.5" fill="currentColor"/>`,
        shapeType: 'security_torx',
      },
      {
        id: 'torx_plus',
        name: 'Torx Plus',
        svgInner: `<path d="${starPath(12, 12, 6.5, 4.2, 6)}" fill="none" stroke="currentColor" stroke-width="1.3"/>`,
        shapeType: 'torx_plus',
      },
      {
        id: 'external_torx',
        name: 'External Torx',
        svgInner: `<path d="${starPath(12, 12, 7, 3.5, 6)}" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="1"/>`,
        shapeType: 'torx',
      },
    ],
  },
  // ===== Hex =====
  {
    category: 'Hex',
    types: [
      {
        id: 'hex',
        name: 'Hex / Allen',
        svgInner: `<path d="${polygonToPath(regularPolygonPoints(12, 12, 6, 6))}" fill="none" stroke="currentColor" stroke-width="1.3"/>`,
        shapeType: 'hexagon',
      },
      {
        id: 'ball_hex',
        name: 'Ball Hex',
        svgInner: `<path d="${polygonToPath(regularPolygonPoints(12, 12, 6, 6))}" fill="none" stroke="currentColor" stroke-width="1.3"/>
                   <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="0.8" stroke-dasharray="2 1"/>`,
        shapeType: 'hexagon',
      },
      {
        id: 'security_hex',
        name: 'Security Hex',
        svgInner: `<path d="${polygonToPath(regularPolygonPoints(12, 12, 6, 6))}" fill="none" stroke="currentColor" stroke-width="1.3"/>
                   <circle cx="12" cy="12" r="1.5" fill="currentColor"/>`,
        shapeType: 'security_hex',
      },
    ],
  },
  // ===== Specialty =====
  {
    category: 'Specialty',
    types: [
      {
        id: 'tri_wing',
        name: 'Tri-Wing',
        svgInner: (() => {
          const wings = [0, 120, 240].map(deg => {
            const rad = (deg - 90) * Math.PI / 180;
            const x2 = 12 + 6 * Math.cos(rad);
            const y2 = 12 + 6 * Math.sin(rad);
            return `<line x1="12" y1="12" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
          });
          return wings.join('');
        })(),
        shapeType: 'tri_wing',
      },
      {
        id: 'tri_point',
        name: 'Tri-Point / Y-Type',
        svgInner: (() => {
          const wings = [0, 120, 240].map(deg => {
            const rad = (deg - 90) * Math.PI / 180;
            const x2 = 12 + 6 * Math.cos(rad);
            const y2 = 12 + 6 * Math.sin(rad);
            return `<line x1="12" y1="12" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`;
          });
          return wings.join('');
        })(),
        shapeType: 'tri_point',
      },
      {
        id: 'spanner',
        name: 'Spanner',
        svgInner: '<circle cx="9" cy="12" r="1.8" fill="currentColor"/><circle cx="15" cy="12" r="1.8" fill="currentColor"/>',
        shapeType: 'spanner',
      },
      {
        id: 'triangle',
        name: 'Triangle',
        svgInner: `<path d="${polygonToPath(regularPolygonPoints(12, 12, 6, 3))}" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
        shapeType: 'triangle',
      },
      {
        id: 'pentalobe',
        name: 'Pentalobe',
        svgInner: (() => {
          const pts = regularPolygonPoints(12, 12, 5.5, 5);
          return pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2" fill="none" stroke="currentColor" stroke-width="1"/>`).join('');
        })(),
        shapeType: 'pentalobe',
      },
      {
        id: 'clutch_a',
        name: 'Clutch Type A',
        svgInner: `<ellipse cx="12" cy="12" rx="6" ry="2.5" fill="none" stroke="currentColor" stroke-width="1.3"/>`,
        shapeType: 'clutch_a',
      },
      {
        id: 'clutch_g',
        name: 'Clutch Type G (Butterfly)',
        svgInner: `<path d="M12 7 Q16 10 12 12 Q8 10 12 7Z" fill="none" stroke="currentColor" stroke-width="1.2"/>
                   <path d="M12 17 Q16 14 12 12 Q8 14 12 17Z" fill="none" stroke="currentColor" stroke-width="1.2"/>`,
        shapeType: 'clutch_g',
      },
      {
        id: 'bristol',
        name: 'Bristol',
        svgInner: (() => {
          const splines = [];
          for (let i = 0; i < 6; i++) {
            const a1 = (i * 60 - 90) * Math.PI / 180;
            const a2 = ((i + 0.4) * 60 - 90) * Math.PI / 180;
            const x1 = 12 + 3 * Math.cos(a1), y1 = 12 + 3 * Math.sin(a1);
            const x2 = 12 + 6 * Math.cos(a2), y2 = 12 + 6 * Math.sin(a2);
            splines.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" stroke-width="1.3"/>`);
          }
          return splines.join('') + '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1"/>';
        })(),
        shapeType: 'bristol',
      },
      {
        id: 'torq_set',
        name: 'Torq-Set',
        svgInner: `<path d="M12 5v6M12 13v6M5 12h6M13 12h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
        shapeType: 'torq_set',
      },
      {
        id: 'twelve_point',
        name: '12-Point',
        svgInner: `<path d="${starPath(12, 12, 7, 5, 12)}" fill="none" stroke="currentColor" stroke-width="1"/>`,
        shapeType: 'twelve_point',
      },
      {
        id: 'polydrive',
        name: 'Polydrive',
        svgInner: `<path d="${starPath(12, 12, 6.5, 4.5, 6, 30)}" fill="none" stroke="currentColor" stroke-width="1.2"/>`,
        shapeType: 'polydrive',
      },
      {
        id: 'twelve_spline',
        name: '12-Spline (Flange)',
        svgInner: `<path d="${starPath(12, 12, 7, 4.5, 12)}" fill="none" stroke="currentColor" stroke-width="0.9"/>`,
        shapeType: 'twelve_spline',
      },
    ],
  },
  // ===== Drill / Other =====
  {
    category: 'Drill / Other',
    types: [
      {
        id: 'wood_drill',
        name: 'Wood Drill',
        svgInner: `<path d="M12 5v14" stroke="currentColor" stroke-width="1.5"/>
                   <path d="M9 8l3-3 3 3" fill="none" stroke="currentColor" stroke-width="1.3"/>
                   <path d="M8 13c2-1.5 6-1.5 8 0" fill="none" stroke="currentColor" stroke-width="1"/>`,
        shapeType: 'wood_drill',
      },
      {
        id: 'stone_drill',
        name: 'Stone / Masonry Drill',
        svgInner: `<path d="M12 5v14" stroke="currentColor" stroke-width="1.5"/>
                   <path d="M8 7h8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                   <path d="M9.5 10h5M10 13h4" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>`,
        shapeType: 'stone_drill',
      },
      {
        id: 'metal_drill',
        name: 'Metal / HSS Drill',
        svgInner: `<path d="M12 5v14" stroke="currentColor" stroke-width="1.5"/>
                   <path d="M9 6.5l3 2 3-2" fill="none" stroke="currentColor" stroke-width="1.2"/>
                   <path d="M10 10l2 1 2-1M10 13l2 1 2-1" fill="none" stroke="currentColor" stroke-width="0.8"/>`,
        shapeType: 'metal_drill',
      },
      {
        id: 'nut_driver',
        name: 'Nut Driver',
        svgInner: `<path d="${polygonToPath(regularPolygonPoints(12, 12, 7, 6))}" fill="none" stroke="currentColor" stroke-width="1.5"/>
                   <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1"/>`,
        shapeType: 'nut_driver',
      },
    ],
  },
];

// Flattened lookup map
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
 * Black circle outline + inner shape.
 */
export function getBitTypeSVG(id, size = 24) {
  const bt = _typesMap.get(id);
  if (!bt) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" style="color:currentColor">${CIRCLE}${bt.svgInner}</svg>`;
}
