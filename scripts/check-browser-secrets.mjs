import {readdir,readFile} from 'node:fs/promises';
import {loadEnv} from 'vite';
const names=['SUPABASE_SERVICE_ROLE_KEY','ADMIN_SESSION_SECRET','RESEND_API_KEY','ENQUIRY_SECURITY_SECRET','UPSTASH_REDIS_REST_TOKEN'];
const env=loadEnv('production',process.cwd(),'');
const files=(await readdir('dist/assets')).filter(f=>f.endsWith('.js')).map(f=>'dist/assets/'+f);
files.push('dist/index.html');
for(const file of files){const text=await readFile(file,'utf8');for(const name of names){if(text.includes(name)||(env[name]?.length>=16&&text.includes(env[name])))throw Error(`Private credential marker detected in ${file}; key ${name}.`);}if(/sb_secret_[A-Za-z0-9_-]+/.test(text))throw Error(`Secret-key marker detected in ${file}.`);}
console.log(`PASS: ${files.length} frontend assets contain no configured private credentials or server-secret markers.`);
