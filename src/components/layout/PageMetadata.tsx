import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {pageMetadata} from '../../services/pageMetadata';
export default function PageMetadata(){
 const {pathname}=useLocation();
 useEffect(()=>{
  const data=pageMetadata(pathname,import.meta.env.PUBLIC_SITE_URL||'',window.location.origin);document.title=data.title;
  const set=(attribute:string,key:string,content:string)=>{let node=document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);if(!node){node=document.createElement('meta');node.setAttribute(attribute,key);document.head.append(node);}node.content=content;};
  set('name','description',data.description);set('name','robots',data.robots);set('property','og:title',data.title);set('property','og:description',data.description);set('property','og:image',data.image);set('property','og:type','website');set('name','twitter:card','summary_large_image');
  document.head.querySelector('link[rel="canonical"]')?.remove();document.head.querySelector('meta[property="og:url"]')?.remove();
  if(data.canonical){const link=document.createElement('link');link.rel='canonical';link.href=data.canonical;document.head.append(link);set('property','og:url',data.canonical);}
  let schema=document.getElementById('bakery-schema');if(!schema){schema=document.createElement('script');schema.id='bakery-schema';schema.setAttribute('type','application/ld+json');document.head.append(schema);}schema.textContent=JSON.stringify(data.structuredData);
 },[pathname]);return null;
}
