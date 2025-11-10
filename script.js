/* script.js — Updated & robust for Prayag Agro Store */

/* ========== Utilities ========== */
const qs = (sel, ctx = document) => (ctx || document).querySelector(sel);
const qsa = (sel, ctx = document) =>
  Array.from((ctx || document).querySelectorAll(sel));

/* ========== NAVBAR: toggle, scroll, wiring ==========
   - toggleMenu(): robust show/hide for mobile menu
   - scrollToId(id): smooth scroll and close mobile menu
   - wireNavButtons(): attaches handlers to nav + mobile menu buttons
*/
function toggleMenu() {
  const menu = qs("#mobileMenu");
  const btn = qs(".menu-toggle");
  if (!menu || !btn) return;

  const open = menu.getAttribute("data-open") === "true";
  if (open) {
    menu.style.display = "none";
    menu.setAttribute("aria-hidden", "true");
    menu.setAttribute("data-open", "false");
    btn.setAttribute("aria-expanded", "false");
  } else {
    menu.style.display = "block";
    menu.setAttribute("aria-hidden", "false");
    menu.setAttribute("data-open", "true");
    btn.setAttribute("aria-expanded", "true");

    // close if clicked outside
    setTimeout(() => {
      const outsideClickHandler = (ev) => {
        if (!menu.contains(ev.target) && !btn.contains(ev.target)) {
          menu.style.display = "none";
          menu.setAttribute("aria-hidden", "true");
          menu.setAttribute("data-open", "false");
          btn.setAttribute("aria-expanded", "false");
          document.removeEventListener("click", outsideClickHandler);
        }
      };
      document.addEventListener("click", outsideClickHandler);
    }, 50);
  }
}

function scrollToId(id) {
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;

  // close mobile menu if open
  const menu = qs("#mobileMenu");
  if (menu) {
    menu.style.display = "none";
    menu.setAttribute("aria-hidden", "true");
    menu.setAttribute("data-open", "false");
  }
  qs(".menu-toggle")?.setAttribute("aria-expanded", "false");

  // smooth scroll and focus for accessibility
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  } catch (e) {
    /* ignore */
  }
}

function _extractTargetFrom(el) {
  if (!el) return null;
  if (el.dataset && el.dataset.target) return el.dataset.target;
  // onclick attr like scrollToId('products')
  const onclick = el.getAttribute && el.getAttribute("onclick");
  if (onclick) {
    const m = onclick.match(/scrollToId\(['"]([^'"]+)['"]\)/);
    if (m) return m[1];
  }
  const href = el.getAttribute && el.getAttribute("href");
  if (href && href.startsWith("#")) return href.slice(1);
  return null;
}

