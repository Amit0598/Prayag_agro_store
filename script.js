/* script.js — Prayag Agro (admin CRUD with device upload, slider, inquiry, map) */

/* ---------- Config ---------- */
const DEMO_ADMIN_USER = "admin";
const DEMO_ADMIN_PASS = "password123";
const SESSION_KEY = "prayag_admin_logged";
const PROD_KEY = "prayag_products_v3";
const STORE_WHATSAPP = "918144632145";
const STORE_EMAIL = "prayagagrostore@gmail.com";
const MAP_LAT = 19.500032;
const MAP_LON = 85.104318;

/* ---------- Helpers ---------- */
const $ = (sel, ctx = document) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx = document) =>
  Array.from((ctx || document).querySelectorAll(sel));
const uid = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}_${Math.floor(
    Math.random() * 900 + 100
  )}`;
const escapeHtml = (s = "") =>
  String(s).replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );

/* ---------- NAV / Mobile ---------- */
function toggleMenu() {
  const nav = $(".nav-links");
  if (!nav) return;
  const now = nav.classList.toggle("open");
  $(".menu-toggle")?.setAttribute("aria-expanded", String(now));
}
$(".menu-toggle")?.addEventListener("click", (e) => {
  e.preventDefault();
  toggleMenu();
});

function wireNavButtons() {
  const navButtons = $$(".nav-links .btn, .hero-actions .btn");
  navButtons.forEach((btn) => {
    if (btn.__wired) return;
    btn.__wired = true;
    btn.addEventListener("click", (ev) => {
      const t = btn.dataset.target;
      if (!t) return;
      ev.preventDefault();
      const el = document.getElementById(t);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        const nav = $(".nav-links");
        if (nav && nav.classList.contains("open")) nav.classList.remove("open");
        $(".menu-toggle")?.setAttribute("aria-expanded", "false");
      }
    });
  });
}
wireNavButtons();

/* ---------- HERO SLIDER ---------- */
function initHeroSlider() {
  const slider = $("#heroSlider");
  if (!slider) return;
  const slidesWrap = slider.querySelector(".slides");
  const slides = Array.from(slidesWrap.children);
  const dotsWrap = slider.querySelector(".slider-dots");
  const prevBtn = slider.querySelector(".slider-btn.prev");
  const nextBtn = slider.querySelector(".slider-btn.next");
  if (!slides.length) return;

  let idx = 0;
  const total = slides.length;
  const delay = 4500;
  let timer = null;

  function show(i) {
    idx = (i + total) % total;
    slidesWrap.style.transform = `translateX(${-idx * 100}%)`;
    if (dotsWrap) {
      Array.from(dotsWrap.children).forEach((d, j) =>
        d.classList.toggle("active", j === idx)
      );
    }
  }

  if (dotsWrap) {
    dotsWrap.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Go to slide ${i + 1}`);
      b.addEventListener("click", () => {
        show(i);
        resetAutoplay();
      });
      dotsWrap.appendChild(b);
    }
  }

  prevBtn?.addEventListener("click", () => {
    show(idx - 1);
    resetAutoplay();
  });
  nextBtn?.addEventListener("click", () => {
    show(idx + 1);
    resetAutoplay();
  });

  slider.addEventListener("mouseenter", () => {
    stopAutoplay();
  });
  slider.addEventListener("mouseleave", () => {
    startAutoplay();
  });
  slider.addEventListener("focusin", () => stopAutoplay());
  slider.addEventListener("focusout", () => startAutoplay());

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(() => show(idx + 1), delay);
  }
  function stopAutoplay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  function resetAutoplay() {
    stopAutoplay();
    setTimeout(startAutoplay, 2500);
  }

  show(0);
  startAutoplay();
  document.addEventListener("visibilitychange", () =>
    document.hidden ? stopAutoplay() : startAutoplay()
  );
}
initHeroSlider();

/* ---------- MAP ---------- */
function ensureStoreMap() {
  const iframe = $("#storeMap");
  if (!iframe) return;
  const src = `https://maps.google.com/maps?q=${MAP_LAT},${MAP_LON}&z=16&output=embed`;
  iframe.src = src;
  const openBtn = $("#openMapsBtn");
  if (openBtn)
    openBtn.href = `https://www.google.com/maps?q=${MAP_LAT},${MAP_LON}`;
}
ensureStoreMap();

