import { lazy, Suspense, useEffect, useState, useCallback, useRef } from "react";
import { RotateCcw, Move, ZoomIn } from "lucide-react";
import SceneBoundary from "./SceneBoundary";
import { useCakeDesignerStore } from "../../store/cakeDesignerStore";
import { useLocalProducts } from '../../store/adminStore';
import BakeryImage from '../ui/BakeryImage';
const CakeScene = lazy(() => import("../../three/CakeScene/CakeScene"));
function SceneFallback() {
  return (
    <div className="scene-fallback" role="status">
      <span className="eyebrow">YOUR DESIGN IS STILL HERE</span>
      <h3>The 3D preview is unavailable.</h3>
      <p>
        This browser needs WebGL 2 to display the cake. Try a compatible browser
        with hardware acceleration. You can still change your options, save the
        design, review the estimate and request a quotation.
      </p>
    </div>
  );
}
export default function DesignerViewport() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const resetCamera = useCakeDesignerStore((state) => state.resetCamera);
  const state=useCakeDesignerStore();const products=useLocalProducts();const product=products.find(p=>p.id===state.configuration.selectedProductId);
  const [compare,setCompare]=useState(false);const frame=useRef<HTMLElement>(null);
  const [fullscreen,setFullscreen]=useState(false);
  useEffect(()=>{const changed=()=>setFullscreen(Boolean(document.fullscreenElement));document.addEventListener('fullscreenchange',changed);return()=>document.removeEventListener('fullscreenchange',changed);},[]);
  const unavailable = useCallback(() => setSupported(false), []);
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2");
      setSupported(Boolean(context));
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      setSupported(false);
    }
  }, []);
  return (
    <section ref={frame} className={`studio-viewport${fullscreen?' studio-fullscreen':''}`} aria-label="Interactive cake preview" onKeyDown={e=>{if(e.key==='Escape')setFullscreen(false);}}>
      <div className="viewport-topline">
        <span className="eyebrow">YOUR CAKE, IN THE MAKING</span>
        <span className="studio-live">3D STUDIO</span>
      </div>
      <div className={compare&&product?'studio-preview-comparison-grid':''}>
      {compare&&product&&<figure className="studio-original-reference"><figcaption>Original Design</figcaption><BakeryImage src={product.image} alt={product.name}/></figure>}
      <div
        className="canvas-frame"
        role="region"
        aria-label="3D cake. Drag to rotate, scroll or pinch to zoom. Use Reset view to restore the camera."
      >
        {supported === null ? (
          <div className="scene-loading" role="status">
            Checking your 3D studio…
          </div>
        ) : supported ? (
          <SceneBoundary fallback={<SceneFallback />}>
            <Suspense
              fallback={
                <div className="scene-loading" role="status">
                  Loading the 3D studio…
                </div>
              }
            >
              <CakeScene onUnavailable={unavailable} />
            </Suspense>
          </SceneBoundary>
        ) : (
          <SceneFallback />
        )}
      </div>
      </div>
      <div className="viewport-tools">
        {(['Front','Side','Top'] as const).map(view=><button key={view} disabled={supported!==true} aria-pressed={state.cameraView===view} onClick={()=>state.setCameraView(view)}>{view} view</button>)}
        <button onClick={()=>{if(document.fullscreenElement)void document.exitFullscreen();else if(frame.current?.requestFullscreen)void frame.current.requestFullscreen();else setFullscreen(v=>!v);}}>{fullscreen?'Exit fullscreen':'Fullscreen preview'}</button>
        {product&&<button aria-pressed={compare} onClick={()=>setCompare(v=>!v)}>Original Design | Your Customisation</button>}
        <label>Studio background<select value={state.background} onChange={e=>state.setBackground(e.target.value as typeof state.background)}>{['White','Warm','Cool'].map(v=><option key={v}>{v}</option>)}</select></label>
        <span>
          <Move size={14} /> Drag to rotate
        </span>
        <span>
          <ZoomIn size={14} /> Scroll / pinch to zoom
        </span>
        <button
          type="button"
          onClick={resetCamera}
          disabled={supported !== true}
        >
          <RotateCcw size={14} /> Reset view
        </button>
      </div>
      {compare&&product&&<section className="studio-comparison"><div><h3>Your Customisation</h3><p>The live preview shows supported structure, colours and decoration positions.</p><p>Approximate visual representation. {state.configuration.studio?.referenceOnly.join('. ')}</p></div></section>}
      <p className="viewport-note">
        Your cake design preview. Colours and handmade details may vary in the
        finished cake. Your changes stay in this tab when you refresh. Save
        design keeps a copy on this browser after closing the tab.
      </p>
    </section>
  );
}
