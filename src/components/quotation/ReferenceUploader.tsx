import { useEffect, useRef, useState } from "react";
import { ImagePlus } from 'lucide-react';
import type { ReferenceImage } from '../../types/quotation';
import { useQuotationPolicy } from '../../hooks/useQuotationPolicy';
import { makeReferenceImage, verifyImageDecodes, validateReferenceCollection } from '../../services/referenceImages';
import ReferenceGallery from './ReferenceGallery';
export default function ReferenceUploader({images,onChange,onBusy,error}:{images:ReferenceImage[];onChange:(images:ReferenceImage[])=>void;onBusy:(busy:boolean)=>void;error?:string}) {
  const quotationRequestPolicy = useQuotationPolicy();
  const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);  const input = useRef<HTMLInputElement>(null);
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  async function attach(files:FileList|null){if(!files?.length)return;setBusy(true);onBusy(true);setMessage('');try{
    if(images.length+files.length>quotationRequestPolicy.maximumImages)throw new Error(`Attach up to ${quotationRequestPolicy.maximumImages} images.`);
    if(images.reduce((sum,image)=>sum+image.size,0)+Array.from(files).reduce((sum,file)=>sum+file.size,0)>quotationRequestPolicy.maximumTotalImageBytes)        throw new Error(`Reference images must total no more than ${quotationRequestPolicy.maximumTotalImageBytes / 1024 / 1024} MB.`);
    const added:ReferenceImage[]=[];for(const file of Array.from(files)){        const image = await makeReferenceImage(file, quotationRequestPolicy);
        if(!mounted.current)return;try{await verifyImageDecodes(image.blob);}catch{throw new Error(`${file.name} could not be opened as an image. Choose a different file.`);}        added.push(image);}
    const next=[...images,...added];validateReferenceCollection(next,quotationRequestPolicy);      if(mounted.current)onChange(next);
  }catch(failure){setMessage(failure instanceof Error?failure.message:'These images could not be added.');}finally{      if(mounted.current){setBusy(false);onBusy(false);}if(input.current)input.current.value='';}}
  return <div className="reference-upload"><label htmlFor="reference-files" className="upload-surface"><ImagePlus size={28} strokeWidth={1}/><strong>A little visual inspiration</strong><span>Choose JPEG, PNG or WebP photographs</span><small>          Up to {quotationRequestPolicy.maximumImages} images · {quotationRequestPolicy.maximumImageBytes / 1024 / 1024} MB each · {quotationRequestPolicy.maximumTotalImageBytes / 1024 / 1024} MB total</small><input ref={input} id="reference-files" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={event=>attach(event.target.files)} aria-describedby="reference-upload-help reference-upload-error" aria-invalid={Boolean(message||error)}/></label><p id="reference-upload-help" className="quote-hint">        Optional. Add images to accompany your quotation request. They will accompany a successfully sent enquiry and help the bakery review your design.</p>{busy&&<p role="status">Checking your images…</p>}<p id="reference-upload-error" className="field-error" role="alert">{message||error}</p><ReferenceGallery images={images} onRemove={busy?undefined:id=>{onChange(images.filter(image=>image.id!==id));setMessage('');}}/></div>;
}
