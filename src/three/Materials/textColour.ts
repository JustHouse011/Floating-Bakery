export function readableMessageColour(colour: string) {
  const luminance = (hex: string) => {
    const values = hex
      .replace("#", "")
      .match(/../g)!
      .map((c) => parseInt(c, 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  const a = luminance(colour),
    b = luminance("#fff9f1");
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5
    ? colour
    : "#933f55";
}
