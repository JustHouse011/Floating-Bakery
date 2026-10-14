const replacements: Record<string, string> = {
  "photo-1578985545062-69928b1d9587": "/images/celebration.jpg",
  "photo-1606313564200-e75d5e30476c": "/images/chocolate.jpg",
  "photo-1586788680434-30d324b2d46f": "/images/red-velvet.jpg",
  "photo-1535254973040-607b92a401c8": "/images/floral.jpg",
  "photo-1623428187969-5da2dcea5ebf": "/images/celebration.jpg",
  "photo-1523438885200-e635ba2c371e": "/images/celebration.jpg",
};
// Presentation aliases repair original sample URLs without rewriting saved catalogues.
export function productImageSource(source: string) {
  try {
    const url = new URL(source);
    if (
      url.hostname === "images.unsplash.com" &&
      url.search === "?auto=format&fit=crop&w=900&q=85"
    )
      return replacements[url.pathname.slice(1)] ?? source;
  } catch {
    /* Local paths need no alias. */
  }
  return source;
}
