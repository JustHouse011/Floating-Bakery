import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { OFFICIAL_CONTACT } from '../../data/officialCatalogue';
import QuoteLink from '../quotation/QuoteLink';

const sitemap = [
  ['Home', '/'], ['About Us', '/about'], ['Catalogue', '/cakes'],
  ['Catering', '/catering'], ['Cake Designer', '/cake-designer'], ['Contact Us', '/contact'],
];

export default function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-footer-grid">
      <div className="footer-brand-column">
        <Link to="/" className="brand footer-logo"><img className="official-brand-logo" src="/Logo.svg" alt="Floating Bakery & Caterers" /></Link>
        <h2>Floating Bakery &amp; Caterers</h2>
        <p className="footer-tagline">Freshness in Every Bite.</p>
        <p>Beautifully crafted cakes, exquisite desserts and bespoke catering for life's most memorable celebrations.</p>
        <address><MapPin size={20} strokeWidth={1.5} aria-hidden="true" /><span>Thatchfield Crescent Estate<br />Thatchfield, The Reeds<br />Centurion, 0158, South Africa</span></address>
      </div>
      <div>
        <h2 className="footer-heading">EXPLORE</h2>
        <ul className="footer-links">{sitemap.map(([label, path]) => <li key={label}><Link to={path}>{label}</Link></li>)}</ul>
      </div>
      <div className="footer-connected">
        <h2 className="footer-heading">GET IN TOUCH</h2>
        <a href="tel:+27731268382"><Phone size={20} strokeWidth={1.5} aria-hidden="true" /><span>{OFFICIAL_CONTACT.phone}</span></a>
        <a href={`mailto:${OFFICIAL_CONTACT.email}`}><Mail size={20} strokeWidth={1.5} aria-hidden="true" /><span>{OFFICIAL_CONTACT.email}</span></a>
        <a className="footer-website" href={`https://${OFFICIAL_CONTACT.website}`} target="_blank" rel="noopener noreferrer">{OFFICIAL_CONTACT.website}</a>
        <p>Tell us about your next celebration.</p>
        <Link className="text-link" to="/contact">Get in touch</Link>
        <QuoteLink>Request a Quote</QuoteLink>
      </div>
    </div>
    <div className="site-footer-bottom">
      <span>© {new Date().getFullYear()} Floating Bakery &amp; Caterers. All rights reserved.</span>
      <a className="developer-credit" href="https://www.locate.africa" target="_blank" rel="noopener noreferrer">Designed and Developed by Bongani Nombamba</a>
    </div>
  </footer>;
}
