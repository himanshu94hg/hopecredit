/* ============================================================
   HOPE CREDIT FINANCE – SCRIPT.JS
   Vanilla JS: Header, Calculator, Sliders, Accordion,
   Testimonial area, Loan Tabs, Scroll Animations
============================================================ */

(function () {
    'use strict';
  
    /* ── Helpers ─────────────────────────────────────── */
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
    const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  
    /* ============================================================
       1. STICKY HEADER
    ============================================================ */
    const header = $('#header');
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    });
  
    /* ============================================================
       2. HAMBURGER / MOBILE NAV
    ============================================================ */
    const hamburger = $('#hamburger');
    const mainNav = $('#mainNav');
  
    hamburger?.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mainNav.classList.toggle('open');
    });
  
    // Close nav when a link is clicked
    $$('.nav-link, .dropdown-menu a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger?.classList.remove('open');
        mainNav?.classList.remove('open');
      });
    });
  
    /* ============================================================
       3. LOAN CALCULATOR
    ============================================================ */
    const loanAmountInput  = $('#loanAmount');
    const loanPeriodInput  = $('#loanPeriod');
    const loanRateInput    = $('#loanRate');
    const loanAmountVal    = $('#loanAmountVal');
    const loanPeriodVal    = $('#loanPeriodVal');
    const loanRateVal      = $('#loanRateVal');
    const monthlyPaymentEl = $('#monthlyPayment');
    const totalInterestEl  = $('#totalInterest');
    const totalAmountEl    = $('#totalAmount');
  
    function updateSliderFill(input) {
      const min  = +input.min;
      const max  = +input.max;
      const val  = +input.value;
      const pct  = ((val - min) / (max - min)) * 100;
      input.style.setProperty('--pct', pct + '%');
      input.style.background = `linear-gradient(90deg, var(--accent) ${pct}%, var(--gray-200) ${pct}%)`;
    }
  
    function calcLoan() {
      const P = +loanAmountInput.value;
      const n = +loanPeriodInput.value;
      const r = +loanRateInput.value / 100 / 12;
  
      loanAmountVal.textContent = fmt(P);
      loanPeriodVal.textContent = n + ' Mo';
      loanRateVal.textContent   = loanRateInput.value + '%';
  
      let monthly, totalPaid, totalInterest;
      if (r === 0) {
        monthly = P / n;
      } else {
        monthly = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      }
      totalPaid    = monthly * n;
      totalInterest = totalPaid - P;
  
      monthlyPaymentEl.textContent = fmt(monthly);
      totalInterestEl.textContent  = fmt(totalInterest);
      totalAmountEl.textContent    = fmt(totalPaid);
  
      updateSliderFill(loanAmountInput);
      updateSliderFill(loanPeriodInput);
      updateSliderFill(loanRateInput);
    }
  
    if (loanAmountInput) {
      [loanAmountInput, loanPeriodInput, loanRateInput].forEach(inp => {
        inp.addEventListener('input', calcLoan);
      });
      calcLoan(); // initial
    }
  
    /* ============================================================
       4. LOAN TYPE TABS
    ============================================================ */
    const loanData = {
      personal: {
        img:   'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80',
        title: 'Personal Loan',
        desc:  'Meet your personal financial needs with flexible repayment options—no collateral required. PAN India support, quick approval, and no hassle documentation.',
      },
      business: {
        img:   'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=80',
        title: 'Business Loan',
        desc:  'Fuel your business with working capital, expansion, or equipment financing. PAN India support, quick approval, and no hassle documentation.',
      },
      balance: {
        img:   'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80',
        title: 'Balance Transfer',
        desc:  'Consolidate high-interest debt and save by moving your existing loan balances to better rates. PAN India support, quick approval, and no hassle documentation.',
      },
      home: {
        img:   'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80',
        title: 'Home Loan',
        desc:  'Make homeownership a reality with competitive mortgage rates and step-by-step guidance. PAN India support, quick approval, and no hassle documentation.',
      },
      lap: {
        img:   'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80',
        title: 'LAP Loan',
        desc:  'Loan against property for business, education, or major goals—competitive rates and flexible tenure. PAN India support, quick approval, and no hassle documentation.',
      },
      car: {
        img:   'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600&q=80',
        title: 'Car Loan',
        desc:  'Drive your dream car home with flexible terms and competitive rates. PAN India support, quick approval, and no hassle documentation.',
      },
      /* Credit Card (hidden until product is live)
      credit: {
        img:   'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80',
        title: 'Credit Card',
        desc:  'Get a credit card tailored to your lifestyle. Enjoy rewards, cashback, and flexible payment options.',
      },
      */
    };
  
    const loanItems   = $$('#loanTypeList .loan-list-item');
    const loanPanelImg   = $('#loanPanelImg');
    const loanPanelTitle = $('#loanPanelTitle');
    const loanPanelDesc  = $('#loanPanelDesc');
  
    function updateLoanPanel(key) {
      const data = loanData[key];
      if (!data || !loanPanelImg) return;
      // Update content immediately (sync with active state)
      loanPanelTitle.textContent = data.title;
      loanPanelDesc.textContent  = data.desc;
      loanPanelImg.alt           = data.title;
      // Fade image transition
      loanPanelImg.style.opacity = '0';
      loanPanelImg.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        loanPanelImg.src = data.img;
        loanPanelImg.style.opacity = '1';
      }, 150);
    }

    loanItems.forEach(item => {
      item.addEventListener('click', () => {
        loanItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const key = item.dataset.tab;
        updateLoanPanel(key);
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      });
    });

    // Ensure initial state is in sync
    const initialActive = document.querySelector('#loanTypeList .loan-list-item.active');
    if (initialActive) updateLoanPanel(initialActive.dataset.tab);
  
    /* ============================================================
       5. ACCORDION (FAQ)
    ============================================================ */
    const accordionItems = $$('.accordion-item');
  
    accordionItems.forEach(item => {
      const header = item.querySelector('.accordion-header');
      header?.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Close all
        accordionItems.forEach(i => i.classList.remove('active'));
        // Toggle current
        if (!isActive) item.classList.add('active');
      });
    });
  
    /* ============================================================
       6. TESTIMONIAL SLIDER
    ============================================================ */
    const slides  = $$('.testimonial-slide');
    const dots    = $$('.t-dot');
    const avatars = $$('.t-avatar');
    let current   = 0;
    let autoplay;
  
    function showSlide(idx) {
      slides.forEach(s  => s.classList.remove('active'));
      dots.forEach(d    => d.classList.remove('active'));
      avatars.forEach(a => a.classList.remove('active'));
  
      slides[idx]?.classList.add('active');
      dots[idx]?.classList.add('active');
      avatars[idx]?.classList.add('active');
      current = idx;
    }
  
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        showSlide(+dot.dataset.idx);
        resetAutoplay();
      });
    });
  
    avatars.forEach(av => {
      av.addEventListener('click', () => {
        showSlide(+av.dataset.idx);
        resetAutoplay();
      });
    });
  
    function nextSlide() {
      const next = (current + 1) % slides.length;
      showSlide(next);
    }
  
    function startAutoplay() {
      autoplay = setInterval(nextSlide, 5000);
    }
  
    function resetAutoplay() {
      clearInterval(autoplay);
      startAutoplay();
    }
  
    if (slides.length > 1) startAutoplay();
  
    /* ============================================================
       7. SCROLL TO TOP BUTTON
    ============================================================ */
    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.className  = 'scroll-top';
    scrollTopBtn.innerHTML  = '&#8679;';
    scrollTopBtn.title      = 'Back to top';
    scrollTopBtn.setAttribute('aria-label', 'Back to top');
    document.body.appendChild(scrollTopBtn);
  
    window.addEventListener('scroll', () => {
      scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    });
  
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  
    /* ============================================================
       8. INTERSECTION OBSERVER – Fade In
    ============================================================ */
    const animEls = $$('.process-step, .team-card, .blog-card, .quick-feature, .feature-item, .founder-story-block');
  
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
  
      animEls.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(28px)';
        el.style.transition = `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`;
        observer.observe(el);
      });
  
      // When visible, reset to natural state
      const visibleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            visibleObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
  
      animEls.forEach(el => visibleObserver.observe(el));
    }
  
    /* ============================================================
       9. SMOOTH ACTIVE NAV LINK ON SCROLL
    ============================================================ */
    const sections = $$('section[id]');
    const navLinks = $$('.nav-link');
  
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY + 120;
      sections.forEach(section => {
        const top    = section.offsetTop;
        const height = section.offsetHeight;
        const id     = section.getAttribute('id');
        if (scrollY >= top && scrollY < top + height) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + id) {
              link.classList.add('active');
            }
          });
        }
      });
    });
  
  })();
  