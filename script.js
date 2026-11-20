/* ==========================================================
   Alcoo'Quiz — logique du quiz
   Chaque épreuve renvoie un score de 0 (K.O.) à 100 (sobre).
   ========================================================== */

// ---------- Utilitaires ----------
const $ = (selector) => document.querySelector(selector);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (array) => array[Math.floor(Math.random() * array.length)];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * Convertit une mesure en score 0-100.
 * `best` donne 100, `worst` donne 0, interpolation linéaire entre les deux.
 * Fonctionne dans les deux sens (temps : plus petit = mieux, % : plus grand = mieux).
 */
function scale(value, best, worst) {
  return clamp((worst - value) / (worst - best), 0, 1) * 100;
}

/** Distance de Levenshtein : nombre de modifications pour passer de a à b. */
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

/** Attend que l'utilisateur clique sur un bouton "C'est parti". */
function waitForGo(stage, label = "C'est parti !") {
  return new Promise((resolve) => {
    stage.innerHTML = `<button class="btn btn-primary">${label}</button>`;
    stage.querySelector("button").addEventListener("click", resolve, { once: true });
  });
}

/** Affiche un champ de réponse et renvoie { value, time } à la validation. */
function askAnswer(container, { placeholder = "Ta réponse", numeric = true } = {}) {
  return new Promise((resolve) => {
    const form = document.createElement("form");
    form.className = "answer-form";
    form.innerHTML = `
      <input type="text" ${numeric ? 'inputmode="numeric"' : ""} autocomplete="off" placeholder="${placeholder}">
      <button class="btn btn-primary" type="submit">OK</button>`;
    container.appendChild(form);
    const input = form.querySelector("input");
    input.focus();
    const start = performance.now();
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (input.value.trim() === "") return;
      resolve({ value: input.value.trim(), time: performance.now() - start });
    });
  });
}

// ==========================================================
// Les épreuves
// ==========================================================

/* ---------- 1. Réflexes ---------- */
const reflexTest = {
  title: "⚡ Réflexes",
  instructions: "Clique (ou tape) sur la zone dès qu'elle devient verte. Pas avant, petit malin !",
  async run(stage) {
    const rounds = 3;
    const times = [];
    let falseStarts = 0;

    for (let i = 0; i < rounds; i++) {
      const result = await this.round(stage, i + 1, rounds);
      if (result === null) {
        falseStarts++;
        times.push(1000); // pénalité
      } else {
        times.push(result);
      }
    }

    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    return {
      score: scale(avg, 250, 650),
      detail: `Temps moyen : ${avg} ms${falseStarts ? ` · ${falseStarts} faux départ(s)` : ""}`,
    };
  },

  round(stage, n, total) {
    return new Promise((resolve) => {
      stage.innerHTML = `
        <p class="round-info">Essai ${n} / ${total}</p>
        <div class="reflex-pad wait">Attends le vert…</div>`;
      const pad = stage.querySelector(".reflex-pad");
      let start = null;

      const timer = setTimeout(() => {
        pad.className = "reflex-pad go";
        pad.textContent = "CLIQUE !";
        start = performance.now();
      }, randInt(1500, 4000));

      pad.addEventListener("pointerdown", async () => {
        if (start === null) {
          clearTimeout(timer);
          pad.className = "reflex-pad early";
          pad.textContent = "Trop tôt ! 🙃 Pénalité.";
          await sleep(1200);
          resolve(null);
        } else {
          const t = Math.round(performance.now() - start);
          pad.textContent = `${t} ms`;
          await sleep(900);
          resolve(t);
        }
      }, { once: true });
    });
  },
};

/* ---------- 2. Couleurs piégées (effet Stroop) ---------- */
const COLORS = [
  { name: "ROUGE", hex: "#ef4444" },
  { name: "BLEU", hex: "#3b82f6" },
  { name: "VERT", hex: "#22c55e" },
  { name: "JAUNE", hex: "#eab308" },
  { name: "VIOLET", hex: "#a855f7" },
];

