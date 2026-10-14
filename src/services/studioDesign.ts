import { FINISHES, ORNAMENTS, type StudioDesign, type StudioDecoration } from '../types/studio';
import type { CakeConfiguration } from '../types/cakeDesigner';
const hex = (v: unknown): v is string => typeof v === 'string' && /^#[a-f0-9]{6}$/i.test(v);
const finite = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown, length: number): v is string => typeof v === 'string' && v.length <= length && Array.from(v).every(c=>c.charCodeAt(0)>=32&&c.charCodeAt(0)!==127);
export function validateStudio(value: unknown): StudioDesign {
  if (!record(value) || value.version !== 1 || !(value.templateId === null || (typeof value.templateId === 'string' && /^cake-wa-\d{4}$/.test(value.templateId))) || !['Round','Square','Rectangular'].includes(String(value.shape)) || !FINISHES.includes(value.finish as never) || !hex(value.secondaryColour) || !Array.isArray(value.tiers) || value.tiers.length < 1 || value.tiers.length > 4) throw new Error('Invalid studio structure');
  let previous: Record<string, unknown> | undefined;
  for (const tier of value.tiers) {
    if (!record(tier) || !finite(tier.width, .9, 3) || !finite(tier.depth, .9, 3) || !finite(tier.height, .4, 1.6) || !finite(tier.taper, 0, .12) || !finite(tier.offset, -.2, .2) || !hex(tier.colour)) throw new Error('Invalid studio tier');
    if (value.shape !== 'Rectangular' && Math.abs(tier.width-tier.depth)>.00001) throw new Error('Round and square tiers need equal width and depth');
    if (previous && (Number(previous.width) * (1 - Number(previous.taper)) - Number(tier.width) < Math.abs(Number(tier.offset)) * 2 + .1 || Number(previous.depth) * (1 - Number(previous.taper)) - Number(tier.depth) < .1)) throw new Error('Upper tiers must fit within supporting tiers');
    previous = tier;
  }
  if (!record(value.board) || typeof value.board.visible !== 'boolean' || !hex(value.board.colour) || !['Matte','Gold','Silver'].includes(String(value.board.finish))) throw new Error('Invalid cake board');
  if (!Array.isArray(value.decorations) || value.decorations.length > 24) throw new Error('Too many decorations');
  const ids = new Set<string>();
  for (const item of value.decorations) {
    if (!record(item) || !text(item.id, 80) || !item.id || ids.has(item.id) || !ORNAMENTS.includes(item.kind as never) || !Number.isInteger(item.tier) || !finite(item.tier, 0, value.tiers.length - 1) || !['Top','Front','Left','Right'].includes(String(item.region)) || !finite(item.scale, .5, 1.3) || !finite(item.rotation, -180, 180) || !finite(item.density, 1, 7) || !Number.isInteger(item.density) || !hex(item.colour) || !text(item.text, 32)) throw new Error('Invalid decoration attachment');
    ids.add(item.id);
    if(item.region==='Top' && item.tier!==value.tiers.length-1 && !['Beaded border','Ribbon','Drip'].includes(String(item.kind))) throw new Error('Top decorations must attach to the exposed top tier');
  }
  const attachments=new Map<string,number>();
  for(const item of value.decorations as StudioDecoration[])if(!['Beaded border','Ribbon','Drip'].includes(item.kind)){const key=`${item.tier}:${item.region}`;attachments.set(key,(attachments.get(key)||0)+1);if(attachments.get(key)!>4)throw new Error('A surface region supports at most four decorative groups. Choose another region or remove a group.');}
  if (!record(value.personalisation) || !['name','number','message','event','scheme'].every(k => text((value.personalisation as Record<string, unknown>)[k], k === 'scheme' ? 100 : 32)) || !Array.isArray(value.referenceOnly) || value.referenceOnly.length > 20 || !value.referenceOnly.every(v => text(v, 200))) throw new Error('Invalid studio personalisation');
  return structuredClone(value) as unknown as StudioDesign;
}
export function studioFromConfiguration(config: CakeConfiguration): StudioDesign {
  return config.studio || { version: 1, templateId: null, shape: config.shape, tiers: Array.from({length: config.tiers}, (_, i) => ({width: (config.size-i*2)/4, depth: (config.size-i*2)/4, height: .72, taper: 0, offset: 0, colour: config.tierColours[i]})), finish: config.frosting === 'Fondant' ? 'Smooth fondant' : 'Smooth buttercream', secondaryColour: '#ffffff', board: {visible: true, colour: '#fff9ef', finish: 'Matte'}, decorations: [], personalisation: {name: '',number: '',message: '',event: '',scheme: ''}, referenceOnly: [] };
}
export function studioTierPositions(studio: StudioDesign) {
  let bottom = .82, x = 0;
  return studio.tiers.map((tier, index) => { x += tier.offset; const result = {...tier, index, bottom, x}; bottom += tier.height; return result; });
}
export function decorationAnchor(studio: StudioDesign, item: StudioDecoration): [number, number, number] {
  const tier = studioTierPositions(studio)[item.tier];
  const occupants=studio.decorations.filter(d=>d.tier===item.tier&&d.region===item.region&&!['Beaded border','Ribbon','Drip'].includes(d.kind));
  const slot=Math.max(0,occupants.findIndex(d=>d.id===item.id));
  if (item.region === 'Top') {const r=occupants.length>1?Math.min(tier.width,tier.depth)*.24*(1-tier.taper):0;const angle=slot*Math.PI*2/Math.max(1,occupants.length);return [tier.x+Math.cos(angle)*r,tier.bottom+tier.height+.015,Math.sin(angle)*r];}
  const y = tier.bottom + tier.height * ((slot+1)/(Math.max(1,occupants.length)+1));
  // Attachment follows the actual tapered surface at this group's height.
  const proportion = (y-tier.bottom)/tier.height;
  const radius = tier.width / 2 * (1 - tier.taper * proportion) + .025;
  return item.region === 'Front' ? [tier.x, y, tier.depth / 2 * (1-tier.taper*proportion) + .025] : [tier.x + (item.region === 'Left' ? -radius : radius), y, 0];
}
export function decorationClearanceScale(studio:StudioDesign,item:StudioDecoration) {
 const tier=studio.tiers[item.tier],count=studio.decorations.filter(d=>d.tier===item.tier&&d.region===item.region&&!['Beaded border','Ribbon','Drip'].includes(d.kind)).length;
 if(item.region==='Top'){if(count<=1)return Math.min(item.scale,Math.min(tier.width,tier.depth)*(1-tier.taper)/1.2);const separation=Math.min(tier.width,tier.depth)*.48*(1-tier.taper)*Math.sin(Math.PI/count);return Math.min(item.scale,separation/1.2*.85);}
 return Math.min(item.scale,tier.height/(Math.max(1,count)+1)/.8*.85);
}
export function studioSummary(studio: StudioDesign): string[] {
  return [`Studio structure: ${studio.shape}; ${studio.tiers.length} tiers (${studio.tiers.map(t => `${t.width*4} × ${t.depth*4} inch, height ${t.height*4} inch`).join(' / ')})`, `Surface: ${studio.finish}; colours ${studio.tiers.map(t=>t.colour).join(', ')} / ${studio.secondaryColour}`, `Board: ${studio.board.visible ? studio.board.finish + ' ' + studio.board.colour : 'Hidden'}`, ...studio.decorations.map(d => `${d.kind}: tier ${d.tier+1}, ${d.region}, scale ${d.scale}, rotation ${d.rotation}°, density ${d.density}, ${d.colour}${d.text ? ', '+d.text : ''}`), `Personalisation: ${Object.values(studio.personalisation).filter(Boolean).join(' · ') || 'None'}`, 'Requires bakery confirmation: advanced structure, materials and decorations; no approved automatic surcharge.', ...studio.referenceOnly.map(v=>`Reference only: ${v}`)];
}
