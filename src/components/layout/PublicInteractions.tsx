import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

export default function PublicInteractions() {
  const cursor = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.public-site');
    if (!root) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const remaining = document.documentElement.scrollHeight - innerHeight;
      root.style.setProperty('--scroll-progress', String(remaining > 0 ? Math.min(1, scrollY / remaining) : 0));
      root.dataset.scrolled = String(scrollY > 60);
      root.dataset.longScroll = String(scrollY > 700);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    update();
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        if (!motion.matches) (entry.target as HTMLElement).dataset.revealed = 'true';
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    root.querySelectorAll('main section, .product-card, .site-footer-grid').forEach((element, index) => {
      (element as HTMLElement).style.setProperty('--reveal-delay', `${element.classList.contains('product-card') ? (index % 3) * 55 : 0}ms`);
      observer.observe(element);
    });
    // Filtered cards and dynamically mounted quotation screens also receive reveals.
    const mutations = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) if (node instanceof HTMLElement) {
        if (node.matches('section, .product-card')) observer.observe(node);
        node.querySelectorAll('section, .product-card').forEach(element => observer.observe(element));
      }
    });
    mutations.observe(root.querySelector('main') || root, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      resize.disconnect(); observer.disconnect(); mutations.disconnect();
    };
  }, [pathname]);
  useEffect(() => {
    const ring = cursor.current;
    if (!ring) return;
    const enabled = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let frame = 0, x = 0, y = 0;
    const move = (event: PointerEvent) => {
      if (!enabled.matches || event.pointerType === 'touch') { ring.dataset.visible = 'false'; return; }
      x = event.clientX; y = event.clientY;
      ring.dataset.visible = 'true';
      ring.dataset.active = String(event.target instanceof Element && !!event.target.closest('a,button,input,select,textarea,summary'));
      if (!frame) frame = requestAnimationFrame(() => {
        ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        frame = 0;
      });
    };
    const hide = () => { ring.dataset.visible = 'false'; };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    enabled.addEventListener('change', hide);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', hide);
      window.removeEventListener('blur', hide);
      enabled.removeEventListener('change', hide);
    };
  }, []);
  return <>
    <div className="scroll-progress" aria-hidden="true" />
    <div ref={cursor} className="cursor-accent" aria-hidden="true"><span /></div>
    <button className="back-to-top" aria-label="Back to top" onClick={() => {
      window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
    }}><ArrowUp size={18} aria-hidden="true" /><span>Top</span></button>
  </>;
}
