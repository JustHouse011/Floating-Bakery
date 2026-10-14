import { useLocalProducts } from '../../store/adminStore';
import { COLOUR_SWATCHES, DECORATION_LABELS } from '../../data/designer';
import { DECORATIONS } from '../../types/cakeDesigner';
import { tierDimensions } from '../../services/cakeConfiguration';
import { useCakeDesignerStore } from "../../store/cakeDesignerStore";
import EstimatePanel from "./EstimatePanel";
import BakeryImage from '../ui/BakeryImage';
import StudioConfigurationSummary from './StudioConfigurationSummary';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveDesign } from '../../services/designerStorage';
import { beginQuotation } from '../../services/quotationNavigation';
export default function DesignerSummary() {
  const [notice,setNotice]=useState('');const navigate=useNavigate();
  const products=useLocalProducts();
  const config = useCakeDesignerStore(state => state.configuration);
  const product = products.find(p => p.id === config.selectedProductId);
  const tiers = tierDimensions(config);
  const decorations = DECORATIONS.filter(key => config.decorations[key]);
  return     <aside className="studio-summary" aria-label="Design summary">
      {product?.kind === 'official-cake' && <section className="studio-reference"><span className="eyebrow">CLIENT DESIGN REFERENCE</span><BakeryImage src={product.image} srcSet={product.responsiveImages?.srcSet} sizes="(max-width: 760px) 90vw, 300px" alt={product.name}/><h3>{product.name}</h3><p>The photograph is the design reference. The 3D cake is a conceptual preview, not an exact recreation.</p><label className="catalogue-field">Personalisation instructions<textarea maxLength={2000} value={config.personalisationInstructions || ''} onChange={e => useCakeDesignerStore.getState().setPersonalisationInstructions(e.target.value)}/></label></section>}
    <span className="eyebrow">A LITTLE SOMETHING SPECIAL</span><h2>Your <em>creation.</em></h2>
    {product && <p className="inspiration-label">          Inspired by {product.name}. A design preview for your celebration.</p>}
                <EstimatePanel />
      <StudioConfigurationSummary studio={config.studio}/>
      <div className="studio-history"><button onClick={()=>{try{saveDesign(config);setNotice('Your design has been saved.');}catch{setNotice('Saving is unavailable. Keep this tab open or copy the estimate.');}}}>Save Design</button><button onClick={()=>useCakeDesignerStore.getState().resetTemplate()}>Reset Design</button><button onClick={()=>{beginQuotation(config);navigate('/quote-request');}}>Request a Quote</button></div><p role="status">{notice}</p>
      <details className="estimate-design-details"><summary>View design details</summary><dl><dt>Shape</dt>          <dd>{config.studio?.shape || config.shape}</dd><dt>Tiers & sizes</dt><dd>{config.studio?.tiers.length || config.tiers} tiers · {(config.studio ? config.studio.tiers.map(t => t.width * 4) : tiers.map(t => t.inches)).map(size => `${size}″`).join(' / ')}</dd><dt>Flavour</dt>        <dd>{config.officialFlavour || config.flavour}</dd><dt>Frosting</dt><dd>{config.frosting}</dd><dt>Tier colours</dt><dd className="summary-colours">{config.tierColours.slice(0,config.tiers).map((hex,index) => <span key={index}><i style={{background:hex}}/>{COLOUR_SWATCHES.find(c => c.hex === hex)?.name || hex}{config.frosting === 'Chocolate Ganache' ? ' (stored)' : ''}</span>)}</dd><dt>Finishing touches</dt><dd>{decorations.map(key => DECORATION_LABELS[key]).join(', ') || 'Simply beautiful, without decorations'}</dd><dt>Decoration colour</dt><dd><span className="summary-colours"><span><i style={{background:config.decorationColour}}/>{config.decorationColour}</span></span></dd>{config.message.trim() && <><dt>Personalised message</dt><dd className="summary-message">“{config.message.trim()}”</dd></>}      </dl></details>
    <p className="control-hint">        Save your design or copy its summary. Use Request a Quote to review and send your enquiry when online submissions are available.</p>
  </aside>;
}
