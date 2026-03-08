/**
 * STL export utilities.
 * For worker-based architecture, STL serialization happens in the worker.
 * This module just handles browser download from an existing ArrayBuffer.
 */

/**
 * Download an STL file from a pre-built ArrayBuffer.
 */
export function downloadSTLFromBuffer(buffer, filename = 'bit-holder') {
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
