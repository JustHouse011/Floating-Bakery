import type { ImgHTMLAttributes } from 'react';
import BakeryImage from './BakeryImage';

/** A shared 4:5 frame with cover cropping; source photographs stay unchanged. */
export default function ProductPhoto({ className = '', ...props }: ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) {
  return <BakeryImage {...props} className={`product-photo ${className}`} loading={props.loading || 'lazy'} decoding="async" />;
}
