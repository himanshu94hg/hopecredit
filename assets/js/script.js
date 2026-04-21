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
  
    function toMonthInputValue(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    }
  
    function addCalendarMonths(ymStr, delta) {
      const [ys, ms] = ymStr.split('-').map(Number);
      const d = new Date(ys, ms - 1 + delta, 1);
      return toMonthInputValue(d);
    }
  
    function ymParts(ymStr, delta) {
      const [ys, ms] = addCalendarMonths(ymStr, delta).split('-').map(Number);
      return { y: ys, m: ms };
    }
  
    function financialYearBucket(y, m) {
      if (m >= 4) return { key: `${y}-${y + 1}`, sort: y };
      return { key: `${y - 1}-${y}`, sort: y - 1 };
    }
  
    function financialYearLabelFromKey(key) {
      const [a, b] = key.split('-').map(Number);
      return `FY ${a}–${String(b).slice(-2)}`;
    }
  
    function buildAmortizationRows(principal, numMonths, annualPct) {
      const r = annualPct / 100 / 12;
      let balance = principal;
      let monthly;
      if (numMonths <= 0) return { monthly: 0, rows: [] };
      if (r === 0) {
        monthly = principal / numMonths;
      } else {
        monthly =
          (principal * (r * Math.pow(1 + r, numMonths))) / (Math.pow(1 + r, numMonths) - 1);
      }
      const rows = [];
      for (let i = 0; i < numMonths; i++) {
        const interest = balance * r;
        const prin = monthly - interest;
        const newBal = Math.max(0, balance - prin);
        rows.push({
          principal: prin,
          interest,
          payment: monthly,
          balanceAfter: newBal,
        });
        balance = newBal;
      }
      return { monthly, rows };
    }
  
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
       Hero (enhanced): value-above + number inputs + live summary.
       Other pages: optional #loanAmountVal span trio (legacy).
    ============================================================ */
    const loanAmountInput  = $('#loanAmount');
    const loanPeriodInput  = $('#loanPeriod');
    const loanRateInput    = $('#loanRate');
  
    function clampNum(n, min, max) {
      if (Number.isNaN(n) || !Number.isFinite(n)) return min;
      return Math.min(max, Math.max(min, n));
    }
  
    function snapToStep(value, step) {
      const s = +step || 1;
      if (s >= 1) return Math.round(value / s) * s;
      const inv = Math.round(1 / s);
      return Math.round(value * inv) / inv;
    }
  
    function initLoanCalculator() {
      if (!loanAmountInput || !loanPeriodInput || !loanRateInput) return;
  
      const loanAmountVal   = $('#loanAmountVal');
      const loanPeriodVal   = $('#loanPeriodVal');
      const loanRateVal     = $('#loanRateVal');
      const loanAmountAbove = $('#loanAmountAbove');
      const loanPeriodAbove = $('#loanPeriodAbove');
      const loanRateAbove   = $('#loanRateAbove');
      const loanAmountNum   = $('#loanAmountNum');
      const loanPeriodNum   = $('#loanPeriodNum');
      const loanRateNum     = $('#loanRateNum');
      const monthlyPaymentEl = $('#monthlyPayment');
      const totalInterestEl  = $('#totalInterest');
      const totalAmountEl    = $('#totalAmount');
      const emiBreakupRing = $('#emiBreakupRing');
      const emiBreakupBarTrack = $('#emiBreakupBarTrack');
      const emiBreakupPrincipalPct = $('#emiBreakupPrincipalPct');
      const emiBreakupInterestPct = $('#emiBreakupInterestPct');
      const emiBreakupLive = $('#emiBreakupLive');
      const emiScheduleSection = $('#emiScheduleSection');
      const emiScheduleStart = $('#emiScheduleStart');
      const emiScheduleView = $('#emiScheduleView');
      const emiScheduleSvg = $('#emiScheduleSvg');
      const emiScheduleTooltip = $('#emiScheduleTooltip');
      const emiScheduleTbody = $('#emiScheduleTbody');
      const emiSchedulePdf = $('#emiSchedulePdf');
      const emiScheduleExcel = $('#emiScheduleExcel');
      const emiScheduleShare = $('#emiScheduleShare');
  
      let refreshEmiSchedule = function () {};
  
      try {
        const qp = new URLSearchParams(window.location.search);
        const qAmt = qp.get('amt');
        const qMo = qp.get('mo');
        const qRate = qp.get('rate');
        if (qAmt != null) {
          const lo = +loanAmountInput.min;
          const hi = +loanAmountInput.max;
          loanAmountInput.value = String(Math.round(clampNum(+qAmt, lo, hi)));
          if (loanAmountNum) loanAmountNum.value = loanAmountInput.value;
        }
        if (qMo != null) {
          const lo = +loanPeriodInput.min;
          const hi = +loanPeriodInput.max;
          loanPeriodInput.value = String(Math.round(clampNum(+qMo, lo, hi)));
          if (loanPeriodNum) loanPeriodNum.value = loanPeriodInput.value;
        }
        if (qRate != null) {
          const lo = +loanRateInput.min;
          const hi = +loanRateInput.max;
          const step = loanRateInput.step ? +loanRateInput.step : 0.1;
          let rv = clampNum(+qRate, lo, hi);
          rv = snapToStep(rv, step);
          loanRateInput.value = String(step < 1 ? rv.toFixed(1) : Math.round(rv));
          if (loanRateNum) loanRateNum.value = loanRateInput.value;
        }
        if (emiScheduleStart && qp.get('start')) {
          emiScheduleStart.value = qp.get('start').slice(0, 7);
        }
        if (emiScheduleView && qp.get('view')) {
          const v = qp.get('view');
          if (v === 'calendar' || v === 'financial') emiScheduleView.value = v;
        }
      } catch (e) {
        /* ignore */
      }
  
      if (emiScheduleStart && !emiScheduleStart.value) {
        emiScheduleStart.value = toMonthInputValue(new Date());
      }
  
      function updateSliderFill(input) {
        const min = +input.min;
        const max = +input.max;
        const val = +input.value;
        const pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
        input.style.setProperty('--pct', pct + '%');
      }
  
      function setAriaRange(input, valueText) {
        input.setAttribute('aria-valuenow', String(input.value));
        if (valueText) input.setAttribute('aria-valuetext', valueText);
      }
  
      function syncNumberFromSliders() {
        const pa = document.activeElement;
        const P = +loanAmountInput.value;
        const n = +loanPeriodInput.value;
        const rate = +loanRateInput.value;
  
        if (loanAmountNum && pa !== loanAmountNum) {
          loanAmountNum.value = String(Math.round(P));
        }
        if (loanPeriodNum && pa !== loanPeriodNum) {
          loanPeriodNum.value = String(Math.round(n));
        }
        if (loanRateNum && pa !== loanRateNum) {
          const fineStep = +loanRateInput.step < 1;
          loanRateNum.value = fineStep ? String(rate.toFixed(1)) : String(Math.round(rate));
        }
      }
  
      function applyNumberToRange(numEl, rangeEl, options) {
        const force = options && options.force === true;
        const min = +rangeEl.min;
        const max = +rangeEl.max;
        const step = rangeEl.step ? +rangeEl.step : 1;
        const raw = String(numEl.value).trim();
        if (!force && (raw === '' || raw === '-' || raw.endsWith('.'))) {
          return;
        }
        if (force && (raw === '' || raw === '-' || raw.endsWith('.'))) {
          const fallback = +rangeEl.value;
          if (+rangeEl.step < 1) {
            numEl.value = String(fallback.toFixed(1));
          } else {
            numEl.value = String(Math.round(fallback));
          }
          return;
        }
        const parsed = parseFloat(raw);
        if (Number.isNaN(parsed)) {
          if (force) {
            const fallback = +rangeEl.value;
            if (+rangeEl.step < 1) {
              numEl.value = String(fallback.toFixed(1));
            } else {
              numEl.value = String(Math.round(fallback));
            }
          }
          return;
        }
        let v = clampNum(parsed, min, max);
        v = snapToStep(v, step);
        rangeEl.value = String(v);
        /* While focused, keep raw text so values like 17 can be typed; if user exceeds
           slider max (e.g. 100 months or 100% rate), replace with clamped value immediately. */
        const exceedsSliderMax = parsed > max;
        const shouldFormat =
          force || document.activeElement !== numEl || exceedsSliderMax;
        if (shouldFormat) {
          if (+rangeEl.step < 1) {
            numEl.value = String(v.toFixed(1));
          } else {
            numEl.value = String(Math.round(v));
          }
        }
      }
  
      function calcLoan() {
        const P = +loanAmountInput.value;
        const n = +loanPeriodInput.value;
        const annualRate = +loanRateInput.value;
        const r = annualRate / 100 / 12;
  
        const amountStr = fmt(P);
        const periodStr = `${n} months`;
        const rateDisplay = annualRate % 1 === 0 ? `${annualRate}%` : `${annualRate.toFixed(1)}%`;
  
        if (loanAmountVal) loanAmountVal.textContent = amountStr;
        if (loanPeriodVal) loanPeriodVal.textContent = `${n} Mo`;
        if (loanRateVal) loanRateVal.textContent = `${annualRate}%`;
  
        if (loanAmountAbove) loanAmountAbove.textContent = amountStr;
        if (loanPeriodAbove) loanPeriodAbove.textContent = periodStr;
        if (loanRateAbove) loanRateAbove.textContent = rateDisplay;
  
        syncNumberFromSliders();
  
        setAriaRange(loanAmountInput, amountStr);
        setAriaRange(loanPeriodInput, periodStr);
        setAriaRange(loanRateInput, `${annualRate} percent per year`);
  
        let monthly;
        let totalPaid;
        let totalInterest;
        if (r === 0) {
          monthly = P / n;
          totalPaid = P;
          totalInterest = 0;
        } else {
          monthly = (P * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
          totalPaid = monthly * n;
          totalInterest = totalPaid - P;
        }
  
        if (monthlyPaymentEl) monthlyPaymentEl.textContent = fmt(monthly);
        if (totalInterestEl) totalInterestEl.textContent = fmt(totalInterest);
        if (totalAmountEl) totalAmountEl.textContent = fmt(totalPaid);
  
        let principalPct = 0;
        let interestPct = 0;
        let principalTurn = 0;
        if (totalPaid > 0 && Number.isFinite(totalPaid)) {
          principalPct = (P / totalPaid) * 100;
          interestPct = (totalInterest / totalPaid) * 100;
          principalTurn = Math.min(1, Math.max(0, principalPct / 100));
        }
        if (emiBreakupRing) {
          emiBreakupRing.style.setProperty('--principal-turn', String(principalTurn));
        }
        if (emiBreakupBarTrack) {
          emiBreakupBarTrack.style.setProperty(
            '--principal-pct-bar',
            totalPaid > 0 ? `${principalPct.toFixed(1)}%` : '0%'
          );
        }
        if (emiBreakupPrincipalPct) {
          emiBreakupPrincipalPct.textContent = totalPaid > 0 ? `${principalPct.toFixed(1)}%` : '—';
        }
        if (emiBreakupInterestPct) {
          emiBreakupInterestPct.textContent = totalPaid > 0 ? `${interestPct.toFixed(1)}%` : '—';
        }
        if (emiBreakupLive) {
          emiBreakupLive.textContent =
            totalPaid > 0
              ? `Break-up of total payment: ${principalPct.toFixed(1)}% principal loan amount, ${interestPct.toFixed(1)}% total interest.`
              : '';
        }
  
        updateSliderFill(loanAmountInput);
        updateSliderFill(loanPeriodInput);
        updateSliderFill(loanRateInput);
  
        refreshEmiSchedule();
      }
  
      if (emiScheduleSection && emiScheduleStart && emiScheduleView && emiScheduleSvg && emiScheduleTbody) {
        const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const NS = 'http://www.w3.org/2000/svg';
  
        function aggregateByView(P, n, annualPct, startYM, view) {
          const { rows } = buildAmortizationRows(P, n, annualPct);
          const buckets = {};
          rows.forEach((row, i) => {
            const { y, m } = ymParts(startYM, i);
            let key;
            let label;
            let sortKey;
            if (view === 'financial') {
              const fy = financialYearBucket(y, m);
              key = fy.key;
              label = financialYearLabelFromKey(key);
              sortKey = fy.sort;
            } else {
              key = String(y);
              label = String(y);
              sortKey = y;
            }
            if (!buckets[key]) {
              buckets[key] = {
                key,
                label,
                sortKey,
                principal: 0,
                interest: 0,
                months: [],
              };
            }
            buckets[key].principal += row.principal;
            buckets[key].interest += row.interest;
            buckets[key].months.push({
              monthIndex: i + 1,
              y,
              m,
              principal: row.principal,
              interest: row.interest,
              payment: row.payment,
              balanceAfter: row.balanceAfter,
            });
            buckets[key].endBalance = row.balanceAfter;
          });
          let cumPrin = 0;
          const list = Object.values(buckets).sort((a, b) => a.sortKey - b.sortKey || a.key.localeCompare(b.key));
          list.forEach((b) => {
            cumPrin += b.principal;
            b.totalPay = b.principal + b.interest;
            b.paidPct = P > 0 ? (cumPrin / P) * 100 : 0;
          });
          return list;
        }
  
        function renderScheduleChart(aggregates, principal) {
          emiScheduleSvg.innerHTML = '';
          if (!aggregates.length || principal <= 0) {
            emiScheduleSvg.setAttribute('viewBox', '0 0 400 120');
            const t = document.createElementNS(NS, 'text');
            t.setAttribute('x', '200');
            t.setAttribute('y', '64');
            t.setAttribute('text-anchor', 'middle');
            t.setAttribute('class', 'calc-schedule__svg-empty');
            t.textContent = 'Adjust loan details to see the schedule chart.';
            emiScheduleSvg.appendChild(t);
            return;
          }
  
          const W = 640;
          const H = 280;
          const padL = 52;
          const padR = 52;
          const padT = 16;
          const padB = 56;
          const innerW = W - padL - padR;
          const innerH = H - padT - padB;
          const n = aggregates.length;
          const gap = 6;
          const barW = Math.max(8, (innerW - gap * (n - 1)) / n);
  
          let maxPay = 0;
          aggregates.forEach((a) => {
            maxPay = Math.max(maxPay, a.totalPay);
          });
          if (maxPay <= 0) maxPay = 1;
  
          emiScheduleSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
          emiScheduleSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  
          const gRoot = document.createElementNS(NS, 'g');
  
          const axis = document.createElementNS(NS, 'path');
          axis.setAttribute(
            'd',
            `M${padL},${padT} L${padL},${padT + innerH} L${padL + innerW},${padT + innerH}`
          );
          axis.setAttribute('class', 'calc-schedule__svg-axis');
          gRoot.appendChild(axis);
  
          const balPts = [];
          aggregates.forEach((a, i) => {
            const cx = padL + i * (barW + gap) + barW / 2;
            const prinH = (a.principal / maxPay) * innerH;
            const intH = (a.interest / maxPay) * innerH;
            const x = padL + i * (barW + gap);
            const baseY = padT + innerH;
            const r1 = document.createElementNS(NS, 'rect');
            r1.setAttribute('x', String(x));
            r1.setAttribute('y', String(baseY - prinH - intH));
            r1.setAttribute('width', String(barW));
            r1.setAttribute('height', String(prinH));
            r1.setAttribute('class', 'calc-schedule__bar-principal');
            r1.dataset.idx = String(i);
            gRoot.appendChild(r1);
            const r2 = document.createElementNS(NS, 'rect');
            r2.setAttribute('x', String(x));
            r2.setAttribute('y', String(baseY - intH));
            r2.setAttribute('width', String(barW));
            r2.setAttribute('height', String(intH));
            r2.setAttribute('class', 'calc-schedule__bar-interest');
            r2.dataset.idx = String(i);
            gRoot.appendChild(r2);
            const by = padT + innerH - (a.endBalance / principal) * innerH;
            balPts.push(`${cx},${by}`);
          });
  
          if (balPts.length) {
            const poly = document.createElementNS(NS, 'polyline');
            poly.setAttribute('points', balPts.join(' '));
            poly.setAttribute('class', 'calc-schedule__line-balance');
            gRoot.appendChild(poly);
            balPts.forEach((pt, i) => {
              const [cx, cy] = pt.split(',').map(Number);
              const c = document.createElementNS(NS, 'circle');
              c.setAttribute('cx', String(cx));
              c.setAttribute('cy', String(cy));
              c.setAttribute('r', '5');
              c.setAttribute('class', 'calc-schedule__dot-balance');
              c.dataset.idx = String(i);
              gRoot.appendChild(c);
            });
          }
  
          aggregates.forEach((a, i) => {
            const cx = padL + i * (barW + gap) + barW / 2;
            const lbl = document.createElementNS(NS, 'text');
            lbl.setAttribute('x', String(cx));
            lbl.setAttribute('y', String(H - 20));
            lbl.setAttribute('text-anchor', 'middle');
            lbl.setAttribute('class', 'calc-schedule__svg-xlabel');
            lbl.textContent = a.label.length > 10 ? a.label.replace('FY ', '') : a.label;
            gRoot.appendChild(lbl);
          });
  
          const yLblL = document.createElementNS(NS, 'text');
          yLblL.setAttribute('x', '12');
          yLblL.setAttribute('y', String(padT + innerH / 2));
          yLblL.setAttribute('class', 'calc-schedule__svg-ylabel');
          yLblL.setAttribute('transform', `rotate(-90 12 ${padT + innerH / 2})`);
          yLblL.textContent = 'Balance';
          gRoot.appendChild(yLblL);
  
          const yLblR = document.createElementNS(NS, 'text');
          yLblR.setAttribute('x', String(W - 8));
          yLblR.setAttribute('y', String(padT + innerH / 2));
          yLblR.setAttribute('text-anchor', 'end');
          yLblR.setAttribute('class', 'calc-schedule__svg-ylabel');
          yLblR.setAttribute('transform', `rotate(-90 ${W - 8} ${padT + innerH / 2})`);
          yLblR.textContent = 'Payment / year';
          gRoot.appendChild(yLblR);
  
          emiScheduleSvg.appendChild(gRoot);
  
          function showTip(idx, clientX, clientY) {
            const a = aggregates[+idx];
            if (!a || !emiScheduleTooltip) return;
            emiScheduleTooltip.hidden = false;
            emiScheduleTooltip.innerHTML = `<strong>${a.label}</strong><br>Balance: ${fmt(
              a.endBalance
            )}<br>Loan paid to date: ${a.paidPct.toFixed(2)}%`;
            const wrap = emiScheduleSection.querySelector('.calc-schedule__chart-area');
            if (!wrap) return;
            const r = wrap.getBoundingClientRect();
            emiScheduleTooltip.style.left = `${clientX - r.left}px`;
            emiScheduleTooltip.style.top = `${clientY - r.top}px`;
          }
  
          function hideTip() {
            if (emiScheduleTooltip) emiScheduleTooltip.hidden = true;
          }
  
          emiScheduleSvg.querySelectorAll('[data-idx]').forEach((el) => {
            el.addEventListener('mouseenter', (ev) => showTip(el.dataset.idx, ev.clientX, ev.clientY));
            el.addEventListener('mousemove', (ev) => showTip(el.dataset.idx, ev.clientX, ev.clientY));
            el.addEventListener('mouseleave', hideTip);
          });
        }
  
        function renderScheduleTable(aggregates) {
          emiScheduleTbody.replaceChildren();
          aggregates.forEach((a) => {
            const trY = document.createElement('tr');
            trY.className = 'calc-schedule__row-year';
            trY.dataset.key = a.key;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'calc-schedule__expand';
            btn.setAttribute('aria-expanded', 'false');
            const ico = document.createElement('span');
            ico.className = 'calc-schedule__expand-ico';
            ico.setAttribute('aria-hidden', 'true');
            ico.textContent = '+';
            btn.appendChild(ico);
            btn.appendChild(document.createTextNode(` ${a.label}`));
            const td0 = document.createElement('td');
            td0.appendChild(btn);
            trY.appendChild(td0);
            const td1 = document.createElement('td');
            td1.textContent = fmt(a.principal);
            trY.appendChild(td1);
            const td2 = document.createElement('td');
            td2.textContent = fmt(a.interest);
            trY.appendChild(td2);
            const td3 = document.createElement('td');
            td3.textContent = fmt(a.totalPay);
            trY.appendChild(td3);
            const td4 = document.createElement('td');
            td4.textContent = fmt(a.endBalance);
            trY.appendChild(td4);
            const td5 = document.createElement('td');
            td5.textContent = `${a.paidPct.toFixed(2)}%`;
            trY.appendChild(td5);
  
            const trD = document.createElement('tr');
            trD.className = 'calc-schedule__row-detail';
            trD.hidden = true;
            const tdInner = document.createElement('td');
            tdInner.colSpan = 6;
            tdInner.className = 'calc-schedule__detail-cell';
            const sub = document.createElement('table');
            sub.className = 'calc-schedule__subtable';
            sub.innerHTML =
              '<thead><tr><th>Month</th><th>Principal</th><th>Interest</th><th>EMI</th><th>Balance</th></tr></thead>';
            const subBody = document.createElement('tbody');
            a.months.forEach((m) => {
              const sr = document.createElement('tr');
              sr.innerHTML = `<td>${MON_SHORT[m.m - 1]} ${m.y} (#${m.monthIndex})</td><td>${fmt(
                m.principal
              )}</td><td>${fmt(m.interest)}</td><td>${fmt(m.payment)}</td><td>${fmt(m.balanceAfter)}</td>`;
              subBody.appendChild(sr);
            });
            sub.appendChild(subBody);
            tdInner.appendChild(sub);
            trD.appendChild(tdInner);
  
            emiScheduleTbody.appendChild(trY);
            emiScheduleTbody.appendChild(trD);
  
            btn.addEventListener('click', () => {
              const open = btn.getAttribute('aria-expanded') === 'true';
              btn.setAttribute('aria-expanded', open ? 'false' : 'true');
              ico.textContent = open ? '+' : '−';
              trD.hidden = open;
            });
          });
        }
  
        function csvEscape(s) {
          const t = String(s);
          if (/[",\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
          return t;
        }
  
        refreshEmiSchedule = function refreshEmiScheduleInner() {
          const P = +loanAmountInput.value;
          const n = +loanPeriodInput.value;
          const annualPct = +loanRateInput.value;
          const startYM = emiScheduleStart.value || toMonthInputValue(new Date());
          const view = emiScheduleView.value;
          const aggregates = aggregateByView(P, n, annualPct, startYM, view);
          renderScheduleChart(aggregates, P);
          renderScheduleTable(aggregates);
        };
  
        emiScheduleStart.addEventListener('change', () => refreshEmiSchedule());
        emiScheduleView.addEventListener('change', () => refreshEmiSchedule());
  
        if (emiSchedulePdf) {
          emiSchedulePdf.addEventListener('click', () => {
            const title = 'Hope Credit — EMI schedule';
            const tableClone = emiScheduleSection.querySelector('.calc-schedule__table');
            const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
              <style>
                body{font-family:system-ui,sans-serif;padding:24px;color:#111}
                h1{font-size:1.25rem}
                table{border-collapse:collapse;width:100%;margin-top:16px;font-size:12px}
                th,td{border:1px solid #ccc;padding:8px;text-align:right}
                th{text-align:center;background:#eee}
                .yl{text-align:left}
              </style></head><body><h1>${title}</h1>
              <p>Generated ${new Date().toLocaleString('en-IN')}</p>
              ${tableClone ? tableClone.outerHTML : ''}
              <script>window.onload=function(){window.print();window.close();}<\/script>
              </body></html>`;
            const w = window.open('', '_blank', 'noopener');
            if (w) {
              w.document.write(html);
              w.document.close();
            }
          });
        }
  
        if (emiScheduleExcel) {
          emiScheduleExcel.addEventListener('click', () => {
            const P = +loanAmountInput.value;
            const n = +loanPeriodInput.value;
            const annualPct = +loanRateInput.value;
            const startYM = emiScheduleStart.value || toMonthInputValue(new Date());
            const view = emiScheduleView.value;
            const rows = buildAmortizationRows(P, n, annualPct).rows;
            const lines = [
              ['Month #', 'Year', 'Month', 'Principal', 'Interest', 'EMI', 'Balance'].map(csvEscape).join(','),
            ];
            rows.forEach((row, i) => {
              const { y, m } = ymParts(startYM, i);
              lines.push(
                [
                  i + 1,
                  y,
                  MON_SHORT[m - 1],
                  Math.round(row.principal),
                  Math.round(row.interest),
                  Math.round(row.payment),
                  Math.round(row.balanceAfter),
                ]
                  .map(csvEscape)
                  .join(',')
              );
            });
            const bom = '\uFEFF';
            const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'hope-credit-emi-schedule.csv';
            a.click();
            URL.revokeObjectURL(a.href);
          });
        }
  
        if (emiScheduleShare) {
          emiScheduleShare.addEventListener('click', async () => {
            const u = new URL(window.location.href);
            u.searchParams.set('amt', String(Math.round(+loanAmountInput.value)));
            u.searchParams.set('mo', String(Math.round(+loanPeriodInput.value)));
            u.searchParams.set('rate', loanRateInput.value);
            if (emiScheduleStart && emiScheduleStart.value) u.searchParams.set('start', emiScheduleStart.value);
            if (emiScheduleView) u.searchParams.set('view', emiScheduleView.value);
            const shareUrl = u.toString();
            try {
              if (navigator.share) {
                await navigator.share({ title: 'EMI calculation', url: shareUrl });
              } else {
                await navigator.clipboard.writeText(shareUrl);
                const lbl = emiScheduleShare.querySelector('.calc-schedule__share-label');
                if (lbl) lbl.textContent = 'Link copied';
                setTimeout(() => {
                  if (lbl) lbl.textContent = 'Share';
                }, 2000);
              }
            } catch (err) {
              prompt('Copy this link:', shareUrl);
            }
          });
        }
      }
  
      function onRangeInput() {
        calcLoan();
      }
  
      [loanAmountInput, loanPeriodInput, loanRateInput].forEach((inp) => {
        inp.addEventListener('input', onRangeInput);
      });
  
      if (loanAmountNum) {
        const syncAmt = () => {
          applyNumberToRange(loanAmountNum, loanAmountInput);
          calcLoan();
        };
        const syncAmtCommit = () => {
          applyNumberToRange(loanAmountNum, loanAmountInput, { force: true });
          calcLoan();
        };
        loanAmountNum.addEventListener('input', syncAmt);
        loanAmountNum.addEventListener('change', syncAmtCommit);
        loanAmountNum.addEventListener('blur', syncAmtCommit);
      }
      if (loanPeriodNum) {
        const syncPer = () => {
          applyNumberToRange(loanPeriodNum, loanPeriodInput);
          calcLoan();
        };
        const syncPerCommit = () => {
          applyNumberToRange(loanPeriodNum, loanPeriodInput, { force: true });
          calcLoan();
        };
        loanPeriodNum.addEventListener('input', syncPer);
        loanPeriodNum.addEventListener('change', syncPerCommit);
        loanPeriodNum.addEventListener('blur', syncPerCommit);
      }
      if (loanRateNum) {
        const syncRate = () => {
          applyNumberToRange(loanRateNum, loanRateInput);
          calcLoan();
        };
        const syncRateCommit = () => {
          applyNumberToRange(loanRateNum, loanRateInput, { force: true });
          calcLoan();
        };
        loanRateNum.addEventListener('input', syncRate);
        loanRateNum.addEventListener('change', syncRateCommit);
        loanRateNum.addEventListener('blur', syncRateCommit);
      }
  
      $$('[data-calc-field]').forEach((field) => {
        field.querySelectorAll('input').forEach((inp) => {
          inp.addEventListener('focus', () => field.classList.add('calc-field--active'));
          inp.addEventListener('blur', () => field.classList.remove('calc-field--active'));
        });
      });
  
      calcLoan();
    }
  
    initLoanCalculator();
  
    /* ============================================================
       4. LOAN TYPE TABS
    ============================================================ */
    const loanData = {
      personal: {
        img:   'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80',
        title: 'Personal Loan',
        desc:  'Meet your personal financial needs with flexible repayment options—no collateral required. PAN India coverage, accelerated coordination, structured documentation support.',
      },
      business: {
        img:   'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=80',
        title: 'Business Loan',
        desc:  'Fuel your business with working capital, expansion, or equipment financing. PAN India coverage, accelerated coordination, structured documentation support.',
      },
      balance: {
        img:   'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80',
        title: 'Balance Transfer',
        desc:  'Consolidate high-interest debt and save by moving your existing loan balances to better rates. PAN India coverage, accelerated coordination, structured documentation support.',
      },
      home: {
        img:   'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80',
        title: 'Home Loan',
        desc:  'Make homeownership a reality with competitive mortgage rates and step-by-step guidance. PAN India coverage, accelerated coordination, structured documentation support.',
      },
      lap: {
        img:   'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80',
        title: 'LAP Loan',
        desc:  'Loan against property for business, education, or major goals—competitive rates and flexible tenure. PAN India coverage, accelerated coordination, structured documentation support.',
      },
      car: {
        img:   'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600&q=80',
        title: 'Car Loan',
        desc:  'Drive your dream car home with flexible terms and competitive rates. PAN India coverage, accelerated coordination, structured documentation support.',
      },
      /* Credit Card (hidden until product is live)
      credit: {
        img:   'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80',
        title: 'Credit Card',
        desc:  'Get a credit card tailored to your lifestyle. Enjoy rewards, cashback, and flexible payment options.',
      },
      */
    };
  
    const loanPanelImg   = $('#loanPanelImg');
    const loanPanelTitle = $('#loanPanelTitle');
    const loanPanelDesc  = $('#loanPanelDesc');
    const loanPanelCta   = $('.loan-panel-cta');
    const loanCategoryGrid = $('#loanCategoryGrid');
    const loanCategoryCards = loanCategoryGrid ? $$('.loan-category-card[data-tab]', loanCategoryGrid) : [];
    const loanContinueCta = $('#loanContinueCta');
    const loanContinueHint = $('#loanContinueHint');
    const loanTypesPreview = $('.loan-types-preview');
  
    function updateLoanPanel(key) {
      const data = loanData[key];
      if (!data || !loanPanelImg) return;
      loanPanelTitle.textContent = data.title;
      loanPanelDesc.textContent  = data.desc;
      loanPanelImg.alt           = data.title;
      loanPanelImg.style.opacity = '0';
      loanPanelImg.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        loanPanelImg.src = data.img;
        loanPanelImg.style.opacity = '1';
      }, 150);
    }
  
    const loanCategoryState = { selectedKey: 'personal' };
  
    function contactHrefForLoan(key) {
      return `/contact/?loan=${encodeURIComponent(key)}`;
    }
  
    function setLoanCategory(key) {
      if (!loanData[key]) return;
      loanCategoryState.selectedKey = key;
      loanCategoryCards.forEach((btn) => {
        const active = btn.dataset.tab === key;
        btn.classList.toggle('loan-category-card--active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      updateLoanPanel(key);
      const href = contactHrefForLoan(key);
      if (loanContinueCta) loanContinueCta.setAttribute('href', href);
      if (loanPanelCta) loanPanelCta.setAttribute('href', href);
      if (loanContinueHint) {
        loanContinueHint.innerHTML = `Ready to proceed with <strong>${loanData[key].title}</strong>`;
      }
      if (loanTypesPreview) {
        loanTypesPreview.classList.add('is-switching');
        clearTimeout(loanTypesPreview._switchT);
        loanTypesPreview._switchT = setTimeout(() => {
          loanTypesPreview.classList.remove('is-switching');
        }, 420);
      }
    }
  
    if (loanCategoryGrid && loanCategoryCards.length) {
      loanCategoryCards.forEach((btn, _i, arr) => {
        btn.addEventListener('click', () => setLoanCategory(btn.dataset.tab));
        btn.addEventListener('keydown', (e) => {
          const keys = arr.map((b) => b.dataset.tab);
          const ix = keys.indexOf(btn.dataset.tab);
          let next = -1;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            next = (ix + 1) % arr.length;
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            next = (ix - 1 + arr.length) % arr.length;
          } else if (e.key === 'Home') {
            e.preventDefault();
            next = 0;
          } else if (e.key === 'End') {
            e.preventDefault();
            next = arr.length - 1;
          }
          if (next >= 0) {
            arr[next].focus();
            setLoanCategory(keys[next]);
          }
        });
      });
      const initial = loanCategoryCards.find((b) => b.classList.contains('loan-category-card--active')) || loanCategoryCards[0];
      if (initial) setLoanCategory(initial.dataset.tab);
    }
  
    const loanItems = $$('#loanTypeList .loan-list-item');
    loanItems.forEach((item) => {
      item.addEventListener('click', () => {
        loanItems.forEach((i) => i.classList.remove('active'));
        item.classList.add('active');
        const key = item.dataset.tab;
        if (key) updateLoanPanel(key);
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      });
    });
    const initialActive = document.querySelector('#loanTypeList .loan-list-item.active');
    if (initialActive && initialActive.dataset.tab) updateLoanPanel(initialActive.dataset.tab);
  
    /* ============================================================
       4b. PROCESS STEPPER — scroll reveal + active state + line progress
    ============================================================ */
    function initProcessStepper() {
      const root = $('#processStepper');
      if (!root) return;
      const steps = $$('.process-stepper__step', root);
      const n = steps.length;
      if (!n) return;
  
      const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  
      function setProgress(activeIndex) {
        const p = n <= 1 ? 1 : activeIndex / (n - 1);
        root.style.setProperty('--progress', String(Math.min(1, Math.max(0, p))));
      }
  
      function setActiveFromScroll() {
        const midY = window.innerHeight * 0.42;
        let best = null;
        let bestScore = -1;
        steps.forEach((step) => {
          if (!step.classList.contains('is-revealed')) return;
          const r = step.getBoundingClientRect();
          if (r.bottom < 40 || r.top > window.innerHeight - 40) return;
          const cy = r.top + Math.min(r.height * 0.35, 48);
          const score = 1 / (1 + Math.abs(cy - midY));
          if (score > bestScore) {
            bestScore = score;
            best = step;
          }
        });
        if (!best) {
          const firstRev = steps.find((s) => s.classList.contains('is-revealed'));
          if (firstRev) best = firstRev;
          else best = steps[0];
        }
        const idx = Math.max(0, steps.indexOf(best));
        steps.forEach((s) => {
          const on = s === best;
          s.classList.toggle('is-active', on);
          if (on) s.setAttribute('aria-current', 'step');
          else s.removeAttribute('aria-current');
        });
        setProgress(idx);
      }
  
      if (mqReduce.matches) {
        steps.forEach((s, i) => {
          s.classList.add('is-revealed');
          s.classList.toggle('is-active', i === 0);
        });
        steps[0]?.setAttribute('aria-current', 'step');
        setProgress(n - 1);
        return;
      }
  
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add('is-revealed');
              revealObserver.unobserve(en.target);
              requestAnimationFrame(setActiveFromScroll);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
      );
      steps.forEach((s) => revealObserver.observe(s));
  
      let ticking = false;
      window.addEventListener(
        'scroll',
        () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            setActiveFromScroll();
            ticking = false;
          });
        },
        { passive: true }
      );
  
      requestAnimationFrame(setActiveFromScroll);
    }
  
    initProcessStepper();
  
    /* ============================================================
       5. ACCORDION (FAQ) — one open per group, ARIA, keyboard
    ============================================================ */
    function initAccordions() {
      const accordions = $$('.accordion');
  
      accordions.forEach((accordion, accIdx) => {
        const items = $$('.accordion-item', accordion);
        if (!items.length) return;
  
        const baseId =
          accordion.id && accordion.id !== 'accordion'
            ? accordion.id
            : `accordion-${accIdx}`;
        if (!accordion.id || accordion.id === 'accordion') {
          accordion.id = baseId;
        }
  
        const headers = items
          .map((item) => item.querySelector('.accordion-header'))
          .filter(Boolean);
  
        items.forEach((item, i) => {
          const header = headers[i];
          const panel = item.querySelector('.accordion-body');
          if (!header || !panel) return;
  
          let inner = panel.querySelector('.accordion-body__inner');
          if (!inner) {
            inner = document.createElement('div');
            inner.className = 'accordion-body__inner';
            while (panel.firstChild) {
              inner.appendChild(panel.firstChild);
            }
            panel.appendChild(inner);
          }
  
          const btnId = `${baseId}-header-${i}`;
          const panelId = `${baseId}-panel-${i}`;
          header.id = btnId;
          panel.id = panelId;
          header.setAttribute('type', 'button');
          header.setAttribute('aria-controls', panelId);
          panel.setAttribute('role', 'region');
          panel.setAttribute('aria-labelledby', btnId);
        });
  
        function syncAria() {
          items.forEach((item) => {
            const header = item.querySelector('.accordion-header');
            const panel = item.querySelector('.accordion-body');
            const open = item.classList.contains('active');
            header?.setAttribute('aria-expanded', open ? 'true' : 'false');
            panel?.setAttribute('aria-hidden', open ? 'false' : 'true');
          });
        }
  
        syncAria();
  
        headers.forEach((header, i) => {
          header.addEventListener('click', () => {
            const item = items[i];
            const wasOpen = item.classList.contains('active');
            items.forEach((it) => it.classList.remove('active'));
            if (!wasOpen) item.classList.add('active');
            syncAria();
          });
        });
  
        accordion.addEventListener('keydown', (e) => {
          const idx = headers.indexOf(document.activeElement);
          if (idx < 0) return;
          let next = idx;
          switch (e.key) {
            case 'ArrowDown':
              e.preventDefault();
              next = (idx + 1) % headers.length;
              headers[next]?.focus();
              break;
            case 'ArrowUp':
              e.preventDefault();
              next = (idx - 1 + headers.length) % headers.length;
              headers[next]?.focus();
              break;
            case 'Home':
              e.preventDefault();
              headers[0]?.focus();
              break;
            case 'End':
              e.preventDefault();
              headers[headers.length - 1]?.focus();
              break;
            default:
              break;
          }
        });
      });
    }
  
    initAccordions();
  
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
    const animEls = $$('.team-card, .blog-card, .quick-feature, .feature-item, .founder-story-chapter');
  
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  
      animEls.forEach((el, i) => {
        const delay = Math.min(i * 0.06, 0.35);
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`;
        observer.observe(el);
      });
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
  
    /* ============================================================
       10. CONTACT FORM — POST /api/contact (AJAX)
    ============================================================ */
    const contactForm = $('#contactForm');
    const formMessage = $('#formMessage');
  
    if (contactForm && formMessage) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        formMessage.textContent = '';
        formMessage.classList.remove('contact-form-message--success', 'contact-form-message--error');
  
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.setAttribute('aria-busy', 'true');
        }
  
        try {
          const fd = new FormData(contactForm);
          const payload = {
            name: (fd.get('name') || '').toString().trim(),
            email: (fd.get('email') || '').toString().trim(),
            phone: (fd.get('phone') || '').toString().trim(),
            subject: (fd.get('subject') || '').toString().trim(),
            message: (fd.get('message') || '').toString().trim(),
          };

          const response = await fetch(contactForm.action, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
  
          let result = {};
          const ct = response.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            try {
              result = await response.json();
            } catch (parseErr) {
              result = {};
            }
          } else {
            const text = (await response.text()).trim();
            result = { message: text || (response.ok ? 'Thank you.' : '') };
          }
  
          const msg =
            (result && typeof result.message === 'string' && result.message.trim()) ||
            (response.ok
              ? 'Thank you. Your message has been sent.'
              : 'Something went wrong. Please try again.');
  
          formMessage.textContent = msg;
          formMessage.classList.toggle('contact-form-message--success', response.ok);
          formMessage.classList.toggle('contact-form-message--error', !response.ok);
  
          if (response.ok) {
            contactForm.reset();
          }
        } catch (err) {
          formMessage.textContent =
            'Network error. Please check your connection and try again.';
          formMessage.classList.add('contact-form-message--error');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.removeAttribute('aria-busy');
          }
        }
      });
    }
  
  })();
  