/* ============================================================
   THE BROWN PRINT — shared site logic
   Data, nav behaviour, grid + story rendering, video hookup,
   and the multi-step "Start a Project" requirements modal.
   Loads on every page; reads data-* attributes to know what to render.
   ============================================================ */

/* ---------- ICONS (lucide-style inline SVG) ---------- */
const I = {
  play:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
  arrowR:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
  chevron:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  checkBig:'<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0c0a09" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  menu:  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>',
  heart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>',
  disc:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>',
  mic:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/></svg>',
  party: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L12 14l4.5 4.5 4.04-1.95c.84-.16 1.44-.9 1.44-1.76v-.38c0-.88.77-1.55 1.63-1.45a2.9 2.9 0 0 0 3.12-1.96L22 2Z"/></svg>',
  brand: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/></svg>',
};

/* ---------- DATA ----------
   All content now lives in content.js (the CONTENT object), which the
   client edits. Here we just read from it and add an auto id + a rotating
   gradient so any item with a missing image still looks intentional. */
const GRADIENTS = [
  "from-rose-200 to-amber-100", "from-amber-200 to-rose-100",
  "from-orange-200 to-pink-100", "from-rose-200 to-orange-100",
  "from-amber-200 to-rose-200", "from-pink-200 to-amber-100",
];
function prep(list) {
  return (list || []).map((item, i) => ({ id: i + 1, hue: GRADIENTS[i % GRADIENTS.length], ...item }));
}

const WEDDING_PHOTOS = prep(CONTENT.weddingPhotos);
const WEDDING_VIDEOS = prep(CONTENT.weddingVideos);
const WEDDING_STORIES = prep(CONTENT.weddingStories);
const MUSIC_WORKS = prep(CONTENT.music);
const CONCERT_WORKS = prep(CONTENT.concerts);
const SOCIAL_WORKS = prep(CONTENT.social);
const BRAND_WORKS = prep(CONTENT.brands);

const SERVICES = [
  { id:"wedding", label:"Wedding", icon:I.heart },
  { id:"music", label:"Music Album", icon:I.disc },
  { id:"concert", label:"Concert", icon:I.mic },
  { id:"social", label:"Social Event", icon:I.party },
  { id:"brand", label:"Brand / Commercial", icon:I.brand },
];
const BUDGETS = ["Under $3,000", "$3,000 – $6,000", "$6,000 – $10,000", "$10,000+"];
const SCALES = ["Intimate (under 50)", "Mid-size (50–150)", "Large (150–300)", "Grand (300+)"];

/* gradient lookup: maps the simple "from-x to-y" token to a CSS gradient
   (used as a fallback background behind images) */
const COLORS = {
  "rose-200":"#fecdd3","rose-100":"#ffe4e6","amber-200":"#fde68a","amber-100":"#fef3c7",
  "orange-200":"#fed7aa","pink-100":"#fce7f3","orange-100":"#ffedd5","pink-200":"#fbcfe8",
};
function gradientStyle(hue) {
  if (!hue) return "";
  const m = hue.match(/from-([\w-]+)\s+to-([\w-]+)/);
  if (!m) return "";
  const a = COLORS[m[1]] || "#44403c", b = COLORS[m[2]] || "#1c1917";
  return `background:linear-gradient(135deg, ${a}, ${b});`;
}

/* ---------- WORK GRID RENDER ---------- */
function renderGrid(containerId, items, kind) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items.map(w => {
    const media = w.src || w.poster;
    const meta = w.artist || w.venue || w.event || w.client || w.sub;
    const subLine = (w.artist || w.venue || w.event || w.client) ? `<p class="sub">${w.sub}</p>` : "";
    const videoAttr = (kind === "video" && w.videoSrc) ? `data-video-src="${w.videoSrc}"` : "";
    const interactive = kind === "video" ? `tabindex="0" role="button" aria-label="Play ${w.title}"` : "";
    return `
      <div class="work-card ${w.tall ? "tall" : ""}" style="${gradientStyle(w.hue)}"
           data-kind="${kind}" data-id="${w.id}" ${videoAttr} ${interactive}>
        ${media ? `<img src="${media}" alt="${w.title}" loading="lazy" onerror="this.style.display='none'">` : ""}
        <div class="work-card-shade"></div>
        ${kind === "video" ? `<div class="work-card-play"><div class="play-btn">${I.play}</div></div>` : ""}
        <div class="work-card-caption">
          <h3 class="serif">${w.title}</h3>
          <p class="meta">${meta}</p>
          ${subLine}
        </div>
      </div>`;
  }).join("");

  // video tiles open the protected player (click, Enter, or Space)
  if (kind === "video") {
    el.querySelectorAll(".work-card").forEach(card => {
      const openIt = () => VideoPlayer.open(items.find(x => x.id == card.dataset.id));
      card.addEventListener("click", openIt);
      card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openIt(); }
      });
    });
  }
}

