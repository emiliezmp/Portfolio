// Fælles navigation og rolig billedanimation på alle sider.

// Projektkortenes indhold: ét objekt pr. projekt.
const projects = [
  {
    id: 'peak-identity', number: '01', title: 'Peak Digital', category: 'Brand Identity',
    href: 'Peak.html', image: 'img/peak-laptop-opt.webp',
    alt: 'Peak Digital — Brand Identity, vist på laptop'
  },
  {
    id: 'peak-guide', number: '02', title: 'Peak Digital', category: 'Brand Guide',
    href: 'brandguide.html', image: 'img/brandguide-tablet.webp',
    alt: 'Peak Digital — Brand Guide, vist på tablet'
  },
  {
    id: 'staycation', number: '03', title: 'Ud i det fri', category: 'UX/UI',
    href: 'stay.html', image: 'img/staycation-phone.webp',
    alt: 'Ud i det fri hjemmeside, vist på telefon'
  },
  {
    id: 'farmors', number: '04', title: 'Farmors Food', category: 'UX & Storytelling',
    href: 'food.html', image: 'img/farmors-laptop.webp',
    alt: 'Farmors Food hjemmeside, vist på laptop'
  }
];

// .map() laver hvert objekt om til HTML, og .join('') samler kortene.
// Et link omkring hele kortet giver både klik og tastaturnavigation.
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
  // Hver side vælger projekter og rækkefølge med data-projects.
  // Kortene oprettes før billedanimationerne sættes op.
  document.querySelectorAll('template[data-projects]').forEach(placeholder => {
    const selectedProjects = placeholder.dataset.projects.split(' ')
      .map(id => projects.find(project => project.id === id))
      .filter(Boolean);
    placeholder.outerHTML = renderProjects(selectedProjects);
  });

  // Registrér klik på projektkortet, også når man klikker på billedet eller teksten.
  document.querySelectorAll('.gallery').forEach(gallery => {
    gallery.addEventListener('click', event => {
      const card = event.target.closest('a[data-project]');
      if (!card) return;
      const project = projects.find(project => project.id === card.dataset.project);
      console.log('Projekt valgt:', project.title, project.category);
      // Linkets href åbner projektsiden som normalt.
    });
  });

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

  // Billeder og overskrifter er synlige som standard, også uden JavaScript.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;

  // En kort, begrænset forskydning giver også flow mellem billeder,
  // som bliver færdigindlæst i forskellige observer-kald.
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
      element.style.setProperty('--image-reveal-delay', `${delay}ms`);
      element.classList.remove(`${revealType}-reveal-pending`);
      element.classList.add(`${revealType}-reveal-enter`);
      element.addEventListener('animationend', () => {
        element.classList.remove(`${revealType}-reveal-enter`);
        element.style.removeProperty('--image-reveal-delay');
      }, { once: true });
      observer.unobserve(element);
    });
  }, { threshold: 0, rootMargin: '0px' });

  document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6').forEach(heading => {
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
