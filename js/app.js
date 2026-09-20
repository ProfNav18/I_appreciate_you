(() => {
  "use strict";

  const SCREENS = ["landing", "level1", "level2", "level3", "level4", "final"];
  const STORAGE_KEY = "appreciate:progress";

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
    stage.innerHTML = "";
    let caught = 0;
    countEl.textContent = `Caught: 0 / ${goal}`;

    clearInterval(level1Timer);

    const symbols = ["☕", "🤎", "💛", "🧡"];
    const stageWidth = () => stage.clientWidth;
    const HEART_SIZE = 46;
    const activeLefts = [];

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

    function spawnHeart() {
      if (caught >= goal) return;
      const heart = document.createElement("div");
      heart.className = "falling-heart";
      heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
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

      function catchHeart(e) {
        e.preventDefault();
        if (caught >= goal) return;
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

      heart.addEventListener("pointerdown", catchHeart, { once: true });
      stage.appendChild(heart);
    }

    for (let i = 0; i < 4; i++) setTimeout(spawnHeart, i * 280);
    level1Timer = setInterval(spawnHeart, 650);
  }

  /* ==================================================================
     LEVEL 2 — Match the Memories
  ================================================================== */
  function initLevel2() {
    const grid = el("l2Grid");
    const countEl = el("l2Count");
    grid.innerHTML = "";

    const icons = ["☕", "🤎", "💛", "🧡", "🍪", "✨"];
    const deck = [...icons, ...icons]
      .map((v) => ({ v, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((x) => x.v);

    let matches = 0;
    let flipped = [];
    let lock = false;
    countEl.textContent = "Pairs: 0 / 6";

    deck.forEach((icon) => {
      const card = document.createElement("div");
      card.className = "mem-card";
      card.innerHTML = `<span class="face">${icon}</span>`;
      card.dataset.icon = icon;

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
     LEVEL 3 — Pop balloons spelling THANKS
  ================================================================== */
  function initLevel3() {
    const target = el("l3Target");
    const stage = el("l3Stage");
    target.innerHTML = "";
    stage.innerHTML = "";

    const word = ["T", "H", "A", "N", "K", "S"];
    const colors = ["#b9531f", "#8b5a2b", "#c99b62", "#d9a441", "#a97b45", "#c1502e"];
    let progressIndex = 0;

    word.forEach((letter, i) => {
      const slot = document.createElement("div");
      slot.className = "word-slot";
      slot.dataset.index = i;
      target.appendChild(slot);
    });

    const shuffled = word
      .map((v) => ({ v, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((x) => x.v);

    const stageWidth = () => stage.clientWidth;
    const stageHeight = () => stage.clientHeight;
    const positions = [];
    const cols = 5;
    shuffled.forEach((letter, i) => {
      const col = i % cols;
      const cellWidth = (stageWidth() || 300) / cols;
      const left = col * cellWidth + cellWidth / 2 - 29 + (Math.random() * 16 - 8);
      const top = 20 + Math.random() * Math.max((stageHeight() || 300) - 120, 60);
      positions.push({ left, top });
    });

    shuffled.forEach((letter, i) => {
      const balloon = document.createElement("div");
      balloon.className = "balloon";
      balloon.textContent = letter;
      balloon.dataset.letter = letter;
      balloon.style.background = colors[i % colors.length];
      balloon.style.left = Math.max(positions[i].left, 6) + "px";
      balloon.style.top = positions[i].top + "px";
      balloon.style.animationDelay = (Math.random() * 2).toFixed(2) + "s";

      balloon.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (balloon.classList.contains("popped")) return;
        const needed = word[progressIndex];

        if (letter === needed) {
          balloon.classList.add("popped");
          const slot = target.querySelector(`[data-index="${progressIndex}"]`);
          slot.textContent = letter;
          slot.classList.add("filled");
          progressIndex++;

          if (progressIndex === word.length) {
            showUnlockOverlay(
              "level4",
              "Level 3 Complete! 🎈",
              "You make ordinary days feel worth writing about."
            );
          }
        } else {
          balloon.classList.add("wiggle");
          setTimeout(() => balloon.classList.remove("wiggle"), 300);
        }
      });

      stage.appendChild(balloon);
    });
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
  initHeartsBg();
  goTo(SCREENS[getFurthestUnlocked()]);
})();
