import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import {
  CONTACT_METHODS,
  EVENT_TYPES,
  type QuotationField,
  type QuotationErrors,
  type CustomerDetails,
  type EventFormValues,
} from "../../types/quotation";
import { useQuotationDraftStore } from "../../store/quotationDraftStore";
import {
  useCakePricingRules,
  cakePricingStore,
} from "../../store/cakePricingStore";
import { useQuotationPolicy } from "../../hooks/useQuotationPolicy";
import {
  validateCustomer,
  validateEvent,
  QuotationValidationError,
  normalizeCustomer,
  normalizeEvent,
} from "../../services/quotationValidation";
import { captureQuotationSnapshot } from "../../services/quotationSnapshot";
import {
  submitQuotation,
  PricingChangedError,
} from "../../services/quotationService";
import { quotationRepository } from "../../services/quotationRepository";
import { formatZARCents } from "../../utils/currency";
import { formatPriceRange } from '../../services/officialCakePricing';
import BakeryImage from '../../components/ui/BakeryImage';
import { addCalendarDays, southAfricanDate } from "../../utils/quotation";
import ReferenceUploader from "../../components/quotation/ReferenceUploader";
import QuotationSummary from "../../components/quotation/QuotationSummary";
import "../../styles/quotation.css";
import {IS_PUBLIC_SITE} from '../../config/siteMode';
import {deliverEnquiry,DELIVERY_FAILURE} from '../../services/onlineEnquiries';
import useDeliveryStatus from '../../hooks/useDeliveryStatus';
import DeliveryAvailability from '../../components/quotation/DeliveryAvailability';
const steps = ["Your details", "Your occasion", "Inspiration", IS_PUBLIC_SITE ? "Review & send" : "Review & save"];
function Field({
  label,
  name,
  id,
  error,
  children,
}: {
  label: string;
  name: QuotationField;
  id: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="quote-field">
      <label htmlFor={`${id}-${name}`}>{label}</label>
      {children}
      {error && (
        <p id={`${id}-${name}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export default function QuotationRequest() {
  const {status,checking}=useDeliveryStatus();
  const quotationRequestPolicy = useQuotationPolicy();
  const {
    draft,
    step,
    setCustomer,
    setEvent,
    setReferences,
    setConsent,
    setStep,
    clear,
  } = useQuotationDraftStore();
  const pricingRules = useCakePricingRules();
  const id = useId();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<QuotationErrors>({});
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [focusField, setFocusField] = useState<QuotationField | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const submitting = useRef(false);
  const submission = useRef({payload:'',id:''});
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const configuration = draft?.configuration;
  const references = draft?.references;
  const preview = useMemo(() => {
    if (!configuration || !references) return { snapshot: null, error: "" };
    try {
      return {
        snapshot: captureQuotationSnapshot(
          configuration,
          pricingRules,
          references,
          quotationRequestPolicy,
        ),
        error: "",
      };
    } catch (error) {
      return {
        snapshot: null,
        error:
          error instanceof Error
            ? error.message
            : "Pricing is unavailable. Please try again.",
      };
    }
  }, [configuration, references, pricingRules, quotationRequestPolicy]);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  useEffect(() => {
    if (focusField)
      document
        .getElementById(
          focusField === "references"
            ? "reference-files"
            : `${id}-${focusField}`,
        )
        ?.focus();
  }, [focusField, id, errors, step]);
  function showErrors(next: QuotationErrors) {
    setErrors(next);
    const field = Object.keys(next)[0] as QuotationField;
    const customerFields = [
      "fullName",
      "email",
      "contactNumber",
      "preferredContactMethod",
    ];
    const eventFields = [
      "eventType",
      "eventDate",
      "fulfilment",
      "deliveryArea",
      "guests",
      "specialInstructions",
    ];
    setStep(
      customerFields.includes(field)
        ? 0
        : eventFields.includes(field)
          ? 1
          : field === "references"
            ? 2
            : 3,
    );
    setFocusField(field);
  }
  function back(next: number) {
    setErrors({});
    setFailure("");
    setFocusField(null);
    setStep(next);
  }
  async function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || uploading || submitting.current) return;
    setFailure("");
    setFocusField(null);
    if (step < 3) {
      const nextErrors =
        step === 0
          ? validateCustomer(draft.customer)
          : step === 1
            ? validateEvent(draft.event, quotationRequestPolicy)
            : {};
      if (Object.keys(nextErrors).length) {
        showErrors(nextErrors);
        return;
      }
      setErrors({});
      setStep(step + 1);
      return;
    }
    if (!preview.snapshot) {
      setFailure(preview.error || "Your estimate is unavailable.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      if(IS_PUBLIC_SITE){
        if(!draft.demoConsent){showErrors({demoConsent:'Please consent to sending your enquiry details.'});return;}
        const images=await Promise.all(draft.references.map(async image=>({content:await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('Could not read image'));reader.readAsDataURL(image.blob);})})));
        const data={configuration:draft.configuration,customer:draft.customer,event:draft.event,consent:draft.demoConsent,references:images};
        const payload=JSON.stringify(data);if(!submission.current.id)submission.current.id=draft.id;else if(submission.current.payload!==payload)submission.current.id=crypto.randomUUID();submission.current.payload=payload;
        const received=await deliverEnquiry('quotation',data,status,submission.current.id);
        clear();navigate('/request-received',{replace:true,state:received});return;
      }
      const saved = await submitQuotation(
        draft,
        () => cakePricingStore.getState().rules,
        quotationRepository,
        {
          reviewedEstimate: preview.snapshot.estimate,
          policy: quotationRequestPolicy,
        },
      );
      if (useQuotationDraftStore.getState().draft?.id === saved.id) clear();
      if (mounted.current)
        navigate(`/quotations/${saved.id}`, { replace: true });
    } catch (error) {
      if (!mounted.current) return;
      if (error instanceof QuotationValidationError) showErrors(error.fields);
      else {
        setFailure(
          error instanceof Error
            ? error.message
            : DELIVERY_FAILURE,
        );
        if (error instanceof PricingChangedError) setStep(3);
      }
    } finally {
      submitting.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  if (!draft)
    return (
      <section className="section page-heading quote-empty">
        <span className="eyebrow">A CAKE TO CALL YOUR OWN</span>
        <h1>
          Start with <em>your design.</em>
        </h1>
        <p>
          Create your cake in the studio, then select Request This Cake. Unsaved
          form details are held in memory and do not survive a browser reload.
        </p>
        <Link to="/cake-designer" className="button">
          Open the Cake Studio <ArrowUpRight size={17} />
        </Link>
      </section>
    );
  const attributes = (name: QuotationField) => ({
    id: `${id}-${name}`,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
  });
  const customerField = (
    name: keyof CustomerDetails,
    label: string,
    type = "text",
    autoComplete?: string,
  ) => (
    <Field key={name} label={label} name={name} id={id} error={errors[name]}>
      <input
        {...attributes(name)}
        type={type}
        autoComplete={autoComplete}
        required
        value={draft.customer[name]}
        maxLength={name === "fullName" ? 100 : name === "email" ? 254 : 40}
        onChange={(event) => setCustomer({ [name]: event.target.value })}
      />
    </Field>
  );
  const total =
    preview.snapshot?.estimate.estimatedTotalCents ??
    preview.snapshot?.estimate.indicativeTotalCents;
  return (
    <div className="quote-flow">
      <div className="quote-page-heading">
        <Link to="/cake-designer" className="text-link">
          <ArrowLeft size={14} /> Back to your cake
        </Link>
        <span className="eyebrow">YOUR DESIGN. YOUR OCCASION.</span>
        <h1>
          A sweet moment,
          <br />
          <em>one step closer.</em>
        </h1>
        <p>
          Share your design and occasion with the bakery. Final pricing and availability require confirmation.
        </p>
      </div>
      {IS_PUBLIC_SITE&&<DeliveryAvailability enabled={status.enabled} checking={checking}/>}
      <ol className="quote-progress" aria-label="Quotation request progress">
        {steps.map((label, index) => (
          <li
            key={label}
            aria-current={index === step ? "step" : undefined}
            className={
              index === step ? "current" : index < step ? "complete" : ""
            }
          >
            <span>{index < step ? <Check size={14} /> : index + 1}</span>
            <span>{label}</span>
          </li>
        ))}
      </ol>
      <div className="quote-layout">
        <form onSubmit={next} noValidate className="quote-form">
          <fieldset disabled={busy || uploading}>
            <span className="eyebrow">STEP {step + 1} OF 4</span>
            <h2 ref={heading} tabIndex={-1}>
              {steps[step]}
            </h2>
            {step === 0 && (
              <>
                <div className="quote-form-grid">
                  {customerField("fullName", "Full name", "text", "name")}
                  {customerField("email", "Email address", "email", "email")}
                  {customerField(
                    "contactNumber",
                    "South African contact number",
                    "tel",
                    "tel",
                  )}
                  <Field
                    label="Preferred contact method"
                    name="preferredContactMethod"
                    id={id}
                    error={errors.preferredContactMethod}
                  >
                    <select
                      {...attributes("preferredContactMethod")}
                      value={draft.customer.preferredContactMethod}
                      onChange={(event) =>
                        setCustomer({
                          preferredContactMethod: event.target
                            .value as CustomerDetails["preferredContactMethod"],
                        })
                      }
                    >
                      {CONTACT_METHODS.map((method) => (
                        <option key={method}>{method}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <p className="quote-hint">
                  Accepted number formats: 082 123 4567, +27 82 123 4567 or 0027
                  82 123 4567.
                </p>
              </>
            )}
            {step === 1 && (
              <>
                <div className="quote-form-grid">
                  <Field
                    label="Event type"
                    name="eventType"
                    id={id}
                    error={errors.eventType}
                  >
                    <select
                      {...attributes("eventType")}
                      value={draft.event.eventType}
                      onChange={(event) =>
                        setEvent({
                          eventType: event.target
                            .value as EventFormValues["eventType"],
                        })
                      }
                    >
                      {EVENT_TYPES.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Event date"
                    name="eventDate"
                    id={id}
                    error={errors.eventDate}
                  >
                    <input
                      {...attributes("eventDate")}
                      type="date"
                      required
                      min={addCalendarDays(
                        southAfricanDate(),
                        quotationRequestPolicy.minimumLeadDays,
                      )}
                      value={draft.event.eventDate}
                      onChange={(event) =>
                        setEvent({ eventDate: event.target.value })
                      }
                    />
                  </Field>
                  <Field
                    label="Collection or delivery"
                    name="fulfilment"
                    id={id}
                    error={errors.fulfilment}
                  >
                    <select
                      {...attributes("fulfilment")}
                      value={draft.event.fulfilment}
                      onChange={(event) =>
                        setEvent({
                          fulfilment: event.target
                            .value as EventFormValues["fulfilment"],
                        })
                      }
                    >
                      <option>Collection</option>
                      <option>Delivery</option>
                    </select>
                  </Field>
                  <Field
                    label="Estimated number of guests"
                    name="guests"
                    id={id}
                    error={errors.guests}
                  >
                    <input
                      {...attributes("guests")}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={quotationRequestPolicy.maximumGuests}
                      step={1}
                      required
                      value={draft.event.guests}
                      onChange={(event) =>
                        setEvent({ guests: event.target.value })
                      }
                    />
                  </Field>
                  {draft.event.fulfilment === "Delivery" && (
                    <Field
                      label="Delivery area"
                      name="deliveryArea"
                      id={id}
                      error={errors.deliveryArea}
                    >
                      <input
                        {...attributes("deliveryArea")}
                        type="text"
                        required
                        maxLength={160}
                        list={
                          quotationRequestPolicy.deliveryAreas?.length
                            ? `${id}-delivery-areas`
                            : undefined
                        }
                        value={draft.event.deliveryArea}
                        onChange={(event) =>
                          setEvent({ deliveryArea: event.target.value })
                        }
                      />
                      <datalist id={`${id}-delivery-areas`}>
                        {quotationRequestPolicy.deliveryAreas?.map((area) => (
                          <option key={area} value={area} />
                        ))}
                      </datalist>
                    </Field>
                  )}
                </div>
                <Field
                  label="Special instructions (optional)"
                  name="specialInstructions"
                  id={id}
                  error={errors.specialInstructions}
                >
                  <textarea
                    {...attributes("specialInstructions")}
                    rows={4}
                    maxLength={2000}
                    value={draft.event.specialInstructions}
                    onChange={(event) =>
                      setEvent({ specialInstructions: event.target.value })
                    }
                  />
                </Field>
                <p className="quote-hint">
                  Scheduling information:{" "}
                  {quotationRequestPolicy.minimumLeadDays} days.
                  {quotationRequestPolicy.deliveryAreas?.length
                    ? ` Configured delivery areas: ${quotationRequestPolicy.deliveryAreas.join(", ")}.`
                    : ""}
                  {quotationRequestPolicy.collectionInstructions
                    ? ` Collection: ${quotationRequestPolicy.collectionInstructions}`
                    : ""}
                  The bakery’s actual booking lead time, collection details and
                  delivery availability still need confirmation. No delivery
                  charge is added.
                </p>
              </>
            )}
            {step === 2 && (
              <ReferenceUploader
                images={draft.references}
                onChange={setReferences}
                onBusy={setUploading}
                error={errors.references}
              />
            )}
            {step === 3 && preview.snapshot && (
              <>
                <p className="quote-hint">
                  Check every detail before sending your request. You can
                  go back to edit your information.
                </p>
                <div className="quote-review-edit">
                  <button type="button" onClick={() => back(0)}>
                    Edit customer
                  </button>
                  <button type="button" onClick={() => back(1)}>
                    Edit occasion
                  </button>
                  <button type="button" onClick={() => back(2)}>
                    Edit references
                  </button>
                </div>
                <QuotationSummary
                  customer={normalizeCustomer(draft.customer)}
                  event={normalizeEvent(draft.event)}
                  snapshot={preview.snapshot}
                  images={draft.references}
                />
                <label className="quote-consent" htmlFor={`${id}-demoConsent`}>
                  <input
                    {...attributes("demoConsent")}
                    type="checkbox"
                    checked={draft.demoConsent}
                    onChange={(event) => setConsent(event.target.checked)}
                  />{" "}
                  I consent to sending these details and references to the bakery. I understand this is an enquiry, not a confirmed booking or final price.
                </label>
                {errors.demoConsent && (
                  <p id={`${id}-demoConsent-error`} className="field-error">
                    {errors.demoConsent}
                  </p>
                )}
              </>
            )}
            {(failure || preview.error) && (
              <p className="quote-error" role="alert">
                {failure || preview.error}
                {' '}<a href="mailto:guguminnaar@gmail.com">Email the bakery</a> · <a href="tel:+27731268382">Call the bakery</a>
              </p>
            )}
            <div className="quote-form-actions">
              {step > 0 && (
                <button
                  type="button"
                  className="quote-back"
                  disabled={busy || uploading}
                  onClick={() => back(step - 1)}
                >
                  <ArrowLeft size={15} /> Back
                </button>
              )}
              <button
                className="button"
                type="submit"
                disabled={
                  busy || uploading || (step === 3 && (!preview.snapshot || (IS_PUBLIC_SITE&&!status.enabled)))
                }
              >
                {busy
                  ? "Sending…"
                  : step === 3
                    ? IS_PUBLIC_SITE ? 'Send Quotation Request' : "Save Demo Request"
                    : "Continue"}
                <ArrowUpRight size={16} />
              </button>
            </div>
          </fieldset>
        </form>
        <aside className="quote-design-card">
          {preview.snapshot?.official && <><BakeryImage src={preview.snapshot.official.image} alt={preview.snapshot.official.productName}/><p>{preview.snapshot.official.productName}</p><p>{preview.snapshot.official.personalisationInstructions}</p></>}
          <span className="eyebrow">YOUR CAKE, CAPTURED</span>
          <h3>
            A design
            <br />
            <em>to celebrate.</em>
          </h3>
          <p>
            {draft.configuration.shape} · {draft.configuration.tiers}{" "}
            {draft.configuration.tiers === 1 ? "tier" : "tiers"} ·{" "}
            {preview.snapshot?.tierSizesInches
              .map((size) => `${size}″`)
              .join(" / ")}
          </p>
          <p>
            {draft.configuration.officialFlavour || draft.configuration.flavour}
            <br />
            {draft.configuration.frosting}
          </p>
          <div className="quote-draft-total">
            <span>
              {preview.snapshot?.official ? 'Estimated range' : preview.snapshot?.estimate.manualQuotationRequired
                ? "Custom Quotation Required"
                : "Current estimated total"}
            </span>
            <strong>
              {preview.snapshot?.official ? formatPriceRange(preview.snapshot.official.minimumEstimateCents, preview.snapshot.official.maximumEstimateCents) : IS_PUBLIC_SITE ? 'Bakery quotation required' : total === undefined || total === null
                ? "Bakery review needed"
                : formatZARCents(total)}
            </strong>
          </div>
          <p className="quote-hint">
            {preview.snapshot?.estimate.manualQuotationRequired && !preview.snapshot?.official
              ? "This is indicative for supported selections only. "
              : ""}
            Estimated Price — Subject to Bakery Confirmation.
          </p>
          <p className="quote-hint">
            This request holds a separate copy of your design. Changing the
            studio does not change it. To request a different cake, return to
            the studio and select Request This Cake again.
          </p>
        </aside>
      </div>
    </div>
  );
}
