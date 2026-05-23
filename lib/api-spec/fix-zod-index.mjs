/**
 * Post-codegen fix: orval generates `export * from './generated/types'` in the
 * api-zod index.ts, which conflicts with the same-named zod schema const in
 * generated/api.ts. Replacing it with `export type *` resolves the ambiguity
 * because the types folder only contains TypeScript type aliases (not values).
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, "../../lib/api-zod/src/index.ts");

let content = readFileSync(indexPath, "utf8");
// Remove the types re-export entirely: api-zod consumers use zod-inferred types,
// not TypeScript aliases, so the types folder re-export is unnecessary and causes
// name conflicts when a multipart endpoint generates both a zod schema value AND
// a same-named TypeScript type alias.
content = content.replace(
  /\nexport (?:type )?\* from ['"]\.\/generated\/types['"](;)?/g,
  ""
);
writeFileSync(indexPath, content, "utf8");
console.log("✓ Fixed api-zod/src/index.ts: removed conflicting types re-export");
