import { useState, type ImgHTMLAttributes } from "react";
import { productImageSource } from "../../utils/productImages";
export default function BakeryImage({
  src,
  alt,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) {
  const source = productImageSource(src);
  const [failed, setFailed] = useState("");
  const [loadedFor, setLoadedFor] = useState('');
  const fallback = failed === source;
  return (
    <img
      {...props}
      srcSet={fallback ? undefined : props.srcSet}
      className={`${props.className || ''}${loadedFor === source ? '' : ' bakery-image-loading'}`}
      src={fallback ? "/images/cake-illustration.svg" : source}
      alt={
        fallback ? `Cake illustration. Photograph unavailable for ${alt}.` : alt
      }
      onError={() => setFailed(source)}
      onLoad={() => setLoadedFor(source)}
    />
  );
}