const stroopTest = {
  title: "🎨 Couleurs piégées",
  instructions: "Clique sur la COULEUR dans laquelle le mot est écrit, pas sur le mot lui-même. Le cerveau adore se tromper.",
  async run(stage) {
    const rounds = 8;
    let correct = 0;
    let totalTime = 0;

    for (let i = 0; i < rounds; i++) {
      const word = pick(COLORS);
      const ink = pick(COLORS.filter((c) => c !== word));

      stage.innerHTML = `
        <p class="round-info">${i + 1} / ${rounds}</p>
        <div class="stroop-word" style="color:${ink.hex}">${word.name}</div>
        <div class="stroop-buttons">
          ${COLORS.map((c) => `<button class="btn" data-name="${c.name}">${c.name.toLowerCase()}</button>`).join("")}
        </div>
        <p class="feedback"></p>`;

      const start = performance.now();
      const chosen = await new Promise((resolve) => {
        stage.querySelectorAll(".stroop-buttons .btn").forEach((btn) =>
          btn.addEventListener("click", () => resolve(btn.dataset.name), { once: true })
        );
      });
      totalTime += performance.now() - start;

      const ok = chosen === ink.name;
      if (ok) correct++;
      const fb = stage.querySelector(".feedback");
      fb.textContent = ok ? "Bien vu ✔" : `Raté ✘ (c'était ${ink.name.toLowerCase()})`;
      fb.className = `feedback ${ok ? "ok" : "ko"}`;
      await sleep(600);
    }

    const avgTime = totalTime / rounds;
    const score = (correct / rounds) * 70 + scale(avgTime, 900, 3000) * 0.3;
    return {
      score,
      detail: `${correct}/${rounds} bonnes réponses · ${(avgTime / 1000).toFixed(1)} s par mot`,
    };
  },
};

/* ---------- 3. Calcul mental ---------- */
const mathTest = {
  title: "🧮 Calcul mental",
  instructions: "Quatre petits calculs. Réponds juste et vite. Les doigts sont interdits.",
  generate() {
    const a = randInt(17, 49), b = randInt(12, 48);
    const c = randInt(3, 9), d = randInt(6, 12);
    const e = randInt(50, 99), f = randInt(11, 49);
    const g = randInt(2, 5), h = randInt(3, 9), k = randInt(1, 9);
    return [
      { q: `${a} + ${b}`, a: a + b },
      { q: `${c} × ${d}`, a: c * d },
      { q: `${e} − ${f}`, a: e - f },
      { q: `${g} × ${h} + ${k}`, a: g * h + k },
    ];
  },
  async run(stage) {
    const questions = this.generate();
    let total = 0;
    let correct = 0;

    for (let i = 0; i < questions.length; i++) {
      const { q, a } = questions[i];
      stage.innerHTML = `
        <p class="round-info">Calcul ${i + 1} / ${questions.length}</p>
        <div class="big-question">${q} = ?</div>`;
      const { value, time } = await askAnswer(stage);

      const ok = Number(value.replace(",", ".")) === a;
      if (ok) {
        correct++;
        total += 50 + scale(time, 4000, 15000) * 0.5;
      }
      const fb = document.createElement("p");
      fb.className = `feedback ${ok ? "ok" : "ko"}`;
      fb.textContent = ok ? "Exact ✔" : `Faux ✘ (réponse : ${a})`;
      stage.appendChild(fb);
      stage.querySelector("input").disabled = true;
      await sleep(900);
    }

    return {
      score: total / questions.length,
      detail: `${correct}/${questions.length} calculs justes`,
    };
  },
};

/* ---------- 4. Mémoire ---------- */
const memoryTest = {
  title: "🧠 Mémoire",
  instructions: "Une suite de chiffres va s'afficher quelques secondes. Mémorise-la puis retape-la.",
  async run(stage) {
    const lengths = [5, 7];
    let ratioSum = 0;
    const results = [];

    for (let r = 0; r < lengths.length; r++) {
      const len = lengths[r];
      const digits = Array.from({ length: len }, () => randInt(0, 9)).join("");

      stage.innerHTML = `
        <p class="round-info">Série ${r + 1} / ${lengths.length} — mémorise !</p>
        <div class="memory-digits">${digits}</div>`;
      await sleep(2500 + len * 150);

      stage.innerHTML = `
        <p class="round-info">Série ${r + 1} / ${lengths.length}</p>
        <div class="big-question">C'était quoi déjà ? 🤔</div>`;
      const { value } = await askAnswer(stage, { placeholder: `${len} chiffres` });

      const answer = value.replace(/\D/g, "");
      let matches = 0;
      for (let i = 0; i < len; i++) if (answer[i] === digits[i]) matches++;
      ratioSum += matches / len;
      results.push(`${matches}/${len}`);

      const fb = document.createElement("p");
      fb.className = `feedback ${matches === len ? "ok" : "ko"}`;
      fb.textContent = matches === len ? "Parfait ✔" : `C'était ${digits}`;
      stage.appendChild(fb);
      stage.querySelector("input").disabled = true;
      await sleep(1200);
    }

    return {
      score: (ratioSum / lengths.length) * 100,
      detail: `Chiffres bien placés : ${results.join(" puis ")}`,
    };
  },
};

