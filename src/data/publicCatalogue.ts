import {clientCakeProducts} from './clientCakeCatalogue';
import {officialProducts,OFFICIAL_CONTACT} from './officialCatalogue';
import {cakePricingRules} from './cakePricing';
import {defaultOfficialPricing} from '../services/officialCakePricing';
export const publicProducts=[...clientCakeProducts,...officialProducts];
export const publicPricingRules={...cakePricingRules,officialCatalogue:{...defaultOfficialPricing(),products:Object.fromEntries(clientCakeProducts.map(p=>[p.id,{name:p.name,image:p.image,category:p.category}]))}};
export const publicSettings={businessName:OFFICIAL_CONTACT.businessName,description:'Cakes and catering by Chef Gugu',email:OFFICIAL_CONTACT.email,phone:OFFICIAL_CONTACT.phone,address:'Thatchfield Crescent Estate, Thatchfield, The Reeds, Centurion, 0158, South Africa',collectionInstructions:'Please arrange collection with the bakery.',disclaimer:'Final pricing is subject to bakery confirmation.',minimumLeadDays:0,deliveryAreas:[],currency:'ZAR' as const,locale:'en-ZA' as const};
