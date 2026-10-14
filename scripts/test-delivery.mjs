import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/delivery.test.ts'],outfile:'.tools/test-output/delivery.test.cjs',bundle:true,platform:'node',format:'cjs',define:{'import.meta.env.MODE':'"production"'}});
const result=spawnSync(process.execPath,['--test','.tools/test-output/delivery.test.cjs'],{stdio:'inherit'});
if(result.error)throw result.error;process.exitCode=result.status??1;
