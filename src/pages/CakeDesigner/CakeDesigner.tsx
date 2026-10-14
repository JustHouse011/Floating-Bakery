import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ChevronDown, Check, Copy, RotateCcw, Save, FolderOpen, X } from 'lucide-react';
import DesignerControls from '../../components/designer/DesignerControls';
import DesignerViewport from '../../components/designer/DesignerViewport';
import DesignerSummary from "../../components/designer/DesignerSummary";
import StudioPanel from '../../components/designer/StudioPanel';
import MobileEstimate from '../../components/designer/MobileEstimate';
import { useCakeDesignerStore } from '../../store/cakeDesignerStore';
import { saveDesign, restoreDesign } from '../../services/designerStorage';
import { buildEstimateSummary } from '../../services/estimateSummary';
import { cakePricingStore } from '../../store/cakePricingStore';
import { useLocalProducts } from '../../store/adminStore';
import "../../styles/designer.css";
import '../../styles/advanced-studio.css';
import { beginQuotation } from '../../services/quotationNavigation';
import { stableJSON } from '../../utils/quotation';
import { readSessionDesign,writeSessionDesign } from '../../services/sessionDesign';
export default function CakeDesigner() {
  const products = useLocalProducts();
  const activeConfiguration = useCakeDesignerStore(s => s.configuration);
  const officialProduct = products.find(p => p.id === activeConfiguration.selectedProductId && p.kind === 'official-cake');
  const [params] = useSearchParams();
  const navigate=useNavigate();
    function requestCake() {
    beginQuotation(useCakeDesignerStore.getState().configuration);navigate('/quote-request');}
  const productId = params.get('product');
  const [notice,setNotice] = useState('');
  const [failed,setFailed] = useState(false);
  const [copyText,setCopyText] = useState<string | null>(null);
  const copyArea = useRef<HTMLTextAreaElement>(null);
  const tools=useRef<HTMLDetailsElement>(null);const toolbar=useRef<HTMLDivElement>(null);
  const resumedProduct=useRef<string|null|undefined>(undefined);
  function closeTools(){if(window.matchMedia('(max-width: 760px)').matches&&tools.current){tools.current.open=false;tools.current.querySelector('summary')?.focus();}}
  useEffect(()=>{const media=window.matchMedia('(max-width: 760px)');const resize=()=>{if(tools.current)tools.current.open=!media.matches;};resize();media.addEventListener('change',resize);const bar=toolbar.current;const observer=new ResizeObserver(()=>{if(bar)bar.closest<HTMLElement>('.cake-studio')?.style.setProperty('--studio-action-height',`${bar.getBoundingClientRect().height}px`);});if(bar)observer.observe(bar);return()=>{media.removeEventListener('change',resize);observer.disconnect();};},[]);
  useEffect(()=> {
    try {      const config = readSessionDesign(          sessionStorage,
          productId);if(config&&useCakeDesignerStore.getState().configuration===          useCakeDesignerStore.getInitialState().configuration      )
        {useCakeDesignerStore.getState().restoreConfiguration(config);resumedProduct.current=productId;}
      else if(config&&stableJSON(config)===stableJSON(useCakeDesignerStore.getState().configuration))resumedProduct.current=productId;}catch {setNotice('Your previous session design could not be restored. Your manually saved design is still available.');}
    const persist=()=>{try{writeSessionDesign(useCakeDesignerStore.getState().configuration,sessionStorage,productId);}catch{setNotice('Automatic session saving is unavailable. Use Save design to keep a copy on this browser.');}};
    const unsubscribe=useCakeDesignerStore.subscribe(persist);
    persist();
    return()=>unsubscribe();
    // Restore once when opening the studio; subsequent URL selections use the catalogue effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(() => {
    if(resumedProduct.current===productId)return; if (productId && products.some(p => p.id === productId)    ) {
      if (useCakeDesignerStore.getState().configuration.selectedProductId === productId) { resumedProduct.current = productId; return; }
      useCakeDesignerStore.getState().selectProduct(productId);
      resumedProduct.current=productId;
    }   }, [productId, products]);
  useEffect(() => { if (copyText !== null) { copyArea.current?.focus(); copyArea.current?.select(); } },[copyText]);
    function action(operation: "save" | "restore" | "reset") {
    closeTools();
    try {
      const store = useCakeDesignerStore.getState();
      if (operation === 'save') { saveDesign(store.configuration); setNotice('Your design has been saved.'); }
      if (operation === 'restore') { store.restoreConfiguration(restoreDesign());         setNotice("Your saved design has been restored. Current catalogue prices will apply."); }
      if (operation === 'reset') { store.resetDesign(); setNotice('Default design restored. Your saved design is still available.'); }
      setFailed(false);
    } catch (error) { setFailed(true); setNotice(error instanceof Error ? error.message : 'Your browser could not access local storage.'); }
  }
  async function copy() {
    closeTools();
    const text = buildEstimateSummary(useCakeDesignerStore.getState().configuration, cakePricingStore.getState().rules);
    try { await navigator.clipboard.writeText(text);       setNotice("Cake estimate copied, for your bakery quotation."); setFailed(false); }
    catch { setCopyText(text); setNotice('Automatic copy is unavailable. Select and copy the summary below.'); setFailed(false); }
  }
  return     <div className={`cake-studio${officialProduct ? ' official-studio' : ''}`}>
    <div className="studio-heading"><div><Link to="/cakes" className="text-link"><ArrowLeft size={14}/> Back to the collection</Link><h1>Make it <em>uniquely yours.</em></h1><p>A colour, a finishing touch, a little imagination. Your celebration starts here.</p></div>        <div className="studio-request"><span className="studio-phase">THE CAKE DESIGN STUDIO</span><button type="button" className="button" onClick={requestCake}>Request This Cake <ArrowUpRight size={17}/></button></div></div>
    <div className="studio-grid">        <StudioPanel title="Design tools" kind="tools"><DesignerControls /></StudioPanel><DesignerViewport/>        <StudioPanel title="Design summary" kind="summary"><DesignerSummary /></StudioPanel></div>
          <div ref={toolbar} className="studio-action-bar" aria-label="Design actions" role="group">
        <MobileEstimate/><span className="studio-action-caption"><Check size={16}/> Designed by you. Made for your moment.</span><details ref={tools} className="studio-tools" open><summary>More design actions <ChevronDown size={14}/></summary><div><button type="button" onClick={() => action('reset')}><RotateCcw size={15}/><span>Reset design</span></button><button type="button" onClick={() => action('restore')}><FolderOpen size={15}/><span>Restore saved</span></button><button type="button" onClick={copy}><Copy size={15}/>            <span>Copy Estimate</span></button><button type="button" className="save-design" onClick={() => action('save')}><Save size={15}/>            <span>Save design</span>
          </button>
          </div></details>
          <button
            type="button"
            className="request-cake-action" onClick={requestCake}><ArrowUpRight size={15}/><span>Request This Cake</span></button><small className="studio-terms">Subject to bakery confirmation</small></div>
    <div className={`studio-notice ${failed ? 'error' : ''}`} role="status" aria-live="polite">{notice}</div>
    {copyText !== null && <section className="copy-summary-panel"           aria-label="Copy your estimate"><div>            <h2>Your cake estimate</h2><button type="button" aria-label="Close copy summary" onClick={() => setCopyText(null)}><X size={18}/></button></div><textarea ref={copyArea} readOnly value={copyText} rows={14}             aria-label="Cake estimate to copy"/><p>Select the text and use your device’s copy action.</p></section>}
  </div>;
}
