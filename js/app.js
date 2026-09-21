(() => {
  "use strict";

  const SCREENS = ["landing", "level1", "level2", "level3", "level4", "final"];
  const STORAGE_KEY = "appreciate:progress";

const SUPABASE_URL = "https://cqqzsagjrgajnvyarxth.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_iFPxkxE2uKqMRm1L2Edwcw_addc_teh";
  const supabaseClient =
    window.supabase && window.supabase.createClient
      ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null;

  // Defaults match the original hardcoded personal version. A ?order=<id>
  // link overrides these from Supabase; no param (or a failed fetch that
  // falls back silently isn't acceptable here, so a bad id shows an error
  // screen instead) means the page behaves exactly as it always has.
  const CONFIG = {
    partnerName: "Ammu",
    signatureName: "Purush",
    letterParagraphs: null,
    gratitudeMessages: null,
    photoUrls: null,
  };

  async function loadOrder() {
    const orderId = new URLSearchParams(location.search).get("order");
    if (!orderId) return true;
    if (!supabaseClient) return true;

    try {
      const { data, error } = await supabaseClient
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error || !data) {
        showOrderNotFound();
        return false;
      }

      CONFIG.partnerName = data.partner_name || CONFIG.partnerName;
      CONFIG.signatureName = data.signature_name || CONFIG.signatureName;
      CONFIG.letterParagraphs = Array.isArray(data.letter_paragraphs) && data.letter_paragraphs.length
        ? data.letter_paragraphs
        : null;
      CONFIG.gratitudeMessages = Array.isArray(data.gratitude_messages) && data.gratitude_messages.length === 6
        ? data.gratitude_messages
        : null;
      // length check only -- NOT "some truthy": a buyer who skips every
      // photo still gets their own 6 placeholder cards, not a silent
      // fallback to the site owner's personal hardcoded photos.
      CONFIG.photoUrls = Array.isArray(data.photo_urls) && data.photo_urls.length === 6
        ? data.photo_urls
        : null;
      return true;
    } catch (e) {
      showOrderNotFound();
      return false;
    }
  }

  function showOrderNotFound() {
    const card = document.querySelector("#screen-landing .card");
    card.innerHTML = `
      <div class="big-emoji">🤔</div>
      <h1 class="title">Hmm...</h1>
      <p class="subtitle">We couldn't find this link. Double check it was copied correctly.</p>
    `;
  }

  function applyConfig() {
    [el("partnerName"), el("partnerNameFinal")].forEach((n) => {
      if (n) n.textContent = CONFIG.partnerName;
    });
    [el("signatureName"), el("footerSignature")].forEach((n) => {
      if (n) n.textContent = CONFIG.signatureName;
    });

    if (CONFIG.letterParagraphs) {
      const container = document.querySelector("#letterPaper .letter-text");
      container.innerHTML =
        CONFIG.letterParagraphs.map((p) => `<p>${p}</p>`).join("") +
        `<p class="letter-signature">Always,<br>${CONFIG.signatureName} 💛</p>`;
    }
  }

  const el = (id) => document.getElementById(id);
  const screens = {
    landing: el("screen-landing"),
    level1: el("screen-level1"),
    level2: el("screen-level2"),
    level3: el("screen-level3"),
    level4: el("screen-level4"),
    final: el("screen-final"),
  };
  const progressBar = el("progress");
  const progressLabel = el("progressLabel");
  const dots = document.querySelectorAll(".dot");

  function getFurthestUnlocked() {
    const saved = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    if (Number.isInteger(saved) && saved >= 0 && saved < SCREENS.length) return saved;
    return 0;
  }

  function saveProgress(index) {
    const current = getFurthestUnlocked();
    if (index > current) localStorage.setItem(STORAGE_KEY, String(index));
  }

  function showScreen(name) {
    Object.entries(screens).forEach(([key, node]) => {
      node.hidden = key !== name;
    });

    const levelNum = { level1: 1, level2: 2, level3: 3, level4: 4 }[name];
    if (levelNum) {
      progressBar.hidden = false;
      progressLabel.textContent = `Level ${levelNum} of 4`;
      dots.forEach((dot) => {
        const n = parseInt(dot.dataset.dot, 10);
        dot.classList.toggle("done", n < levelNum);
        dot.classList.toggle("active", n === levelNum);
      });
    } else {
      progressBar.hidden = true;
    }

    saveProgress(SCREENS.indexOf(name));
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function goTo(name) {
    showScreen(name);
    if (name === "level1") initLevel1();
    if (name === "level2") initLevel2();
    if (name === "level3") initLevel3();
    if (name === "level4") initLevel4();
    if (name === "final") initFinal();
  }

  /* ---------------- Unlock overlay (locked -> win -> unlock -> next) ---------------- */
  const unlockOverlay = el("unlockOverlay");
  const lockIcon = el("lockIcon");
  const unlockTitle = el("unlockTitle");
  const unlockSub = el("unlockSub");
  const btnContinue = el("btnContinue");
  let pendingNext = null;

  function spawnSparkles() {
    const card = unlockOverlay.querySelector(".unlock-card");
    const symbols = ["✨", "💗", "⭐", "💫"];
    for (let i = 0; i < 10; i++) {
      const s = document.createElement("span");
      s.className = "sparkle-piece";
      s.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      s.style.left = "50%";
      s.style.top = "70px";
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 70;
      s.style.setProperty("--sx", Math.cos(angle) * dist + "px");
      s.style.setProperty("--sy", Math.sin(angle) * dist + "px");
      card.appendChild(s);
      s.addEventListener("animationend", () => s.remove());
    }
  }

  function showUnlockOverlay(nextScreen, title, sub) {
    pendingNext = nextScreen;
    unlockTitle.textContent = title;
    unlockSub.textContent = sub;
    lockIcon.textContent = "🔒";
    lockIcon.className = "lock-icon";
    btnContinue.hidden = true;

    unlockOverlay.hidden = false;
    requestAnimationFrame(() => unlockOverlay.classList.add("show"));

    setTimeout(() => {
      lockIcon.classList.add("shaking");
    }, 300);

    setTimeout(() => {
      lockIcon.textContent = "🔓";
      lockIcon.className = "lock-icon unlocked";
      spawnSparkles();
      btnContinue.hidden = false;
    }, 800);
  }

  function advanceFromOverlay() {
    if (!pendingNext) return;
    const next = pendingNext;
    pendingNext = null;
    unlockOverlay.classList.remove("show");
    setTimeout(() => {
      unlockOverlay.hidden = true;
      goTo(next);
    }, 250);
  }

  btnContinue.addEventListener("click", advanceFromOverlay);

  /* ---------------- Mistake overlay (Level 1 wrong tap) ---------------- */
  const mistakeOverlay = el("mistakeOverlay");
  const btnTryAgain = el("btnTryAgain");
  let onTryAgain = null;

  function showMistakeOverlay(retryFn) {
    onTryAgain = retryFn;
    mistakeOverlay.hidden = false;
    requestAnimationFrame(() => mistakeOverlay.classList.add("show"));
  }

  btnTryAgain.addEventListener("click", () => {
    mistakeOverlay.classList.remove("show");
    setTimeout(() => {
      mistakeOverlay.hidden = true;
      if (onTryAgain) onTryAgain();
    }, 250);
  });

  /* ---------------- Floating background ambience ---------------- */
  function initHeartsBg() {
    const bg = el("heartsBg");
    const symbols = ["☕", "🤎", "💛", "🧡", "✨"];
    const count = window.innerWidth < 500 ? 12 : 18;
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      span.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      span.style.left = Math.random() * 100 + "vw";
      span.style.setProperty("--drift", (Math.random() * 60 - 30) + "px");
      span.style.animationDuration = 10 + Math.random() * 12 + "s";
      span.style.animationDelay = Math.random() * 14 + "s";
      span.style.fontSize = 16 + Math.random() * 16 + "px";
      bg.appendChild(span);
    }
  }

  /* ==================================================================
     LEVEL 1 — Catch the Little Things
  ================================================================== */
  let level1Timer = null;

  function initLevel1() {
    const stage = el("l1Stage");
    const countEl = el("l1Count");
    const goal = parseInt(el("l1Goal").textContent, 10);

    const TARGET = "☕";
    const DISTRACTORS = ["🍪", "🍩", "🧁"];
    const stageWidth = () => stage.clientWidth;
    const HEART_SIZE = 46;

    let caught = 0;
    let activeLefts = [];

    clearInterval(level1Timer);

    function pickLeft() {
      const maxLeft = Math.max(stageWidth() - HEART_SIZE, 10);
      let left = Math.random() * maxLeft;
      for (let attempt = 0; attempt < 6; attempt++) {
        const tooClose = activeLefts.some((l) => Math.abs(l - left) < HEART_SIZE + 14);
        if (!tooClose) break;
        left = Math.random() * maxLeft;
      }
      return left;
    }

    function restart() {
      caught = 0;
      activeLefts = [];
      countEl.textContent = `Caught: 0 / ${goal}`;
      stage.innerHTML = "";
    }

    function spawnHeart() {
      if (caught >= goal) return;
      const isTarget = Math.random() < 0.55;
      const symbol = isTarget ? TARGET : DISTRACTORS[Math.floor(Math.random() * DISTRACTORS.length)];

      const heart = document.createElement("div");
      heart.className = "falling-heart";
      heart.textContent = symbol;
      const left = pickLeft();
      activeLefts.push(left);
      heart.style.left = left + "px";
      const duration = 3.6 + Math.random() * 2.2;
      heart.style.animationDuration = duration + "s";

      function cleanup() {
        const idx = activeLefts.indexOf(left);
        if (idx !== -1) activeLefts.splice(idx, 1);
        heart.remove();
      }

      heart.addEventListener("animationend", cleanup);

      function tapHeart(e) {
        e.preventDefault();
        if (caught >= goal) return;

        if (!isTarget) {
          heart.classList.add("wrong-tap");
          clearInterval(level1Timer);
          setTimeout(() => showMistakeOverlay(initLevel1), 220);
          return;
        }

        caught++;
        countEl.textContent = `Caught: ${caught} / ${goal}`;

        const burst = document.createElement("div");
        burst.className = "pop-burst";
        burst.textContent = "✨";
        burst.style.left = heart.style.left;
        burst.style.top = heart.getBoundingClientRect().top - stage.getBoundingClientRect().top + "px";
        stage.appendChild(burst);
        burst.addEventListener("animationend", () => burst.remove());

        cleanup();

        if (caught >= goal) {
          clearInterval(level1Timer);
          showUnlockOverlay(
            "level2",
            "Level 1 Complete! ☕",
            "Every little thing you do for me doesn't go unnoticed."
          );
        }
      }

      heart.addEventListener("pointerdown", tapHeart, { once: true });
      stage.appendChild(heart);
    }

    restart();
    for (let i = 0; i < 4; i++) setTimeout(spawnHeart, i * 280);
    level1Timer = setInterval(spawnHeart, 650);
  }

  /* ==================================================================
     LEVEL 2 — Match the Memories
  ================================================================== */
  // Six couple photos, each appearing twice as a matching pair. If a photo
  // hasn't been added yet at its path, the card falls back to a colored
  // placeholder + camera icon so the grid still looks intentional and the
  // game stays fully playable while you're adding the real pictures.
  const DEFAULT_MEMORY_PHOTOS = [
    "assets/couple/1.jpg",
    "assets/couple/2.jpg",
    "assets/couple/3.jpg",
    "assets/couple/4.jpg",
    "assets/couple/5.jpg",
    "assets/couple/6.jpg",
  ];
  const MEMORY_FALLBACK_COLORS = ["#b9531f", "#8b5a2b", "#c99b62", "#d9a441", "#a97b45", "#c1502e"];

  function initLevel2() {
    const grid = el("l2Grid");
    const countEl = el("l2Count");
    grid.innerHTML = "";

    const memoryPhotos = CONFIG.photoUrls || DEFAULT_MEMORY_PHOTOS;
    // Pairs are keyed by index, not by URL: a buyer can skip several photos
    // (leaving multiple null entries), and those must still count as
    // distinct pairs rather than all matching each other as "null".
    const deck = [...memoryPhotos.keys(), ...memoryPhotos.keys()]
      .map((v) => ({ v, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((x) => x.v);

    let matches = 0;
    let flipped = [];
    let lock = false;
    countEl.textContent = "Pairs: 0 / 6";

    deck.forEach((index) => {
      const photo = memoryPhotos[index];
      const card = document.createElement("div");
      card.className = "mem-card";
      card.dataset.icon = String(index);

      const face = document.createElement("span");
      face.className = "face";

      function showFallback() {
        face.innerHTML = "📷";
        face.classList.add("face-fallback");
        face.style.background = MEMORY_FALLBACK_COLORS[index % MEMORY_FALLBACK_COLORS.length];
      }

      if (photo) {
        const img = document.createElement("img");
        img.src = photo;
        img.alt = "";
        img.onerror = showFallback;
        face.appendChild(img);
      } else {
        showFallback();
      }
      card.appendChild(face);

      card.addEventListener("click", () => {
        if (lock) return;
        if (card.classList.contains("flipped") || card.classList.contains("matched")) return;

        card.classList.add("flipped");
        flipped.push(card);

        if (flipped.length === 2) {
          lock = true;
          const [a, b] = flipped;
          if (a.dataset.icon === b.dataset.icon) {
            a.classList.add("matched");
            b.classList.add("matched");
            flipped = [];
            lock = false;
            matches++;
            countEl.textContent = `Pairs: ${matches} / 6`;
            if (matches === 6) {
              showUnlockOverlay(
                "level3",
                "Level 2 Complete! 🤎",
                "Every memory with you is one I hold onto."
              );
            }
          } else {
            setTimeout(() => {
              a.classList.add("shake");
              b.classList.add("shake");
              setTimeout(() => {
                a.classList.remove("flipped", "shake");
                b.classList.remove("flipped", "shake");
                flipped = [];
                lock = false;
              }, 350);
            }, 450);
          }
        }
      });

      grid.appendChild(card);
    });
  }

  /* ==================================================================
     LEVEL 3 — Gratitude Wheel
  ================================================================== */
  function initLevel3() {
    const wheel = el("l3Wheel");
    const spinBtn = el("l3SpinBtn");
    const messageBox = el("l3Message");
    const countEl = el("l3Count");

    const messages = CONFIG.gratitudeMessages || [
      "For always making time for me, even when you're busy.",
      "For the way you remember the little details.",
      "For your patience on my worst days.",
      "For making ordinary moments feel special.",
      "For loving me exactly as I am.",
      "For simply being you.",
    ];
    const icons = ["☕", "🤎", "💛", "🧡", "✨", "🍪"];
    const colors = ["#b9531f", "#8b5a2b", "#c99b62", "#d9a441", "#a97b45", "#c1502e"];
    const segmentDeg = 360 / messages.length;

    wheel.style.background =
      "conic-gradient(from 0deg, " +
      colors.map((c, i) => `${c} ${i * segmentDeg}deg ${(i + 1) * segmentDeg}deg`).join(", ") +
      ")";

    wheel.innerHTML = "";
    icons.forEach((icon, i) => {
      const label = document.createElement("span");
      label.className = "wheel-label";
      label.textContent = icon;
      const angle = i * segmentDeg + segmentDeg / 2;
      label.style.transform = `translate(-50%,-50%) rotate(${angle}deg) translateY(-88px) rotate(${-angle}deg)`;
      wheel.appendChild(label);
    });

    messageBox.hidden = true;
    messageBox.textContent = "";
    spinBtn.disabled = false;
    countEl.textContent = `Revealed: 0 / ${messages.length}`;

    // A shuffled "bag" of segment indices — pops one per spin so every
    // message is guaranteed to appear exactly once, no frustrating repeats,
    // and the level always finishes in exactly 6 spins.
    const bag = messages
      .map((_, i) => i)
      .sort(() => Math.random() - 0.5);
    let revealed = 0;
    let currentRotation = 0;

    spinBtn.onclick = () => {
      if (bag.length === 0) return;
      spinBtn.disabled = true;
      messageBox.hidden = true;

      const targetIndex = bag.pop();
      const targetCenter = targetIndex * segmentDeg + segmentDeg / 2;
      // Rotate clockwise so the wheel's targetCenter angle ends up under the
      // fixed top pointer (0deg), plus a few extra full spins for effect.
      const finalMod = (360 - targetCenter + 360) % 360;
      const delta = (finalMod - (currentRotation % 360) + 360) % 360;
      currentRotation += 360 * 5 + delta;
      wheel.style.transform = `rotate(${currentRotation}deg)`;

      setTimeout(() => {
        revealed++;
        messageBox.textContent = messages[targetIndex];
        messageBox.hidden = false;
        countEl.textContent = `Revealed: ${revealed} / ${messages.length}`;

        if (bag.length === 0) {
          showUnlockOverlay(
            "level4",
            "Level 3 Complete! ☕",
            "You make ordinary days feel worth writing about."
          );
        } else {
          spinBtn.disabled = false;
        }
      }, 3300);
    };
  }

  /* ==================================================================
     LEVEL 4 — One Last Thing (runaway "not really" button)
  ================================================================== */
  function initLevel4() {
    const stage = el("l4Stage");
    const btnYes = el("btnYes");
    const btnNo = el("btnNo");
    let scale = 1;
    let dodges = 0;

    btnYes.style.transform = "scale(1)";
    btnNo.style.position = "static";
    btnNo.style.transform = "none";

    function dodge() {
      dodges++;
      if (dodges > 6) {
        btnNo.style.display = "none";
        return;
      }
      const stageRect = stage.getBoundingClientRect();
      const btnRect = btnNo.getBoundingClientRect();
      const maxX = Math.max(stageRect.width - btnRect.width, 10);
      const maxY = Math.max(stageRect.height - btnRect.height, 10);
      const x = Math.random() * maxX;
      const y = Math.random() * maxY;

      btnNo.style.position = "absolute";
      btnNo.style.left = x + "px";
      btnNo.style.top = y + "px";

      scale = Math.min(scale + 0.08, 1.6);
      btnYes.style.transform = `scale(${scale})`;
    }

    const dodgeEvents = ["pointerenter", "touchstart"];
    dodgeEvents.forEach((evt) =>
      btnNo.addEventListener(evt, (e) => {
        e.preventDefault();
        dodge();
      })
    );
    btnNo.addEventListener("click", (e) => {
      e.preventDefault();
      dodge();
    });

    btnYes.onclick = () =>
      showUnlockOverlay(
        "final",
        "Level 4 Complete! 💛",
        "Now let me show you something I wrote for you."
      );
  }

  /* ==================================================================
     FINAL — coffee-stained letter reveal + confetti
  ================================================================== */
  function initFinal() {
    const crumpled = el("letterCrumpled");
    const paper = el("letterPaper");

    paper.hidden = true;
    crumpled.hidden = false;

    // onclick (not addEventListener) so replaying the game never stacks a
    // second handler on the same button.
    crumpled.onclick = () => {
      crumpled.hidden = true;
      paper.hidden = false;
    };

    fireConfetti();
  }

  function fireConfetti() {
    const layer = el("confettiLayer");
    const colors = ["#b9531f", "#8b5a2b", "#d9a441", "#f6e8c8", "#c1502e"];
    const count = 60;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      const size = 6 + Math.random() * 6;
      piece.style.width = size + "px";
      piece.style.height = size * 1.6 + "px";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = 2.5 + Math.random() * 2 + "s";
      piece.style.animationDelay = Math.random() * 0.6 + "s";
      layer.appendChild(piece);
      piece.addEventListener("animationend", () => piece.remove());
    }
  }

  /* ---------------- Wire up static buttons ---------------- */
  el("btnStart").addEventListener("click", () => goTo("level1"));
  el("btnReplay").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    goTo("landing");
  });

  /* ---------------- Boot ---------------- */
  (async () => {
    initHeartsBg();
    const ok = await loadOrder();
    if (!ok) return;
    applyConfig();
    goTo(SCREENS[getFurthestUnlocked()]);
  })();
})();
