import { memo, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { ContactShadows } from "@react-three/drei/core/ContactShadows";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useReducedMotion } from "framer-motion";
import { useCakeDesignerStore } from "../../store/cakeDesignerStore";
import CakeModel from "../CakeModel/CakeModel";
import { studioCameraFrame } from "../cakeGeometry";
import { studioTierPositions } from '../../services/studioDesign';
function StudioControls() {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const size = useCakeDesignerStore((state) => state.configuration.size);
  const shape = useCakeDesignerStore((state) => state.configuration.shape);
  const aspect = useThree(
    (state) => state.size.width / Math.max(1, state.size.height),
  );
  const tiers = useCakeDesignerStore((state) => state.configuration.tiers);
  const flowers = useCakeDesignerStore(
    (s) => s.configuration.decorations.flowers,
  );
  const topper = useCakeDesignerStore(
    (s) => s.configuration.decorations.topper,
  );
  const message = useCakeDesignerStore((s) => !!s.configuration.message.trim());
  const resetKey = useCakeDesignerStore((state) => state.cameraResetKey);
  const reducedMotion = useReducedMotion();
  const studio = useCakeDesignerStore(s=>s.configuration.studio);
  const framing = studio ? JSON.stringify([studio.shape,studio.tiers.map(t=>[t.width,t.depth,t.height,t.offset,t.taper])]) : '';
  const cameraView = useCakeDesignerStore(s=>s.cameraView);
  useEffect(() => {
    let { targetHeight, distance } = studioCameraFrame(
      {
        shape,
        size,
        tiers,
        decorations: {
          flowers,
          topper,
          pearls: false,
          ribbon: false,
          drip: false,
        },
        message: message ? "message" : "",
      },
      aspect,
    );
    const currentStudio=useCakeDesignerStore.getState().configuration.studio;
    if(currentStudio) {const positions=studioTierPositions(currentStudio);const top=positions[positions.length-1];targetHeight=(top.bottom+top.height+.8)/2;const width=Math.max(...positions.map(t=>Math.hypot(t.width,t.depth)+Math.abs(t.x)));distance=Math.max((top.bottom+top.height+1.2)*1.8,width*1.7/Math.max(.5,aspect));}
    camera.position.set(
      distance * 0.53,
      targetHeight + distance * 0.36,
      distance * 0.77,
    );
    if(cameraView==='Front')camera.position.set(0,targetHeight,distance);
    if(cameraView==='Side')camera.position.set(distance,targetHeight,0);
    if(cameraView==='Top')camera.position.set(0,targetHeight+distance,.001);
    controls.current?.target.set(0, targetHeight, 0);
    camera.lookAt(0, targetHeight, 0);
    controls.current?.update();
    invalidate();
  }, [
    shape,
    size,
    tiers,
    flowers,
    topper,
    message,
    aspect,
    resetKey,
    camera,
    invalidate,
    framing, cameraView,
  ]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping={!reducedMotion}
      dampingFactor={0.08}
      minDistance={3.8}
      maxDistance={20}
      minPolarAngle={0.001}
      maxPolarAngle={Math.PI / 2 - 0.05}
      rotateSpeed={0.65}
      zoomSpeed={0.7}
    />
  );
}
function ContextGuard({ onUnavailable }: { onUnavailable: () => void }) {
  const canvas = useThree((state) => state.gl.domElement);
  useEffect(() => {
    const lost = (event: Event) => {
      event.preventDefault();
      onUnavailable();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [canvas, onUnavailable]);
  return null;
}
// Re-render the one-frame shadow only for silhouette changes, without remounting
// Drei's render targets. This avoids allocating new GPU textures on each edit.
const CakeShadows = memo(function CakeShadows({
  signature,
}: {
  signature: string;
}) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [signature, invalidate]);
  return (
    <ContactShadows
      position={[0, 0.012, 0]}
      opacity={0.38}
      scale={10}
      blur={2.8}
      far={4.5}
      resolution={256}
      frames={Infinity}
    />
  );
});
export default function CakeScene({
  onUnavailable,
}: {
  onUnavailable: () => void;
}) {
  const config = useCakeDesignerStore((state) => state.configuration);
  const background = useCakeDesignerStore(s=>s.background);
  const [ready, setReady] = useState(false);
  const [compact, setCompact] = useState(
    () => window.matchMedia("(max-width: 760px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const change = () => setCompact(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return (
    <>
      {!ready && (
        <div className="scene-loading" role="status">
          Preparing your cake studio…
        </div>
      )}
      <Canvas
        role="region"
        tabIndex={0}
        aria-label="Interactive 3D cake; select a decoration or use the labelled placement controls."
        frameloop="demand"
        dpr={compact ? 1 : [1, 1.5]}
        camera={{ position: [5, 4, 7], fov: 36, near: 0.1, far: 50 }}
        gl={{ antialias: true, powerPreference: "low-power" }}
        onCreated={() => setReady(true)}
        fallback={
          <div className="scene-fallback">
            3D is unavailable. You can still configure, save and copy your
            design.
          </div>
        }
      >
        <color attach="background" args={[background==='White'?'#ffffff':background==='Warm'?'#f5efe9':'#edf1f6']} />
        <ambientLight intensity={0.8} />
        <hemisphereLight args={["#fff6ed", "#b2a0c3", 1.2]} />
        <directionalLight position={[4, 6, 5]} intensity={2.5} />
        <directionalLight
          position={[-4, 3, -2]}
          intensity={1.1}
          color="#e1e9ff"
        />
        <CakeModel configuration={config} />
        <CakeShadows
          signature={JSON.stringify([
            config.shape,
            config.studio,
            config.size,
            config.tiers,
            config.decorations,
            !!config.message.trim(),
            config.frosting === "Buttercream",
          ])}
        />
        <StudioControls />
        <ContextGuard onUnavailable={onUnavailable} />
      </Canvas>
    </>
  );
}
