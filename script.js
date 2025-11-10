/* script.js — Full, robust behaviors for Prayag Agro Store */

/* ========== small helpers ========== */
const $ = (sel, ctx = document) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx = document) =>
  Array.from((ctx || document).querySelectorAll(sel));

/* ========== NAV: toggle & smooth scroll ========== */
function toggleMenu() {
  const navLinks = $(".nav-links");
  const toggle = $(".menu-toggle");
  if (!navLinks || !toggle) return;

  // stop bubbling so outside click handler doesn't immediately close it
  try {
    window.event?.stopPropagation?.();
  } catch (e) {}

  const nowOpen = navLinks.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(nowOpen));

  // manage outside click
  if (nowOpen) {
    // one-time outside click capture
    const outside = (ev) => {
      if (!navLinks.contains(ev.target) && !toggle.contains(ev.target)) {
        navLinks.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.removeEventListener("click", outside, true);
      }
    };
    // small delay to avoid immediate closure from the same click
    setTimeout(() => document.addEventListener("click", outside, true), 40);
  }
}

function scrollToId(id) {
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) {
    console.warn("scrollToId: no element", id);
    return false;
  }

  // close mobile nav if open
  const navLinks = $(".nav-links");
  const menuToggle = $(".menu-toggle");
  if (navLinks && navLinks.classList.contains("open")) {
    navLinks.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }

  el.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  } catch (e) {}
  return true;
}

/* ========== wire header nav buttons (desktop) ========== */
function wireHeaderButtons() {
  // desktop/nav-links primary wiring: buttons inside .nav-links and .nav
  $$(".nav-links .btn, .nav .btn, .nav-links a, .nav a").forEach((el) => {
    if (el.__navWired) return;
    el.__navWired = true;
    el.addEventListener(
      "click",
      (ev) => {
        // try to get target from data-target, href#id, or onclick pattern
        const dt = el.dataset?.target;
        if (dt) {
          ev.preventDefault();
          scrollToId(dt);
          return;
        }

        const href = el.getAttribute("href");
        if (href && href.startsWith("#")) {
          ev.preventDefault();
          scrollToId(href.slice(1));
          return;
        }

        const onclick = el.getAttribute && el.getAttribute("onclick");
        if (onclick) {
          const m = onclick.match(/scrollToId\(['"]([^'"]+)['"]\)/);
          if (m) {
            ev.preventDefault();
            scrollToId(m[1]);
            return;
          }
        }

        // otherwise allow custom handlers to run (e.g., open enquiry)
      },
      { passive: false }
    );
  });
}

/* ========== Mobile menu delegation (reliable for touch) ========== */
function wireMobileDelegation() {
  const mobile = $("#mobileMenu");
  if (!mobile || mobile.__delegated) return;
  mobile.__delegated = true;

  const handle = (ev) => {
    const btn = ev.target.closest("button, a");
    if (!btn || !mobile.contains(btn)) return;
    // attempt to extract id same as desktop
    const dt = btn.dataset?.target;
    if (dt) {
      ev.preventDefault();
      scrollToId(dt);
      return;
    }
    const href = btn.getAttribute("href");
    if (href && href.startsWith("#")) {
      ev.preventDefault();
      scrollToId(href.slice(1));
      return;
    }
    const onclick = btn.getAttribute && btn.getAttribute("onclick");
    if (onclick) {
      const m = onclick.match(/scrollToId\(['"]([^'"]+)['"]\)/);
      if (m) {
        ev.preventDefault();
        scrollToId(m[1]);
        return;
      }
    }
    // else let other behavior run (like openEnquiry)
  };

  mobile.addEventListener("click", handle, { passive: false });
  mobile.addEventListener("touchend", handle, { passive: false });
}

