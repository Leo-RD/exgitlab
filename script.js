
/* ==========================================================
   Alcoo'Quiz — Test de pureté (alcool)
   Chaque « oui » retire 1 point de pureté sur le total des
   questions. Score final : 100 = pur·e, 0 = légende des bars.
   ========================================================== */
 
// ---------- Utilitaires ----------
const $ = (selector) => document.querySelector(selector);
 
// ==========================================================
// Les questions, classées par catégorie
// ==========================================================
const CATEGORIES = [
  {
    id: "general",
    emoji: "🍻",
    title: "Soirées & général",
    intro: "Pour commencer en douceur : tes premières fois et tes habitudes de soirée.",
    questions: [
      "As-tu déjà bu de l’alcool avant tes 16 ans ?",
      "As-tu déjà été ivre ?",
      "As-tu déjà fait un cul sec ?",
      "As-tu déjà mélangé plusieurs alcools « pour voir » ?",
      "As-tu déjà participé à un jeu à boire (beer-pong, cartes, « je n’ai jamais »…) ?",
      "As-tu déjà bu un alcool fort pur (vodka, whisky, rhum…) cul sec ou en shot ?",
      "As-tu déjà bu seul(e) chez toi, sans aucune occasion particulière ?",
      "As-tu déjà bu de l’alcool avant midi ?",
      "As-tu déjà bu de l’alcool en cours, en formation ou au travail ?",
      "As-tu déjà acheté de l’alcool alors que tu étais mineur(e) ?",
      "As-tu déjà bu plus de cinq verres en une seule soirée ?",
      "As-tu déjà relevé un défi alcool sur un coup de tête ?",
    ],
  },
  {
    id: "exces",
    emoji: "🤢",
    title: "Excès & lendemains",
    intro: "Quand la soirée a (un peu) dérapé et que le réveil est difficile.",
    questions: [
      "As-tu déjà vomi à cause de l’alcool ?",
      "As-tu déjà eu un trou noir (un moment dont tu ne te souviens plus du tout) ?",
      "As-tu déjà dormi dans un endroit improbable (voiture, toilettes, canapé d’un inconnu…) ?",
      "As-tu déjà raté un cours ou une journée de travail à cause d’une gueule de bois ?",
      "As-tu déjà perdu ton téléphone, tes clés ou ton portefeuille en soirée ?",
      "As-tu déjà dépensé bien plus que prévu au bar ?",
      "As-tu déjà juré de ne plus jamais boire… et recommencé la semaine suivante ?",
      "As-tu déjà pleuré en soirée sans vraie raison ?",
      "As-tu déjà chanté ou dansé en public dans un état que tu regrettes aujourd’hui ?",
      "As-tu déjà commandé un kebab ou une pizza à 3 h du matin ?",
      "As-tu déjà eu une gueule de bois qui a duré plus de 24 heures ?",
      "As-tu déjà dû être pris(e) en charge par des secours ou un médecin après avoir trop bu ?",
    ],
  },
  {
    id: "intime",
    emoji: "💋",
    title: "Côté intime",
    intro: "Les confidences de fin de soirée. Rassure-toi : personne ne regarde ton écran.",
    questions: [
      "As-tu déjà envoyé un message à ton ex en étant ivre ?",
      "As-tu déjà envoyé un texto, un vocal ou un snap que tu as regretté le lendemain ?",
      "As-tu déjà embrassé quelqu’un que tu venais de rencontrer pendant une soirée ?",
      "As-tu déjà embrassé quelqu’un en soirée et regretté dès le lendemain ?",
      "As-tu déjà terminé la soirée avec quelqu’un que tu n’aurais jamais regardé en étant sobre ?",
      "As-tu déjà dragué un(e) ami(e), un(e) collègue ou un(e) camarade en étant éméché(e) ?",
      "As-tu déjà avoué tes sentiments à quelqu’un après quelques verres ?",
      "As-tu déjà passé la nuit chez quelqu’un à l’issue d’une soirée bien arrosée ?",
      "As-tu déjà couché avec quelqu’un après avoir bu ?",
      "T’es-tu déjà réveillé(e) à côté de quelqu’un sans trop savoir comment tu en étais arrivé là ?",
      "T’es-tu déjà retrouvé(e) en sous-vêtements ou nu(e) en public à cause de l’alcool (baignade, défi, pari…) ?",
      "As-tu déjà fait une scène de jalousie ou une dispute avec ton/ta partenaire à cause de l’alcool ?",
    ],
  },
  {
    id: "risques",
    emoji: "🚨",
    title: "Limites & risques",
    intro: "Les questions sérieuses sous le vernis rigolo. Réponds franchement, c’est pour toi.",
    questions: [
      "As-tu déjà conduit (voiture, moto, scooter, vélo, trottinette) après avoir bu ?",
      "Es-tu déjà monté(e) dans la voiture d’un conducteur qui avait trop bu ?",
      "As-tu déjà mélangé de l’alcool avec des médicaments ou d’autres substances ?",
      "As-tu déjà laissé ton verre sans surveillance en soirée ?",
      "As-tu déjà bu plus de dix verres en une seule soirée ?",
      "As-tu déjà été ramené(e) chez toi parce que tu ne pouvais plus tenir debout ?",
      "As-tu déjà bu pour « oublier » un problème ou te donner du courage ?",
      "Un proche t’a-t-il déjà fait remarquer qu’il s’inquiétait de ta consommation ?",
      "As-tu déjà bu pendant plusieurs jours d’affilée ?",
      "T’es-tu déjà brouillé(e) avec un(e) ami(e) ou un proche à cause de l’alcool ?",
    ],
  },
];
 
