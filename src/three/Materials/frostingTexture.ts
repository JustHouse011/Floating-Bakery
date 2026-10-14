import { DataTexture, RedFormat, RepeatWrapping, LinearFilter } from "three";
export function frostingTexture() {
  const data = new Uint8Array(64 * 64);
  for (let i = 0; i < data.length; i++)
    data[i] = 128 + Math.round(Math.sin(i * 12.9898) * 20);
  const texture = new DataTexture(data, 64, 64, RedFormat);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(9, 3);
  texture.magFilter = texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