/* ---------- WEDDING STORIES RENDER ---------- */
function renderStories(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = WEDDING_STORIES.map((s, i) => `
    <button class="story ${i % 2 ? "rev" : ""}" data-id="${s.id}">
      <div class="story-img">${s.src ? `<img src="${s.src}" alt="${s.couple}" loading="lazy" onerror="this.style.display='none'">` : ""}</div>
      <div class="story-body">
        <span class="place">${s.place} · ${s.date}</span>
        <h3 class="serif">${s.couple}</h3>
        <p>${s.excerpt}</p>
        <span class="story-read">Read their story ${I.arrow}</span>
      </div>
    </button>`).join("");

  el.querySelectorAll(".story").forEach(b => {
    b.addEventListener("click", () => openStory(WEDDING_STORIES.find(x => x.id == b.dataset.id)));
  });
}

/* ---------- STORY MODAL ---------- */
function openStory(s) {
  let ov = document.getElementById("storyModal");
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "storyModal";
    ov.className = "modal-overlay";
    document.body.appendChild(ov);
    ov.addEventListener("click", e => { if (e.target === ov) ov.classList.remove("open"); });
  }
  ov.innerHTML = `
    <div class="modal story-modal" onclick="event.stopPropagation()">
      <button class="modal-close" onclick="document.getElementById('storyModal').classList.remove('open')">${I.close}</button>
      <div class="story-modal-img" style="${gradientStyle(s.hue)}">
        ${s.src ? `<img src="${s.src}" alt="${s.couple}" onerror="this.style.display='none'">` : ""}
      </div>
      <div class="modal-pad">
        <span class="place">${s.place} · ${s.date}</span>
        <h3 class="serif">${s.couple}</h3>
        <p class="story-text">${s.body}</p>
      </div>
    </div>`;
  ov.classList.add("open");
}

/* ---------- NAV: scroll state + mobile toggle ---------- */
function initNav() {
  const nav = document.querySelector(".nav");
  const isHome = document.body.dataset.theme === "home";
  const onScroll = () => {
    if (window.scrollY > 50 || !isHome) nav.classList.add("solid");
    else nav.classList.remove("solid");
  };
  window.addEventListener("scroll", onScroll);
  onScroll();

  const burger = document.querySelector(".nav-burger");
  const mobile = document.querySelector(".nav-mobile");
  if (burger && mobile) {
    burger.setAttribute("aria-expanded", "false");
    burger.addEventListener("click", () => {
      const open = mobile.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });
    mobile.querySelectorAll("a, button").forEach(l =>
      l.addEventListener("click", () => {
        mobile.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }));
  }

  // Escape closes any open modal and the mobile menu
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const openModal = document.querySelector(".modal-overlay.open");
    if (openModal) {
      openModal.classList.remove("open");
      document.body.style.overflow = "";
    }
    if (mobile && mobile.classList.contains("open")) {
      mobile.classList.remove("open");
      burger?.setAttribute("aria-expanded", "false");
    }
  });
}

/* ---------- PAGE TRANSITIONS ----------
   Modern browsers (Chromium/Safari) get a native, GPU-smooth
   cross-document View Transition (see the @view-transition rule
   and ::view-transition-old/new(root) keyframes in style.css) —
   the browser handles those automatically, no JS needed.

   Everywhere else, <html> carries a "vt-fallback" class (added by
   an inline script in <head>, before first paint) and we do the
   fade+slide by hand: play an exit animation on click, then
   navigate once it finishes. */