// Liste à plat : chaque question connaît sa catégorie
const QUESTIONS = CATEGORIES.flatMap((cat, catIndex) =>
  cat.questions.map((text) => ({ text, catIndex }))
);
 
// ==========================================================
// Verdicts (selon le score de pureté, 100 = pur·e)
// ==========================================================
const VERDICTS = [
  { min: 90, emoji: "😇", title: "Pur(e) comme l’eau de source", text: "Soit tu es un ange, soit tu as menti sur au moins deux questions. Dans les deux cas, bravo." },
  { min: 75, emoji: "🙂", title: "Presque innocent(e)", text: "Quelques écarts de jeunesse, mais rien qui ne tienne dans un verre de limonade." },
  { min: 55, emoji: "🍷", title: "Fêtard(e) raisonnable", text: "Tu as vécu quelques belles soirées, et tu en gardes quelques anecdotes… et quelques regrets." },
  { min: 35, emoji: "🥴", title: "Habitué(e) des comptoirs", text: "Le barman connaît ton prénom. Tes amis connaissent tes histoires. Et ton téléphone garde des preuves." },
  { min: 15, emoji: "🍻", title: "Légende des soirées", text: "Tu as vu des choses que même un sommelier n’oserait pas raconter. Pense à t’hydrater." },
  { min: 0,  emoji: "🛸", title: "Dossier hors catégorie", text: "Ton foie demande une médiation. Un grand verre d’eau et une longue nuit de sommeil s’imposent." },
];
 
// ==========================================================
// Stockage du dernier score (localStorage, facultatif)
// ==========================================================
const BASELINE_KEY = "alcooquiz-purete-score";
 
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
let answers = [];       // tableau de booléens (true = « oui »)
let current = 0;
let lastScore = 0;
 
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(`#${id}`).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
 
function setProgress(done) {
  $("#progress-bar").style.width = `${(done / QUESTIONS.length) * 100}%`;
}
 
function startQuiz() {
  answers = new Array(QUESTIONS.length).fill(null);
  current = 0;
  showScreen("screen-test");
  renderQuestion();
}
 
function renderQuestion() {
  const q = QUESTIONS[current];
  const cat = CATEGORIES[q.catIndex];
  $("#test-step").textContent = `Question ${current + 1} / ${QUESTIONS.length}`;
  $("#test-title").textContent = `${cat.emoji} ${cat.title}`;
  $("#test-instructions").textContent = cat.intro;
  $("#question-text").textContent = q.text;
  $("#back-btn").disabled = current === 0;
  setProgress(current);
}
 
