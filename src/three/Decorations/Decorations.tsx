import { memo, useMemo } from "react";
import InstancedDetail, { type DetailInstance } from "./InstancedDetail";
import { perimeterPoint, starShape } from "../cakeGeometry";
import type {
  CakeConfiguration,
  CakeShape,
  TierDimension,
} from "../../types/cakeDesigner";
function PerimeterBand({
  shape,
  radius,
  y,
  height,
  colour,
}: {
  shape: CakeShape;
  radius: number;
  y: number;
  height: number;
  colour: string;
}) {
  return shape === "Round" ? (
    <mesh position={[0, y, 0]}>
      <cylinderGeometry
        args={[radius + 0.012, radius + 0.012, height, 80, 1, true]}
      />
      <meshStandardMaterial color={colour} roughness={0.4} side={2} />
    </mesh>
  ) : (
    <group position={[0, y, 0]}>
      {[0, 1, 2, 3].map((side) => (
        <mesh
          key={side}
          position={
            side < 2
              ? [0, 0, (side === 0 ? 1 : -1) * (radius + 0.008)]
              : [(side === 2 ? 1 : -1) * (radius + 0.008), 0, 0]
          }
          rotation={[0, side < 2 ? 0 : Math.PI / 2, 0]}
        >
          <boxGeometry args={[radius * 2, height, 0.022]} />
          <meshStandardMaterial color={colour} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
export const TierDecorations = memo(function TierDecorations({
  tier,
  configuration,
}: {
  tier: TierDimension;
  configuration: CakeConfiguration;
}) {
  const { decorations, shape, decorationColour: colour } = configuration;
  const radius = tier.radius;
  const pearls = useMemo(
    () =>
      Array.from({ length: shape === "Round" ? 44 : 48 }, (_, i) => {
        const [x, z] = perimeterPoint(
          shape,
          radius + 0.009,
          i / (shape === "Round" ? 44 : 48),
        );
        return { position: [x, 0.065, z] } as DetailInstance;
      }),
    [shape, radius],
  );
  const drips = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const [x, z] = perimeterPoint(shape, radius + 0.009, (i + 0.5) / 24);
        const length = 0.08 + (Math.sin(i * 7.3) + 1) * 0.07;
        return {
          position: [x, tier.height - 0.04 - length / 2, z],
          scale: [1, (length + 0.068) / 0.208, 1],
        } as DetailInstance;
      }),
    [shape, radius, tier.height],
  );
  return (
    <group position={[0, tier.bottom, 0]}>
      {decorations.ribbon && (
        <PerimeterBand
          shape={shape}
          radius={radius}
          y={0.14}
          height={0.12}
          colour={colour}
        />
      )}
      {decorations.pearls && (
        <InstancedDetail instances={pearls}>
          <sphereGeometry args={[0.044, 10, 8]} />
          <meshStandardMaterial
            color="#fff5e5"
            roughness={0.2}
            metalness={0.12}
          />
        </InstancedDetail>
      )}
      {decorations.drip && (
        <>
          <PerimeterBand
            shape={shape}
            radius={radius}
            y={tier.height - 0.035}
            height={0.075}
            colour={colour}
          />
          <InstancedDetail instances={drips}>
            <capsuleGeometry args={[0.034, 0.14, 4, 8]} />
            <meshStandardMaterial color={colour} roughness={0.28} />
          </InstancedDetail>
        </>
      )}
    </group>
  );
});
function Flower({
  position,
  colour,
  scale = 1,
}: {
  position: [number, number, number];
  colour: string;
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * Math.PI) / 3;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.13, 0, Math.sin(angle) * 0.13]}
            rotation={[0, -angle, 0]}
            scale={[0.14, 0.04, 0.075]}
          >
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color={colour} roughness={0.68} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.035, 0]} scale={[0.07, 0.04, 0.07]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#e7bd76" roughness={0.5} />
      </mesh>
      <mesh
        position={[0.18, -0.025, -0.08]}
        rotation={[0, 0.6, 0]}
        scale={[0.2, 0.02, 0.07]}
      >
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#77966f" roughness={0.8} />
      </mesh>
    </group>
  );
}
export const TopDecorations = memo(function TopDecorations({
  configuration,
  top,
}: {
  configuration: CakeConfiguration;
  top: TierDimension;
}) {
  const star = useMemo(starShape, []);
  const colour = configuration.decorationColour;
  const y = top.bottom + top.height;
  return (
    <group>
      {configuration.decorations.flowers && (
        <group
          name="cake-flower-cluster"
          userData={{ cakeTop: y }}
          position={[0, y + 0.04, 0]}
        >
          <Flower position={[-top.radius * 0.5, 0, 0.18]} colour={colour} />
          <Flower
            position={[-top.radius * 0.33, 0.02, -0.14]}
            colour={colour}
            scale={0.85}
          />
          <Flower
            position={[-top.radius * 0.06, 0, 0.19]}
            colour={colour}
            scale={0.7}
          />
        </group>
      )}
      {configuration.decorations.topper && (
        <group
          position={[
            configuration.message.trim() ? top.radius * 0.6 : 0,
            y,
            -0.2,
          ]}
        >
          <mesh position={[0, 0.29, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.58, 8]} />
            <meshStandardMaterial
              color="#b69762"
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, 0.71, 0]}>
            <extrudeGeometry
              args={[
                star,
                {
                  depth: 0.035,
                  bevelEnabled: true,
                  bevelSize: 0.008,
                  bevelThickness: 0.008,
                  bevelSegments: 2,
                  steps: 1,
                },
              ]}
            />
            <meshStandardMaterial
              color={colour}
              metalness={0.25}
              roughness={0.35}
            />
          </mesh>
        </group>
      )}
    </group>
  );
});
export function ButtercreamDetail({
  tier,
  shape,
  colour,
}: {
  tier: TierDimension;
  shape: CakeShape;
  colour: string;
}) {
  const rings = useMemo(
    () =>
      Array.from(
        { length: 8 },
        (_, i) =>
          ({
            position: [0, 0.1 + i * 0.072, 0],
            rotation: [Math.PI / 2, 0, 0],
          }) as DetailInstance,
      ),
    [],
  );
  const lines = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => {
        const row = Math.floor(i / 4),
          side = i % 4;
        return {
          position:
            side < 2
              ? [0, 0.1 + row * 0.072, (side === 0 ? 1 : -1) * tier.radius]
              : [(side === 2 ? 1 : -1) * tier.radius, 0.1 + row * 0.072, 0],
          rotation: [0, side < 2 ? 0 : Math.PI / 2, 0],
        } as DetailInstance;
      }),
    [tier.radius],
  );
  return (
    <group position={[0, tier.bottom, 0]}>
      {shape === "Round" ? (
        <InstancedDetail instances={rings}>
          <torusGeometry args={[tier.radius - 0.002, 0.012, 5, 64]} />
          <meshStandardMaterial color={colour} roughness={0.95} />
        </InstancedDetail>
      ) : (
        <InstancedDetail instances={lines}>
          <boxGeometry args={[tier.radius * 2 - 0.08, 0.025, 0.025]} />
          <meshStandardMaterial color={colour} roughness={0.95} />
        </InstancedDetail>
      )}
    </group>
  );
}