function wireNavButtons() {
  // wire menu-toggle
  const menuToggle = qs(".menu-toggle");
  if (menuToggle && !menuToggle.__wired) {
    menuToggle.addEventListener("click", (e) => {
      e.preventDefault();
      toggleMenu();
    });
    menuToggle.__wired = true;
  }

  // desktop nav buttons and mobile menu buttons
  const navButtons = Array.from(
    document.querySelectorAll(".nav .btn, #mobileMenu button")
  );
  navButtons.forEach((btn) => {
    if (btn.__navWired) return;
    btn.__navWired = true;
    btn.addEventListener(
      "click",
      (ev) => {
        // if button has explicit behavior (no target) do nothing
        const target = _extractTargetFrom(btn);
        if (target) {
          ev.preventDefault();
          scrollToId(target);
        } else {
          // let other handlers run (e.g., openEnquiry) — do not intercept
        }
      },
      { passive: false }
    );
  });

  // also wire anchor links inside navs
  const anchors = document.querySelectorAll(
    ".nav a[href^='#'], #mobileMenu a[href^='#']"
  );
  anchors.forEach((a) => {
    if (a.__navWired) return;
    a.__navWired = true;
    a.addEventListener(
      "click",
      (ev) => {
        const id = (a.getAttribute("href") || "").replace(/^#/, "");
        if (id) {
          ev.preventDefault();
          scrollToId(id);
        }
      },
      { passive: false }
    );
  });
}

/* ========== Product filtering ========== */
function initFilters() {
  const buttons = qsa(".filter-btn");
  if (!buttons.length) return;
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.cat || "all";
      qsa("#productGrid .card").forEach((card) => {
        if (cat === "all" || card.dataset.cat === cat) {
          card.style.display = "";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}

/* ========== Enquiry cart ========== */
let enquiry = [];
function addToEnquiry(id, title, btnRef = null) {
  if (!id || !title) return;
  if (!enquiry.some((i) => i.id === id)) enquiry.push({ id, title });
  updateEnquiryBadge();

  // button feedback (if passed)
  try {
    const btn = btnRef instanceof HTMLElement ? btnRef : null;
    if (btn) {
      const prev = btn.textContent;
      btn.textContent = "Added";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = prev;
        btn.disabled = false;
      }, 900);
    }
  } catch (e) {
    // ignore
  }
}
function updateEnquiryBadge() {
  const el = qs("#enqCount");
  if (el) el.textContent = String(enquiry.length);
}
function openEnquiry() {
  if (enquiry.length === 0) {
    alert(
      "Your enquiry list is empty. Click 'Enquire' on product cards to add items."
    );
    return;
  }
  const items = enquiry.map((it) => `• ${it.title}`).join("\n");
  const name = prompt(
    `Enquiry details:\n${items}\n\nEnter your name to submit:`
  );
  if (name && name.trim()) {
    alert(
      `Thank you, ${name.trim()}! We received your enquiry and will contact you soon.`
    );
    enquiry = [];
    updateEnquiryBadge();
  }
}

/* ========== Product modal ========== */
const modalBackdrop = qs("#modalBackdrop");
const modalTitle = qs("#modalTitle");
const modalImage = qs("#modalImage");
const modalDesc = qs("#modalDesc");
const modalPrice = qs("#modalPrice");

function openProduct(e, id) {
  if (e && typeof e.stopPropagation === "function") e.stopPropagation();
  const products = {
    1: {
      id: 1,
      title: "Pesticide A — 500 ml",
      desc: "Effective on leaf pests. Use as directed.",
      price: "₹120",
      img: "https://picsum.photos/seed/pest1/900/600",
    },
    2: {
      id: 2,
      title: "Insecticide B — 250 ml",
      desc: "Fast knockdown formula. Follow label.",
      price: "₹95",
      img: "https://picsum.photos/seed/insec1/900/600",
    },
    3: {
      id: 3,
      title: "Plant Vitamin C — 100 gm",
      desc: "Promotes root & foliage health. Use diluted.",
      price: "₹180",
      img: "https://picsum.photos/seed/vit1/900/600",
    },
    4: {
      id: 4,
      title: "Manual Spray Machine — 16L",
      desc: "Durable pump and adjustable nozzle.",
      price: "₹2,200",
      img: "https://picsum.photos/seed/spray1/900/600",
    },
  };
  const p = products[id] || {
    id,
    title: "Product",
    desc: "Description not available.",
    price: "—",
    img: "https://picsum.photos/900/600",
  };
  if (modalTitle) modalTitle.textContent = p.title;
  if (modalDesc) modalDesc.textContent = p.desc;
  if (modalPrice) modalPrice.textContent = p.price;
  if (modalImage) {
    modalImage.src = p.img;
    modalImage.alt = p.title;
  }
  showModal();
}
function showModal() {
  if (!modalBackdrop) return;
  modalBackdrop.style.display = "flex";
  modalBackdrop.setAttribute("aria-hidden", "false");
  qs(".modal")?.focus?.();
}
function closeModal() {
  if (!modalBackdrop) return;
  modalBackdrop.style.display = "none";
  modalBackdrop.setAttribute("aria-hidden", "true");
}
if (modalBackdrop) {
  modalBackdrop.addEventListener("click", (ev) => {
    if (ev.target === modalBackdrop) closeModal();
  });
}

/* ========== Inquiry + Share Helpers ========= */
const STORE_WHATSAPP_PHONE = "918144632145"; // change if needed (country code + number)
const STORE_EMAIL = "prayagagrostore@gmai.com"; // change if needed

function submitInquiry(e) {
  e.preventDefault();
  const name = (qs("#inqName")?.value || "").trim();
  const phone = (qs("#inqPhone")?.value || "").trim();
  const email = (qs("#inqEmail")?.value || "").trim();
  const msg = (qs("#inqMsg")?.value || "").trim();
  const status = qs("#inqStatus");

  if (!name || !phone) {
    if (status) {
      status.textContent = "Please enter your name and phone number.";
      status.style.color = "crimson";
    }
    return;
  }
  if (status) {
    status.textContent = "Preparing options...";
    status.style.color = "gray";
  }

  const messageLines = [
    `Enquiry from Prayag Agro Store website:`,
    `Name: ${name}`,
    `Phone: ${phone}`,
    email ? `Email: ${email}` : null,
    msg ? `Message: ${msg}` : null,
  ].filter(Boolean);
  const message = messageLines.join("\n");

  showShareOptions({ message });
  if (status) {
    status.textContent = "Choose WhatsApp or Gmail to send your enquiry.";
    status.style.color = "green";
  }
}

function showShareOptions({ message }) {
  const backdrop = qs("#shareBackdrop");
  const preview = qs("#sharePreview");
  const whatsappBtn = qs("#whatsappBtn");
  const gmailBtn = qs("#gmailBtn");
  if (!backdrop || !preview || !whatsappBtn || !gmailBtn) return;

  preview.textContent = message;

  whatsappBtn.onclick = () => {
    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${STORE_WHATSAPP_PHONE}?text=${encoded}`;
    window.open(waUrl, "_blank");
    postShareCleanup();
  };

  gmailBtn.onclick = () => {
    const subject = `Enquiry — Prayag Agro Store`;
    const body = message;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(
      STORE_EMAIL
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank");
    const mailto = `mailto:${encodeURIComponent(
      STORE_EMAIL
    )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setTimeout(() => {
      window.location.href = mailto;
    }, 200);
    postShareCleanup();
  };

  backdrop.style.display = "flex";
  backdrop.setAttribute("aria-hidden", "false");
}
function hideShareOptions() {
  const backdrop = qs("#shareBackdrop");
  if (!backdrop) return;
  backdrop.style.display = "none";
  backdrop.setAttribute("aria-hidden", "true");
}
function postShareCleanup() {
  hideShareOptions();
  const status = qs("#inqStatus");
  if (status) {
    status.textContent = "Inquiry sent (or opened in your email/WhatsApp).";
    status.style.color = "green";
  }
  const form = qs("#inquiryForm");
  if (form) form.reset();
  setTimeout(() => {
    const preview = qs("#sharePreview");
    if (preview) preview.textContent = "";
    if (qs("#inqStatus")) qs("#inqStatus").textContent = "";
  }, 3500);
}
function confirmAndClose() {
  hideShareOptions();
}

/* ========== Hero slider (6 images) ==========
   - autoplay with pause on hover/focus
   - dots, prev/next, touch swipe, keyboard nav
*/
function initHeroSlider() {
  const slider = document.getElementById("heroSlider");
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll(".slide"));
  const prevBtn = slider.querySelector(".slider-btn.prev");
  const nextBtn = slider.querySelector(".slider-btn.next");
  const dotsWrap = slider.querySelector(".slider-dots");

  let current = slides.findIndex((s) => s.classList.contains("active"));
  if (current < 0) current = 0;
  const total = slides.length || 1;
  const delay = 4200;
  let autoplay = true;
  let timer = null;

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Go to slide ${i + 1}`);
      b.dataset.index = i;
      b.addEventListener("click", () => {
        go(i);
        resetAutoplay();
      });
      if (i === current) b.classList.add("active");
      dotsWrap.appendChild(b);
    }
  }

  function show(i) {
    slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
    if (dotsWrap) {
      Array.from(dotsWrap.children).forEach((d, idx) =>
        d.classList.toggle("active", idx === i)
      );
    }
    current = i;
  }
  function go(i) {
    show((i + total) % total);
  }
  function next() {
    go(current + 1);
  }
  function prev() {
    go(current - 1);
  }

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(() => {
      if (autoplay) next();
    }, delay);
  }
  function stopAutoplay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  function resetAutoplay() {
    autoplay = false;
    stopAutoplay();
    setTimeout(() => {
      autoplay = true;
      startAutoplay();
    }, 3000);
  }

  prevBtn?.addEventListener("click", () => {
    prev();
    resetAutoplay();
  });
  nextBtn?.addEventListener("click", () => {
    next();
    resetAutoplay();
  });

  slider.addEventListener("mouseenter", () => (autoplay = false));
  slider.addEventListener("mouseleave", () => (autoplay = true));
  slider.addEventListener("focusin", () => (autoplay = false));
  slider.addEventListener("focusout", () => (autoplay = true));

  slider.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      prev();
      resetAutoplay();
    }
    if (e.key === "ArrowRight") {
      next();
      resetAutoplay();
    }
  });
  slider.setAttribute("tabindex", "0");

  // touch swipe
  let startX = 0;
  slider.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
    },
    { passive: true }
  );
  slider.addEventListener("touchend", (e) => {
    const endX = (e.changedTouches && e.changedTouches[0].clientX) || 0;
    const diff = endX - startX;
    if (Math.abs(diff) > 40) {
      if (diff < 0) next();
      else prev();
      resetAutoplay();
    }
  });

  buildDots();
  show(current);
  startAutoplay();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });
}

/* ========== Accessibility: open product on Enter when card focused ==========
   - ensures keyboard users can open product details
*/
function enableCardKeyboardOpen() {
  qsa("#productGrid .card").forEach((card) => {
    card.setAttribute("tabindex", card.getAttribute("tabindex") || "0");
    card.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        const detailsBtn = card.querySelector(".ghost");
        if (detailsBtn) detailsBtn.click();
      }
    });
  });
}

/* ========== Initialization ==========
   Single DOMContentLoaded handler wires everything once
*/
document.addEventListener("DOMContentLoaded", () => {
  // Nav wiring
  wireNavButtons();

  // Filters
  initFilters();

  // Enquiry badge
  updateEnquiryBadge();

  // Product keyboard access
  enableCardKeyboardOpen();

  // Hero slider
  initHeroSlider();

  // Year in footer
  const yEl = qs("#year");
  if (yEl) yEl.textContent = String(new Date().getFullYear());

  // ensure mobile menu hidden initially (safe)
  const menu = qs("#mobileMenu");
  if (menu) {
    menu.style.display = "none";
    menu.setAttribute("aria-hidden", "true");
    menu.setAttribute("data-open", "false");
  }
  qs(".menu-toggle")?.setAttribute("aria-expanded", "false");

  // Close mobile menu when resizing to wide screens
  window.addEventListener("resize", () => {
    const menu = qs("#mobileMenu");
    if (!menu) return;
    if (window.innerWidth > 768) {
      menu.style.display = "none";
      menu.setAttribute("aria-hidden", "true");
      menu.setAttribute("data-open", "false");
      qs(".menu-toggle")?.setAttribute("aria-expanded", "false");
    }
  });

  // Global keyboard handling for escape
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      closeModal();
      hideShareOptions();
      // close mobile menu if open
      const menu = qs("#mobileMenu");
      if (menu && menu.getAttribute("data-open") === "true") {
        menu.style.display = "none";
        menu.setAttribute("aria-hidden", "true");
        menu.setAttribute("data-open", "false");
        qs(".menu-toggle")?.setAttribute("aria-expanded", "false");
      }
    }
  });
});
