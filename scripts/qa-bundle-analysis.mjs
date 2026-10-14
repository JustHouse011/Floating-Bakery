import { build } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
const stage = process.env.QA_STAGE ?? "before";
await mkdir("qa/evidence", { recursive: true });
await build({
  plugins: [
    {
      name: "qa-bundle-attribution",
      generateBundle(_options, bundle) {
        const rows = Object.values(bundle)
          .filter((c) => c.type === "chunk")
          .map((c) => ({
            file: c.fileName,
            bytes: c.code.length,
            modules: Object.entries(c.modules)
              .map(([id, m]) => ({
                id: id.replaceAll("\\", "/").split("/node_modules/").pop(),
                renderedBytes: m.renderedLength,
              }))
              .sort((a, b) => b.renderedBytes - a.renderedBytes),
          }));
        return writeFile(
          `qa/evidence/bundle-${stage}.json`,
          JSON.stringify(rows, null, 2),
        );
      },
    },
  ],
});
