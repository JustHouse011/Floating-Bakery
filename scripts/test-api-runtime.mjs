import assert from "node:assert/strict";
import { createHandler } from "../server/delivery.js";
import { createAdminHandler, clientFor } from "../server/adminFoundation.js";
// Import exactly the native ESM files used by the Vercel TypeScript wrappers.
process.env.ENQUIRY_ENABLED = "false";
process.env.ADMIN_ENABLED = "false";
process.env.NODE_ENV = "production";
async function invoke(handler, method) {
  let status = 0,
    value;
  const req = { method, url: "/api/admin?action=session", headers: {} };
  const res = {
    statusCode: 0,
    setHeader() {},
    end(raw) {
      status = this.statusCode;
      value = JSON.parse(raw);
    },
  };
  await handler(req, res);
  return { status, value };
}
assert.deepEqual(await invoke(createHandler("status"), "GET"), {
  status: 200,
  value: { enabled: false },
});
assert.deepEqual(await invoke(createAdminHandler(), "GET"), {
  status: 503,
  value: { error: "admin_not_configured" },
});
console.log("PASS: native Node ESM imports and disabled API handlers.");
process.env.SUPABASE_URL = "https://project.supabase.test";
process.env.SUPABASE_PUBLISHABLE_KEY = "native-runtime-test-key";
const client = clientFor("native-test-token", false, async () =>
  Response.json("Owner"),
);
const role = await client.rpc("current_admin_role");
assert.equal(role.error, null);
assert.equal(role.data, "Owner");
console.log(
  "PASS: bundled Supabase client executes a mocked RPC in native Node ESM.",
);
