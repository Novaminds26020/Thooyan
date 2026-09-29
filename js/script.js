/**
 * NOVAMINDS — AI-Powered Autonomous Biomedical Waste Management Robot
 * Vanilla JavaScript Interactive Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --------------------------------------------------
  // 1. NAVBAR SCROLL EFFECT & MOBILE MENU TOGGLE
  // --------------------------------------------------
  const header = document.getElementById('header');
  const navToggle = document.getElementById('navToggle');
  const primaryNav = document.getElementById('primaryNav');
  const navLinks = document.querySelectorAll('.nav-link');

  // Handle sticky header shadow & shrink on scroll
  const handleScrollHeader = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScrollHeader, { passive: true });
  handleScrollHeader();

  // Mobile hamburger toggle
  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', () => {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
      navToggle.classList.toggle('active');
      primaryNav.classList.toggle('nav-open');
      document.body.classList.toggle('no-scroll', !isExpanded);
    });

    // Close menu when clicking on nav link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (primaryNav.classList.contains('nav-open')) {
          navToggle.setAttribute('aria-expanded', 'false');
          navToggle.classList.remove('active');
          primaryNav.classList.remove('nav-open');
          document.body.classList.remove('no-scroll');
        }
      });
    });

    // Close mobile menu on outside click
    document.addEventListener('click', (e) => {
      if (
        primaryNav.classList.contains('nav-open') &&
        !primaryNav.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.classList.remove('active');
        primaryNav.classList.remove('nav-open');
        document.body.classList.remove('no-scroll');
      }
    });
  }

  // --------------------------------------------------
  // 2. ACTIVE SECTION INDICATOR ON SCROLL
  // --------------------------------------------------
  const sections = document.querySelectorAll('section[id]');

  const updateActiveNavLink = () => {
    const scrollPosition = window.scrollY + 120;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', updateActiveNavLink, { passive: true });

  // --------------------------------------------------
  // 3. TECHNICAL APPROACH TABS SWITCHING
  // --------------------------------------------------
  const tabButtons = document.querySelectorAll('.tech-tab-btn');
  const tabPanes = document.querySelectorAll('.tech-tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      // Update button states
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update tab pane visibility
      tabPanes.forEach(pane => {
        if (pane.id === `tab-${targetTab}`) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });
    });
  });

  // --------------------------------------------------
  // 4. SCROLL REVEAL ANIMATIONS (IntersectionObserver)
  // --------------------------------------------------
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealElements = document.querySelectorAll('[data-reveal]');

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.getAttribute('data-delay') || 0;

          setTimeout(() => {
            el.classList.add('revealed');
          }, delay);

          observer.unobserve(el);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // If reduced motion is requested or IntersectionObserver is unsupported
    revealElements.forEach(el => el.classList.add('revealed'));
  }

  // --------------------------------------------------
  // 5. SYSTEM FLOW INTERACTIVE HIGHLIGHTING
  // --------------------------------------------------
  const flowNodes = document.querySelectorAll('.flow-node');
  if (flowNodes.length > 0) {
    flowNodes.forEach(node => {
      node.addEventListener('mouseenter', () => {
        flowNodes.forEach(n => n.classList.remove('active-flow-node'));
        node.classList.add('active-flow-node');
      });
    });
  }

  // --------------------------------------------------
  // 6. BACK TO TOP BUTTON SMOOTH SCROLL
  // --------------------------------------------------
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  }

  // --------------------------------------------------
  // 7. IMAGE FALLBACK STATE HANDLER
  // --------------------------------------------------
  const allImages = document.querySelectorAll('img');
  allImages.forEach(img => {
    if (!img.complete || img.naturalWidth === 0) {
      img.addEventListener('error', function() {
        const parentBox = this.closest('.image-wrapper, .team-img-wrapper, .mentor-img-wrapper');
        if (parentBox) {
          parentBox.classList.add('placeholder-active');
        }
      });
    }
  });
});
