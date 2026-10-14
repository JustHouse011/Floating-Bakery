import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import type {Plugin} from 'vite';
import {pageMetadata} from '../src/services/pageMetadata';
import {publicProducts} from '../src/data/publicCatalogue';
export function seoPlugin(siteURL:string,previewURL=''):Plugin {
 return {name:'bakery-metadata',async closeBundle(){
  const base=resolve('dist');const template=await readFile(resolve(base,'index.html'),'utf8');
  const paths=['/','/cakes','/about','/catering','/contact','/cake-designer','/quote-request',...publicProducts.map(p=>`/cakes/${p.id}`)];
  const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  for(const path of paths){const d=pageMetadata(path,siteURL,previewURL);const head=`<title>${escape(d.title)}</title><meta name="description" content="${escape(d.description)}"><meta name="robots" content="${d.robots}"><meta property="og:title" content="${escape(d.title)}"><meta property="og:description" content="${escape(d.description)}"><meta property="og:image" content="${escape(d.image)}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image">${d.canonical?`<link rel="canonical" href="${escape(d.canonical)}"><meta property="og:url" content="${escape(d.canonical)}">`:''}<script id="bakery-schema" type="application/ld+json">${JSON.stringify(d.structuredData).replaceAll('<','\\u003c')}</script>`;
   const html=template.replace(/<title>[\s\S]*?<\/title>/,'').replace(/<meta\s+(?:name="(?:description|robots|twitter:card)"|property="og:[^"]+")[^>]*>/g,'').replace('</head>',head+'</head>');
   const folder=path==='/'?base:resolve(base,'.'+path);await mkdir(folder,{recursive:true});await writeFile(resolve(folder,'index.html'),html);
  }
  const urls=paths.map(p=>pageMetadata(p,siteURL).canonical).filter(Boolean);
  await writeFile(resolve(base,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`<url><loc>${escape(url)}</loc></url>`).join('')}</urlset>`);
  await writeFile(resolve(base,'robots.txt'),urls.length?`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nDisallow: /quote-request\nDisallow: /product-enquiry\nSitemap: ${new URL(siteURL).origin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
 }};
}
