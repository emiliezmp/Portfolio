// Pop-up reveal: billeder glider ind, når de scroller i syne.
// Målretter to ting: alle billeder i .case-slide-grid (brandguide.html m.fl.)
// og alle billeder med klassen .pop-reveal (fx who.html).

document.addEventListener('DOMContentLoaded', () => {
  // Beviser at JavaScript rent faktisk kører — fjerner sikkerhedsnettet fra CSS'en
  document.body.classList.remove('no-js');

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

  // GIF-loop tæller forskelligt på tværs af browsere. Derfor måles den første
  // animations varighed, hvorefter den altid erstattes af det statiske SVG-logo.
  const getGifDuration = bytes => {
    let pointer = 13;
    let frameDelay = 10;
    let duration = 0;
    const packedFields = bytes[10];

    if (packedFields & 0x80) pointer += 3 * (2 ** ((packedFields & 0x07) + 1));

    const skipSubBlocks = () => {
      while (pointer < bytes.length) {
        const size = bytes[pointer++];
        if (size === 0) break;
        pointer += size;
      }
    };

    while (pointer < bytes.length) {
      const marker = bytes[pointer++];
      if (marker === 0x21) {
        const label = bytes[pointer++];
        if (label === 0xf9) {
          const size = bytes[pointer++];
          frameDelay = bytes[pointer + 1] + (bytes[pointer + 2] << 8);
          pointer += size + 1;
        } else {
          skipSubBlocks();
        }
      } else if (marker === 0x2c) {
        const descriptor = bytes[pointer + 8];
        pointer += 9;
        if (descriptor & 0x80) pointer += 3 * (2 ** ((descriptor & 0x07) + 1));
        pointer += 1;
        skipSubBlocks();
        duration += (frameDelay || 10) * 10;
        frameDelay = 10;
      } else if (marker === 0x3b) {
        break;
      }
    }
    return duration;
  };

  document.querySelectorAll('.brand img[src*="logo.gif"]').forEach(async logo => {
    try {
      const response = await fetch(logo.currentSrc);
      const duration = getGifDuration(new Uint8Array(await response.arrayBuffer()));
      if (duration) window.setTimeout(() => { logo.src = 'img/logo.svg'; }, duration);
    } catch {
      // GIF'en bevarer sin egen én-gangs-indstilling, hvis filen ikke kan læses.
    }
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
  const whoPhotoGrid = document.querySelector('.who-photo-grid');
  const whoImages = whoPhotoGrid ? whoPhotoGrid.querySelectorAll('.pop-reveal') : [];
  const revealImages = [...caseImages, ...whoImages];

  if (!revealImages.length) return;

  // Vis billederne i "Who am I?" som én samlet sekvens.
  // Det er vigtigt at observere grid'et — ikke hvert billede — da to billeder
  // i samme række ellers bliver synlige samtidig.
  let whoImagesAreRevealing = false;

  const revealWhoImages = () => {
    if (whoImagesAreRevealing) return;
    whoImagesAreRevealing = true;

    whoImages.forEach((img, index) => {
      window.setTimeout(() => img.classList.add('is-visible'), index * 220);
    });
  };

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

    if (whoPhotoGrid) {
      const whoObserver = new IntersectionObserver((entries) => {
        if (entries.some(entry => entry.isIntersecting)) {
          revealWhoImages();
          whoObserver.disconnect();
        }
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

      whoObserver.observe(whoPhotoGrid);
    }
  } else {
    // Fallback: hvis IntersectionObserver ikke understøttes, vis billederne med det samme
    caseImages.forEach(img => img.classList.add('is-visible'));
    revealWhoImages();
  }

  // Ekstra sikkerhedsnet: hvis et billede af en eller anden grund aldrig
  // udløser observeren (fx meget kort side), vis det alligevel efter 3 sekunder
  setTimeout(() => {
    document.querySelectorAll('.case-slide-grid img:not(.is-visible)')
      .forEach(img => img.classList.add('is-visible'));

    if (whoImages.length && !whoImagesAreRevealing) {
      revealWhoImages();
    }
  }, 3000);
});
