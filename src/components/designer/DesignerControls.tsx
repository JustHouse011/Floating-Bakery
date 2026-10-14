import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from 'lucide-react';
import { CAKE_SHAPES, CAKE_SIZES, FLAVOURS, FROSTINGS, DECORATIONS, type TierCount } from '../../types/cakeDesigner';
import { COLOUR_SWATCHES, DECORATION_LABELS } from '../../data/designer';
import { compatibleSize, tierDimensions } from '../../services/cakeConfiguration';
import { useCakeDesignerStore } from "../../store/cakeDesignerStore";
import { OFFICIAL_FLAVOURS, type OfficialFlavour } from '../../types/officialCake';
import { useCakePricingRules } from '../../store/cakePricingStore';
import { formatZARCents } from '../../utils/currency';
import AdvancedStudioControls from './AdvancedStudioControls';
function ControlSection({ title, step, children }: { title: string; step: string; children: ReactNode }) {
  return <details className="studio-control-section" open><summary><span><small>{step}</small> {title}</span><ChevronDown size={15}/></summary><div className="control-section-content">{children}</div></details>;
}
export default function DesignerControls() {
  const rules = useCakePricingRules();
  const state = useCakeDesignerStore();
  const config = state.configuration;
  const id = useId();
  const [error,setError]=useState('');
  function structure(action:()=>void) {try{action();setError('');}catch(e){setError(e instanceof Error?e.message:'Please check this structure');}}
  const tiers = tierDimensions(config);
  return <aside className="studio-controls" aria-label="Cake customisation">
    <div className="panel-heading"><span className="eyebrow">THE DETAILS MAKE IT YOURS</span><h2>Your <em>design.</em></h2></div>
          <ControlSection title="Start from a Design" step="01"><AdvancedStudioControls section="start"/></ControlSection>
      <ControlSection title="Cake Structure" step="02">
        <AdvancedStudioControls section="structure"/>
      <fieldset><legend>Cake shape</legend><div className="segments">{CAKE_SHAPES.map(shape => <button type="button" key={shape}                 aria-pressed={(config.studio?.shape || config.shape) === shape}                 onClick={() => structure(()=>state.setShape(shape))}>{shape}</button>)}</div></fieldset>
      <fieldset><legend>Number of tiers</legend><div className="segments">{([1,2,3] as TierCount[]).map(tiers => <button type="button" key={tiers}                 aria-pressed={(config.studio?.tiers.length || config.tiers) === tiers}                 onClick={() => structure(()=>state.setTiers(tiers))}>{tiers === 1 ? 'Single' : `${tiers} tiers`}</button>)}</div></fieldset>
      <fieldset><legend>Base tier size</legend><div className="segments size-segments">{CAKE_SIZES.map(size => <button type="button" key={size} disabled={!compatibleSize(size,config.tiers)} title={!compatibleSize(size,config.tiers) ? 'Choose a larger base for this tier count' : `${size} inch base`} aria-pressed={config.size === size}                 onClick={() => structure(()=>state.setSize(size))}>{size}″</button>)}</div></fieldset>
      <p className="control-hint">Bottom to top: {tiers.map(t => `${t.inches}″`).join(' / ')}. Each upper tier is 2″ smaller; 6″ is the minimum.</p>
    </ControlSection>
          <ControlSection title="Frosting & Textures" step="03">
        <AdvancedStudioControls section="finish"/>
      <label htmlFor={`${id}-flavour`}>Flavour<select id={`${id}-flavour`}             value={config.selectedProductId && rules.officialCatalogue?.products[config.selectedProductId] ? config.officialFlavour || 'Vanilla' : config.flavour} onChange={e =>               config.selectedProductId && rules.officialCatalogue?.products[config.selectedProductId] ? state.setOfficialFlavour(e.target.value as OfficialFlavour) : state.setFlavour(e.target.value as typeof config.flavour)}>{(config.selectedProductId && rules.officialCatalogue?.products[config.selectedProductId] ? OFFICIAL_FLAVOURS : FLAVOURS).map(flavour => <option key={flavour} value={flavour}>{flavour}{config.selectedProductId && rules.officialCatalogue?.products[config.selectedProductId] ? ` (+${formatZARCents(rules.officialCatalogue.flavourSurchargesCents[flavour as OfficialFlavour])})` : ''}</option>)}</select></label>
      <p className="control-hint">Flavour is saved in your design; it does not change the outside appearance.</p>
      <label htmlFor={`${id}-frosting`}>Frosting<select id={`${id}-frosting`} value={config.frosting} onChange={e => state.setFrosting(e.target.value as typeof config.frosting)}>{FROSTINGS.map(frosting => <option key={frosting}>{frosting}</option>)}</select></label>
      <p className="control-hint">{config.frosting === 'Buttercream' ? 'Soft matte icing with delicate horizontal piping.' : config.frosting === 'Fondant' ? 'A smooth, softly polished finish with clean edges.' : 'A glossy chocolate brown coating.'}</p>
    </ControlSection>
          <ControlSection title="Flowers" step="04"><AdvancedStudioControls section="flowers"/></ControlSection>
      <ControlSection title="Decorations" step="05">
        <AdvancedStudioControls section="decorations"/>
      <div className="decoration-options">{DECORATIONS.map(decoration => <label key={decoration}><input type="checkbox" checked={config.decorations[decoration]}                 onChange={() => {try{state.toggleDecoration(decoration);setError('');}catch(e){setError(e instanceof Error?e.message:'Please check this decoration');}}}/><span>{DECORATION_LABELS[decoration]}</span></label>)}</div>
      <label className="custom-colour" htmlFor={`${id}-decoration`}>Decoration colour<input id={`${id}-decoration`} type="color" value={config.decorationColour} onChange={e => state.setDecorationColour(e.target.value)}/></label>
      <p className="control-hint">Applies to ribbon, drips, petals, the star and message lettering.           Pearls stay ivory. Very light colours use darker message lettering for readability.</p>
      <label htmlFor={`${id}-message`}>Personalised message<input id={`${id}-message`} type="text" value={config.message} onChange={e => state.setMessage(e.target.value)} maxLength={32} placeholder="Happy Birthday"/></label>
      <p className="control-hint">{config.message.length}/32 characters · Your message appears on a cake-top plaque. Leave blank to remove it.</p>
    </ControlSection>
        <ControlSection title="Colours" step="06">
        <AdvancedStudioControls section="colours"/>
      {tiers.map(tier => <fieldset key={tier.index}><legend>{config.tiers === 1 ? 'Cake colour' : `Tier ${tier.index + 1} · ${tier.index === 0 ? 'base' : tier.index === config.tiers - 1 ? 'top' : 'middle'}`}</legend><div className="swatches">{COLOUR_SWATCHES.map(colour => <button type="button" key={colour.hex} disabled={config.frosting === 'Chocolate Ganache'} style={{background:colour.hex}} className={config.tierColours[tier.index] === colour.hex ? 'chosen' : ''} title={colour.name} aria-label={`${colour.name}, tier ${tier.index + 1}`} aria-pressed={config.tierColours[tier.index] === colour.hex} onClick={() => state.setTierColour(tier.index,colour.hex)}/>)}</div><label className="custom-colour" htmlFor={`${id}-tier-${tier.index}`}>Custom colour <input id={`${id}-tier-${tier.index}`} type="color" value={config.tierColours[tier.index]} onChange={e => state.setTierColour(tier.index,e.target.value)} disabled={config.frosting === 'Chocolate Ganache'}/><span>{config.tierColours[tier.index]}</span></label></fieldset>)}
      {config.frosting === 'Chocolate Ganache' && <p className="control-hint">Ganache has a chocolate brown finish. Your tier colours are kept for switching back to buttercream or fondant.</p>}
    </ControlSection>
          <ControlSection title="Personalisation" step="07"><AdvancedStudioControls section="personalisation"/></ControlSection>
      <ControlSection title="Bakery review" step="08">
        <div className="decoration-options">
          <label><input type="checkbox" checked={config.quotationRequirements.complexBespoke} onChange={event => state.setQuotationRequirement('complexBespoke',event.target.checked)}/><span>Complex bespoke details</span></label>
          <label><input type="checkbox" checked={config.quotationRequirements.referenceDesign} onChange={event => state.setQuotationRequirement('referenceDesign',event.target.checked)}/><span>I have a reference design to discuss</span></label>
        </div>
        <p className="control-hint">These notes do not change the 3D preview. They mark your estimate for           a custom bakery quotation. Add reference photographs through Request
          This Cake. Online submissions are available when the enquiry service is operational.</p>
      </ControlSection>
      {error && <p className="field-error" role="alert">{error}</p>}
    </aside>;
}
