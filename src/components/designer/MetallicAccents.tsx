import type { StudioDesign } from '../../types/studio';
export default function MetallicAccents({studio,onChange}:{studio:StudioDesign;onChange:(patch:Partial<StudioDesign>)=>boolean}) {
 return <label>Metallic accent<select aria-label="Metallic accent" value={studio.secondaryColour==='#c0c0c0'?'Silver':studio.secondaryColour==='#c6a044'?'Gold':'Custom'} onChange={e=>{if(e.target.value==='Custom')return;const colour=e.target.value==='Silver'?'#c0c0c0':'#c6a044';onChange({secondaryColour:colour,decorations:studio.decorations.map(d=>['Gold leaf','Geometric ornament','Topper'].includes(d.kind)?{...d,colour}:d)});}}><option>Custom</option><option>Gold</option><option>Silver</option></select></label>;
}
