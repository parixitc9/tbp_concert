/* ============================================================
   CONCERT PORTFOLIO — concert-portfolio.js
   Three.js hero scene, scroll animations, 3D card interactivity,
   tour map, stats counter, portfolio grid.
   Loads as ES module via importmap (Three.js r160).
   ============================================================ */

(function () {
  "use strict";

  /* ---------- FEATURE DETECTION ---------- */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;
  const hasIO = "IntersectionObserver" in window;

  /* ============================================================
     1. THREE.JS HERO SCENE
     Concert speakers, spotlight cone, metallic orbs, crystal
     polyhedra, and stage-fog particles. Mouse parallax on desktop.
     ============================================================ */
  const HeroScene = (() => {
    let scene, camera, renderer, clock;
    let particles, spotlight, orbs = [], crystals = [], speakers = [];
    let mouseX = 0, mouseY = 0;
    let raf;
    let canvasContainer;
    let ready = false;

    const PARTICLE_COUNT = isMobile ? 42 : 80;
    const ORB_COUNT = isMobile ? 3 : 6;
    const CRYSTAL_COUNT = isMobile ? 2 : 4;
    const SPEAKER_COUNT = isMobile ? 2 : 4;

    async function init() {
      canvasContainer = document.getElementById("cpCanvas");
      if (!canvasContainer) return;

      // Check for WebGL
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
      if (!gl) {
        showFallback();
        return;
      }

      try {
        const THREE = await import("three");
        setupScene(THREE);
        createLights(THREE);
        createParticles(THREE);
        createOrbs(THREE);
        createCrystals(THREE);
        createSpeakers(THREE);
        createSpotlightCone(THREE);
        bindEvents();
        ready = true;
        animate();
      } catch (e) {
        console.warn("Three.js failed to load:", e);
        showFallback();
      }
    }

    function setupScene(THREE) {
      scene = new THREE.Scene();
      clock = new THREE.Clock();

      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 0, 5);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      canvasContainer.appendChild(renderer.domElement);
    }

    function createLights(THREE) {
      const ambient = new THREE.AmbientLight(0x1a1a2e, 0.4);
      scene.add(ambient);

      const orangeLight = new THREE.PointLight(0xf97316, 2, 20);
      orangeLight.position.set(3, 3, 4);
      scene.add(orangeLight);

      const redLight = new THREE.PointLight(0xef4444, 1.5, 18);
      redLight.position.set(-3, -2, 3);
      scene.add(redLight);

      const warmLight = new THREE.PointLight(0xffa500, 1, 15);
      warmLight.position.set(0, 5, 2);
      scene.add(warmLight);
    }

    function createParticles(THREE) {
      const positions = new Float32Array(PARTICLE_COUNT * 3);
      const sizes = new Float32Array(PARTICLE_COUNT);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        sizes[i] = Math.random() * 3 + 1;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

      const material = new THREE.PointsMaterial({
        color: 0xf97316,
        size: 0.06,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

      particles = new THREE.Points(geometry, material);
      scene.add(particles);
    }

    function createOrbs(THREE) {
      for (let i = 0; i < ORB_COUNT; i++) {
        const radius = Math.random() * 0.3 + 0.15;
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0xf97316 : 0xef4444,
          metalness: 0.85,
          roughness: 0.15,
          transparent: true,
          opacity: 0.7,
        });
        const orb = new THREE.Mesh(geometry, material);
        orb.position.set(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 4 - 2
        );
        orb.userData = {
          speed: Math.random() * 0.3 + 0.1,
          offset: Math.random() * Math.PI * 2,
          baseY: orb.position.y,
        };
        scene.add(orb);
        orbs.push(orb);
      }
    }

    function createCrystals(THREE) {
      const geos = [
        new THREE.IcosahedronGeometry(0.25, 0),
        new THREE.OctahedronGeometry(0.2, 0),
      ];

      for (let i = 0; i < CRYSTAL_COUNT; i++) {
        const geo = geos[i % geos.length];
        // Wireframe
        const wireMat = new THREE.MeshBasicMaterial({
          color: 0xf97316,
          wireframe: true,
          transparent: true,
          opacity: 0.4,
        });
        const wire = new THREE.Mesh(geo, wireMat);
        // Solid core
        const solidMat = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          metalness: 0.9,
          roughness: 0.1,
          transparent: true,
          opacity: 0.25,
        });
        const solid = new THREE.Mesh(geo, solidMat);

        const group = new THREE.Group();
        group.add(wire);
        group.add(solid);
        group.position.set(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 3 - 3
        );
        group.userData = {
          rotSpeed: Math.random() * 0.5 + 0.2,
          offset: Math.random() * Math.PI * 2,
        };
        scene.add(group);
        crystals.push(group);
      }
    }

    function createSpeakers(THREE) {
      const boxGeo = new THREE.BoxGeometry(0.6, 0.8, 0.5);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.7,
        roughness: 0.3,
      });

      for (let i = 0; i < SPEAKER_COUNT; i++) {
        const speaker = new THREE.Mesh(boxGeo, mat);
        speaker.position.set(
          (Math.random() - 0.5) * 8 - 1,
          -2.5 + Math.random() * 0.5,
          (Math.random() - 0.5) * 3 - 4
        );
        // Speaker cone detail
        const coneGeo = new THREE.CircleGeometry(0.15, 16);
        const coneMat = new THREE.MeshStandardMaterial({
          color: 0xf97316,
          metalness: 0.8,
          roughness: 0.2,
          emissive: 0xf97316,
          emissiveIntensity: 0.3,
        });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.z = 0.26;
        speaker.add(cone);
        speaker.userData = {
          baseY: speaker.position.y,
          offset: Math.random() * Math.PI * 2,
        };
        scene.add(speaker);
        speakers.push(speaker);
      }
    }

    function createSpotlightCone(THREE) {
      const geo = new THREE.ConeGeometry(2, 8, 32, 1, true);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.03,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      spotlight = new THREE.Mesh(geo, mat);
      spotlight.position.set(0, 6, -2);
      spotlight.rotation.x = Math.PI;
      scene.add(spotlight);
    }

    function bindEvents() {
      if (!isTouch) {
        window.addEventListener("pointermove", onMouseMove, { passive: true });
      }
      window.addEventListener("resize", onResize, { passive: true });
    }

    function onMouseMove(e) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }

    function onResize() {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Mouse parallax on camera (desktop only)
      if (!isTouch) {
        camera.position.x += (mouseX * 0.4 - camera.position.x) * 0.03;
        camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);
      }

      // Particle drift
      if (particles) {
        const pos = particles.geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          pos[i * 3 + 1] += 0.003;
          if (pos[i * 3 + 1] > 8) pos[i * 3 + 1] = -8;
          pos[i * 3] += Math.sin(t * 0.5 + i) * 0.001;
        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.rotation.y = t * 0.02;
      }

      // Orb float + rotation
      orbs.forEach((orb) => {
        const d = orb.userData;
        orb.position.y = d.baseY + Math.sin(t * d.speed + d.offset) * 0.5;
        orb.rotation.x = t * d.speed * 0.3;
        orb.rotation.y = t * d.speed * 0.5;
      });

      // Crystal rotation
      crystals.forEach((cr) => {
        const d = cr.userData;
        cr.rotation.x = t * d.rotSpeed;
        cr.rotation.y = t * d.rotSpeed * 0.7;
        cr.position.y += Math.sin(t * 0.4 + d.offset) * 0.002;
      });

      // Speaker subtle bob
      speakers.forEach((sp) => {
        const d = sp.userData;
        sp.position.y = d.baseY + Math.sin(t * 1.5 + d.offset) * 0.08;
      });

      // Spotlight pulse
      if (spotlight) {
        spotlight.material.opacity = 0.02 + Math.sin(t * 0.8) * 0.015;
      }

      renderer.render(scene, camera);
    }

    function showFallback() {
      const fb = document.getElementById("cpFallback");
      if (fb) fb.style.opacity = "1";
      canvasContainer.style.display = "none";
    }

    function destroy() {
      if (raf) cancelAnimationFrame(raf);
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
      }
    }

    return { init, destroy };
  })();

  /* ============================================================
     2. SCROLL ANIMATIONS (IntersectionObserver)
     ============================================================ */
  const ScrollAnimations = (() => {
    function init() {
      if (reduce || !hasIO) {
        document.querySelectorAll(".cp-reveal, .cp-reveal-stagger").forEach((el) => {
          el.classList.add("in");
        });
        return;
      }

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );

      document.querySelectorAll(".cp-reveal, .cp-reveal-stagger").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          el.classList.add("in");
        } else {
          io.observe(el);
        }
      });
    }

    return { init };
  })();

  /* ============================================================
     3. STATS COUNTER ANIMATION
     ============================================================ */
  const StatsCounter = (() => {
    let animated = false;

    function init() {
      const container = document.getElementById("cpStats");
      if (!container) return;

      const nums = container.querySelectorAll(".cp-stat-num[data-target]");
      if (!nums.length) return;

      const trigger = () => {
        if (animated) return;
        animated = true;
        nums.forEach((el) => {
          const target = parseInt(el.dataset.target, 10);
          animateNum(el, 0, target, 1800);
        });
      };

      if (reduce || !hasIO) {
        nums.forEach((el) => {
          el.textContent = el.dataset.target + "+";
        });
        return;
      }

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              trigger();
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      io.observe(container);
    }

    function animateNum(el, from, to, duration) {
      const start = performance.now();
      const suffix = "+";

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = Math.round(from + (to - from) * eased);
        el.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }

    return { init };
  })();

  /* ============================================================
     4. PORTFOLIO GRID — CSS3D FLIP CARDS
     Uses CONCERT_WORKS from content.js (loaded via main.js).
     ============================================================ */
  const PortfolioGrid = (() => {
    function init() {
      const grid = document.getElementById("cpPortfolioGrid");
      const works = window.CCERT_WORKS;
      if (!grid || !works) return;

      grid.innerHTML = works.map((w, i) => {
        const media = w.src || w.poster;
        const meta = w.venue || w.sub || "";
        const desc = w.sub || "Live concert film captured with multi-cam precision.";
        return `
          <div class="cp-card-3d-wrap" tabindex="0" role="button"
               aria-label="Flip card: ${w.title}" data-index="${i}">
            <div class="cp-card-3d">
              <!-- Front -->
              <div class="cp-card-3d-face cp-card-3d-front cp-glass-subtle">
                ${media ? `<img class="cp-card-front-img" src="${media}" alt="${w.title}" loading="lazy" onerror="this.style.display='none'">` : ""}
                <div class="cp-card-front-shade"></div>
                <div class="cp-card-front-play">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#0c0a09">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <div class="cp-card-front-caption">
                  <h3>${w.title}</h3>
                  <p class="meta">${meta}</p>
                </div>
              </div>
              <!-- Back -->
              <div class="cp-card-3d-face cp-card-3d-back cp-glass">
                <div class="cp-card-back-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>
                  </svg>
                  Live Film
                </div>
                <h3>${w.title}</h3>
                <p>${desc}</p>
                <button class="cp-card-back-btn" onclick="event.stopPropagation(); window.VideoPlayer && window.VideoPlayer.open(window.CCERT_WORKS[${i}])">
                  Watch Film
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>`;
      }).join("");

      // Wire flip interaction
      grid.querySelectorAll(".cp-card-3d-wrap").forEach((wrap) => {
        wrap.addEventListener("click", () => flipCard(wrap));
        wrap.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            flipCard(wrap);
          }
        });
      });

      // Escape unflips all
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          grid.querySelectorAll(".cp-card-3d.flipped").forEach((c) => c.classList.remove("flipped"));
        }
      });

      // Image lazy fade
      grid.querySelectorAll(".cp-card-front-img").forEach((img) => {
        if (img.complete && img.naturalWidth > 0) {
          img.classList.add("loaded");
        } else {
          img.addEventListener("load", () => img.classList.add("loaded"), { once: true });
          img.addEventListener("error", () => img.classList.add("loaded"), { once: true });
        }
      });
    }

    function flipCard(wrap) {
      const card = wrap.querySelector(".cp-card-3d");
      if (!card) return;
      card.classList.toggle("flipped");
    }

    return { init };
  })();

  /* ============================================================
     5. FEATURED FILM — hook up to VideoPlayer
     ============================================================ */
  const FeaturedFilm = (() => {
    function init() {
      const el = document.getElementById("cpFeaturedVideo");
      if (!el) return;

      const openFilm = () => {
        if (typeof window.CCERT_WORKS !== "undefined" && window.CCERT_WORKS.length > 0) {
          window.VideoPlayer && window.VideoPlayer.open(window.CCERT_WORKS[0]);
        }
      };

      el.addEventListener("click", openFilm);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openFilm();
        }
      });
    }

    return { init };
  })();

  /* ============================================================
     6. TOUR MAP — SVG dots with tooltip
     ============================================================ */
  const TourMap = (() => {
    const cities = [
      { name: "Toronto", x: 228, y: 138, desc: "Home base — Rogers Centre, Scotiabank Arena" },
      { name: "Vancouver", x: 168, y: 132, desc: "Rogers Arena, Queen Elizabeth Theatre" },
      { name: "Calgary", x: 185, y: 125, desc: "Stampede Grounds, Saddledome" },
      { name: "Montreal", x: 248, y: 135, desc: "Bell Centre, Place des Arts" },
      { name: "New York", x: 260, y: 145, desc: "Madison Square Garden, Barclays" },
      { name: "Los Angeles", x: 155, y: 162, desc: "The Forum, Hollywood Bowl" },
      { name: "London", x: 455, y: 112, desc: "O2 Arena, Wembley Stadium" },
      { name: "Paris", x: 470, y: 118, desc: "Accor Arena, Zenith" },
      { name: "Berlin", x: 498, y: 108, desc: "Mercedes-Benz Arena" },
      { name: "Dubai", x: 580, y: 175, desc: "Coca-Cola Arena, Expo City" },
      { name: "Mumbai", x: 630, y: 185, desc: "DY Patil Stadium, NSCI" },
      { name: "Delhi", x: 640, y: 165, desc: "Jawaharlal Nehru Stadium" },
      { name: "Sydney", x: 790, y: 310, desc: "Accor Stadium, Hordern Pavilion" },
      { name: "Tokyo", x: 760, y: 142, desc: "Tokyo Dome, Budokan" },
      { name: "Singapore", x: 705, y: 215, desc: "National Stadium, Star Theatre" },
      { name: "Nairobi", x: 530, y: 250, desc: "Kasarani Stadium" },
      { name: "São Paulo", x: 275, y: 310, desc: "Allianz Parque, Espaço das Américas" },
    ];

    const dotsGroup = document.getElementById("cpMapDots");
    const container = document.getElementById("cpMapContainer");
    const tooltip = document.getElementById("cpMapTooltip");
    const tooltipCity = document.getElementById("cpTooltipCity");
    const tooltipDesc = document.getElementById("cpTooltipDesc");

    function init() {
      if (!dotsGroup || !container) return;

      cities.forEach((city, i) => {
        // Pulse ring
        const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pulse.setAttribute("cx", city.x);
        pulse.setAttribute("cy", city.y);
        pulse.setAttribute("r", "3");
        pulse.setAttribute("class", "cp-map-pulse");
        pulse.style.animationDelay = `${i * 0.2}s`;
        dotsGroup.appendChild(pulse);

        // Dot
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("cx", city.x);
        dot.setAttribute("cy", city.y);
        dot.setAttribute("r", "3.5");
        dot.setAttribute("class", "cp-map-dot");
        dot.setAttribute("data-city", city.name);
        dot.setAttribute("tabindex", "0");
        dot.setAttribute("role", "button");
        dot.setAttribute("aria-label", city.name);
        dotsGroup.appendChild(dot);

        // Events
        dot.addEventListener("mouseenter", (e) => showTooltip(city, e));
        dot.addEventListener("mouseleave", hideTooltip);
        dot.addEventListener("focus", (e) => showTooltip(city, e));
        dot.addEventListener("blur", hideTooltip);
        dot.addEventListener("click", () => toggleTooltip(city));
        dot.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleTooltip(city);
          }
        });
      });
    }

    function showTooltip(city, e) {
      if (!tooltip || !tooltipCity || !tooltipDesc) return;
      tooltipCity.textContent = city.name;
      tooltipDesc.textContent = city.desc;

      // Position near the SVG dot
      const svg = container.querySelector(".cp-map-svg");
      if (!svg) return;
      const svgRect = svg.getBoundingClientRect();
      const scaleX = svgRect.width / 1000;
      const scaleY = svgRect.height / 500;
      const x = svgRect.left + city.x * scaleX - container.getBoundingClientRect().left;
      const y = svgRect.top + city.y * scaleY - container.getBoundingClientRect().top;

      tooltip.style.left = `${x + 10}px`;
      tooltip.style.top = `${y - 20}px`;
      tooltip.classList.add("visible");
    }

    function hideTooltip() {
      if (tooltip) tooltip.classList.remove("visible");
    }

    function toggleTooltip(city) {
      if (tooltip && tooltip.classList.contains("visible")) {
        hideTooltip();
      } else {
        showTooltip(city);
      }
    }

    return { init };
  })();

  /* ============================================================
     7. 3D CARD TILT (desktop only, pointer devices)
     ============================================================ */
  const CardTilt = (() => {
    function init() {
      if (isTouch || reduce) return;

      document.querySelectorAll(".cp-card-3d-wrap").forEach((wrap) => {
        wrap.addEventListener("pointermove", (e) => {
          const card = wrap.querySelector(".cp-card-3d");
          if (!card || card.classList.contains("flipped")) return;

          const rect = wrap.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;

          card.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 8}deg) scale(1.02)`;
        });

        wrap.addEventListener("pointerleave", () => {
          const card = wrap.querySelector(".cp-card-3d");
          if (!card || card.classList.contains("flipped")) return;
          card.style.transform = "";
        });
      });
    }

    return { init };
  })();

  /* ============================================================
     8. IMAGE FADE-IN ON LOAD
     ============================================================ */
  function fadeImages() {
    document.querySelectorAll(".cp-card-front-img, .cp-about-img img, .cp-featured-video img").forEach((img) => {
      if (reduce) { img.classList.add("loaded"); return; }
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add("loaded");
      } else {
        img.addEventListener("load", () => img.classList.add("loaded"), { once: true });
        img.addEventListener("error", () => img.classList.add("loaded"), { once: true });
      }
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    HeroScene.init();
    ScrollAnimations.init();
    StatsCounter.init();
    PortfolioGrid.init();
    FeaturedFilm.init();
    TourMap.init();
    fadeImages();

    // Init card tilt after grid is rendered
    setTimeout(() => {
      CardTilt.init();
      fadeImages(); // re-scan late-injected images
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 0));
  } else {
    setTimeout(boot, 0);
  }

  // Re-scan on full load (grids built from content.js may inject late)
  window.addEventListener("load", () => {
    fadeImages();
    CardTilt.init();
  });
})();