function answer(isYes) {
  answers[current] = isYes;
  if (current < QUESTIONS.length - 1) {
    current++;
    renderQuestion();
  } else {
    setProgress(QUESTIONS.length);
    showResults();
  }
}
 
function goBack() {
  if (current > 0) {
    current--;
    renderQuestion();
  }
}
 
function showResults() {
  const total = QUESTIONS.length;
  const yesCount = answers.filter(Boolean).length;
  const score = Math.round(((total - yesCount) / total) * 100);
  lastScore = score;
  const verdict = VERDICTS.find((v) => score >= v.min);
 
  $("#verdict-emoji").textContent = verdict.emoji;
  $("#verdict-title").textContent = verdict.title;
  $("#verdict-text").textContent = verdict.text;
  $("#yes-count").textContent = `${yesCount} « oui » sur ${total} questions`;
 
  // Animation du compteur
  const scoreEl = $("#score-value");
  const startT = performance.now();
  const animate = (now) => {
    const p = Math.min(1, (now - startT) / 1200);
    scoreEl.textContent = Math.round(score * p);
    if (p < 1) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
 
  // Jauge : plus le score de pureté est bas, plus elle se remplit vers le rouge
  const gaugeFill = $("#gauge-fill");
  gaugeFill.style.width = "100%";
  requestAnimationFrame(() => requestAnimationFrame(() => {
    gaugeFill.style.width = `${score}%`;
  }));
 
  // Détail par catégorie
  const perCat = CATEGORIES.map((cat, i) => {
    const idx = QUESTIONS.map((q, n) => (q.catIndex === i ? n : -1)).filter((n) => n >= 0);
    const yes = idx.filter((n) => answers[n]).length;
    const pct = Math.round(((idx.length - yes) / idx.length) * 100);
    return { cat, yes, count: idx.length, pct };
  });
 
  $("#breakdown").innerHTML = perCat.map((r) => `
    <li>
      <strong>${r.cat.emoji} ${r.cat.title}</strong>
      <span>${r.pct}/100</span>
      <div class="bd-bar"><div style="width:${r.pct}%"></div></div>
      <span class="bd-detail">${r.yes} « oui » sur ${r.count}</span>
    </li>`).join("");
 
  // Message d'aide si plusieurs situations à risque cochées
  const risk = perCat.find((r) => r.cat.id === "risques");
  $("#help-box").hidden = !(risk && risk.yes >= 4);
 
  renderBaseline(score);
  $("#save-baseline-btn").disabled = false;
  $("#save-baseline-btn").textContent = "Enregistrer ce score";
 
  $("#result-card").classList.toggle("tipsy", score < 35);
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
  if (diff > 5) comment = "Tu es plus sage que la dernière fois. 😇";
  else if (diff >= -5) comment = "À peu près le même niveau que ton score enregistré.";
  else comment = "Tu as pris quelques points de « fête » depuis la dernière fois. 🍻";
 
  box.innerHTML = `
    <strong>Ton score enregistré : ${baseline}/100</strong>
    (écart : ${diff > 0 ? "+" : ""}${diff} points)<br>${comment}`;
}
 
// ---------- Événements ----------
$("#promise-check").addEventListener("change", (e) => {
  $("#start-btn").disabled = !e.target.checked;
});
 
$("#start-btn").addEventListener("click", startQuiz);
$("#restart-btn").addEventListener("click", startQuiz);
$("#yes-btn").addEventListener("click", () => answer(true));
$("#no-btn").addEventListener("click", () => answer(false));
$("#back-btn").addEventListener("click", goBack);
 
$("#save-baseline-btn").addEventListener("click", (e) => {
  if (writeBaseline(lastScore)) {
    e.target.textContent = "Score enregistré ✔";
    e.target.disabled = true;
    renderBaseline(lastScore);
  } else {
    e.target.textContent = "Impossible d’enregistrer 😕";
  }
});
 