import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, MapPin, Phone, Mail } from "lucide-react";
import { useLocalProducts } from "../store/adminStore";
import {deliverEnquiry,DELIVERY_SUCCESS,DELIVERY_FAILURE} from '../services/onlineEnquiries';
import useDeliveryStatus from '../hooks/useDeliveryStatus';
import DeliveryAvailability from '../components/quotation/DeliveryAvailability';
import { OFFICIAL_CONTACT } from '../data/officialCatalogue';
import Reveal from '../components/ui/Reveal';
import '../styles/contact.css';
import QuoteLink from '../components/quotation/QuoteLink';

const estateAddress = 'Thatchfield Crescent Estate, Thatchfield, The Reeds, Centurion, 0158, South Africa';
const mapQuery = encodeURIComponent(estateAddress);
const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;
export default function Contact() {
  const products = useLocalProducts().filter((p) => !p.archived);
  const [params] = useSearchParams();
  const selected = products.find((p) => p.id === params.get("cake"));
  const [type, setType] = useState(params.get("type") || "General enquiry");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const savedOnce = useRef(false);
  const {status,checking}=useDeliveryStatus();
  const [busy,setBusy]=useState(false);
  const submission=useRef(crypto.randomUUID());
  const payload=useRef('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (savedOnce.current || busy || !status.enabled) return;
    const form = e.currentTarget;
    const fields = new FormData(form);
    const data = {
      name: String(fields.get("name")),
      email: String(fields.get("email")),
      telephone: String(fields.get("telephone")),
      type: String(fields.get("type")),
      message: String(fields.get("message")),
      consent: fields.get('consent') === 'on',
    };
    const fingerprint=JSON.stringify(data);if(payload.current&&payload.current!==fingerprint)submission.current=crypto.randomUUID();payload.current=fingerprint;
    setBusy(true);
    try {
      await deliverEnquiry('contact',data,status,submission.current,String(fields.get('website')||''));
      savedOnce.current = true;
      setSent(true);
      setError("");
    } catch {
      setError(DELIVERY_FAILURE);
    } finally {setBusy(false);}
  }
  return (
    <>
    <section className="section contact">
      <div>
        <span className="eyebrow">LET’S MAKE SOMETHING LOVELY</span>
        <h1>
          Every celebration
          <br />
          starts with <em>an idea.</em>
        </h1>
        <p>
          Tell us a little about your occasion and the cake or catering you have
          in mind.
        </p>
        <Reveal className="contact-estate-map">
          <iframe title="Google Maps: Thatchfield Crescent Estate, Centurion, South Africa" src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
          <a className="text-link" href={directionsUrl} target="_blank" rel="noopener noreferrer">Get Directions <ArrowUpRight size={18} aria-hidden="true" /></a>
        </Reveal>
      </div>
      {sent ? (
        <div className="form-confirmation" role="status">
          <CheckCircle2 size={42} strokeWidth={1} />
          <h2>
            Thank you for <em>getting in touch.</em>
          </h2>
          <p>
            {DELIVERY_SUCCESS}
          </p>
          <button className="button" onClick={() => { savedOnce.current = false; submission.current=crypto.randomUUID();payload.current='';setSent(false); }}>
            Write another enquiry
          </button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <DeliveryAvailability enabled={status.enabled} checking={checking}/>
          <fieldset disabled={busy} className="delivery-fields">
          <h2>
            Tell us your <em>story.</em>
          </h2>
          <div className="form-row">
            <label>
              Your name
              <input name="name" required autoComplete="name" maxLength={100} />
            </label>
            <label>
              Email address
              <input name="email" type="email" required autoComplete="email" />
            </label>
          </div>
          <label>
            Telephone
            <input
              name="telephone"
              type="tel"
              required
              autoComplete="tel"
              pattern={"[+0-9 \\(\\)\\-]{7,20}"}
              title="Enter a telephone number with 7–20 characters"
            />
          </label>
          <label>
            Enquiry type
            <select
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {["General enquiry", "Cake quotation", "Catering"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Your message
            <textarea
              name="message"
              required
              rows={5}
              maxLength={3000}
              defaultValue={
                selected
                  ? `I would like to enquire about the ${selected.name}. `
                  : ""
              }
            />
          </label>
          <label className="enquiry-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
          <label className="consent"><input type="checkbox" name="consent" required/>I agree that the bakery may use these details to respond to my enquiry.</label>
          {error && <div role="alert"><p>{error}</p><a href="mailto:guguminnaar@gmail.com">Email the bakery</a> · <a href="tel:+27731268382">Call the bakery</a></div>}
          <button className="button" type="submit" disabled={!status.enabled||busy}>
            {busy?'Sending…':'Send Enquiry'} <ArrowUpRight size={18} />
          </button>
          </fieldset>
        </form>
      )}
    </section>
    <section className="section contact-details" aria-labelledby="contact-details-heading">
      <span className="eyebrow">LET’S CONNECT</span>
      <h2 id="contact-details-heading">We'd Love to <em>Hear From You</em></h2>
      <p>Whether you're planning a celebration, looking for a beautifully crafted cake or enquiring about catering, we're just a message away.</p>
      <div className="contact-items">
        <Reveal className="contact-item" delay={0}>
          <MapPin size={24} strokeWidth={1.5} aria-hidden="true" />
          <h3>Visit Us</h3>
          <p><strong>Thatchfield Crescent Estate</strong><br />Thatchfield, The Reeds<br />Centurion, 0158, South Africa</p>
          <a className="text-link" href={directionsUrl} target="_blank" rel="noopener noreferrer">Get Directions <ArrowUpRight size={18} aria-hidden="true" /></a>
        </Reveal>
        <Reveal className="contact-item" delay={0.07}>
          <Phone size={24} strokeWidth={1.5} aria-hidden="true" />
          <h3>Call Us</h3>
          <a className="text-link" href="tel:+27731268382">{OFFICIAL_CONTACT.phone}</a>
        </Reveal>
        <Reveal className="contact-item" delay={0.14}>
          <Mail size={24} strokeWidth={1.5} aria-hidden="true" />
          <h3>Email Us</h3>
          <a className="text-link" href={`mailto:${OFFICIAL_CONTACT.email}`}>{OFFICIAL_CONTACT.email}</a>
        </Reveal>
      </div>
      <div className="contextual-quote"><p>Have a cake design in mind?</p><QuoteLink>Request a Cake Quote</QuoteLink></div>
    </section>
    </>
  );
}
