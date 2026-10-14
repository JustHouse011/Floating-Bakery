export interface DeliveryStatus {enabled:boolean;challenge?:string}
export interface DeliveryReceipt {accepted:true;reference:string}
export const DELIVERY_FAILURE="We couldn't send your enquiry right now. Please try again or contact us directly.";
export const DELIVERY_SUCCESS='Thank you for contacting Floating Bakery & Caterers. Your enquiry has been received, and our team will be in touch.';
export async function deliveryStatus():Promise<DeliveryStatus>{try{const r=await fetch('/api/status',{cache:'no-store'});if(!r.ok)return {enabled:false};const value=await r.json();return {enabled:value.enabled===true,...(typeof value.challenge==='string'?{challenge:value.challenge}:{})};}catch{return {enabled:false};}}
export async function deliverEnquiry(kind:'contact'|'quotation'|'product',data:unknown,status:DeliveryStatus,submissionId:string,website=''):Promise<DeliveryReceipt>{
 if(!status.enabled||!status.challenge)throw new Error('Online submissions are temporarily unavailable. Please contact the bakery directly.');
 const response=await fetch(`/api/${kind}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submissionId,challenge:status.challenge,website,data}),signal:AbortSignal.timeout(25000)});
 const result=await response.json().catch(()=>null);
 if(!response.ok||result?.accepted!==true||typeof result.reference!=='string')throw new Error(DELIVERY_FAILURE);
 return {accepted:true,reference:result.reference};
}
