/* ==========================================================================
   NEXORAI CLIENT LOGIC
   Vanilla JavaScript with isolated DOM state mutations & smooth transitions
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  /* --------------------------------------------------------------------------
     1. PRICING MATRIX SYSTEM (Isolated State Mutations - Section 6E)
     -------------------------------------------------------------------------- */
  const PRICING_MATRIX = {
    tiers: ['Starter', 'Pro', 'Enterprise'],
    baseRates: {            // Monthly USD base
      Starter:    29,
      Pro:        79,
      Enterprise: 199
    },
    annualMultiplier: 0.80, // 20% discount
    currencyConfig: {
      USD: { symbol: '$', tariff: 1.00 },
      INR: { symbol: '₹', tariff: 83.5 },
      EUR: { symbol: '€', tariff: 0.92 }
    }
  };

  let currentBilling = 'monthly';
  let currentCurrency = 'USD';

  const toggleMonthlyBtn = document.getElementById('toggle-monthly');
  const toggleAnnualBtn = document.getElementById('toggle-annual');
  const currencySelect = document.getElementById('currency-select');

  // Trigger price computation and isolated DOM updates
  function updatePricingDOM() {
    const isAnnual = currentBilling === 'annual';
    const currencyInfo = PRICING_MATRIX.currencyConfig[currentCurrency];
    const symbol = currencyInfo.symbol;
    const tariff = currencyInfo.tariff;
    const multiplier = isAnnual ? PRICING_MATRIX.annualMultiplier : 1.0;

    const tiers = ['starter', 'pro', 'enterprise'];

    tiers.forEach(tier => {
      const priceSpan = document.getElementById(`price-${tier}`);
      const symbolSpan = document.getElementById(`symbol-${tier}`);
      const periodSpan = document.getElementById(`period-${tier}`);

      if (!priceSpan || !symbolSpan || !periodSpan) return;

      // Calculate localized price: rate * multiplier * tariff
      const baseKey = tier.charAt(0).toUpperCase() + tier.slice(1);
      const baseRate = PRICING_MATRIX.baseRates[baseKey];
      const finalPrice = Math.round(baseRate * multiplier * tariff);

      // 1. Apply price-flip animation class
      priceSpan.classList.add('price-flip');
      priceSpan.style.willChange = 'transform, opacity';

      // 2. Perform direct textNode mutations (State Isolation - Zero Reflow)
      priceSpan.textContent = finalPrice;
      symbolSpan.textContent = symbol;
      periodSpan.textContent = isAnnual ? '/yr' : '/mo';

      // 3. Remove price-flip class after animation finishes (180ms)
      priceSpan.addEventListener('animationend', () => {
        priceSpan.classList.remove('price-flip');
        priceSpan.style.willChange = 'auto';
      }, { once: true });
    });
  }

  // Event Listeners for billing toggle
  toggleMonthlyBtn.addEventListener('click', () => {
    if (currentBilling !== 'monthly') {
      currentBilling = 'monthly';
      toggleMonthlyBtn.classList.add('active');
      toggleMonthlyBtn.setAttribute('aria-pressed', 'true');
      toggleAnnualBtn.classList.remove('active');
      toggleAnnualBtn.setAttribute('aria-pressed', 'false');
      updatePricingDOM();
    }
  });

  toggleAnnualBtn.addEventListener('click', () => {
    if (currentBilling !== 'annual') {
      currentBilling = 'annual';
      toggleAnnualBtn.classList.add('active');
      toggleAnnualBtn.setAttribute('aria-pressed', 'true');
      toggleMonthlyBtn.classList.remove('active');
      toggleMonthlyBtn.setAttribute('aria-pressed', 'false');
      updatePricingDOM();
    }
  });

  // Event Listener for currency selector
  currencySelect.addEventListener('change', (e) => {
    currentCurrency = e.target.value;
    updatePricingDOM();
  });

  // Run initial calculation on load
  updatePricingDOM();


  /* --------------------------------------------------------------------------
     2. BENTO GRID / ACCORDION CONTEXT SYNC (Section 6C)
     -------------------------------------------------------------------------- */
  const bentoCards = document.querySelectorAll('.bento-card');
  const accordionItems = document.querySelectorAll('.accordion-item');

  let activeIndex = 0;
  let isDesktop = window.innerWidth >= 768;
  let resizeTimeout = null;

  // Set active bento card style on hover / focus
  function setBentoActive(index) {
    activeIndex = index;
    bentoCards.forEach((card, idx) => {
      if (idx === index) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  // Toggle mobile accordion item on click
  function toggleAccordion(index) {
    activeIndex = index;
    accordionItems.forEach((item, idx) => {
      const content = item.querySelector('.accordion-content');
      const header = item.querySelector('.accordion-header');
      
      if (idx === index) {
        const isOpen = item.classList.contains('open');
        if (isOpen) {
          item.classList.remove('open');
          content.style.maxHeight = '0';
          header.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          content.style.maxHeight = '200px';
          header.setAttribute('aria-expanded', 'true');
        }
      } else {
        item.classList.remove('open');
        content.style.maxHeight = '0';
        header.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Synchronize state across breakpoints
  function syncBreakpointState(index, toDesktop) {
    if (toDesktop) {
      // Transitioning mobile -> desktop: set active bento card to index N
      setBentoActive(index);
    } else {
      // Transitioning desktop -> mobile: open accordion panel N
      accordionItems.forEach((item, idx) => {
        const content = item.querySelector('.accordion-content');
        const header = item.querySelector('.accordion-header');
        if (idx === index) {
          item.classList.add('open');
          content.style.maxHeight = '200px';
          header.setAttribute('aria-expanded', 'true');
        } else {
          item.classList.remove('open');
          content.style.maxHeight = '0';
          header.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  // Bento card event bindings (Desktop)
  bentoCards.forEach((card, idx) => {
    card.addEventListener('mouseenter', () => {
      if (window.innerWidth >= 768) {
        setBentoActive(idx);
      }
    });
    card.addEventListener('focus', () => {
      if (window.innerWidth >= 768) {
        setBentoActive(idx);
      }
    });
  });

  // Accordion header bindings (Mobile)
  accordionItems.forEach((item, idx) => {
    const header = item.querySelector('.accordion-header');
    header.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        toggleAccordion(idx);
      }
    });
  });

  // ResizeObserver watching viewport breakpoint crossings
  const resizeObserver = new ResizeObserver(() => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const newIsDesktop = window.innerWidth >= 768;
      if (newIsDesktop !== isDesktop) {
        isDesktop = newIsDesktop;
        // Schedule state synchronization inside a requestAnimationFrame to avoid thrashing
        requestAnimationFrame(() => {
          syncBreakpointState(activeIndex, isDesktop);
        });
      }
    }, 50); // 50ms Debounced resize
  });
  resizeObserver.observe(document.body);


  /* --------------------------------------------------------------------------
     3. FAQ ACCORDION LOGIC (Section 6F)
     -------------------------------------------------------------------------- */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    const content = item.querySelector('.faq-content');

    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      
      // Close other FAQs
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('open');
        otherItem.querySelector('.faq-content').style.maxHeight = '0';
        otherItem.querySelector('.faq-header').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        content.style.maxHeight = '200px';
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });


  /* --------------------------------------------------------------------------
     4. ANIMATE COUNT-UPS & SOCIAL PROOF STATS (Section 6D, 8)
     -------------------------------------------------------------------------- */
  function animateCountUp(element, target, duration, decimals = 0) {
    let startTime = null;
    const startValue = 0;
    const suffix = element.getAttribute('data-suffix') || '';

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Quadratic ease-out: f(t) = t * (2 - t)
      const easeProgress = progress * (2 - progress);
      const currentValue = startValue + easeProgress * (target - startValue);

      let displayVal;
      if (decimals === 0) {
        displayVal = Math.floor(currentValue).toLocaleString();
      } else {
        displayVal = currentValue.toFixed(decimals);
      }

      element.textContent = displayVal + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        let finalVal;
        if (decimals === 0) {
          finalVal = target.toLocaleString();
        } else {
          finalVal = target.toFixed(decimals);
        }
        element.textContent = finalVal + suffix;
      }
    }
    requestAnimationFrame(step);
  }

  // IntersectionObserver for Stats Row count ups
  const statsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const countTo = parseFloat(target.getAttribute('data-target'));
        const decimals = parseInt(target.getAttribute('data-decimals') || '0', 10);
        animateCountUp(target, countTo, 1600, decimals);
        observer.unobserve(target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.count-up').forEach(el => statsObserver.observe(el));


  /* --------------------------------------------------------------------------
     5. HERO KPI ANIMATIONS & LOAD TIMERS
     -------------------------------------------------------------------------- */
  // Animate KPI Tiles on load (t=450ms, right after dashboard card enters)
  setTimeout(() => {
    const kpiAccuracy = document.getElementById('kpi-accuracy');
    const kpiLatency = document.getElementById('kpi-latency');
    const kpiThroughput = document.getElementById('kpi-throughput');

    if (kpiAccuracy) animateCountUp(kpiAccuracy, 99, 1000, 0);
    if (kpiLatency) animateCountUp(kpiLatency, 12, 1000, 0);
    if (kpiThroughput) animateCountUp(kpiThroughput, 85, 1000, 0);
  }, 450);


  /* --------------------------------------------------------------------------
     6. SCROLL INTERSECTION OBSERVER FOR SECTIONS
     -------------------------------------------------------------------------- */
  const sectionAnims = document.querySelectorAll('.scroll-animate');
  const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  sectionAnims.forEach(sec => sectionObserver.observe(sec));


  /* --------------------------------------------------------------------------
     7. STICKY NAV BORDER SCROLL INTERACTION
     -------------------------------------------------------------------------- */
  const header = document.getElementById('site-header');
  let scrollTimeout = null;

  window.addEventListener('scroll', () => {
    if (!scrollTimeout) {
      scrollTimeout = setTimeout(() => {
        if (window.scrollY > 80) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
        scrollTimeout = null;
      }, 15);
    }
  }, { passive: true });


  /* --------------------------------------------------------------------------
     8. WILL-CHANGE PERFORMANCE CLEANUP (Section 9)
     -------------------------------------------------------------------------- */
  // Query all items that had entrance animations active on page load
  const animatingElements = document.querySelectorAll(
    '.navbar, .hero-badge, .title-line-1, .title-line-2, .hero-subtitle, .hero-actions, .trust-badge, .dashboard-card'
  );

  animatingElements.forEach(el => {
    // Explicitly notify GPU path is active
    el.style.willChange = 'transform, opacity';
    
    el.addEventListener('animationend', () => {
      // Remove will-change immediately after animation completes to avoid memory bloat
      el.style.willChange = 'auto';
    }, { once: true });
  });

});
