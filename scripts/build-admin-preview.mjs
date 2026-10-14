import {spawnSync} from 'node:child_process';
import {mkdir,cp,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
if(process.env.VERCEL_ENV==='production')throw Error('The mock admin can only be deployed as a Preview.');
for(const [program,args] of [['typescript/bin/tsc',['-b']],['vite/bin/vite.js',['build','--mode','admin-preview','--outDir','.tools/admin-preview']]]){
 const result=spawnSync(process.execPath,[resolve('node_modules',program),...args],{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
const output=resolve('.vercel/output');
if(output!==resolve(process.cwd(),'.vercel','output'))throw Error('Invalid output directory');
await rm(output,{recursive:true,force:true});
await mkdir('.vercel/output/static',{recursive:true});
await cp('.tools/admin-preview','.vercel/output/static',{recursive:true});
await writeFile('.vercel/output/config.json',JSON.stringify({version:3,routes:[
 {src:'/(.*)',headers:{'X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Cache-Control':'no-store'},continue:true},
 {src:'/api/.*',status:503},
 {handle:'filesystem'},
 {src:'/(.*)',dest:'/index.html'}
]}));
