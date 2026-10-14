import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei/core/OrbitControls';
import { ContactShadows } from '@react-three/drei/core/ContactShadows';
import { useReducedMotion } from 'framer-motion';
import type { StudioDesign } from '../../types/studio';
import { studioTierPositions } from '../../services/studioDesign';
import StudioCake from '../CakeModel/StudioCake';
export default function SavedStudioPreview({studio}:{studio:StudioDesign}) {
 const top=studioTierPositions(studio).at(-1)!;const height=top.bottom+top.height;const reduced=useReducedMotion();
 return <div style={{height:380,maxWidth:700}} aria-label="Read-only saved studio preview"><Canvas frameloop="demand" dpr={1} camera={{position:[height*.8,height*.8,height*1.5],fov:42}} gl={{antialias:true,powerPreference:'low-power'}} fallback={<p>3D is unavailable. All saved studio details are listed below.</p>}><color attach="background" args={['#ffffff']}/><ambientLight intensity={1}/><directionalLight position={[4,6,5]} intensity={2.5}/><directionalLight position={[-4,3,-2]} intensity={1}/><StudioCake studio={studio} readOnly/><ContactShadows position={[0,.005,0]} opacity={.3} blur={2.5} scale={8} resolution={128} frames={1}/><OrbitControls target={[0,height/2,0]} enablePan={false} enableDamping={!reduced} minDistance={3} maxDistance={18}/></Canvas></div>;
}
