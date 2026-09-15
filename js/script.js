// Pop-up reveal: billeder glider ind, når de scroller i syne.
// Målretter to ting: alle billeder i .case-slide-grid (brandguide.html m.fl.)
// og alle billeder med klassen .pop-reveal (fx who.html).

document.addEventListener('DOMContentLoaded', () => {
  // Beviser at JavaScript rent faktisk kører — fjerner sikkerhedsnettet fra CSS'en
  document.body.classList.remove('no-js');

  // GIF-filer styrer selv, hvor mange gange de looper. Logoet genstartes her
  // én gang, hvorefter det sidste frame erstattes af et statisk canvas.
  const getGifDuration = bytes => {
    let pointer = 13;
    let currentDelay = 10;
    let duration = 0;
    const globalColorTable = bytes[10];

    if (globalColorTable & 0x80) {
      pointer += 3 * (2 ** ((globalColorTable & 0x07) + 1));
    }

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
          currentDelay = bytes[pointer + 1] + (bytes[pointer + 2] << 8);
          pointer += size + 1;
        } else {
          skipSubBlocks();
        }
      } else if (marker === 0x2c) {
        const descriptor = bytes[pointer + 8];
        pointer += 9;
        if (descriptor & 0x80) {
          pointer += 3 * (2 ** ((descriptor & 0x07) + 1));
        }
        pointer += 1;
        skipSubBlocks();
        duration += (currentDelay || 10) * 10;
        currentDelay = 10;
      } else if (marker === 0x3b) {
        break;
      }
    }

    return duration;
  };

  document.querySelectorAll('.brand img[src$="logo.gif"]').forEach(async logo => {
    try {
      const response = await fetch(logo.currentSrc);
      const duration = getGifDuration(new Uint8Array(await response.arrayBuffer()));
      if (!duration) return;

      const source = new URL(logo.currentSrc);
      source.searchParams.set('play-once', Date.now());
      logo.addEventListener('load', () => {
        window.setTimeout(() => {
          const stillFrame = document.createElement('canvas');
          stillFrame.className = 'brand-logo-still';
          stillFrame.width = logo.naturalWidth;
          stillFrame.height = logo.naturalHeight;
          stillFrame.setAttribute('aria-hidden', 'true');
          stillFrame.getContext('2d').drawImage(logo, 0, 0);
          logo.replaceWith(stillFrame);
        }, Math.max(0, duration - 30));
      }, { once: true });
      logo.src = source.toString();
    } catch {
      // Hvis GIF'en ikke kan læses (fx ved file://), vises den som normalt.
    }
  });

  // Den lodrette linje i navigationen følger sidens scroll-position.
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let navigationFrame;

    const updateNavigationProgress = () => {
      const maximumScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maximumScroll > 0 ? window.scrollY / maximumScroll : 1;
      sidebar.style.setProperty('--navigation-progress', Math.min(Math.max(progress, 0), 1));
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
    if (!image.closest('.hero')) image.loading = 'lazy';
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
