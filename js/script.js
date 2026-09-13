// Pop-up reveal: billeder glider ind, når de scroller i syne.
// Målretter to ting: alle billeder i .case-slide-grid (brandguide.html m.fl.)
// og alle billeder med klassen .pop-reveal (fx who.html).

document.addEventListener('DOMContentLoaded', () => {
  // Beviser at JavaScript rent faktisk kører — fjerner sikkerhedsnettet fra CSS'en
  document.body.classList.remove('no-js');

  // Den lodrette linje i navigationen følger sidens scroll-position.
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const updateNavigationProgress = () => {
      const maximumScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maximumScroll > 0 ? window.scrollY / maximumScroll : 1;
      sidebar.style.setProperty('--navigation-progress', Math.min(Math.max(progress, 0), 1));
    };

    updateNavigationProgress();
    window.addEventListener('scroll', updateNavigationProgress, { passive: true });
    window.addEventListener('resize', updateNavigationProgress);
  }

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
