/* ============================================================
   THE BROWN PRINT — enhance.js
   Progressive immersive layer. Additive, dependency-free, and
   safe: if a feature is missing the content simply shows normally.
   Loads on every page AFTER main.js so grids already exist.
   ============================================================ */
(function () {
  "use strict";

  var reduce = false;
  try {
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  /* ---------- 1. Nav entrance on first paint ---------- */
  function navIntro() {
    if (reduce) return;
    var nav = document.querySelector(".nav");
    // The wedding page owns its own nav choreography during the
    // scroll-film; don't fight it there.
    if (nav && !document.body.classList.contains("wedding-page")) {
      nav.classList.add("tbp-nav-intro");
      nav.addEventListener("animationend", function () {
        nav.classList.remove("tbp-nav-intro");
      }, { once: true });
    }
  }

  /* ---------- 2. Image fade-in on load ---------- */
  function fadeImages() {
    var imgs = document.querySelectorAll(".work-card img, .story-img img");
    imgs.forEach(function (img) {
      if (reduce) { img.setAttribute("data-nofade", ""); return; }
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add("loaded");
      } else {
        img.addEventListener("load", function () { img.classList.add("loaded"); }, { once: true });
        // if it errors (onerror hides it already), don't leave it invisible-but-present
        img.addEventListener("error", function () { img.classList.add("loaded"); }, { once: true });
      }
    });
  }

  /* ---------- 3. Scroll-reveal ---------- */
  // Tag the natural content blocks so we don't need to touch markup.
  var REVEAL_SELECTORS = [
    ".sec-head",
    ".stat",
    ".cat-card",
    ".story",
    ".cta h2", ".cta p", ".cta .btn",
    ".con-cta > *", ".soc-cta > *", ".brd-cta > *",
    ".page-hero-inner > *", ".con-hero .page-hero-inner > *"
  ];

  var STAGGER_SELECTORS = [".stats-grid", ".cats-grid", ".work-grid"];

  function tagReveals() {
    STAGGER_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.classList.add("reveal-stagger");
      });
    });
    REVEAL_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        // don't double-tag things already inside a stagger group
        if (el.closest(".reveal-stagger")) return;
        el.classList.add("reveal");
      });
    });
  }

  function revealNow(el) { el.classList.add("in"); }

  function initReveal() {
    var targets = document.querySelectorAll(".reveal, .reveal-stagger");
    if (!targets.length) return;

    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach(revealNow);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          revealNow(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    targets.forEach(function (el) {
      // anything already in view on load reveals immediately (no blank flash)
      var r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight || document.documentElement.clientHeight)) {
        revealNow(el);
      } else {
        io.observe(el);
      }
    });
  }

  /* ---------- 4. Video Hover Previews ---------- */
  function initHoverPreviews() {
    if (reduce) return;

    document.addEventListener("mouseover", function (e) {
      var card = e.target.closest(".work-card[data-video-src]");
      if (!card) return;
      if (card.dataset.hovered === "true") return;
      card.dataset.hovered = "true";

      var video = card.querySelector(".work-card-video");
      if (!video) {
        video = document.createElement("video");
        video.className = "work-card-video";
        video.src = card.getAttribute("data-video-src");
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute("preload", "auto");
        
        video.style.position = "absolute";
        video.style.inset = "0";
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.objectFit = "cover";
        video.style.zIndex = "2"; /* Above poster img (z-index 1) but below text/play-btn (z-index 3) */
        video.style.opacity = "0";
        video.style.transition = "opacity 0.4s ease";
        video.style.pointerEvents = "none";

        card.insertBefore(video, card.querySelector(".work-card-shade") || card.firstChild);
        video.offsetHeight; // trigger reflow
      }
      
      video.style.opacity = "1";
      video.play().catch(function (err) {
        // quiet fail if autoplay blocked
      });
    });

    document.addEventListener("mouseout", function (e) {
      var card = e.target.closest(".work-card[data-video-src]");
      if (!card) return;
      
      var related = e.relatedTarget;
      if (related && card.contains(related)) return;

      card.dataset.hovered = "false";
      var video = card.querySelector(".work-card-video");
      if (video) {
        video.style.opacity = "0";
        video.pause();
      }
    });
  }

  /* ---------- 5. Grids render async in main.js; observe them ---------- */
  // main.js populates work grids inside DOMContentLoaded. We run after,
  // but stories/videos may inject images a tick later — re-scan shortly.
  function run() {
    navIntro();
    tagReveals();
    initReveal();
    fadeImages();
    initHoverPreviews();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      // let main.js finish its own DOMContentLoaded work first
      setTimeout(run, 0);
    });
  } else {
    setTimeout(run, 0);
  }

  // Safety re-scan for late-injected media (grids built from content.js).
  window.addEventListener("load", function () {
    tagReveals();
    initReveal();
    fadeImages();
    initHoverPreviews();
  });
})();