/* ---------- STORAGE ---------- */
function loadProducts() {
  try {
    return JSON.parse(localStorage.getItem(PROD_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function saveProducts(list) {
  localStorage.setItem(PROD_KEY, JSON.stringify(list || []));
}
function addProduct(p) {
  const list = loadProducts();
  list.unshift(p);
  saveProducts(list);
}
function updateProduct(p) {
  const list = loadProducts().map((x) => (x.id === p.id ? p : x));
  saveProducts(list);
}
function deleteProduct(id) {
  const list = loadProducts().filter((x) => x.id !== id);
  saveProducts(list);
}

/* ---------- RENDER PRODUCT GRID ---------- */
function renderProductGrid(filter = "all") {
  const grid = $("#productGrid");
  if (!grid) return;
  const products = loadProducts();
  const filtered =
    filter === "all" ? products : products.filter((p) => p.category === filter);
  grid.innerHTML = "";
  if (!filtered.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:18px;color:var(--muted)">No products available.</div>`;
    return;
  }
  filtered.forEach((p) => {
    const card = document.createElement("article");
    card.className = "card compact";
    card.dataset.cat = p.category || "";
    const imgSrc = p.image || "https://picsum.photos/seed/default/600/400";
    card.innerHTML = `
      <div class="thumb">
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(
      p.title
    )}" loading="lazy" />
        <div class="price-badge">${escapeHtml(p.price || "")}</div>
        <div class="cat-badge">${escapeHtml(p.category || "")}</div>
      </div>
      <div class="body">
        <h4>${escapeHtml(p.title)}</h4>
        <p class="meta">${escapeHtml(p.description || "")}</p>
        <div class="actions">
          <div class="left">
            <button class="icon-btn details-btn" data-id="${
              p.id
            }" title="Details">🔍</button>
            <button class="icon-btn enquire-btn" data-id="${
              p.id
            }" data-title="${escapeHtml(p.title)}" title="Enquire">✉️</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  $$(".details-btn").forEach((b) => {
    b.addEventListener("click", () => openProductModal(b.dataset.id));
  });
  $$(".enquire-btn").forEach((b) => {
    b.addEventListener("click", () => {
      addToEnquiry(b.dataset.id, b.dataset.title);
      alert("Added to enquiry list.");
    });
  });
}

/* ---------- ADMIN LIST ---------- */
function renderAdminList() {
  const wrap = $("#adminProductList");
  if (!wrap) return;
  const list = loadProducts();
  wrap.innerHTML = "";
  if (!list.length) {
    wrap.innerHTML = `<div style="padding:12px;color:var(--muted)">No products yet. Add from the form.</div>`;
    return;
  }
  list.forEach((p) => {
    const row = document.createElement("div");
    row.className = "admin-product-row";
    row.innerHTML = `
      <img src="${escapeHtml(
        p.image || "https://picsum.photos/seed/default/120/80"
      )}" alt="${escapeHtml(p.title)}" />
      <div class="meta">
        <div class="title">${escapeHtml(p.title)}</div>
        <div class="sub">${escapeHtml(p.category)} • ${escapeHtml(
      p.price || ""
    )}</div>
      </div>
      <div class="actions">
        <button class="btn ghost admin-edit" data-id="${p.id}">Edit</button>
        <button class="btn danger admin-delete" data-id="${
          p.id
        }">Delete</button>
      </div>
    `;
    wrap.appendChild(row);
  });

  $$(".admin-edit").forEach((b) =>
    b.addEventListener("click", () => startEditProduct(b.dataset.id))
  );
  $$(".admin-delete").forEach((b) =>
    b.addEventListener("click", () => {
      if (!confirm("Delete this product?")) return;
      deleteProduct(b.dataset.id);
      renderAdminList();
      renderProductGrid(getActiveFilter());
    })
  );
}

/* ---------- ADMIN FORM (file upload support) ---------- */
function initAdminForm() {
  const form = $("#productForm");
  if (!form) return;

  const fileInput = $("#prodImageFile");
  const previewWrap = $("#prodImagePreviewWrap");
  const previewImg = $("#prodImagePreview");
  const deleteBtn = $("#prodDeleteBtn");
  let uploadedImageData = "";

  function resetForm() {
    $("#prodId").value = "";
    $("#prodTitle").value = "";
    $("#prodCategory").value = "pesticide";
    $("#prodPrice").value = "";
    $("#prodDesc").value = "";
    if (fileInput) fileInput.value = "";
    uploadedImageData = "";
    if (previewWrap) previewWrap.style.display = "none";
    if (deleteBtn) deleteBtn.style.display = "none";
    $("#adminFormTitle") &&
      ($("#adminFormTitle").textContent = "Add New Product");
    $("#prodFormStatus") && ($("#prodFormStatus").textContent = "");
  }

  function showPreview(src) {
    uploadedImageData = src || "";
    if (previewImg) previewImg.src = src || "";
    if (previewWrap) previewWrap.style.display = src ? "block" : "none";
  }

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) {
        showPreview("");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        showPreview(ev.target.result);
      };
      reader.readAsDataURL(f);
    });
  }

  window.startEditProduct = function (id) {
    const p = loadProducts().find((x) => x.id === id);
    if (!p) return alert("Product not found");
    $("#prodId").value = p.id;
    $("#prodTitle").value = p.title || "";
    $("#prodCategory").value = p.category || "pesticide";
    $("#prodPrice").value = p.price || "";
    $("#prodDesc").value = p.description || "";
    if (p.image) {
      showPreview(p.image);
      if (fileInput) fileInput.value = "";
    } else {
      showPreview("");
    }
    if (deleteBtn) deleteBtn.style.display = "inline-block";
    $("#adminFormTitle") && ($("#adminFormTitle").textContent = "Edit Product");
    const panel = $("#adminPanel");
    if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const id = $("#prodId").value || uid("prod");
    const title = $("#prodTitle").value.trim();
    const category = $("#prodCategory").value;
    const price = $("#prodPrice").value.trim();
    const desc = $("#prodDesc").value.trim();

    if (!title) {
      $("#prodFormStatus").textContent = "Title is required.";
      $("#prodFormStatus").style.color = "crimson";
      return;
    }

    let imageToStore = uploadedImageData || "";
    const obj = {
      id,
      title,
      category,
      price,
      image: imageToStore,
      description: desc,
    };
    const exists = loadProducts().some((p) => p.id === id);
    if (exists) {
      updateProduct(obj);
      $("#prodFormStatus").textContent = "Product updated.";
    } else {
      addProduct(obj);
      $("#prodFormStatus").textContent = "Product added.";
    }
    $("#prodFormStatus").style.color = "green";
    renderAdminList();
    renderProductGrid(getActiveFilter());
    setTimeout(() => {
      $("#prodFormStatus").textContent = "";
    }, 2200);
    resetForm();
  });

  $("#prodResetBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    resetForm();
  });
  $("#prodDeleteBtn")?.addEventListener("click", (e) => {
    const id = $("#prodId").value;
    if (!id) return;
    if (!confirm("Delete this product permanently?")) return;
    deleteProduct(id);
    renderAdminList();
    renderProductGrid(getActiveFilter());
    resetForm();
  });
}
initAdminForm();

/* ---------- FILTERS ---------- */
function initFilters() {
  $$(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderProductGrid(btn.dataset.cat || "all");
    });
  });
}
initFilters();
function getActiveFilter() {
  return (
    ($(".filter-btn.active") && $(".filter-btn.active").dataset.cat) || "all"
  );
}

/* ---------- PRODUCT MODAL ---------- */
function openProductModal(id) {
  const p = loadProducts().find((x) => x.id === id);
  if (!p) return alert("Product not found");
  if ($("#modalBackdrop")) {
    $("#modalTitle").textContent = p.title || "Product";
    $("#modalDesc").textContent = p.description || "";
    $("#modalPrice").textContent = p.price || "";
    $("#modalImage").src = p.image || "https://picsum.photos/900/600";
    $("#modalBackdrop").style.display = "flex";
  } else {
    alert(`${p.title}\n\n${p.description}\n\nPrice: ${p.price || "-"}`);
  }
}
$("#modalBackdrop")?.addEventListener("click", (ev) => {
  if (ev.target === $("#modalBackdrop"))
    $("#modalBackdrop").style.display = "none";
});

/* ---------- ENQUIRY ---------- */
let enquiry = [];
function addToEnquiry(id, title) {
  if (!enquiry.some((x) => x.id === id)) enquiry.push({ id, title });
  const adminCount = $("#adminEnquiryCount");
  if (adminCount) adminCount.textContent = enquiry.length;
}

/* ---------- SHARE/INQUIRY ---------- */
function submitInquiry(e) {
  e.preventDefault();
  const name = ($("#inqName")?.value || "").trim();
  const phone = ($("#inqPhone")?.value || "").trim();
  if (!name || !phone) {
    $("#inqStatus").textContent = "Please enter name and phone.";
    $("#inqStatus").style.color = "crimson";
    return;
  }
  const email = ($("#inqEmail")?.value || "").trim();
  const msg = ($("#inqMsg")?.value || "").trim();
  const messageLines = [
    "Enquiry — Prayag Agro Store",
    `Name: ${name}`,
    `Phone: ${phone}`,
    email ? `Email: ${email}` : null,
    msg ? `Message: ${msg}` : null,
  ].filter(Boolean);
  const message = messageLines.join("\n");
  if ($("#shareBackdrop")) {
    $("#sharePreview").textContent = message;
    $("#shareBackdrop").style.display = "flex";
    $("#whatsappBtn").onclick = () => {
      window.open(
        `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(message)}`,
        "_blank"
      );
      postShareCleanup();
    };
    $("#gmailBtn").onclick = () => {
      window.open(
        `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
          STORE_EMAIL
        )}&su=${encodeURIComponent(
          "Enquiry — Prayag Agro Store"
        )}&body=${encodeURIComponent(message)}`,
        "_blank"
      );
      setTimeout(
        () =>
          (window.location.href = `mailto:${encodeURIComponent(
            STORE_EMAIL
          )}?subject=${encodeURIComponent(
            "Enquiry — Prayag Agro Store"
          )}&body=${encodeURIComponent(message)}`),
        200
      );
      postShareCleanup();
    };
  } else {
    if (confirm("Send via WhatsApp? Cancel -> Gmail")) {
      window.open(
        `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(message)}`,
        "_blank"
      );
    } else {
      window.open(
        `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
          STORE_EMAIL
        )}&su=${encodeURIComponent(
          "Enquiry — Prayag Agro Store"
        )}&body=${encodeURIComponent(message)}`,
        "_blank"
      );
    }
  }
}
function postShareCleanup() {
  $("#shareBackdrop") && ($("#shareBackdrop").style.display = "none");
  $("#inquiryForm") && $("#inquiryForm").reset();
  $("#inqStatus") && ($("#inqStatus").textContent = "Sent / opened.");
  setTimeout(() => {
    $("#inqStatus") && ($("#inqStatus").textContent = "");
  }, 3000);
}

/* ---------- ADMIN AUTH (demo) ---------- */
function openAdminModal() {
  $("#adminModal") && ($("#adminModal").style.display = "flex");
}
function closeAdminModal() {
  $("#adminModal") && ($("#adminModal").style.display = "none");
  $("#adminLoginForm") && $("#adminLoginForm").reset();
  $("#adminLoginStatus") && ($("#adminLoginStatus").textContent = "");
}
function submitAdminLogin(e) {
  e.preventDefault();
  const u = $("#adminUser")?.value.trim();
  const p = $("#adminPass")?.value.trim();
  if (u === DEMO_ADMIN_USER && p === DEMO_ADMIN_PASS) {
    sessionStorage.setItem(SESSION_KEY, "1");
    applyAdminState(true);
    closeAdminModal();
  } else {
    $("#adminLoginStatus").textContent = "Invalid credentials";
    $("#adminLoginStatus").style.color = "crimson";
  }
}
function applyAdminState(isAdmin) {
  if (isAdmin) {
    $("#adminControls") && ($("#adminControls").style.display = "flex");
    $("#adminLoginTrigger") && ($("#adminLoginTrigger").style.display = "none");
    $("#adminPanel") && ($("#adminPanel").style.display = "block");
    renderAdminList();
  } else {
    $("#adminControls") && ($("#adminControls").style.display = "none");
    $("#adminLoginTrigger") &&
      ($("#adminLoginTrigger").style.display = "inline-block");
    $("#adminPanel") && ($("#adminPanel").style.display = "none");
  }
}
$("#adminLoginTrigger")?.addEventListener("click", (e) => {
  e.preventDefault();
  openAdminModal();
});
$("#adminLogoutBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  sessionStorage.removeItem(SESSION_KEY);
  applyAdminState(false);
});
$("#adminLoginForm")?.addEventListener("submit", submitAdminLogin);
$("#adminDashboardBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("adminPanel")?.scrollIntoView({ behavior: "smooth" });
});

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  wireNavButtons();
  initHeroSlider();
  ensureStoreMap();
  initAdminForm();
  initFilters();

  renderProductGrid();
  renderAdminList();

  $("#inquiryForm")?.addEventListener("submit", submitInquiry);

  // close share modal backdrop
  $("#shareBackdrop")?.addEventListener("click", (ev) => {
    if (ev.target === $("#shareBackdrop"))
      $("#shareBackdrop").style.display = "none";
  });

  // close product modal
  $(".close-btn")?.addEventListener("click", () => {
    $("#modalBackdrop") && ($("#modalBackdrop").style.display = "none");
    $("#adminModal") && ($("#adminModal").style.display = "none");
  });

  $("#year") && ($("#year").textContent = String(new Date().getFullYear()));

  applyAdminState(sessionStorage.getItem(SESSION_KEY) === "1");
});
