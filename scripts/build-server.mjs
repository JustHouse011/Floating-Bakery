import { build } from "esbuild";
// Node ESM requires explicit file extensions. Bundle shared TypeScript modules
// into standalone JavaScript before Vercel traces the API functions.
await build({
  entryPoints: ["server/delivery.ts", "server/adminFoundation.ts"],
  outdir: "server",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  allowOverwrite: true,
  sourcemap: false,
  define: { "import.meta.env.MODE": '"production"' },
});
