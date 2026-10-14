import type { StudioDesign } from '../../types/studio';
import { studioSummary } from '../../services/studioDesign';
import { lazy, Suspense, useState } from 'react';
import SceneBoundary from './SceneBoundary';
import '../../styles/advanced-studio.css';
const SavedStudioPreview=lazy(()=>import('../../three/CakeScene/SavedStudioPreview'));
export default function StudioConfigurationSummary({studio,inspect=false,message=''}:{studio?:StudioDesign;inspect?:boolean;message?:string}) {
 const [preview,setPreview]=useState(false);
 if(!studio)return null;
 return <section className="studio-configuration-summary"><h3>Advanced customisation</h3><p><strong>Recreated in 3D:</strong> supported structure, colours, board and attachment regions.</p><p><strong>Approximate visual representation:</strong> handmade finishes, procedural flowers and generic ornaments.</p>{inspect&&<><button className="text-link" aria-expanded={preview} onClick={()=>setPreview(v=>!v)}>{preview?'Close saved 3D design':'Inspect saved 3D design'}</button>{preview&&<SceneBoundary fallback={<p>3D unavailable. Review the saved configuration below.</p>}><Suspense fallback={<p role="status">Loading saved design…</p>}><SavedStudioPreview studio={{...studio,personalisation:{...studio.personalisation,message:studio.personalisation.message||message}}}/></Suspense></SceneBoundary>}</>}<details open><summary>Bakery confirmation & saved studio details</summary><ul>{studioSummary(studio).map((line,i)=><li key={i}>{line}</li>)}</ul></details><p>No automatic advanced decoration or structure surcharge. Final quotation requires bakery confirmation.</p></section>;
}