function initPageTransitions() {
  if (!document.documentElement.classList.contains("vt-fallback")) return;

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (link.target === "_blank" || link.hasAttribute("download")) return;
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    let url;
    try { url = new URL(href, window.location.href); } catch { return; }
    if (url.origin !== window.location.origin) return; // external link, no intercept
    if (url.pathname === window.location.pathname && url.hash) return; // in-page anchor

    e.preventDefault();
    document.body.classList.add("page-exit");
    const goto = () => (window.location.href = url.href);
    document.body.addEventListener("animationend", goto, { once: true });
    setTimeout(goto, 400); // safety net if animationend doesn't fire
  });
}

/* ---------- PROJECT (requirements) MODAL ---------- */
const Project = (() => {
  let ov, step = 1, data = {};
  const reset = () => { step = 1; data = { service:"", date:"", location:"", budget:"", scale:"", style:"", name:"", email:"", phone:"", notes:"" }; };

  function build() {
    ov = document.createElement("div");
    ov.id = "projectModal";
    ov.className = "modal-overlay";
    document.body.appendChild(ov);
    ov.addEventListener("click", e => { if (e.target === ov) closeIt(); });
  }

  function open(service) {
    if (!ov) build();
    reset();
    if (service) data.service = service;
    render();
    ov.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeIt() { ov.classList.remove("open"); document.body.style.overflow = ""; }

  const set = (k, v) => { data[k] = v; render(); };
  const canNext = () =>
    step === 1 ? data.service :
    step === 2 ? data.date && data.location && data.budget && data.scale :
    data.name && data.email && data.phone;

  function next() {
    if (step === 3) { console.log("PROJECT REQUEST:", data); step = 4; render(); return; }
    if (canNext()) { step++; render(); }
  }
  function back() { if (step > 1) { step--; render(); } }

  const today = new Date().toISOString().split("T")[0];

  function render() {
    const bars = [1,2,3].map(s => `<div class="progress-bar ${s <= step ? "active" : ""}"></div>`).join("");
    let inner = "";

    if (step === 1) {
      inner = `
        <span class="modal-step-label">Start a Project</span>
        <div class="progress">${bars}</div>
        <h3 class="serif">What can we create for you?</h3>
        <p style="color:var(--stone-500);font-size:.875rem;margin:-1rem 0 1.5rem;">Choose the type of project you'd like to discuss.</p>
        ${SERVICES.map(s => `
          <button class="service-row ${data.service === s.id ? "sel" : ""}" data-svc="${s.id}">
            <span class="service-ico">${s.icon}</span>
            <span style="font-weight:500;">${s.label}</span>
            ${data.service === s.id ? `<span style="margin-left:auto;color:var(--amber-400);">${I.check}</span>` : ""}
          </button>`).join("")}`;
    } else if (step === 2) {
      inner = `
        <span class="modal-step-label">Start a Project</span>
        <div class="progress">${bars}</div>
        <h3 class="serif">Tell us about your event</h3>
        <label class="field-label">Event Date</label>
        <input type="date" class="field" id="f-date" min="${today}" value="${data.date}" style="color-scheme:dark;">
        <label class="field-label">Location / City</label>
        <input class="field" id="f-loc" placeholder="e.g. Toronto, ON" value="${data.location}">
        <label class="field-label">Budget Range</label>
        <div class="chip-grid">${BUDGETS.map(b => `<button class="chip-sm ${data.budget === b ? "sel" : ""}" data-budget="${b}">${b}</button>`).join("")}</div>
        <label class="field-label">Scale / Guest Count</label>
        <div class="chip-grid">${SCALES.map(s => `<button class="chip-sm ${data.scale === s ? "sel" : ""}" data-scale="${s}">${s}</button>`).join("")}</div>
        <label class="field-label">Style / Mood References</label>
        <textarea class="field" id="f-style" rows="2" placeholder="Describe the vibe you're after, links to references, themes...">${data.style}</textarea>`;
    } else if (step === 3) {
      inner = `
        <span class="modal-step-label">Start a Project</span>
        <div class="progress">${bars}</div>
        <h3 class="serif">How do we reach you?</h3>
        <input class="field" id="f-name" placeholder="Full name" value="${data.name}">
        <input class="field" id="f-email" type="email" placeholder="Email address" value="${data.email}">
        <input class="field" id="f-phone" placeholder="Phone number" value="${data.phone}">
        <textarea class="field" id="f-notes" rows="3" placeholder="Anything else we should know? (optional)">${data.notes}</textarea>
        <div class="summary">
          <div class="summary-row"><span>Project</span><span style="text-transform:capitalize;">${data.service || "—"}</span></div>
          <div class="summary-row"><span>Date</span><span>${data.date || "—"}</span></div>
          <div class="summary-row"><span>Location</span><span>${data.location || "—"}</span></div>
          <div class="summary-row"><span>Budget</span><span>${data.budget || "—"}</span></div>
        </div>`;
    } else {
      inner = `
        <div style="text-align:center;padding:2rem 0;">
          <div class="success-check">${I.checkBig}</div>
          <h3 class="serif">Request sent!</h3>
          <p style="color:var(--stone-400);font-size:.875rem;margin-bottom:.5rem;">Thanks, ${data.name}. We've received your ${data.service} project details.</p>
          <p style="color:var(--stone-500);font-size:.75rem;margin-bottom:2rem;">The Brown Print team will reach out within 24–48 hours to discuss your vision.</p>
          <button class="btn btn-amber" id="p-done">Done</button>
        </div>`;
    }

    const actions = step < 4 ? `
      <div class="modal-actions">
        ${step > 1 ? `<button class="modal-btn modal-btn-back" id="p-back">Back</button>` : ""}
        <button class="modal-btn modal-btn-next" id="p-next" ${canNext() ? "" : "disabled"}>
          ${step === 3 ? "Send Request" : "Continue"} ${I.chevron}
        </button>
      </div>` : "";

    ov.innerHTML = `
      <div class="modal" onclick="event.stopPropagation()">
        <button class="modal-close" id="p-close">${I.close}</button>
        <div class="modal-pad">${inner}${actions}</div>
      </div>`;

    wire();
  }

  function wire() {
    const q = sel => ov.querySelector(sel);
    q("#p-close")?.addEventListener("click", closeIt);
    q("#p-done")?.addEventListener("click", closeIt);
    q("#p-next")?.addEventListener("click", next);
    q("#p-back")?.addEventListener("click", back);
    ov.querySelectorAll("[data-svc]").forEach(b => b.addEventListener("click", () => set("service", b.dataset.svc)));
    ov.querySelectorAll("[data-budget]").forEach(b => b.addEventListener("click", () => set("budget", b.dataset.budget)));
    ov.querySelectorAll("[data-scale]").forEach(b => b.addEventListener("click", () => set("scale", b.dataset.scale)));
    // text inputs: store on input without full re-render (keeps focus)
    const bind = (id, key) => { const f = q(id); if (f) f.addEventListener("input", e => { data[key] = e.target.value; const n = q("#p-next"); if (n) n.disabled = !canNext(); }); };
    bind("#f-date","date"); bind("#f-loc","location"); bind("#f-style","style");
    bind("#f-name","name"); bind("#f-email","email"); bind("#f-phone","phone"); bind("#f-notes","notes");
  }

  return { open };
})();

/* expose for inline onclick handlers in the HTML */
window.openProject = (service) => Project.open(service || null);

/* ---------- BOOT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initPageTransitions();

  // render whichever grids exist on this page
  if (document.getElementById("weddingPhotos")) renderGrid("weddingPhotos", WEDDING_PHOTOS, "photo");
  if (document.getElementById("weddingVideos")) renderGrid("weddingVideos", WEDDING_VIDEOS, "video");
  if (document.getElementById("musicGrid"))     renderGrid("musicGrid", MUSIC_WORKS, "video");
  if (document.getElementById("concertGrid"))   renderGrid("concertGrid", CONCERT_WORKS, "video");
  if (document.getElementById("socialGrid"))    renderGrid("socialGrid", SOCIAL_WORKS, "video");
  if (document.getElementById("brandsGrid"))    renderGrid("brandsGrid", BRAND_WORKS, "video");
  if (document.getElementById("storyList"))     renderStories("storyList");
});