/* ========== Filters ========== */
function initFilters() {
  const buttons = $$(".filter-btn");
  if (!buttons.length) return;
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.cat || "all";
      $$("#productGrid .card").forEach((card) => {
        card.style.display =
          cat === "all" || card.dataset.cat === cat ? "" : "none";
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
  try {
    if (btnRef instanceof HTMLElement) {
      const prev = btnRef.textContent;
      btnRef.textContent = "Added";
      btnRef.disabled = true;
      setTimeout(() => {
        btnRef.textContent = prev;
        btnRef.disabled = false;
      }, 900);
    }
  } catch (e) {}
}
function updateEnquiryBadge() {
  const el = $("#enqCount");
  if (el) el.textContent = String(enquiry.length);
}
function openEnquiry() {
  if (!enquiry.length) {
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
const modalBackdrop = $("#modalBackdrop");
const modalTitle = $("#modalTitle");
const modalImage = $("#modalImage");
const modalDesc = $("#modalDesc");
const modalPrice = $("#modalPrice");

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
      desc: "Promotes root & foliage health.",
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
  modalTitle && (modalTitle.textContent = p.title);
  modalDesc && (modalDesc.textContent = p.desc);
  modalPrice && (modalPrice.textContent = p.price);
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
  $(".modal")?.focus?.();
}
function closeModal() {
  if (!modalBackdrop) return;
  modalBackdrop.style.display = "none";
  modalBackdrop.setAttribute("aria-hidden", "true");
}
modalBackdrop?.addEventListener("click", (ev) => {
  if (ev.target === modalBackdrop) closeModal();
});

/* ========== Inquiry + share (WhatsApp/Gmail) ========== */
const STORE_WHATSAPP_PHONE = "918144632145";
const STORE_EMAIL = "prayagagrostore@gmai.com";

function submitInquiry(ev) {
  ev.preventDefault();
  const name = ($("#inqName")?.value || "").trim();
  const phone = ($("#inqPhone")?.value || "").trim();
  const email = ($("#inqEmail")?.value || "").trim();
  const msg = ($("#inqMsg")?.value || "").trim();
  const status = $("#inqStatus");
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
    "Enquiry from Prayag Agro Store website:",
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
  const backdrop = $("#shareBackdrop");
  const preview = $("#sharePreview");
  const whatsappBtn = $("#whatsappBtn");
  const gmailBtn = $("#gmailBtn");
  if (!backdrop || !preview || !whatsappBtn || !gmailBtn) return;
  preview.textContent = message;
  whatsappBtn.onclick = () => {
    const encoded = encodeURIComponent(message);
    window.open(
      `https://wa.me/${STORE_WHATSAPP_PHONE}?text=${encoded}`,
      "_blank"
    );
    postShareCleanup();
  };
  gmailBtn.onclick = () => {
    const subject = `Enquiry — Prayag Agro Store`;
    const body = message;
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(
        STORE_EMAIL
      )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      "_blank"
    );
    const mailto = `mailto:${encodeURIComponent(
      STORE_EMAIL
    )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setTimeout(() => (window.location.href = mailto), 200);
    postShareCleanup();
  };
  backdrop.style.display = "flex";
  backdrop.setAttribute("aria-hidden", "false");
}
function hideShareOptions() {
  const b = $("#shareBackdrop");
  if (!b) return;
  b.style.display = "none";
  b.setAttribute("aria-hidden", "true");
}
function postShareCleanup() {
  hideShareOptions();
  const s = $("#inqStatus");
  if (s) {
    s.textContent = "Inquiry sent (or opened in your email/WhatsApp).";
    s.style.color = "green";
  }
  $("#inquiryForm")?.reset();
  setTimeout(() => {
    $("#sharePreview") && ($("#sharePreview").textContent = "");
    if ($("#inqStatus")) $("#inqStatus").textContent = "";
  }, 3500);
}
function confirmAndClose() {
  hideShareOptions();
}

/* ========== Hero slider (6 slides) ========== */
function initHeroSlider() {
  const slider = $("#heroSlider");
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
    if (dotsWrap)
      Array.from(dotsWrap.children).forEach((d, idx) =>
        d.classList.toggle("active", idx === i)
      );
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

  let startX = 0;
  slider.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
    },
    { passive: true }
  );
  slider.addEventListener(
    "touchend",
    (e) => {
      const endX = (e.changedTouches && e.changedTouches[0].clientX) || 0;
      const diff = endX - startX;
      if (Math.abs(diff) > 40) {
        if (diff < 0) next();
        else prev();
        resetAutoplay();
      }
    },
    { passive: true }
  );

  buildDots();
  show(current);
  startAutoplay();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });
}

/* ========== keyboard access for product cards ========== */
function enableCardKeyboardOpen() {
  $$("#productGrid .card").forEach((card) => {
    card.setAttribute("tabindex", card.getAttribute("tabindex") || "0");
    card.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        const d = card.querySelector(".ghost");
        if (d) d.click();
      }
    });
  });
}

/* ========== initialization ========== */
document.addEventListener("DOMContentLoaded", () => {
  wireHeaderButtons();
  wireMobileDelegation();
  initFilters();
  updateEnquiryBadge();
  enableCardKeyboardOpen();
  initHeroSlider();

  // wire mobile toggle (the visible hamburger)
  const mt = $(".menu-toggle");
  if (mt && !mt.__wired) {
    mt.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });
    mt.__wired = true;
  }

  // ensure mobile nav hidden initially
  const nav = $(".nav-links");
  if (nav) {
    nav.classList.remove("open");
    $(".menu-toggle")?.setAttribute("aria-expanded", "false");
  }

  // footer year
  const y = $("#year");
  if (y) y.textContent = String(new Date().getFullYear());

  // close mobile menu on resize
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      $(".nav-links")?.classList.remove("open");
      $(".menu-toggle")?.setAttribute("aria-expanded", "false");
    }
  });

  // ESC closure
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      closeModal();
      hideShareOptions();
      const navlinks = $(".nav-links");
      if (navlinks && navlinks.classList.contains("open")) {
        navlinks.classList.remove("open");
        $(".menu-toggle")?.setAttribute("aria-expanded", "false");
      }
    }
  });
});
