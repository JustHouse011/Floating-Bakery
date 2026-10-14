import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { ReferenceImage } from "../../types/quotation";
function ReferenceThumbnail({
  image,
  onRemove,
}: {
  image: ReferenceImage;
  onRemove?: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const preview = URL.createObjectURL(image.blob);
    setUrl(preview);
    setFailed(false);
    return () => URL.revokeObjectURL(preview);
  }, [image.blob]);
  return (
    <figure className="reference-thumbnail">
      {url && !failed ? (
        <img
          src={url}
          alt={`Reference: ${image.name}`}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="reference-placeholder">
          {failed ? "This image preview is unavailable." : "Loading image…"}
        </div>
      )}
      <figcaption>
        {image.name}
        <small>{(image.size / 1024).toFixed(0)} KB</small>
      </figcaption>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${image.name}`}
          onClick={onRemove}
        >
          <X size={16} />
        </button>
      )}
    </figure>
  );
}
export default function ReferenceGallery({
  images,
  onRemove,
}: {
  images: ReferenceImage[];
  onRemove?: (id: string) => void;
}) {
  return (
    <div className="reference-gallery">
      {images.map((image) => (
        <ReferenceThumbnail
          key={image.id}
          image={image}
          onRemove={onRemove ? () => onRemove(image.id) : undefined}
        />
      ))}
    </div>
  );
}
