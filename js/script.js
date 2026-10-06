// Shared navigation and gentle image animations across all pages.

// Project card content: one object per project.
const projects = [
  {
    id: 'peak-identity', number: '01', title: 'Peak Digital', category: 'Brand Identity',
    href: 'Peak.html', image: 'img/peak-laptop-opt.webp',
    alt: 'Peak Digital — Brand Identity displayed on a laptop'
  },
  {
    id: 'peak-guide', number: '02', title: 'Peak Digital', category: 'Brand Guide',
    href: 'brandguide.html', image: 'img/brandguide-tablet.webp',
    alt: 'Peak Digital — Brand Guide displayed on a tablet'
  },
  {
    id: 'staycation', number: '03', title: 'Ud i det fri', category: 'UX/UI',
    href: 'stay.html', image: 'img/staycation-phone.webp',
    alt: 'Ud i det fri website displayed on a phone'
  },
  {
    id: 'farmors', number: '04', title: 'Farmors Food', category: 'UX & Storytelling',
    href: 'food.html', image: 'img/farmors-laptop.webp',
    alt: 'Farmors Food website displayed on a laptop'
  }
];

// Convert each project to HTML and join the cards together.
// Wrapping each card in a link supports mouse and keyboard navigation.
function renderProjects(projects) {
  return projects.map(project => `
    <a class="gallery-item" href="${project.href}" id="${project.id}" data-project="${project.id}">
      <img src="${project.image}" alt="${project.alt}" loading="lazy" decoding="async">
      <span class="gallery-overlay"></span>
      <span class="gallery-overlay-text">
        <span class="gallery-number">${project.number}</span>
        <span class="gallery-title gallery-title--split">
          <span>${project.title}</span>
          <span>${project.category} <svg class="gallery-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        </span>
      </span>
    </a>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // Each page selects projects and their order using data-projects.
  // Render the cards before setting up image animations.
  document.querySelectorAll('template[data-projects]').forEach(placeholder => {
    const selectedProjects = placeholder.dataset.projects.split(' ')
      .map(id => projects.find(project => project.id === id))
      .filter(Boolean);
    placeholder.outerHTML = renderProjects(selectedProjects);
  });

  // Remove the CSS fallback once JavaScript is running.
  document.body.classList.remove('no-js');

  // Show the back-to-top button after the user has scrolled down.
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    const updateBackToTop = () => {
      backToTop.classList.toggle('is-visible', window.scrollY > 240);
    };

    updateBackToTop();
    window.addEventListener('scroll', updateBackToTop, { passive: true });
  }

  // Shared mobile and tablet menu. Each page already contains navigation,
  // so create the button here for use across all pages.
  document.querySelectorAll('.sidebar').forEach(sidebar => {
    const navigation = sidebar.querySelector('nav');
    const brand = sidebar.querySelector('.brand');
    if (!navigation || !brand) return;

    const menuButton = document.createElement('button');
    menuButton.className = 'menu-toggle';
    menuButton.type = 'button';
    menuButton.setAttribute('aria-label', 'Open menu');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-controls', 'site-navigation');
    menuButton.innerHTML = '<span></span><span></span><span></span><svg class="menu-toggle__heart" viewBox="0 0 64 56" aria-hidden="true" focusable="false"><path fill="currentColor" d="M32 53C27 48 3 31 3 17C3 1 23-3 32 12C41-3 61 1 61 17C61 31 37 48 32 53Z"/></svg>';
    navigation.id = 'site-navigation';
    brand.insertAdjacentElement('afterend', menuButton);
    const mobileMenu = window.matchMedia('(max-width: 900px)');

    const closeMenu = () => {
      sidebar.classList.remove('is-menu-open');
      if (mobileMenu.matches) navigation.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open menu');
    };

    const syncMenuForViewport = () => {
      if (mobileMenu.matches) {
        navigation.hidden = !sidebar.classList.contains('is-menu-open');
      } else {
        navigation.hidden = false;
        closeMenu();
      }
    };

    menuButton.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('is-menu-open');
      navigation.hidden = !isOpen;
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    mobileMenu.addEventListener('change', syncMenuForViewport);
    syncMenuForViewport();
  });

  // The vertical navigation line follows the page's scroll position.
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let navigationFrame;
    let lastNavigationProgress = -1;

    const updateNavigationProgress = () => {
      const maximumScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maximumScroll > 0 ? window.scrollY / maximumScroll : 1;
      const clampedProgress = Math.min(Math.max(progress, 0), 1);
      // Avoid updates for tiny changes in scroll position.
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

  // Decode project images asynchronously and load them near the viewport.
  // Load the homepage hero immediately.
  document.querySelectorAll('main img').forEach(image => {
    image.decoding = 'async';
    if (!image.closest('.hero') && !image.hasAttribute('loading')) image.loading = 'lazy';
  });

  // Images and headings are visible by default, including without JavaScript.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;

  // A short, capped delay staggers images that finish loading
  // in separate observer callbacks.
  let nextRevealAt = 0;
  const observer = new IntersectionObserver(entries => {
    entries.filter(entry => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top
        || a.boundingClientRect.left - b.boundingClientRect.left)
      .forEach(entry => {
      const element = entry.target;
      const revealType = element.tagName === 'IMG' ? 'image' : 'heading';
      const now = performance.now();
      const delay = Math.min(Math.max(nextRevealAt - now, 0), 420);
      nextRevealAt = now + delay + 140;
      const subtitleDelay = element.matches('.contact-marquee') ? 900
        : element.matches('.case-subtitle') ? 350 : 0;
      element.style.setProperty('--image-reveal-delay', `${delay + subtitleDelay}ms`);
      element.classList.remove(`${revealType}-reveal-pending`);
      element.classList.add(`${revealType}-reveal-enter`);
      element.addEventListener('animationend', () => {
        element.classList.remove(`${revealType}-reveal-enter`);
        element.style.removeProperty('--image-reveal-delay');
      }, { once: true });
      observer.unobserve(element);
    });
  }, { threshold: 0, rootMargin: '0px' });

  document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6, main .case-subtitle, main .contact-marquee').forEach(heading => {
    heading.classList.add('heading-reveal-pending');
    observer.observe(heading);
  });

  document.querySelectorAll('img').forEach(image => {
    const prepareReveal = () => {
      if (reducedMotion.matches || !image.naturalWidth) return;
      image.classList.add('image-reveal-pending');
      observer.observe(image);
    };
    if (image.complete) prepareReveal();
    else image.addEventListener('load', prepareReveal, { once: true });
  });

  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    document.querySelectorAll('.image-reveal-pending, .image-reveal-enter, .heading-reveal-pending, .heading-reveal-enter').forEach(element => {
      element.classList.remove('image-reveal-pending', 'image-reveal-enter', 'heading-reveal-pending', 'heading-reveal-enter');
      element.style.removeProperty('--image-reveal-delay');
    });
  });
});
