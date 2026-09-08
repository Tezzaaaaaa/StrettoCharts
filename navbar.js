(() => {
  'use strict';

  const init = () => {
    if (document.querySelector('[data-stretto-navbar]')) return;

    const nav = document.createElement('header');
    nav.className = 'sc-navbar';
    nav.dataset.strettoNavbar = '';
    nav.innerHTML = `
      <nav class="sc-navbar-inner" aria-label="Primary navigation">
        <a class="sc-navbar-brand" href="#top" aria-label="StrettoCharts home">
          <span class="sc-navbar-mark" aria-hidden="true">SC</span>
          <span>StrettoCharts</span>
        </a>
        <button class="sc-navbar-toggle" type="button" aria-expanded="false" aria-controls="sc-navbar-menu" aria-label="Open navigation">
          <span></span><span></span><span></span>
        </button>
        <div class="sc-navbar-menu" id="sc-navbar-menu">
          <div class="sc-navbar-links">
            <a href="#top" data-section-link="top">Home</a>
            <a href="#results" data-section-link="results">Charts</a>
            <a href="#analytics" data-section-link="analytics">Analytics</a>
            <a href="#rankings" data-section-link="rankings">Rankings</a>
            <a href="#coverage" data-section-link="coverage">Sources</a>
          </div>
          <div class="sc-navbar-actions">
            <a class="sc-navbar-action" href="#search">Search</a>
            <a class="sc-navbar-primary" href="#results">Explore charts</a>
          </div>
        </div>
      </nav>`;

    document.body.prepend(nav);
    document.body.id = 'top';

    const style = document.createElement('style');
    style.textContent = `
      .sc-navbar{position:sticky;top:0;z-index:1000;margin:0 auto 14px;max-width:1480px;padding:0 20px;background:transparent}
      .sc-navbar-inner{min-height:64px;display:flex;align-items:center;gap:28px;padding:10px 14px;border:1px solid rgba(228,228,237,.9);border-radius:20px;background:rgba(255,255,255,.88);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 8px 28px rgba(36,36,59,.08)}
      .sc-navbar-brand{display:inline-flex;align-items:center;gap:9px;color:#171722;text-decoration:none;font-size:16px;font-weight:900;letter-spacing:-.035em;white-space:nowrap}
      .sc-navbar-mark{display:grid;place-items:center;width:31px;height:31px;border-radius:10px;color:#fff;font-size:9px;font-weight:900;letter-spacing:-.04em;background:linear-gradient(135deg,#ff3d81,#7657ff)}
      .sc-navbar-menu{display:flex;align-items:center;justify-content:space-between;gap:20px;flex:1}
      .sc-navbar-links,.sc-navbar-actions{display:flex;align-items:center;gap:4px}
      .sc-navbar-links a,.sc-navbar-action{padding:9px 11px;border-radius:10px;color:#5e5e6e;text-decoration:none;font-size:12px;font-weight:750;transition:background .18s ease,color .18s ease}
      .sc-navbar-links a:hover,.sc-navbar-links a:focus-visible,.sc-navbar-action:hover,.sc-navbar-action:focus-visible{color:#171722;background:#f1f1f7}
      .sc-navbar-links a[aria-current="page"]{color:#171722;background:#eeeafc}
      .sc-navbar-primary{padding:9px 13px;border-radius:999px;color:#fff;text-decoration:none;font-size:12px;font-weight:850;background:linear-gradient(135deg,#ff3d81,#7657ff);box-shadow:0 7px 18px rgba(118,87,255,.22)}
      .sc-navbar-primary:hover,.sc-navbar-primary:focus-visible{filter:brightness(1.04)}
      .sc-navbar-toggle{display:none;margin-left:auto;width:40px;height:40px;padding:9px;border:1px solid #e4e4ed;border-radius:12px;background:#fff;cursor:pointer}
      .sc-navbar-toggle span{display:block;height:2px;margin:4px 0;border-radius:2px;background:#171722}
      .sc-navbar a:focus-visible,.sc-navbar button:focus-visible{outline:3px solid rgba(118,87,255,.28);outline-offset:2px}
      body{scroll-behavior:smooth}
      #results,#analytics,#rankings,#coverage{scroll-margin-top:88px}
      @media(max-width:760px){
        .sc-navbar{padding:0 12px;margin-bottom:10px}
        .sc-navbar-inner{min-height:58px;padding:8px 10px;border-radius:17px;position:relative}
        .sc-navbar-toggle{display:block}
        .sc-navbar-menu{display:none;position:absolute;left:10px;right:10px;top:calc(100% + 8px);padding:9px;border:1px solid #e4e4ed;border-radius:17px;background:rgba(255,255,255,.96);box-shadow:0 18px 40px rgba(36,36,59,.13);flex-direction:column;align-items:stretch;gap:8px}
        .sc-navbar-menu.is-open{display:flex}
        .sc-navbar-links,.sc-navbar-actions{display:grid;grid-template-columns:1fr;gap:3px}
        .sc-navbar-links a,.sc-navbar-action,.sc-navbar-primary{text-align:left;padding:11px 12px;border-radius:11px}
        .sc-navbar-primary{text-align:center}
      }
      @media(prefers-reduced-motion:reduce){body{scroll-behavior:auto}.sc-navbar-links a,.sc-navbar-action,.sc-navbar-primary{transition:none}}
    `;
    document.head.appendChild(style);

    const toggle = nav.querySelector('.sc-navbar-toggle');
    const menu = nav.querySelector('.sc-navbar-menu');
    const closeMenu = () => {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
    };

    toggle.addEventListener('click', () => {
      const open = !menu.classList.contains('is-open');
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });

    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

    document.addEventListener('click', (event) => {
      if (!nav.contains(event.target)) closeMenu();
    });

    const sections = ['results', 'analytics', 'rankings', 'coverage'];
    const links = [...menu.querySelectorAll('[data-section-link]')];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      links.forEach((link) => link.removeAttribute('aria-current'));
      if (visible) {
        menu.querySelector(`[data-section-link="${visible.target.id}"]`)?.setAttribute('aria-current', 'page');
      } else {
        menu.querySelector('[data-section-link="top"]')?.setAttribute('aria-current', 'page');
      }
    }, { rootMargin: '-25% 0px -60% 0px', threshold: [0, .25, .5] });

    sections.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
