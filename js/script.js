// Pop-up reveal: billeder glider ind, når de scroller i syne.
// Målretter to ting: alle billeder i .case-slide-grid (brandguide.html m.fl.)
// og alle billeder med klassen .pop-reveal (fx who.html).

document.addEventListener('DOMContentLoaded', () => {
  // Beviser at JavaScript rent faktisk kører — fjerner sikkerhedsnettet fra CSS'en
  document.body.classList.remove('no-js');

  // GIF'ens loop-indstilling ændres til én gennemspilning, uden at logoet
  // erstattes. Browseren beholder derfor sidste frame synlig bagefter.
  const makeGifPlayOnce = bytes => {
    const signature = 'NETSCAPE2.0';
    for (let index = 0; index < bytes.length - 19; index += 1) {
      if (bytes[index] !== 0x21 || bytes[index + 1] !== 0xff || bytes[index + 2] !== 0x0b) continue;

      const application = String.fromCharCode(...bytes.slice(index + 3, index + 14));
      if (application === signature || application === 'ANIMEXTS1.0') {
        // Fjern GIF'ens loop-blok helt. Uden den afspilles en GIF én gang,
        // og browseren beholder sidste frame synlig.
        const withoutLoop = new Uint8Array(bytes.length - 19);
        withoutLoop.set(bytes.slice(0, index));
        withoutLoop.set(bytes.slice(index + 19), index);
        return withoutLoop;
      }
    }
    return bytes;
  };

  document.querySelectorAll('.brand img[src$="logo.gif"]').forEach(async logo => {
    try {
      const response = await fetch(logo.currentSrc);
      const gif = makeGifPlayOnce(new Uint8Array(await response.arrayBuffer()));
      const playbackUrl = URL.createObjectURL(new Blob([gif], { type: 'image/gif' }));
      logo.addEventListener('load', () => URL.revokeObjectURL(playbackUrl), { once: true });
      logo.src = playbackUrl;
    } catch {
      // Ved file:// kan GIF-filen ikke læses; brug Live Server for denne funktion.
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
