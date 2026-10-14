import { Vector2, Shape } from "three";
import type { CakeShape, CakeConfiguration } from "../types/cakeDesigner";
export function studioCameraFrame(
  config: Pick<CakeConfiguration, "shape" | "size" | "tiers"> &
    Partial<Pick<CakeConfiguration, "decorations" | "message">>,
  aspect: number,
) {
  const extraHeight =
    config.decorations === undefined
      ? 0.9
      : Math.max(
          config.decorations.topper ? 0.98 : 0,
          config.message?.trim() ? 0.74 : 0,
          config.decorations.flowers ? 0.19 : 0,
          0.12,
        );
  const sceneHeight = 0.82 + config.tiers * 0.72 + extraHeight;
  const sceneWidth =
    (config.size / 4) * (config.shape === "Square" ? Math.SQRT2 : 1) + 0.45;
  const halfFov = Math.tan((18 * Math.PI) / 180);
  return {
    targetHeight: sceneHeight / 2,
    distance:
      Math.max(
        (sceneHeight * 0.94 + sceneWidth * 0.36) / (2 * halfFov),
        sceneWidth / (2 * halfFov * Math.max(0.5, aspect)),
      ) * 1.18,
  };
}
export function roundedCakeProfile(radius: number, height: number): Vector2[] {
  const bevel = 0.055;
  const points = [new Vector2(0, 0), new Vector2(radius - bevel, 0)];
  for (let i = 1; i <= 6; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 12;
    points.push(
      new Vector2(
        radius - bevel + Math.cos(angle) * bevel,
        bevel + Math.sin(angle) * bevel,
      ),
    );
  }
  points.push(new Vector2(radius, height - bevel));
  for (let i = 1; i <= 6; i++) {
    const angle = (i * Math.PI) / 12;
    points.push(
      new Vector2(
        radius - bevel + Math.cos(angle) * bevel,
        height - bevel + Math.sin(angle) * bevel,
      ),
    );
  }
  points.push(new Vector2(0, height));
  return points;
}
export function perimeterPoint(
  shape: CakeShape,
  radius: number,
  fraction: number,
): [number, number] {
  const t = ((fraction % 1) + 1) % 1;
  if (shape === "Round")
    return [
      Math.cos(t * Math.PI * 2) * radius,
      Math.sin(t * Math.PI * 2) * radius,
    ];
  if (t < 0.25) return [-radius + t * 8 * radius, radius];
  if (t < 0.5) return [radius, radius - (t - 0.25) * 8 * radius];
  if (t < 0.75) return [radius - (t - 0.5) * 8 * radius, -radius];
  return [-radius, -radius + (t - 0.75) * 8 * radius];
}
export function starShape(): Shape {
  const shape = new Shape();
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? 0.25 : 0.115;
    const x = Math.cos(angle) * radius,
      y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}
