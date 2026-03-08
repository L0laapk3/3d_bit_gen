/**
 * STL export using @jscad/stl-serializer.
 */

let serializer = null;

export async function initSTLExport() {
  serializer = await import('https://esm.sh/@jscad/stl-serializer@2.1.17');
}

/**
 * Serialize JSCAD geometry to an STL ArrayBuffer.
 * @param {object} geometry - JSCAD geom3 object
 * @returns {ArrayBuffer}
 */
export function geometryToSTLBuffer(geometry) {
  if (!serializer) throw new Error('STL serializer not initialized');
  const rawData = serializer.serialize({ binary: true }, geometry);
  // rawData is an array of ArrayBuffers; concatenate them
  if (rawData.length === 1) return rawData[0];
  const totalLen = rawData.reduce((sum, buf) => sum + buf.byteLength, 0);
  const merged = new Uint8Array(totalLen);
  let offset = 0;
  for (const buf of rawData) {
    merged.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  return merged.buffer;
}

/**
 * Download an STL file from JSCAD geometry.
 */
export function downloadSTL(geometry, filename = 'bit-holder') {
  const buffer = geometryToSTLBuffer(geometry);
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace(/[^a-zA-Z0-9_\-. ]/g, '_') + '.stl';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