/* ---------- 5. Main stable ---------- */
const steadyTest = {
  title: "🎯 Main stable",
  instructions: "Place ton curseur (ou ton doigt) sur la cible puis suis-la pendant 7 secondes sans en sortir.",
  duration: 7000,
  radius: 38,
  run(stage) {
    return new Promise((resolve) => {
      stage.innerHTML = `
        <div class="steady-arena">
          <div class="steady-target"></div>
          <div class="steady-msg">Pose ton curseur sur la cible pour démarrer</div>
        </div>`;
      const arena = stage.querySelector(".steady-arena");
      const target = stage.querySelector(".steady-target");
      const msg = stage.querySelector(".steady-msg");

      const pointer = { x: -999, y: -999 };
      const pos = { x: 0, y: 0 };
      let started = false;
      let startTime = 0;
      let framesIn = 0;
      let framesTotal = 0;

      const isInside = () => Math.hypot(pointer.x - pos.x, pointer.y - pos.y) <= this.radius;

      const placeTarget = (elapsed) => {
        const w = arena.clientWidth;
        const h = arena.clientHeight;
        const t = elapsed / 1000;
        // Trajectoire de Lissajous qui accélère doucement
        const speed = 1 + t * 0.12;
        pos.x = w / 2 + (w / 2 - 50) * Math.sin(t * 1.1 * speed);
        pos.y = h / 2 + (h / 2 - 50) * Math.sin(t * 1.7 * speed + 0.6);
        target.style.left = `${pos.x}px`;
        target.style.top = `${pos.y}px`;
      };

      const onMove = (e) => {
        const rect = arena.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
        if (!started && isInside()) begin();
      };

      const begin = () => {
        started = true;
        startTime = performance.now();
        requestAnimationFrame(loop);
      };

      const loop = (now) => {
        const elapsed = now - startTime;
        placeTarget(elapsed);
        framesTotal++;
        const inside = isInside();
        if (inside) framesIn++;
        target.className = `steady-target ${inside ? "inside" : "outside"}`;
        msg.textContent = `${Math.ceil((this.duration - elapsed) / 1000)} s`;

        if (elapsed < this.duration) {
          requestAnimationFrame(loop);
        } else {
          arena.removeEventListener("pointermove", onMove);
          arena.removeEventListener("pointerdown", onMove);
          const ratio = framesIn / Math.max(1, framesTotal);
          msg.textContent = `Terminé ! ${Math.round(ratio * 100)} % du temps sur la cible`;
          setTimeout(() => resolve({
            score: scale(ratio, 0.9, 0.3),
            detail: `${Math.round(ratio * 100)} % du temps sur la cible`,
          }), 1300);
        }
      };

      arena.addEventListener("pointermove", onMove);
      arena.addEventListener("pointerdown", onMove);
      placeTarget(0);
    });
  },
};

/* ---------- 6. Virelangue au clavier ---------- */
const TWISTERS = [
  "Les chaussettes de l'archiduchesse sont-elles sèches, archi-sèches ?",
  "Un chasseur sachant chasser doit savoir chasser sans son chien.",
  "Si six scies scient six cyprès, six cent six scies scient six cent six cyprès.",
  "Panier, piano, panier, piano, panier, piano.",
  "Ton thé t'a-t-il ôté ta toux ?",
];

const typingTest = {
  title: "👅 Virelangue au clavier",
  instructions: "Recopie la phrase le plus fidèlement et le plus vite possible. Le copier-coller est désactivé, évidemment.",
  normalize: (s) => s.toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, " ").trim(),
  run(stage) {
    return new Promise((resolve) => {
      const phrase = pick(TWISTERS);
      stage.innerHTML = `
        <div class="tongue-twister">${phrase}</div>
        <textarea class="typing-area" placeholder="Tape ici…" spellcheck="false" autocomplete="off"></textarea>
        <button class="btn btn-primary">Valider</button>`;
      const area = stage.querySelector("textarea");
      const btn = stage.querySelector("button");
      let start = null;

      area.focus();
      area.addEventListener("paste", (e) => e.preventDefault());
      area.addEventListener("input", () => { if (start === null) start = performance.now(); });
      area.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); btn.click(); }
      });

      btn.addEventListener("click", () => {
        if (start === null) return;
        const time = performance.now() - start;
        const target = this.normalize(phrase);
        const typed = this.normalize(area.value);
        const distance = levenshtein(target, typed);
        const similarity = Math.max(0, 1 - distance / target.length);
        const msPerChar = time / target.length;

        resolve({
          score: similarity * 85 + scale(msPerChar, 180, 700) * 0.15,
          detail: `Précision ${Math.round(similarity * 100)} % · ${distance} faute(s) · ${(time / 1000).toFixed(1)} s`,
        });
      });
    });
  },
};

const TESTS = [reflexTest, stroopTest, mathTest, memoryTest, steadyTest, typingTest];

