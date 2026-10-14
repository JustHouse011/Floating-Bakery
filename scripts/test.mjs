import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
await mkdir(".tools/test-output", { recursive: true });
await build({
  entryPoints: [
    "tests/designer.test.tsx",
    "tests/pricing.test.tsx",
    "tests/quotation.test.tsx",
    "tests/admin.test.tsx",
    "tests/qa.test.tsx",
    "tests/catalogue.test.tsx",
    "tests/officialCake.test.tsx",
    "tests/quotationNavigation.test.tsx",
    "tests/studio.test.tsx",
  ],
  outdir: ".tools/test-output",
  outExtension: { ".js": ".cjs" },
  bundle: true,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  define:{'import.meta.env.MODE':'"internal"'},
  external: ["react", "react-dom", "react-dom/*"],
  loader: { ".css": "empty" },
});
const result = spawnSync(
  process.execPath,
  [
    "--test",
    ".tools/test-output/designer.test.cjs",
    ".tools/test-output/pricing.test.cjs",
    ".tools/test-output/quotation.test.cjs",
    ".tools/test-output/admin.test.cjs",
    ".tools/test-output/qa.test.cjs",
    ".tools/test-output/catalogue.test.cjs",
    ".tools/test-output/officialCake.test.cjs",
    ".tools/test-output/quotationNavigation.test.cjs",
    ".tools/test-output/studio.test.cjs",
  ],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
