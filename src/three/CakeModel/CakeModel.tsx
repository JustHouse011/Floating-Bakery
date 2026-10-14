import { memo, useEffect, useMemo } from "react";
import type { Texture } from "three";
import { frostingTexture } from "../Materials/frostingTexture";
import { RoundedBox } from "@react-three/drei/core/RoundedBox";
import type {
  CakeConfiguration,
  TierDimension,
} from "../../types/cakeDesigner";
import { tierDimensions } from "../../services/cakeConfiguration";
import { roundedCakeProfile } from "../cakeGeometry";
import { frostingMaterial } from "../Materials/frosting";
import {
  ButtercreamDetail,
  TierDecorations,
  TopDecorations,
} from "../Decorations/Decorations";
import MessageTopper from "../Decorations/MessageTopper";
import StudioCake from './StudioCake';
const CakeTier = memo(function CakeTier({
  tier,
  configuration,
  texture,
}: {
  tier: TierDimension;
  configuration: CakeConfiguration;
  texture: Texture;
}) {
  const profile = useMemo(
    () => roundedCakeProfile(tier.radius, tier.height),
    [tier.radius, tier.height],
  );
  const material = frostingMaterial(
    configuration.frosting,
    configuration.tierColours[tier.index],
  );
  return (
    <>
      {configuration.shape === "Round" ? (
        <mesh position={[0, tier.bottom, 0]}>
          <latheGeometry args={[profile, 80]} />
          <meshPhysicalMaterial
            {...material}
            bumpMap={configuration.frosting === "Buttercream" ? texture : null}
            bumpScale={0.006}
          />
        </mesh>
      ) : (
        <RoundedBox
          args={[tier.radius * 2, tier.height, tier.radius * 2]}
          radius={0.055}
          smoothness={4}
          position={[0, tier.bottom + tier.height / 2, 0]}
        >
          <meshPhysicalMaterial
            {...material}
            bumpMap={configuration.frosting === "Buttercream" ? texture : null}
            bumpScale={0.006}
          />
        </RoundedBox>
      )}
      {configuration.frosting === "Buttercream" && (
        <ButtercreamDetail
          tier={tier}
          shape={configuration.shape}
          colour={material.color}
        />
      )}
      <TierDecorations tier={tier} configuration={configuration} />
    </>
  );
});
export default memo(function CakeModel({
  configuration,
}: {
  configuration: CakeConfiguration;
}) {
  const texture = useMemo(frostingTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  const tiers = useMemo(
    () =>
      tierDimensions({ size: configuration.size, tiers: configuration.tiers }),
    [configuration.size, configuration.tiers],
  );
  const top = tiers[tiers.length - 1];
  if (configuration.studio) return <StudioCake studio={{...configuration.studio, ...(configuration.frosting==='Chocolate Ganache'?{tiers:configuration.studio.tiers.map(t=>({...t,colour:'#45281e'}))}:{}), personalisation:{...configuration.studio.personalisation,message:configuration.studio.personalisation.message || configuration.message}}}/>;
  const boardRadius =
    configuration.shape === "Square"
      ? (configuration.size / 8) * Math.SQRT2 + 0.15
      : configuration.size / 8 + 0.2;
  return (
    <group name="custom-cake">
      <mesh position={[0, 0.112, 0]}>
        <cylinderGeometry args={[0.64, 0.74, 0.2, 64]} />
        <meshStandardMaterial color="#e2ccd0" roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.427, 0]}>
        <cylinderGeometry args={[0.23, 0.3, 0.43, 48]} />
        <meshStandardMaterial color="#e2ccd0" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry
          args={[boardRadius + 0.07, boardRadius + 0.02, 0.14, 80]}
        />
        <meshStandardMaterial color="#ecd8dc" roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.795, 0]}>
        <cylinderGeometry args={[boardRadius, boardRadius, 0.05, 80]} />
        <meshStandardMaterial color="#fff9ef" roughness={0.56} />
      </mesh>
      {tiers.map((tier) => (
        <CakeTier
          key={tier.index}
          tier={tier}
          configuration={configuration}
          texture={texture}
        />
      ))}
      <TopDecorations configuration={configuration} top={top} />
      {configuration.message.trim() && (
        <MessageTopper
          message={configuration.message.trim()}
          colour={configuration.decorationColour}
          top={top.bottom + top.height}
        />
      )}
    </group>
  );
});