// ==========================================================
// Verdicts
// ==========================================================
const VERDICTS = [
  { min: 85, emoji: "🐪", title: "Sobre comme un chameau", text: "Réflexes affûtés, mémoire d'éléphant. Soit tu n'as rien bu, soit tu es un cas d'étude." },
  { min: 70, emoji: "🍷", title: "Légèrement pompette", text: "Quelques petites hésitations… Rien de grave, mais un grand verre d'eau ne ferait pas de mal." },
  { min: 50, emoji: "🥴", title: "Joyeusement éméché", text: "Le cerveau répond, mais avec un léger décalage. Tu racontes probablement les mêmes blagues en boucle." },
  { min: 30, emoji: "🍻", title: "Rond comme une queue de pelle", text: "Tes neurones font la chenille. Il est temps de passer à l'eau et de commander un taxi." },
  { min: 0,  emoji: "🛸", title: "En orbite", text: "Tu parles probablement aux lampadaires. Au lit, et ton téléphone reste dans ta poche !" },
];

const BASELINE_KEY = "alcooquiz-baseline";

function readBaseline() {
  try {
    const v = localStorage.getItem(BASELINE_KEY);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}

function writeBaseline(score) {
  try {
    localStorage.setItem(BASELINE_KEY, String(score));
    return true;
  } catch {
    return false;
  }
}

// ==========================================================
// Déroulement du quiz
// ==========================================================
let lastScore = 0;

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(`#${id}`).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setProgress(done) {
  $("#progress-bar").style.width = `${(done / TESTS.length) * 100}%`;
}

async function runQuiz() {
  const results = [];
  showScreen("screen-test");
  const stage = $("#stage");

  for (let i = 0; i < TESTS.length; i++) {
    const test = TESTS[i];
    setProgress(i);
    $("#test-step").textContent = `Épreuve ${i + 1} / ${TESTS.length}`;
    $("#test-title").textContent = test.title;
    $("#test-instructions").textContent = test.instructions;

    await waitForGo(stage);
    const { score, detail } = await test.run(stage);
    results.push({ title: test.title, score: Math.round(score), detail });
  }

  setProgress(TESTS.length);
  showResults(results);
}

function showResults(results) {
  const score = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
  lastScore = score;
  const verdict = VERDICTS.find((v) => score >= v.min);

  $("#verdict-emoji").textContent = verdict.emoji;
  $("#verdict-title").textContent = verdict.title;
  $("#verdict-text").textContent = verdict.text;
  $("#fake-rate").textContent = `${(((100 - score) / 100) * 2.5).toFixed(2).replace(".", ",")} g/L`;

  // Animation du compteur
  const scoreEl = $("#score-value");
  const startT = performance.now();
  const animate = (now) => {
    const p = Math.min(1, (now - startT) / 1200);
    scoreEl.textContent = Math.round(score * p);
    if (p < 1) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);

  // Jauge : plus le score est bas, plus elle se remplit vers le rouge
  const gaugeFill = $("#gauge-fill");
  gaugeFill.style.width = "100%";
  requestAnimationFrame(() => requestAnimationFrame(() => {
    gaugeFill.style.width = `${score}%`;
  }));

  $("#breakdown").innerHTML = results.map((r) => `
    <li>
      <strong>${r.title}</strong>
      <span>${r.score}/100</span>
      <div class="bd-bar"><div style="width:${r.score}%"></div></div>
      <span class="bd-detail">${r.detail}</span>
    </li>`).join("");

  renderBaseline(score);
  $("#save-baseline-btn").disabled = false;
  $("#save-baseline-btn").textContent = "Enregistrer comme référence à jeun";

  $("#result-card").classList.toggle("tipsy", score < 50);
  showScreen("screen-result");
}

function renderBaseline(score) {
  const baseline = readBaseline();
  const box = $("#baseline-info");
  if (baseline === null) {
    box.innerHTML = "";
    return;
  }
  const diff = score - baseline;
  let comment;
  if (diff >= -5) comment = "Tu es au niveau de ta référence à jeun. Chapeau. 🎩";
  else if (diff >= -15) comment = "Un peu en dessous de ta référence… fatigue ou premier verre ? 🤔";
  else comment = "Nettement moins bien qu'à jeun. Les chiffres ne mentent pas. 🚕";

  box.innerHTML = `
    <strong>Ta référence à jeun : ${baseline}/100</strong>
    (écart : ${diff > 0 ? "+" : ""}${diff} points)<br>${comment}`;
}

// ---------- Événements ----------
$("#promise-check").addEventListener("change", (e) => {
  $("#start-btn").disabled = !e.target.checked;
});

$("#start-btn").addEventListener("click", runQuiz);
$("#restart-btn").addEventListener("click", runQuiz);

$("#save-baseline-btn").addEventListener("click", (e) => {
  if (writeBaseline(lastScore)) {
    e.target.textContent = "Référence enregistrée ✔";
    e.target.disabled = true;
    renderBaseline(lastScore);
  } else {
    e.target.textContent = "Impossible d'enregistrer 😕";
  }
});
