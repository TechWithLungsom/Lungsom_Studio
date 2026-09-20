import { useEffect, useRef, useState } from 'react';
import ContactForm from './ContactForm.jsx';
import './style.css';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [service, setService] = useState('Website');
  const menuButton = useRef(null);
  useEffect(() => {
    const escape = event => { if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); } };
    const outside = event => { if (!event.target.closest('.site-header')) setMenuOpen(false); };
    const close = () => setMenuOpen(false);
    const screen = window.matchMedia('(min-width: 521px)');
    document.addEventListener('keydown', escape);
    document.addEventListener('click', outside);
    screen.addEventListener('change', close);
    return () => { document.removeEventListener('keydown', escape); document.removeEventListener('click', outside); screen.removeEventListener('change', close); };
  }, [menuOpen]);
  return <>

<a className="skip" href="#main">Skip to content</a>
<header className="site-header"><div className="wrap header-inner">
<a className="brand" href="#main" aria-label="Lungsom Studio home"><span className="brand-symbol" aria-hidden="true">ls<span>✳</span></span><span>Lungsom<span className="brand-light">Studio</span></span></a>
<nav className={menuOpen ? "open" : ""} onClick={() => setMenuOpen(false)} id="navigation" aria-label="Main navigation"><a href="#services">Services</a><a href="#process">The process</a><a className="nav-contact" href="#contact">Let’s talk <span aria-hidden="true">↗</span></a></nav>
<button ref={menuButton} onClick={() => setMenuOpen(!menuOpen)} className="menu-toggle" aria-expanded={menuOpen} aria-controls="navigation" aria-label={menuOpen ? "Close navigation" : "Open navigation"}><span></span><span></span></button>
</div></header>
<main id="main">
<section className="hero wrap">
<div className="hero-copy"><div className="eyebrow"><span className="tiny-star" aria-hidden="true">✳</span> INDEPENDENT DIGITAL STUDIO</div>
<h1>Big ideas.<br />Beautifully<br /><span className="serif">built.</span><span className="hero-star" aria-hidden="true">✳</span></h1>
<p>I turn your ideas into thoughtful websites and apps. Made to feel right. Built to work beautifully.</p>
<div className="hero-actions"><a className="button primary" href="#contact">Let’s build something <span aria-hidden="true">↗</span></a><a className="text-link" href="#services">Explore services <span aria-hidden="true">↓</span></a></div>
<div className="hero-note"><span className="mini-symbol" aria-hidden="true">↳</span> Your idea. A clear plan. Something worth launching.</div></div>
<div className="hero-visual" aria-label="Illustrative website and mobile interface concepts">
<div className="visual-topline"><span>IDEAS, TAKING SHAPE</span><span>DESIGN + DEVELOPMENT</span></div>
<div className="concept-window"><div className="window-bar"><div className="window-dots"><i></i><i></i><i></i></div><span>your-next-big-idea.com</span><span aria-hidden="true">↗</span></div>
<div className="concept-content"><div className="concept-nav"><b>form<span>®</span></b><span>Designed for everyday.</span><span aria-hidden="true">☰</span></div><div className="concept-main"><span className="concept-tag">MAKE ROOM FOR BETTER.</span><h2>A little less noise.<br />A lot more <em>possibility.</em></h2><p>A thoughtful space for your next chapter.</p><span className="concept-button">Discover what’s next ↗</span></div><div className="concept-bottom"><span>Thoughtfully made.</span><span>01 — 03</span></div></div></div>
<div className="floating-label"><span aria-hidden="true">✦</span> Details make the difference.</div>
<div className="app-concept"><div className="phone-top"><span>9:41</span><span aria-hidden="true">••• ▰</span></div><div className="app-greeting">A little progress,<br /><b>every day.</b></div><div className="app-date">YOUR DAILY SPACE</div><div className="progress-ring"><div><strong>3<span>/4</span></strong><small>Today’s focus</small></div></div><div className="app-task"><span>✓</span> Make something good.</div><div className="app-task muted"><span>○</span> Take the next step.</div><div className="app-bottom"><span aria-hidden="true">⌂</span><span aria-hidden="true">▦</span><span aria-hidden="true">＋</span></div></div>
<div className="visual-caption"><span className="caption-line"></span> Website & app interface concepts</div>
</div>
</section>
<div className="principles"><div className="wrap"><span>Thoughtful design <i>✳</i></span><span>Purposeful development <i>✳</i></span><span>Responsive by nature <i>✳</i></span><span>Built around you <i>✳</i></span></div></div>
<section id="services" className="services section wrap">
<div className="section-heading"><div><div className="eyebrow">01 / WHAT I CAN HELP WITH</div><h2>Good ideas deserve<br /><span className="serif">great execution.</span></h2></div><p>A new online home. A useful digital product.<br />Let’s build the next chapter of your business.</p></div>
<div className="service-grid">
<article className="service-card website-card"><div className="card-top"><span className="icon-box" aria-hidden="true">↗</span><span>01 / WEB EXPERIENCES</span></div><h3>Make a first impression.<br /><span>Then make it count.</span></h3><p>Distinctive, easy-to-use websites that give your business a home and your visitors a clear next step.</p><div className="service-tags"><span>Business websites</span><span>Landing pages</span><span>Redesigns</span></div><div className="website-detail" aria-hidden="true"><div className="detail-bar"><i></i><i></i><i></i></div><div className="detail-layout"><span>Built for<br /><em>your next.</em></span><div className="detail-grid"><i></i><i></i><i></i><i></i></div></div></div><a href="#contact" onClick={() => setService("Website")}>Let’s build your website <span aria-hidden="true">↗</span></a></article>
<article className="service-card app-card"><div className="card-top"><span className="icon-box" aria-hidden="true">⌘</span><span>02 / DIGITAL PRODUCTS</span></div><h3>From “what if”<br /><span>to “it works.”</span></h3><p>Custom applications that solve real problems, simplify everyday work, and bring your product idea to life.</p><div className="service-tags"><span>Web & mobile apps</span><span>MVPs</span><span>Internal tools</span></div><div className="app-detail" aria-hidden="true"><div className="code-line"><span>01</span><b>const</b> idea = <em>“something great”;</em></div><div className="code-line"><span>02</span><b>build</b>(&#123; design, purpose, you &#125;);</div><div className="code-status"><span>✓</span> Ready for your next chapter</div></div><a href="#contact" onClick={() => setService("Application")}>Let’s build your app <span aria-hidden="true">↗</span></a></article>
</div></section>
<section id="process" className="process section"><div className="wrap"><div className="section-heading"><div><div className="eyebrow">02 / FROM IDEA TO LAUNCH</div><h2>Less guesswork.<br /><span className="serif">More making.</span></h2></div><p>A straightforward, collaborative process.<br />You’re part of the conversation at every step.</p></div><ol className="steps"><li><div className="step-top"><span>01</span><span aria-hidden="true">↗</span></div><h3>Start with a conversation.</h3><p>Tell me about your idea, your audience, and what you want to achieve. Rough sketches welcome.</p><span className="step-label">DISCOVER & DEFINE</span></li><li><div className="step-top"><span>02</span><span aria-hidden="true">↗</span></div><h3>Give the idea a direction.</h3><p>We shape the experience and agree on scope, timeline, and budget before development begins.</p><span className="step-label">DESIGN & PLAN</span></li><li><div className="step-top"><span>03</span><span aria-hidden="true">✳</span></div><h3>Make it real. Make it yours.</h3><p>Watch it take shape, share your feedback, and get ready to put something good into the world.</p><span className="step-label">BUILD & LAUNCH</span></li></ol></div></section>
<section id="contact" className="contact section wrap"><div className="contact-panel"><div className="contact-copy"><div className="eyebrow">03 / IT STARTS WITH HELLO</div><h2>Your next big thing<br />starts with a<br /><span className="serif">small conversation.</span></h2><p>A clear vision or a half-formed idea.<br />I’d love to hear what you have in mind.</p><div className="contact-links"><a href="mailto:lungsomlamnio@gmail.com"><span><small>DROP ME A LINE</small>lungsomlamnio@gmail.com</span><span aria-hidden="true">↗</span></a><a href="https://wa.me/918413050187" target="_blank" rel="noopener noreferrer"><span><small>KEEP IT CASUAL</small>Chat on WhatsApp</span><span aria-hidden="true">↗</span></a></div><div className="signature">Lungsom <span>✳</span></div></div>
<ContactForm service={service} setService={setService} /></div></section>
</main><footer className="wrap"><div className="footer-top"><a className="brand" href="#main"><span className="brand-symbol" aria-hidden="true">ls<span>✳</span></span><span>Lungsom<span className="brand-light">Studio</span></span></a><p>Small studio. Thoughtful work. Big possibilities.</p><a href="#main" className="back-top" aria-label="Back to top">↑</a></div><div className="footer-bottom"><span>© <span>{new Date().getFullYear()}</span> Lungsom Studio</span><span>Made with intention.</span></div></footer>

  </>;
}
