// Pop-up reveal for billeder i .case-slide-grid (brandguide.html m.fl.).

document.addEventListener('DOMContentLoaded', () => {
  // Beviser at JavaScript rent faktisk kører — fjerner sikkerhedsnettet fra CSS'en
  document.body.classList.remove('no-js');

  // Vis først tilbage-til-top-knappen, når brugeren er kommet lidt ned på siden.
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    const updateBackToTop = () => {
      backToTop.classList.toggle('is-visible', window.scrollY > 240);
    };

    updateBackToTop();
    window.addEventListener('scroll', updateBackToTop, { passive: true });
  }

  // Fælles burger-menu på tablet og mobil. Navigationen findes allerede på
  // alle sider, så knappen kan oprettes ét sted og bruges overalt.
  document.querySelectorAll('.sidebar').forEach(sidebar => {
    const navigation = sidebar.querySelector('nav');
    const brand = sidebar.querySelector('.brand');
    if (!navigation || !brand) return;

    const menuButton = document.createElement('button');
    menuButton.className = 'menu-toggle';
    menuButton.type = 'button';
    menuButton.setAttribute('aria-label', 'Åbn menu');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-controls', 'site-navigation');
    menuButton.innerHTML = '<span></span><span></span><span></span>';
    navigation.id = 'site-navigation';
    brand.insertAdjacentElement('afterend', menuButton);
    const mobileMenu = window.matchMedia('(max-width: 900px)');
    const footer = sidebar.querySelector('.sidebar-footer');
    const footerAnchor = footer ? document.createComment('sidebar footer position') : null;
    if (footer && footerAnchor) footer.before(footerAnchor);

    const closeMenu = () => {
      sidebar.classList.remove('is-menu-open');
      if (mobileMenu.matches) navigation.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Åbn menu');
    };

    const syncMenuForViewport = () => {
      if (mobileMenu.matches) {
        navigation.hidden = !sidebar.classList.contains('is-menu-open');
        if (footer && footer.parentElement !== navigation) navigation.append(footer);
      } else {
        navigation.hidden = false;
        if (footer && footerAnchor && footer.parentElement !== sidebar) footerAnchor.after(footer);
        closeMenu();
      }
    };

    menuButton.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('is-menu-open');
      navigation.hidden = !isOpen;
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Luk menu' : 'Åbn menu');
    });

    navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    mobileMenu.addEventListener('change', syncMenuForViewport);
    syncMenuForViewport();
  });

  // Den lodrette linje i navigationen følger sidens scroll-position.
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let navigationFrame;
    let lastNavigationProgress = -1;

    const updateNavigationProgress = () => {
      const maximumScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maximumScroll > 0 ? window.scrollY / maximumScroll : 1;
      const clampedProgress = Math.min(Math.max(progress, 0), 1);
      // Undgå at opdatere layout for mikroskopiske scroll-ændringer.
      if (Math.abs(clampedProgress - lastNavigationProgress) > 0.003 || clampedProgress === 1) {
        sidebar.style.setProperty('--navigation-progress', clampedProgress);
        lastNavigationProgress = clampedProgress;
      }
      navigationFrame = undefined;
    };

    updateNavigationProgress();
    window.addEventListener('scroll', () => {
      if (!navigationFrame) {
        navigationFrame = window.requestAnimationFrame(updateNavigationProgress);
      }
    }, { passive: true });
    window.addEventListener('resize', updateNavigationProgress);
  }

  // Store projektbilleder afkodes uden for den kritiske scroll-rendering og
  // hentes først, når de nærmer sig skærmen. Hero-billedet på forsiden er
  // undtagelsen, da det skal stå klar med det samme.
  document.querySelectorAll('main img').forEach(image => {
    image.decoding = 'async';
    if (!image.closest('.hero') && !image.hasAttribute('loading')) image.loading = 'lazy';
  });

  const caseImages = document.querySelectorAll('.case-slide-grid img');
  if (!caseImages.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    caseImages.forEach(img => observer.observe(img));
  } else {
    // Fallback: hvis IntersectionObserver ikke understøttes, vis billederne med det samme
    caseImages.forEach(img => img.classList.add('is-visible'));
  }

  // Ekstra sikkerhedsnet: hvis et billede af en eller anden grund aldrig
  // udløser observeren (fx meget kort side), vis det alligevel efter 3 sekunder
  setTimeout(() => {
    document.querySelectorAll('.case-slide-grid img:not(.is-visible)')
      .forEach(img => img.classList.add('is-visible'));
  }, 3000);
});
