import { createClient } from "@supabase/supabase-js";
// Run only after Stage 9A review, against the approved development project.
const args = process.argv.slice(2),
  argument = (name) => args[args.indexOf(name) + 1];
if (
  !args.includes("--reviewed-development-project") ||
  !args.includes("--user-id") ||
  !args.includes("--email")
)
  throw Error(
    "Provide reviewed project ref, existing confirmed user UUID and approved email explicitly.",
  );
const ref = argument("--reviewed-development-project"),
  id = argument("--user-id"),
  email = argument("--email").trim().toLowerCase();
if (
  !/^[a-z0-9]+$/.test(ref) ||
  !/^[a-f0-9-]{36}$/i.test(id) ||
  !/^\S+@\S+\.\S+$/.test(email)
)
  throw Error("Invalid provisioning arguments.");
if (
  process.env.SUPABASE_URL !== `https://${ref}.supabase.co` ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
)
  throw Error(
    "Project URL must exactly match the reviewed development project.",
  );
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const {
  data: { user },
  error: userError,
} = await client.auth.admin.getUserById(id);
if (
  userError ||
  !user ||
  user.email?.toLowerCase() !== email ||
  !user.email_confirmed_at
)
  throw Error(
    "The existing confirmed Auth identity must match the owner-approved email.",
  );
const { data: existing, error } = await client
  .from("admin_accounts")
  .select("user_id,role,active");
if (error) throw Error("Reviewed migration is not available.");
if (existing.some((a) => a.user_id === id && a.role === "Owner" && a.active)) {
  console.log("Owner already provisioned; no change.");
  process.exit(0);
}
if (existing.length)
  throw Error(
    "Initial bootstrap is unavailable after accounts exist. Use the authorised Owner role-management process.",
  );
const { error: insertError } = await client.rpc("bootstrap_owner", {
  target_user: id,
  approved_email: email,
});
if (insertError)
  throw Error("Owner provisioning failed; inspect the protected backend.");
console.log(
  "Owner role assigned to the confirmed, explicitly approved Auth identity. No password created or email sent.",
);
