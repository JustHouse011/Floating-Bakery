import { defineConfig,loadEnv } from "vite";
import {resolve} from 'node:path';
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {seoPlugin} from './scripts/seoPlugin';
export default defineConfig(({mode})=>{
 const environment=loadEnv(mode,process.cwd(),'');
 const siteURL=environment.VERCEL_ENV==='preview'||process.env.VERCEL_ENV==='preview'?'':environment.PUBLIC_SITE_URL||'';
 return ({
  define:{'import.meta.env.PUBLIC_SITE_URL':JSON.stringify(siteURL)},
  resolve:{alias:mode==='internal'?[]:[{find:/^(\.\.\/)+store\/adminStore$/,replacement:resolve(mode==='admin-preview'?'src/store/adminStore.ts':'src/store/publicStore.ts')},{find:'../pages/Admin/Admin',replacement:resolve(mode==='admin-preview'?'src/pages/Admin/Admin.tsx':'src/pages/Unavailable.tsx')},{find:'../pages/Quotation/ProductEnquiry',replacement:resolve('src/pages/Quotation/ProductionProductEnquiry.tsx')},{find:'../../services/quotationRepository',replacement:resolve(mode==='admin-preview'?'src/services/quotationRepository.ts':'src/services/unavailableLocalQuotation.ts')},{find:'../../services/quotationService',replacement:resolve('src/services/unavailableLocalQuotation.ts')},{find:'../pages/Quotation/QuotationConfirmation',replacement:resolve('src/pages/Unavailable.tsx')}]},
  plugins: [react(), tailwindcss(), ...(mode === 'internal' ? [] : [seoPlugin(siteURL,environment.VERCEL_URL ? `https://${environment.VERCEL_URL}` : '')]),{name:'bakery-local-api',configureServer(server){const environment=loadEnv(mode,process.cwd(),'');for(const name of ['ENQUIRY_ENABLED','RESEND_API_KEY','RESEND_FROM','RESEND_DOMAIN_ID','ENQUIRY_SECURITY_SECRET','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','APP_ORIGIN'])if(environment[name])process.env[name]=environment[name];server.middlewares.use(async(req,res,next)=>{const route=req.url?.split('?')[0];if(!route||!/^\/api\/(status|contact|quotation|product)$/.test(route))return next();try{const module=await server.ssrLoadModule(`${route}.ts`);await module.default(req,res);}catch{res.statusCode=503;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({enabled:false,error:'Online submissions are unavailable.'}));}});}}],
  build: { rollupOptions: { output: { manualChunks: (id) => id.replaceAll('\\', '/').endsWith('/src/data/clientCakeCatalogue.ts') ? 'client-cake-catalogue' : undefined } } },
  server: { watch: { ignored: ['**/qa/evidence/**', '**/.tools/**', '**/playwright-report/**', '**/test-results/**'] } },

});});
