// Pop-up reveal: billeder i .case-slide-grid glider ind, når de scroller i syne.
// Bruges på: Brandguide.html (og alle fremtidige sider med samme klasse).

document.addEventListener('DOMContentLoaded', () => {
  // Beviser at JavaScript rent faktisk kører — fjerner sikkerhedsnettet fra CSS'en
  document.body.classList.remove('no-js');

  const slideImages = document.querySelectorAll('.case-slide-grid img');

  if (!slideImages.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    slideImages.forEach(img => observer.observe(img));
  } else {
    // Fallback: hvis IntersectionObserver ikke understøttes, vis billederne med det samme
    slideImages.forEach(img => img.classList.add('is-visible'));
  }

  // Ekstra sikkerhedsnet: hvis et billede af en eller anden grund aldrig
  // udløser observeren (fx meget kort side), vis det alligevel efter 3 sekunder
  setTimeout(() => {
    document.querySelectorAll('.case-slide-grid img:not(.is-visible)')
      .forEach(img => img.classList.add('is-visible'));
  }, 3000);
});