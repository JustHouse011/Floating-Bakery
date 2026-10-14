import {createStore} from 'zustand/vanilla';
import {publicProducts,publicPricingRules,publicSettings} from '../data/publicCatalogue';
import {cakePricingStore} from './cakePricingStore';
export const adminStore=createStore(()=>({ready:true,error:''}));
export async function initializeWorkspace(){cakePricingStore.getState().setRules(publicPricingRules);}
export function useLocalProducts(){return publicProducts;}
export function useBakerySettings(){return publicSettings;}
