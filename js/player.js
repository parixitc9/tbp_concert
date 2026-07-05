/* ============================================================
   THE BROWN PRINT — Custom protected video player
   - Builds its own controls (play/pause, seek, time, fullscreen)
   - No download button, no right-click menu, no picture-in-picture
   - Source URL assigned in JS (not in page markup) to deter casual saving
   NOTE: No browser player can fully prevent a determined download.
         This blocks the easy routes (right-click save, download button,
         visible URL). True protection needs DRM / private Vimeo/YouTube.
   ============================================================ */

const VideoPlayer = (() => {
  let overlay, video, fill, track, timeEl, bigPlay, playIcon, pauseIcon,
      titleEl, subEl, controls, fsBtn;
  let hideTimer;

  // SVG icon markup (lucide-style)
  const ICONS = {
    play: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    bigPlay: '<svg width="30" height="30" viewBox="0 0 24 24" fill="#0c0a09"><path d="M8 5v14l11-7z"/></svg>',
    fs: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
    close: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  };

  function build() {
    overlay = document.createElement("div");
    overlay.className = "vp-overlay";
    overlay.innerHTML = `
      <div class="vp-shell">
        <button class="vp-close" aria-label="Close">${ICONS.close}</button>
        <div class="vp-frame">
          <video class="vp-video" playsinline preload="metadata"
                 controlslist="nodownload noplaybackrate noremoteplayback"
                 disablepictureinpicture></video>
          <div class="vp-guard"></div>
          <div class="vp-bigplay">
            <div class="vp-bigplay-circle">${ICONS.bigPlay}</div>
          </div>
          <div class="vp-controls">
            <button class="vp-btn vp-playpause">${ICONS.play}</button>
            <div class="vp-track"><div class="vp-fill"></div></div>
            <span class="vp-time">0:00 / 0:00</span>
            <button class="vp-btn vp-fs">${ICONS.fs}</button>
          </div>
        </div>
        <div class="vp-caption">
          <h3></h3>
          <p></p>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    video    = overlay.querySelector(".vp-video");
    fill     = overlay.querySelector(".vp-fill");
    track    = overlay.querySelector(".vp-track");
    timeEl   = overlay.querySelector(".vp-time");
    bigPlay  = overlay.querySelector(".vp-bigplay");
    controls = overlay.querySelector(".vp-controls");
    titleEl  = overlay.querySelector(".vp-caption h3");
    subEl    = overlay.querySelector(".vp-caption p");
    fsBtn    = overlay.querySelector(".vp-fs");
    const playPauseBtn = overlay.querySelector(".vp-playpause");

    // ---- protection: kill right-click on the whole player ----
    overlay.addEventListener("contextmenu", e => e.preventDefault());
    video.addEventListener("contextmenu", e => e.preventDefault());
    // block common save shortcut while focused
    overlay.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") e.preventDefault();
    });

    // ---- controls wiring ----
    const toggle = () => video.paused ? video.play() : video.pause();
    bigPlay.addEventListener("click", toggle);
    playPauseBtn.addEventListener("click", toggle);
    video.addEventListener("click", toggle);

    video.addEventListener("play", () => {
      bigPlay.classList.add("hide");
      playPauseBtn.innerHTML = ICONS.pause;
    });
    video.addEventListener("pause", () => {
      bigPlay.classList.remove("hide");
      playPauseBtn.innerHTML = ICONS.play;
    });

    video.addEventListener("timeupdate", () => {
      const pct = (video.currentTime / video.duration) * 100 || 0;
      fill.style.width = pct + "%";
      timeEl.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
    });
    video.addEventListener("loadedmetadata", () => {
      timeEl.textContent = `0:00 / ${fmt(video.duration)}`;
    });
    video.addEventListener("ended", () => {
      bigPlay.classList.remove("hide");
      playPauseBtn.innerHTML = ICONS.play;
    });

    // seek
    track.addEventListener("click", e => {
      const rect = track.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      video.currentTime = ratio * video.duration;
    });

    // fullscreen (on the frame so our controls stay visible)
    fsBtn.addEventListener("click", () => {
      const frame = overlay.querySelector(".vp-frame");
      if (!document.fullscreenElement) frame.requestFullscreen?.();
      else document.exitFullscreen?.();
    });

    // close
    overlay.querySelector(".vp-close").addEventListener("click", close);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && overlay.classList.contains("open") && !document.fullscreenElement) close();
    });
  }

  function fmt(s) {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  function open(work) {
    if (!overlay) build();
    // assign source via JS (kept out of static markup)
    video.src = work.videoSrc || "";
    if (work.poster) video.poster = work.poster;
    titleEl.textContent = work.title || "";
    subEl.textContent = work.artist || work.venue || work.event || work.client || work.sub || "";
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    // attempt autoplay; if blocked, big-play button remains
    video.play().catch(() => {});
  }

  function close() {
    if (!overlay) return;
    video.pause();
    video.removeAttribute("src");
    video.load(); // drop the buffered source from memory
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    if (document.fullscreenElement) document.exitFullscreen?.();
  }

  return { open, close };
})();
