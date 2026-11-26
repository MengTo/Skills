export function startLedger() {
  const platform = document.getElementById("platform");
  if (!platform) return;
  const within = (selector) => platform.querySelector(selector);
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const periods = ["All", "1H", "1D", "1W", "1Y"];
  // Opening balance plus client receipts minus production costs equals available funds.
  const quarters = {
    Q3: {
      opening: 54500,
      received: 142880,
      spent: 112619.48,
      range: "Jul 1 – Sep 30",
      envelopes: [42180.2, 28420, 14160.32],
    },
    Q2: {
      opening: 46280,
      received: 117600,
      spent: 109380,
      range: "Apr 1 – Jun 30",
      envelopes: [26100, 18100, 10300],
    },
    Q1: {
      opening: 38600,
      received: 98400,
      spent: 90720,
      range: "Jan 1 – Mar 31",
      envelopes: [24200, 14200, 7880],
    },
  };
  const closing = (q) => Number((q.opening + q.received - q.spent).toFixed(2));
  const dollars = (value, digits = 2) =>
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  const invoices = {
    Q3: { id: "TW-824", supplier: "Ternwick", job: "BF-034", amount: 3420 },
    Q2: { id: "VE-208", supplier: "Veysett", job: "OR-027", amount: 1880 },
    Q1: { id: "KE-017", supplier: "Kelmora", job: "SA-014", amount: 2460 },
  };
  const invoiceStages = { Q1: 0, Q2: 0, Q3: 0 };
  const statusNames = ["Received", "Approved", "Paid"];
  let period = "Q3",
    interval = 0,
    view = "balance";
  function setBalance(value) {
    within(".ap-balance-value").textContent = dollars(Math.floor(value), 0);
    within(".ap-amount em").textContent = value.toFixed(2).slice(-3);
  }
  let plotted = [];
  const scrubber = within(".receipt-scrubber");
  function inspectReceipt(value) {
    const i = Math.max(0, Math.min(plotted.length - 1, Math.round(value)));
    if (!plotted.length) return;
    scrubber.value = String(i);
    const x = i / (plotted.length - 1),
      y = plotted[i];
    const formatted = dollars(4800 - (y / 110) * 3200);
    within(".sample-guide").setAttribute(
      "d",
      "M" + (500 * x).toFixed(2) + " 110V" + y.toFixed(2),
    );
    const dot = within(".sample-dot");
    dot.style.left = x * 100 + "%";
    dot.style.top = (y / 110) * 100 + "%";
    within(".ap-chart-amount").textContent = formatted;
    scrubber.setAttribute(
      "aria-valuetext",
      formatted + " in receipts, sample " + (i + 1) + " of " + plotted.length,
    );
  }
  scrubber.addEventListener("input", () =>
    inspectReceipt(Number(scrubber.value)),
  );
  scrubber.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || event.buttons) return;
    const box = scrubber.getBoundingClientRect();
    inspectReceipt(
      ((event.clientX - box.left) / box.width) * (plotted.length - 1),
    );
  });
  function drawChart() {
    const seed = interval + (3 - Number(period.slice(1))) * 3;
    const anchors = [
      58, 77, 38, 81, 46, 71, 64, 91, 76, 88, 73, 69, 79, 63, 48, 54, 50, 61,
      47, 75, 82, 74, 81, 87, 72, 66, 82, 62, 67, 57, 72, 63, 75, 56, 68,
    ];
    const prices = [],
      bars = [];
    plotted = [];
    let state = 1619 + seed * 169;
    const noise = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
    for (let n = 0; n < 175; n++) {
      const p = n / 174,
        ix = Math.min(anchors.length - 2, Math.floor(p * (anchors.length - 1)));
      const q = p * (anchors.length - 1) - ix,
        h =
          anchors[(ix + seed) % anchors.length] * (1 - q) +
          anchors[(ix + seed + 1) % anchors.length] * q;
      const y = 110 - h * 0.66 + (noise() - 0.5) * 5;
      plotted.push(y);
      prices.push((n ? "L" : "M") + (p * 500).toFixed(2) + " " + y.toFixed(2));
      const barHeight = Math.max(
        4,
        h * (0.56 + noise() * 0.65) * (0.82 + 0.16 * Math.sin(p * 18)),
      );
      bars.push(
        "M" +
          (p * 500).toFixed(2) +
          " 110v-" +
          barHeight.toFixed(2) +
          "h2.3V110z",
      );
    }
    within(".ap-bars").setAttribute("d", bars.join(""));
    within(".ap-trend").setAttribute("d", prices.join(""));
    const month = ["Jan", "Apr", "Jul"][Number(period.slice(1)) - 1];
    const labels = [
      ["Week 1", "", "Wk 4", "", "Wk 7", "", "Wk 10", "", "Wk 13"],
      ["09:00", "", "09:15", "", "09:30", "", "09:45", "", "10:00"],
      ["09:00", "", "11:00", "", "13:00", "", "15:00", "", "17:00"],
      ["Mon", "", "Tue", "", "Wed", "", "Thu", "", "Fri"],
      ["Jan", "", "Apr", "", "Jul", "", "Oct", "", "Dec"],
    ][interval];
    within(".receipt-label").textContent =
      interval === 0
        ? "Receipts · " + month + " quarter"
        : "Receipts · " + periods[interval];
    Array.from(within(".ap-ticks").children).forEach(
      (tick, i) => (tick.textContent = labels[i]),
    );
    inspectReceipt(Number(scrubber.value));
  }
  function pressed(group, index) {
    Array.from(group.querySelectorAll("button")).forEach((button, i) => {
      button.setAttribute("aria-pressed", String(i === index));
    });
  }
  function wireGroup(selector, select) {
    const group = within(selector);
    const buttons = Array.from(group.querySelectorAll("button"));
    group.addEventListener("click", (event) => {
      const index = buttons.indexOf(event.target.closest("button"));
      if (index >= 0) select(index);
    });
    return (index) => pressed(group, index);
  }
  function repaint(element, kind = "readout-change") {
    if (motion.matches || element.closest("[hidden]")) return;
    const frames =
      kind === "chart"
        ? [{ clipPath: "inset(0 98% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }]
        : [
            { opacity: 0.28, transform: "translateY(5px)" },
            { opacity: 1, transform: "translateY(0)" },
          ];
    element.animate(frames, {
      duration: kind === "chart" ? 720 : 360,
      easing: "cubic-bezier(.2,.7,.25,1)",
    });
  }
  function renderQuarter() {
    const quarter = quarters[period],
      invoice = invoices[period],
      stage = invoiceStages[period];
    const payment = stage === 2 ? invoice.amount : 0;
    const available = closing(quarter) - payment;
    setBalance(available);
    const totals = {
      received: quarter.received,
      spent: quarter.spent + payment,
      opening: quarter.opening,
    };
    for (const [field, value] of Object.entries(totals))
      within("[data-ap-stat=" + field + "]").textContent = dollars(value);
    within("[data-range]").textContent = quarter.range;
    platform.querySelectorAll("[data-envelope]").forEach((output, index) => {
      const amount = quarter.envelopes[index] - (index === 1 ? payment : 0);
      output.textContent = dollars(amount);
      output
        .closest("[style]")
        .style.setProperty("--h", (100 * amount) / available + "%");
    });
    within(".invoice-state").textContent = statusNames[stage];
    within(".invoice-amount").textContent = dollars(invoice.amount);
    for (const node of platform.querySelectorAll("[data-invoice]"))
      node.textContent = invoice[node.dataset.invoice];
    within(".invoice-action").textContent = [
      "Approve invoice",
      "Post payment",
      "Reset example",
    ][stage];
    within(".invoice-pane").dataset.stage = stage;
    Array.from(within(".invoice-steps").children).forEach((item, index) => {
      item.classList.toggle("complete", index <= stage);
      if (index === stage) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
    drawChart();
  }
  const quarterButtons = wireGroup(".ap-years", (index) => {
    period = ["Q3", "Q2", "Q1"][index];
    quarterButtons(index);
    renderQuarter();
    repaint(within("#view-" + view));
  });
  const intervalButtons = wireGroup(".ap-windows", (index) => {
    interval = index;
    intervalButtons(index);
    drawChart();
    repaint(within(".ap-plot"), "chart");
  });
  const viewKeys = ["balance", "receipts", "invoice"];
  function showView(index) {
    view = viewKeys[index];
    viewButtons(index);
    for (const key of viewKeys) within("#view-" + key).hidden = key !== view;
    repaint(within("#view-" + view));
    if (view === "receipts") repaint(within(".ap-plot"), "chart");
  }
  const viewButtons = wireGroup(".ledger-views", showView);
  function advanceInvoice() {
    invoiceStages[period] = (invoiceStages[period] + 1) % 3;
    renderQuarter();
    repaint(within(".invoice-state"));
  }
  within(".invoice-action").addEventListener("click", advanceInvoice);

  // Fixed example rates keep the demo reproducible when the HTML is opened offline.
  const currencies = [
    ["USD", 1],
    ["EUR", 0.92],
    ["GBP", 0.79],
    ["JPY", 151.2],
    ["CAD", 1.37],
  ];
  let currency = 0,
    budget = 0;
  function showCurrency(index) {
    currency = index;
    currencyButtons(index);
    const [code, rate] = currencies[index];
    within(".converted-code").textContent = code;
    within(".converted-value").textContent = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).format(1250 * rate);
    repaint(within(".converted"));
  }
  const currencyButtons = wireGroup(".ap-currency", showCurrency);
  const budgets = [
    [18640, 12480, 7, 16, "Brindlefold"],
    [32400, 23600, 11, 24, "Ternwick"],
    [7850, 5320, 4, 9, "Orriven"],
  ];
  const starred = new Set();
  function showBudget(index) {
    budget = index;
    budgetButtons(index);
    const [total, committed, suppliers, orders, studio] = budgets[index];
    within(".budget-amount").textContent = dollars(total);
    const fields = [
      dollars(committed),
      dollars(total - committed),
      suppliers,
      orders,
      studio,
    ];
    platform
      .querySelectorAll("[data-budget]")
      .forEach((el) => (el.textContent = fields[Number(el.dataset.budget)]));
    within(".budget-meter i").style.width = (committed / total) * 100 + "%";
    within(".ap-star").setAttribute("aria-pressed", String(starred.has(index)));
    within(".ap-star").textContent = starred.has(index) ? "★" : "☆";
    repaint(within(".ap-market-info"));
  }
  const budgetButtons = wireGroup(".ap-order", showBudget);
  within(".ap-star").addEventListener("click", () => {
    if (starred.has(budget)) starred.delete(budget);
    else starred.add(budget);
    showBudget(budget);
  });

  function playback(selector, advance, delay) {
    const surface = within(selector),
      toggle = surface.querySelector(".demo-play");
    let enabled = !motion.matches,
      inView = false,
      hovering = false,
      explicitPlay = false,
      timer;
    function schedule() {
      clearTimeout(timer);
      const focused = surface.contains(document.activeElement);
      const running =
        enabled &&
        inView &&
        !document.hidden &&
        !platform.closest(".playing") &&
        (explicitPlay || (!hovering && !focused));
      surface.classList.toggle("demo-running", running);
      toggle.setAttribute(
        "aria-label",
        (enabled ? "Pause " : "Play ") + toggle.dataset.demoName + " demo",
      );
      toggle.title = toggle.getAttribute("aria-label");
      toggle.dataset.enabled = String(enabled);
      if (running)
        timer = setTimeout(() => {
          advance();
          schedule();
        }, delay);
    }
    surface.addEventListener("click", (event) => {
      if (!event.target.closest("button,input")) return;
      if (toggle.contains(event.target)) {
        enabled = !enabled;
        explicitPlay = enabled;
      } else {
        enabled = false;
        explicitPlay = false;
      }
      schedule();
    });
    surface.addEventListener("input", () => {
      enabled = false;
      explicitPlay = false;
      schedule();
    });
    surface.addEventListener("pointerenter", (e) => {
      hovering = e.pointerType === "mouse";
      schedule();
    });
    surface.addEventListener("pointerleave", () => {
      hovering = false;
      explicitPlay = false;
      schedule();
    });
    surface.addEventListener("focusin", (e) => {
      if (e.target !== toggle) explicitPlay = false;
      schedule();
    });
    surface.addEventListener("focusout", () => queueMicrotask(schedule));
    new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio >= 0.35;
        schedule();
      },
      { root: document.querySelector(".page"), threshold: [0, 0.35] },
    ).observe(surface);
    const wall = platform.closest(".gallery-wall");
    if (wall) new MutationObserver(schedule).observe(wall, {
      attributes: true,
      attributeFilter: ["class"],
    });
    document.addEventListener("visibilitychange", schedule);
    motion.addEventListener("change", () => {
      enabled = !motion.matches;
      explicitPlay = false;
      schedule();
    });
    schedule();
  }
  renderQuarter();
  showBudget(0);
  playback(
    ".ap-dash",
    () => {
      if (view === "invoice") {
        if (invoiceStages[period] < 2) {
          advanceInvoice();
          return;
        }
        advanceInvoice();
      }
      showView((viewKeys.indexOf(view) + 1) % viewKeys.length);
    },
    4700,
  );
  playback(
    ".currency-window",
    () => showCurrency((currency + 1) % currencies.length),
    3600,
  );
  playback(".ap-market", () => showBudget((budget + 1) % budgets.length), 4200);

  document
    .querySelector(".page")
    .addEventListener("tourbegin", () => showView(0));
  const observe = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("ap-seen");
        observe.unobserve(entry.target);
      }
    },
    { threshold: 0.035 },
  );
  platform.classList.add("ap-ready");
  platform.querySelectorAll(".ap-reveal").forEach((el) => observe.observe(el));
}
