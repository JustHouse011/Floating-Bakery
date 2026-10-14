import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { RoundedBox } from "@react-three/drei/core/RoundedBox";
import { readableMessageColour } from "../Materials/textColour";
export default function MessageTopper({
  message,
  top,
  colour,
}: {
  message: string;
  top: number;
  colour: string;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Text rendering is unavailable");
    context.fillStyle = "#fff9f1";
    context.fillRect(0, 0, 1024, 256);
    context.fillStyle = readableMessageColour(colour);
    context.textAlign = "center";
    context.textBaseline = "middle";
    let fontSize = 90;
    context.font = `500 ${fontSize}px Georgia, serif`;
    while (context.measureText(message).width > 940 && fontSize > 24) {
      fontSize -= 2;
      context.font = `500 ${fontSize}px Georgia, serif`;
    }
    context.fillText(message, 512, 132);
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, [message, colour]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group position={[0, top, 0.2]}>
      {[-0.48, 0.48].map((x) => (
        <mesh key={x} position={[x, 0.19, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.38, 8]} />
          <meshStandardMaterial color="#b69762" roughness={0.4} />
        </mesh>
      ))}
      <RoundedBox
        args={[1.62, 0.43, 0.06]}
        radius={0.035}
        smoothness={3}
        position={[0, 0.49, 0]}
      >
        <meshStandardMaterial color="#fff9f1" roughness={0.6} />
      </RoundedBox>
      {[0, 1].map((side) => (
        <mesh
          key={side}
          position={[0, 0.49, side === 0 ? 0.032 : -0.032]}
          rotation={[0, side === 0 ? 0 : Math.PI, 0]}
        >
          <planeGeometry args={[1.54, 0.385]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
