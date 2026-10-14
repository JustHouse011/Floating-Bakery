import type {
  CustomerDetails,
  EventDetails,
  QuotationSnapshot,
  ReferenceImage,
} from "../../types/quotation";
import { DECORATIONS } from "../../types/cakeDesigner";
import { DECORATION_LABELS, COLOUR_SWATCHES } from "../../data/designer";
import { formatEventDate } from "../../utils/quotation";
import { EstimateReceipt } from "../designer/EstimatePanel";
import ReferenceGallery from "./ReferenceGallery";
import BakeryImage from '../ui/BakeryImage';
import StudioConfigurationSummary from '../designer/StudioConfigurationSummary';
import {IS_PUBLIC_SITE} from '../../config/siteMode';
export default function QuotationSummary({
  customer,
  event,
  snapshot,
  images,
}: {
  customer: CustomerDetails;
  event: EventDetails;
  snapshot: QuotationSnapshot;
  images: ReferenceImage[];
}) {
  const config = snapshot.configuration;
  const decorations = DECORATIONS.filter((key) => config.decorations[key]);
  return (
    <div className="quotation-summary">
      {snapshot.requestPolicy.businessDisclaimer &&
        snapshot.requestPolicy.businessDisclaimer !== snapshot.disclaimer && (
          <p className="fine-print">
            {snapshot.requestPolicy.businessDisclaimer}
          </p>
        )}
      {event.fulfilment === "Collection" &&
        snapshot.requestPolicy.collectionInstructions && (
          <p>{snapshot.requestPolicy.collectionInstructions}</p>
        )}
      <div className="quote-review-grid">
        <section>
          <span className="eyebrow">THE PERSON BEHIND THE OCCASION</span>
          <h3>Customer details</h3>
          <dl>
            <dt>Full name</dt>
            <dd>{customer.fullName}</dd>
            <dt>Email</dt>
            <dd>{customer.email}</dd>
            <dt>Contact number</dt>
            <dd>{customer.contactNumber}</dd>
            <dt>Preferred contact</dt>
            <dd>{customer.preferredContactMethod}</dd>
          </dl>
        </section>
        <section>
          <span className="eyebrow">A DATE TO LOOK FORWARD TO</span>
          <h3>Event details</h3>
          <dl>
            <dt>Occasion</dt>
            <dd>{event.eventType}</dd>
            <dt>Date</dt>
            <dd>{formatEventDate(event.eventDate)}</dd>
            <dt>Collection or delivery</dt>
            <dd>{event.fulfilment}</dd>
            {event.fulfilment === "Delivery" && (
              <>
                <dt>Delivery area</dt>
                <dd>{event.deliveryArea}</dd>
              </>
            )}
            <dt>Estimated guests</dt>
            <dd>{event.guests}</dd>
            {event.specialInstructions && (
              <>
                <dt>Special instructions</dt>
                <dd className="special-instructions">
                  {event.specialInstructions}
                </dd>
              </>
            )}
          </dl>
          <p className="quote-hint">
            No delivery price, availability or service-area confirmation is
            included.
          </p>
        </section>
      </div>
      <section className="quote-cake-details">
        {snapshot.official && <section className="official-quote-reference"><h3>{snapshot.official.productName}</h3><BakeryImage src={snapshot.official.image} alt={snapshot.official.productName}/><p>{snapshot.official.category} · {snapshot.official.flavour}</p><p>{snapshot.official.personalisationInstructions}</p><p>Estimated range · awaiting bakery confirmation. Photograph is the design reference; 3D geometry is conceptual.</p></section>}
        <span className="eyebrow">DESIGNED AROUND YOUR MOMENT</span>
        <h3>Your cake design</h3>
        <dl>
          <dt>Shape & tiers</dt>
          <dd>
            {config.studio?.shape || config.shape} · {config.studio?.tiers.length || config.tiers}{" "}
            tiers ·{" "}
            {(config.studio ? config.studio.tiers.map(t=>t.width*4) : snapshot.tierSizesInches).map((size) => `${size}″`).join(" / ")}{" "}
            (base to top)
          </dd>
          <dt>Flavour & finish</dt>
          <dd>
            {config.officialFlavour || config.flavour} · {config.frosting}
          </dd>
          <dt>Tier colours</dt>
          <dd className="quote-colours">
            {config.tierColours.slice(0, config.tiers).map((hex, index) => (
              <span key={index}>
                <i style={{ background: hex }} />
                {COLOUR_SWATCHES.find((colour) => colour.hex === hex)?.name ??
                  hex}
                {config.frosting === "Chocolate Ganache"
                  ? " (stored; chocolate finish)"
                  : ""}
              </span>
            ))}
          </dd>
          <dt>Decorations</dt>
          <dd>
            {decorations.map((key) => DECORATION_LABELS[key]).join(", ") ||
              "None"}
          </dd>
          <dt>Decoration colour</dt>
          <dd>{config.decorationColour}</dd>
          <dt>Personalised message</dt>
          <dd>{config.message.trim() || "None"}</dd>
          {snapshot.selectedProduct && (
            <>
              <dt>Catalogue inspiration</dt>
              <dd>{snapshot.selectedProduct.name}</dd>
            </>
          )}
        </dl>
      </section>
      {IS_PUBLIC_SITE && !snapshot.official ? <p>Bakery quotation required. Final pricing is subject to confirmation.</p> : <EstimateReceipt estimate={snapshot.estimate} />}
      <StudioConfigurationSummary studio={config.studio} message={config.message} inspect/>
      {images.length > 0 && (
        <section>
          <h3>Reference photographs</h3>
          <ReferenceGallery images={images} />
          <p className="quote-hint">
            References require individual bakery review and are not included in
            the indicative design amount.
          </p>
        </section>
      )}
    </div>
  );
}
