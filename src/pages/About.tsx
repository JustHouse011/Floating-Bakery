import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import "../styles/about.css";
import QuoteLink from '../components/quotation/QuoteLink';

export default function About() {
  return (
    <div className="about-page">
      <section className="section about-hero">
        <span className="eyebrow">OUR STORY</span>
        <h1>Baked with Love.<br /><em>Crafted with Elegance.</em></h1>
        <p>At Floating Bakery &amp; Caterers, we believe that every occasion deserves beauty, exceptional flavour and a touch of magic.</p>
        <span className="about-divider" aria-hidden="true" />
      </section>
      <section className="section about-story" aria-labelledby="story-heading">
        <div><span className="eyebrow">ROOTED IN WARMTH</span><h2 id="story-heading">Where French Artistry Meets <em>African Hospitality</em></h2></div>
        <div className="about-prose">
          <p>Founded by Chef Gugu, a passionate pastry chef with over a decade of experience, Floating Bakery &amp; Caterers brings together the timeless elegance of French-inspired pastry artistry and the warmth of African hospitality.</p>
          <p>From breathtaking wedding cakes and beautifully handcrafted celebration cakes to exquisite desserts and bespoke catering experiences, every creation is thoughtfully prepared with love, precision and purpose.</p>
          <p>We believe that exceptional baking is about more than creating something delicious. It is about celebrating life's special moments, bringing people together and creating memories that last long after the final bite.</p>
        </div>
      </section>
      <section className="section about-founder" aria-labelledby="founder-heading">
        <figure className="founder-portrait">
          <img src="/images/profile/gugu.jpeg" width="826" height="1600" loading="lazy" decoding="async" alt="Chef Gugu, founder and pastry chef of Floating Bakery & Caterers, wearing her branded chef jacket." />
          <figcaption>Chef Gugu · Floating Bakery &amp; Caterers</figcaption>
        </figure>
        <div className="about-prose">
          <span className="eyebrow">THE HEART BEHIND THE BRAND</span>
          <h2 id="founder-heading">Meet <em>Chef Gugu</em></h2>
          <p className="founder-role">Founder &amp; Pastry Chef</p>
          <p>With more than ten years of experience in pastry artistry, Chef Gugu is the creative heart behind Floating Bakery &amp; Caterers.</p>
          <p>Her passion lies in transforming simple ingredients into beautiful, memorable creations that tell a story. Drawing inspiration from French pastry techniques and African traditions of warmth and togetherness, she brings a distinctive personal touch to every cake, dessert and catering experience.</p>
          <p>For Chef Gugu, every creation is an opportunity to share joy, celebrate milestones and make someone's special day even more meaningful.</p>
          <p className="founder-experience">10+ Years of Pastry Experience</p>
        </div>
      </section>
      <section className="section about-philosophy" aria-labelledby="philosophy-heading">
        <div className="contextual-quote"><h2>Inspired by Passion. <em>Crafted for Your Celebration.</em></h2><QuoteLink>Let's Create Something Special</QuoteLink></div>
        <span className="eyebrow">OUR PHILOSOPHY</span>
        <h2 id="philosophy-heading">Every Detail <em>Matters</em></h2>
        <div className="about-prose">
          <p>Every detail, from the delicate finishing touches to the perfect balance of flavours, reflects our unwavering commitment to quality, creativity and sophistication.</p>
          <p>Whether we are creating an elegant wedding cake, a personalised celebration centrepiece or a thoughtfully curated catering experience, our goal remains the same: to make every occasion feel truly special.</p>
        </div>
        <dl className="about-values">
          <div><dt>Artistry</dt><dd>Beautifully crafted creations inspired by timeless pastry techniques.</dd></div>
          <div><dt>Quality</dt><dd>Thoughtful preparation and attention to every detail.</dd></div>
          <div><dt>Celebration</dt><dd>Meaningful experiences made to be shared and remembered.</dd></div>
        </dl>
      </section>
      <section className="section about-location" aria-labelledby="location-heading">
        <span className="eyebrow">OUR HOME</span>
        <h2 id="location-heading">Made with Love <em>in Centurion</em></h2>
        <p>Proudly based in Thatchfield, Centurion, Floating Bakery &amp; Caterers creates beautiful cakes, exquisite desserts and memorable catering experiences for life's special occasions.</p>
        <p>One elegant slice and delightful bite at a time.</p>
        <p className="founder-role">Thatchfield, Centurion, South Africa</p>
        <Link className="text-link" to="/contact">Get in touch <ArrowUpRight size={18} aria-hidden="true" /></Link>
      </section>
      <section className="final-cta about-cta">
        <h2>Let's Make Your Next Celebration <em>Unforgettable</em></h2>
        <p>From elegant wedding cakes to handcrafted treats and bespoke catering, we'd love to be part of your special occasion.</p>
        <div className="actions"><Link className="button" to="/cakes">Explore Our Cakes <ArrowUpRight size={18} aria-hidden="true" /></Link><QuoteLink>Request a Quotation</QuoteLink></div>
      </section>
    </div>
  );
}
