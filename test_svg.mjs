import { deserialize } from 'https://esm.sh/@jscad/svg-deserializer@2.3.16';
import fs from 'fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="black" stroke-width="2.2" stroke-linecap="round"/></svg>`;

try {
  const geom = deserialize({ output: 'geometry', addMetaData: false }, svg);
  console.log("Success:", JSON.stringify(geom));
} catch (e) {
  console.error(e);
}
