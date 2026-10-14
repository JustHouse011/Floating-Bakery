import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
let assertions = 0;
const ids = {
  Owner: "11111111-1111-4111-8111-111111111111",
  Administrator: "22222222-2222-4222-8222-222222222222",
  Staff: "33333333-3333-4333-8333-333333333333",
  customer: "44444444-4444-4444-8444-444444444444",
  other: "55555555-5555-4555-8555-555555555555",
};
async function as(role, user, fn) {
  await db.exec(`reset role;set role ${role};`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    user || "",
  ]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub','',false)");
  }
}
async function denied(fn) {
  await assert.rejects(fn);
  assertions++;
}
async function equal(query, expected) {
  const result = await db.query(query);
  assert.deepEqual(result.rows, expected);
  assertions++;
}
try {
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz default now());
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid() to public;
 create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;grant usage on schema storage to anon,authenticated,service_role;
 grant select,insert,update,delete on storage.objects to anon,authenticated,service_role;
 create table test_migrations(version text primary key);`);
  const versions = ["202610140001_foundation", "202610140002_storage"];
  for (let run = 0; run < 2; run++)
    for (const version of versions) {
      const found = await db.query(
        "select 1 from test_migrations where version=$1",
        [version],
      );
      if (!found.rows.length) {
        await db.exec(
          await readFile(`supabase/migrations/${version}.sql`, "utf8"),
        );
        await db.query("insert into test_migrations values($1)", [version]);
      }
    }
  await equal("select count(*)::int n from test_migrations", [{ n: 2 }]);
  for (const [name, id] of Object.entries(ids))
    await db.query("insert into auth.users(id,email) values($1,$2)", [
      id,
      `${name.toLowerCase()}@example.test`,
    ]);
  await as("service_role", null, async () => {
    await denied(() =>
      db.query("select public.bootstrap_owner($1,$2)", [
        ids.Owner,
        "wrong@example.test",
      ]),
    );
    await db.query("select public.bootstrap_owner($1,$2)", [
      ids.Owner,
      "owner@example.test",
    ]);
    assertions++;
    await db.query("select public.bootstrap_owner($1,$2)", [
      ids.Owner,
      "owner@example.test",
    ]);
    assertions++;
    await denied(() =>
      db.query("select public.bootstrap_owner($1,$2)", [
        ids.other,
        "other@example.test",
      ]),
    );
  });
  for (const role of ["Administrator", "Staff"])
    await db.query(
      "insert into public.admin_accounts(user_id,role) values($1,$2)",
      [ids[role], role],
    );
  for (const [id, status] of [
    ["active-product", "active"],
    ["draft-product", "draft"],
  ])
    await db.query(
      "insert into public.products(id,slug,name,kind,category,base_price_cents,status,catalogue_data,approved_at) values($1,$1,'Test Product','catalogue','Test',100,$2,'{}',now())",
      [id, status],
    );
  await db.query(
    "insert into public.product_images(product_id,path,alt) values('active-product','/published.webp','Test'),('draft-product','/private.webp','Draft')",
  );
  for (const [key, name] of [
    ["customer", "Customer A"],
    ["other", "Customer B"],
  ])
    await db.query(
      "insert into public.customers(id,auth_user_id,name,email,telephone) values($1,$1,$2,$3,$4)",
      [ids[key], name, `${key}@example.test`, "0731234567"],
    );
  const quote = "66666666-6666-4666-8666-666666666666";
  await db.query(
    "insert into public.quotations(id,reference,customer_id,design_snapshot,pricing_snapshot,event_details) values($1,'TEST-ONLY',$2,'{}','{}','{}')",
    [quote, ids.customer],
  );
  await as("anon", null, async () => {
    await equal("select id from public.products", [{ id: "active-product" }]);
    await equal("select path from public.product_images", [
      { path: "/published.webp" },
    ]);
    for (const table of [
      "customers",
      "enquiries",
      "quotations",
      "reference_files",
      "audit_logs",
      "admin_accounts",
      "admin_sessions",
    ])
      await denied(() => db.query(`select * from public.${table}`));
    await denied(() =>
      db.query("insert into public.products(id) values('unauthorised')"),
    );
    await denied(() =>
      db.query("select public.consume_auth_attempt(repeat('a',64))"),
    );
    await denied(() =>
      db.query("select public.set_admin_role($1,'Owner',true)", [ids.customer]),
    );
  });
  await as("authenticated", ids.customer, async () => {
    await equal("select * from public.customers", []);
    await equal("select * from public.quotations", []);
    await equal("select public.current_admin_role() role", [{ role: null }]);
    await denied(() =>
      db.query("update public.quotations set confirmed_price_cents=999"),
    );
    await denied(() =>
      db.query("select public.transition_quotation($1,1,'in_review')", [quote]),
    );
    await denied(() =>
      db.query("select public.set_admin_role($1,'Owner',true)", [ids.customer]),
    );
  });
  await as("authenticated", ids.Staff, async () => {
    await equal("select count(*)::int n from public.customers", [{ n: 2 }]);
    await denied(() =>
      db.query(
        "insert into public.products(id,slug,name,kind,category,catalogue_data) values('staff','staff','Staff','catalogue','Test','{}')",
      ),
    );
    await db.query("select public.transition_quotation($1,1,'in_review')", [
      quote,
    ]);
    assertions++;
    await denied(() =>
      db.query("select public.transition_quotation($1,2,'quoted',100)", [
        quote,
      ]),
    );
    await denied(() =>
      db.query("select public.set_admin_role($1,'Administrator',true)", [
        ids.Staff,
      ]),
    );
  });
  await as("authenticated", ids.Administrator, async () => {
    await db.query(
      "update public.products set description='Reviewed description',version=version+1 where id='active-product'",
    );
    assertions++;
    await db.query("select public.transition_quotation($1,2,'quoted',1200)", [
      quote,
    ]);
    assertions++;
    await denied(() =>
      db.query("select public.transition_quotation($1,2,'accepted')", [quote]),
    );
    await denied(() =>
      db.query("select public.set_admin_role($1,'Owner',true)", [
        ids.Administrator,
      ]),
    );
    await equal(
      "select count(*)::int n from public.audit_logs where entity_type='quotations'",
      [{ n: 3 }],
    );
    await denied(() => db.query("delete from public.audit_logs"));
  });
  await as("authenticated", ids.Staff, async () => {
    await db.query("select public.transition_quotation($1,3,'accepted')", [
      quote,
    ]);
    assertions++;
    await equal("select count(*)::int n from public.bookings", [{ n: 0 }]);
  });
  await as("authenticated", ids.Owner, async () => {
    await denied(() =>
      db.query("select public.set_admin_role($1,'Staff',true)", [ids.Owner]),
    );
    await db.query("select public.set_admin_role($1,'Staff',false)", [
      ids.Staff,
    ]);
    assertions++;
    const session = "77777777-7777-4777-8777-777777777777";
    await db.query(
      "select public.register_admin_session($1,now()+interval '1 hour')",
      [session],
    );
    await db.query("select public.revoke_admin_session($1)", [session]);
    await equal(
      "select count(*)::int n from public.audit_logs where entity_type='admin_sessions'",
      [{ n: 2 }],
    );
  });
  await as("authenticated", ids.Staff, () =>
    equal("select * from public.customers", []),
  );
  await as("service_role", null, async () => {
    for (let i = 1; i <= 11; i++) {
      const result = await db.query(
        "select public.consume_auth_attempt(repeat('a',64)) allowed",
      );
      assert.equal(result.rows[0].allowed, i <= 10);
      assertions++;
    }
  });
  await denied(() =>
    db.query(
      "insert into public.products(id,slug,name,kind,category,minimum_price_cents,maximum_price_cents,catalogue_data) values('wrong-range','wrong-range','Wrong','official-cake','Test',100,200,'{}')",
    ),
  );
  await denied(() =>
    db.query(
      "insert into public.products(id,slug,name,kind,category,catalogue_data) values('missing-range','missing-range','Wrong','official-cake','Test','{}')",
    ),
  );
  await equal("select id,public from storage.buckets order by id", [
    { id: "customer-references", public: false },
    { id: "product-drafts", public: false },
  ]);
  const file = "88888888-8888-4888-8888-888888888888.jpg";
  const object = quote + "/" + file;
  await db.query(
    "insert into public.reference_files(quotation_id,object_path,mime_type,size_bytes) values($1,$2,$3,128)",
    [quote, object, "image/jpeg"],
  );
  await db.query(
    "insert into storage.objects(bucket_id,name) values('customer-references',$1)",
    [object],
  );
  await as("anon", null, async () => {
    await equal("select * from storage.objects", []);
    await denied(() =>
      db.query(
        "insert into storage.objects(bucket_id,name) values('customer-references','bad.svg')",
      ),
    );
  });
  await as("authenticated", ids.customer, () =>
    equal("select * from storage.objects", []),
  );
  await as("authenticated", ids.Administrator, () =>
    equal("select count(*)::int n from storage.objects", [{ n: 1 }]),
  );
  await equal(
    "select count(*)::int n from information_schema.tables t join pg_class c on c.relname=t.table_name where t.table_schema='public' and t.table_name not in ('test_migrations') and not c.relrowsecurity",
    [{ n: 0 }],
  );
  console.log(
    `PASS: ${assertions} migration, grant, RLS, role, session, storage and quotation lifecycle assertions (local PostgreSQL).`,
  );
} catch (e) {
  console.error(e.message, e.where || "");
  process.exitCode = 1;
} finally {
  await db.close();
}
