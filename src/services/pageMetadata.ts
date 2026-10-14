import {publicProducts} from '../data/publicCatalogue';
const brand='Floating Bakery & Caterers';
export function pageMetadata(path:string,siteURL='',previewURL='') {
  const pages:Record<string,[string,string]>={
    '/':['Beautiful Cakes & Bespoke Catering','Celebration cakes, sweet treats and thoughtful catering by Chef Gugu in Thatchfield, Centurion. Explore our collection and create your cake design.'],
    '/cakes':['Our Cake & Sweet Treat Collection','Explore celebration cakes, bakery treats and scones with official South African rand prices. View products and plan your celebration with Chef Gugu.'],
    '/about':['Meet Chef Gugu','Meet the founder of Floating Bakery & Caterers in Centurion. Discover her pastry experience, French-inspired elegance and African hospitality.'],
    '/catering':['Catering for Your Occasion','Plan catering for celebrations, corporate gatherings and special occasions with Floating Bakery & Caterers in Centurion.'],
    '/contact':['Contact Chef Gugu','Contact Floating Bakery & Caterers at Thatchfield Crescent Estate, Centurion. Call 073 126 8382 or email guguminnaar@gmail.com.'],
    '/cake-designer':['Your 3D Cake Design Studio','Explore cake shapes, tiers, colours, flowers and personalisation in our interactive 3D cake studio. Final designs and pricing require bakery confirmation.'],
    '/quote-request':['Request a Cake Quotation','Prepare your cake design, occasion details and reference photographs for a personalised bakery quotation.'],
    '/request-received':['Your Enquiry','Review the acceptance status of your Floating Bakery & Caterers enquiry.'],
  };
  const product=path.startsWith('/cakes/')?publicProducts.find(p=>p.id===decodeURIComponent(path.slice(7))||p.slug===decodeURIComponent(path.slice(7))):undefined;
  const [title,description]=path.startsWith('/admin')?['Bakery Administration','Authorised access to Floating Bakery & Caterers administration.']:product?[product.name,`${product.description} Explore this ${product.category.toLowerCase()} design from Floating Bakery & Caterers. Final pricing and availability require confirmation.`]:pages[path]||['Page Unavailable','Return to the Floating Bakery & Caterers collection.'];
  let origin='';try{const url=new URL(siteURL);if(url.protocol==='https:')origin=url.origin;}catch{/* No confirmed production domain. */}
  let imageOrigin=origin;try{const url=new URL(previewURL);if(!imageOrigin&&['https:','http:'].includes(url.protocol))imageOrigin=url.origin;}catch{/* The deployment origin is optional for local static builds. */}
  const indexable=Boolean(origin)&&(Boolean(product)||['/','/cakes','/about','/catering','/contact'].includes(path));
  const image=product?.responsiveImages?.detail||product?.image||'/Logo.svg';
  const structuredData={ '@context':'https://schema.org','@type':'Bakery',name:brand,founder:{'@type':'Person',name:'Chef Gugu'},telephone:'+27731268382',email:'guguminnaar@gmail.com',address:{'@type':'PostalAddress',streetAddress:'Thatchfield Crescent Estate, Thatchfield, The Reeds',addressLocality:'Centurion',postalCode:'0158',addressCountry:'ZA'},...(origin?{url:origin,image:origin+image}:{})};
  return {title:`${title} | ${brand}`,description,image:imageOrigin?imageOrigin+image:image,canonical:indexable?origin+path:'',robots:indexable?'index, follow':'noindex, nofollow',structuredData};
}
