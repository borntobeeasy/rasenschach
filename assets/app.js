const thesisPool = [
  { id: "t1", text: "Bayern bleibt ohne Gegentor.", result: "positive" },
  { id: "t2", text: "Dortmund schiesst mindestens drei Tore.", result: "negative" },
  { id: "t3", text: "Leverkusen gewinnt das Zentrum klar.", result: "positive" },
  { id: "t4", text: "Stuttgart verliert nach Führung.", result: "negative" },
  { id: "t5", text: "Frankfurt erzielt ein Standardtor.", result: "positive" },
  { id: "t6", text: "Leipzig dominiert die xG-Werte.", result: "positive" },
  { id: "t7", text: "Freiburg bleibt unter 40 Prozent Ballbesitz.", result: "positive" },
  { id: "t8", text: "Gladbach gewinnt auswärts.", result: "negative" },
  { id: "t9", text: "Union Berlin spielt zu null.", result: "negative" },
  { id: "t10", text: "Wolfsburg trifft in beiden Halbzeiten.", result: "positive" },
  { id: "t11", text: "Mainz holt mindestens einen Punkt.", result: "positive" },
  { id: "t12", text: "Hoffenheim kassiert weniger als zwei Tore.", result: "negative" }
];

const snakeOrder = ["A", "B", "B", "A", "A", "B", "B", "A", "A", "B", "B", "A"];

const fieldTemplates = [
  { id: "plus3", label: "+3 Feld", type: "plus3" },
  { id: "plus1", label: "+1 Feld", type: "plus1" },
  { id: "minus1", label: "-1 Feld", type: "minus1" },
  { id: "pm3", label: "±3 Feld", type: "pm3" },
  { id: "random-a", label: "Zufallsfeld I", type: "random" },
  { id: "random-b", label: "Zufallsfeld II", type: "random" }
];

const randomFieldEffects = [
  { label: "Heisser Lauf", positive: 2, negative: -2 },
  { label: "Abseitsfalle", positive: 1, negative: -1 },
  { label: "VAR-Moment", positive: 3, negative: -3 },
  { label: "Chaosball", positive: 0, negative: 2 }
];

const figureTemplates = [
  {
    id: "rook",
    icon: "♜",
    title: "Turm (Torwart)",
    summary: "+1 bei weisser Weste, +1 extra bei meisten Paraden",
    scores: { A: 2, B: 1 },
    detailA: "Spieler A: weisse Weste + meiste Paraden",
    detailB: "Spieler B: nur weisse Weste"
  },
  {
    id: "bishop",
    icon: "♝",
    title: "Laeufer (Ausdauer)",
    summary: "+1 Team-km, +2 Spiel-km, +3 Spieltag-km",
    scores: { A: 1, B: 3 },
    detailA: "Spieler A: meiste km im Team",
    detailB: "Spieler B: meiste km im Spiel"
  },
  {
    id: "queen",
    icon: "♛",
    title: "Dame (Playmaker)",
    summary: "+1 Punkt pro Scorer",
    scores: { A: 2, B: 1 },
    detailA: "Spieler A: 2 Scorer",
    detailB: "Spieler B: 1 Scorer"
  },
  {
    id: "king",
    icon: "♚",
    title: "Koenig (Torjaeger)",
    summary: "+1 Punkt pro Tor",
    scores: { A: 1, B: 2 },
    detailA: "Spieler A: 1 Tor",
    detailB: "Spieler B: 2 Tore"
  },
  {
    id: "knight",
    icon: "♞",
    title: "Springer (Random)",
    summary: "Diese Woche: erfolgreiche Dribblings",
    scores: { A: 2, B: 0 },
    detailA: "Spieler A: fuehrt die Dribbling-Wertung an",
    detailB: "Spieler B: kein Bonus im Random-Slot"
  }
];

const elements = {
  thesisPool: document.getElementById("thesis-pool"),
  pickNumber: document.getElementById("pick-number"),
  currentPlayer: document.getElementById("current-player"),
  phaseLabel: document.getElementById("phase-label"),
  turnLabel: document.getElementById("turn-label"),
  snakeDisplay: document.getElementById("snake-display"),
  placementStatus: document.getElementById("placement-status"),
  draftedA: document.getElementById("drafted-a"),
  draftedB: document.getElementById("drafted-b"),
  fieldGridA: document.getElementById("field-grid-a"),
  fieldGridB: document.getElementById("field-grid-b"),
  figureGrid: document.getElementById("figure-grid"),
  scoreA: document.getElementById("score-a"),
  scoreB: document.getElementById("score-b"),
  draftCountA: document.getElementById("draft-count-a"),
  draftCountB: document.getElementById("draft-count-b"),
  placedCount: document.getElementById("placed-count"),
  resolveButton: document.getElementById("resolve-button"),
  autoPlaceButton: document.getElementById("auto-place-button"),
  resetButton: document.getElementById("reset-button"),
  thesisPointsA: document.getElementById("thesis-points-a"),
  thesisPointsB: document.getElementById("thesis-points-b"),
  figurePointsA: document.getElementById("figure-points-a"),
  figurePointsB: document.getElementById("figure-points-b"),
  winnerPill: document.getElementById("winner-pill"),
  breakdownA: document.getElementById("breakdown-a"),
  breakdownB: document.getElementById("breakdown-b"),
  liveScoreA: document.getElementById("live-score-a"),
  liveScoreB: document.getElementById("live-score-b"),
  liveSubA: document.getElementById("live-sub-a"),
  liveSubB: document.getElementById("live-sub-b"),
  duelFillA: document.getElementById("duel-fill-a"),
  duelFillB: document.getElementById("duel-fill-b")
};

function createPlayerFields() {
  return fieldTemplates.map((field, index) => ({
    ...field,
    slotId: `${field.id}-${index}`,
    thesisId: null,
    randomEffect: field.type === "random" ? randomFieldEffects[index % randomFieldEffects.length] : null
  }));
}

function createInitialState() {
  return {
    phase: "draft",
    pickIndex: 0,
    activePlayer: snakeOrder[0],
    theses: thesisPool.map((thesis) => ({ ...thesis, draftedBy: null })),
    drafted: { A: [], B: [] },
    selectedThesisId: null,
    fields: { A: createPlayerFields(), B: createPlayerFields() },
    figures: figureTemplates.map((figure) => ({ ...figure })),
    result: null
  };
}

let state = createInitialState();

function currentPlayerLabel() {
  return state.activePlayer === "A" ? "Spieler A" : "Spieler B";
}

function getThesisById(id) {
  return state.theses.find((thesis) => thesis.id === id) || null;
}

function getPlacedCount() {
  return [...state.fields.A, ...state.fields.B].filter((field) => field.thesisId).length;
}

function updatePhaseLabels() {
  elements.phaseLabel.textContent =
    state.phase === "draft" ? "Draft" : state.phase === "placement" ? "Platzierung" : "Ergebnis";
  elements.turnLabel.textContent =
    state.phase === "draft"
      ? `${currentPlayerLabel()} ist dran`
      : state.phase === "placement"
        ? "Thesen auf Punktefelder legen"
        : "Spieltag ausgewertet";
}

function renderDraftPool() {
  elements.thesisPool.innerHTML = "";
  state.theses.forEach((thesis) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `thesis-card${thesis.draftedBy ? " is-locked" : ""}`;
    card.disabled = state.phase !== "draft" || Boolean(thesis.draftedBy);
    card.innerHTML = `
      <span>These ${thesis.id.replace("t", "")}</span>
      <strong>${thesis.text}</strong>
      <small>${thesis.draftedBy ? `gedraftet von Spieler ${thesis.draftedBy}` : "verfuegbar"}</small>
    `;
    card.addEventListener("click", () => handleDraft(thesis.id));
    elements.thesisPool.append(card);
  });
}

function renderDraftLists() {
  renderPlayerDraftList("A", elements.draftedA);
  renderPlayerDraftList("B", elements.draftedB);
  elements.draftCountA.textContent = `${state.drafted.A.length} / 6`;
  elements.draftCountB.textContent = `${state.drafted.B.length} / 6`;
}

function renderPlayerDraftList(playerKey, target) {
  target.innerHTML = "";
  state.drafted[playerKey].forEach((thesisId) => {
    const thesis = getThesisById(thesisId);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `draft-chip${state.selectedThesisId === thesisId ? " is-selected" : ""}`;
    button.disabled = state.phase === "draft";
    button.textContent = thesis ? thesis.text : thesisId;
    button.addEventListener("click", () => {
      if (state.phase === "placement") {
        state.selectedThesisId = state.selectedThesisId === thesisId ? null : thesisId;
        render();
      }
    });
    target.append(button);
  });
}

function renderFieldGrid(playerKey, target) {
  target.innerHTML = "";
  state.fields[playerKey].forEach((field) => {
    const thesis = field.thesisId ? getThesisById(field.thesisId) : null;
    const node = document.createElement("button");
    node.type = "button";
    node.className = `field-slot field-${field.type}`;
    node.disabled = state.phase === "draft" || state.phase === "resolved";
    node.innerHTML = `
      <span>${field.label}</span>
      <strong>${thesis ? thesis.text : "These platzieren"}</strong>
      <small>${field.type === "random" ? field.randomEffect.label : field.type}</small>
    `;
    node.addEventListener("click", () => placeSelectedThesis(playerKey, field.slotId));
    target.append(node);
  });
}

function renderFigures() {
  elements.figureGrid.innerHTML = "";
  state.figures.forEach((figure) => {
    const card = document.createElement("article");
    card.className = "figure-card";
    card.innerHTML = `
      <div class="figure-head">
        <span class="figure-icon">${figure.icon}</span>
        <div>
          <strong>${figure.title}</strong>
          <small>${figure.summary}</small>
        </div>
      </div>
      <div class="figure-scoreline">
        <span>Spieler A: +${figure.scores.A}</span>
        <span>Spieler B: +${figure.scores.B}</span>
      </div>
      <p>${figure.detailA}</p>
      <p>${figure.detailB}</p>
    `;
    elements.figureGrid.append(card);
  });
}

function renderMeta() {
  elements.pickNumber.textContent = `${Math.min(state.pickIndex + 1, 12)} / 12`;
  elements.currentPlayer.textContent = state.phase === "draft" ? currentPlayerLabel() : "Draft beendet";
  elements.placedCount.textContent = `${getPlacedCount()} / 12`;
  elements.placementStatus.textContent =
    state.phase === "draft"
      ? "Warte auf Draft-Abschluss"
      : state.phase === "placement"
        ? state.selectedThesisId
          ? "These ausgewaehlt – jetzt Feld anklicken"
          : "These aus einer Draft-Liste waehlen"
        : "Felder ausgewertet";
}

function renderResult() {
  if (!state.result) {
    elements.thesisPointsA.textContent = "0";
    elements.thesisPointsB.textContent = "0";
    elements.figurePointsA.textContent = "0";
    elements.figurePointsB.textContent = "0";
    elements.scoreA.textContent = "0";
    elements.scoreB.textContent = "0";
    elements.liveScoreA.textContent = "0";
    elements.liveScoreB.textContent = "0";
    elements.liveSubA.textContent = "wartet auf Auswertung";
    elements.liveSubB.textContent = "wartet auf Auswertung";
    elements.winnerPill.textContent = "Noch nicht ausgewertet";
    drawBreakdown(elements.breakdownA, ["Drafte zuerst alle Thesen und platziere sie auf dem Brett."]);
    drawBreakdown(elements.breakdownB, ["Die Auswertung kombiniert Thesenfelder und Figurenboni."]);
    elements.duelFillA.style.width = "50%";
    elements.duelFillB.style.width = "50%";
    return;
  }

  const { totalA, totalB, thesisA, thesisB, figureA, figureB, breakdownA, breakdownB, winner } = state.result;
  elements.thesisPointsA.textContent = String(thesisA);
  elements.thesisPointsB.textContent = String(thesisB);
  elements.figurePointsA.textContent = String(figureA);
  elements.figurePointsB.textContent = String(figureB);
  elements.scoreA.textContent = String(totalA);
  elements.scoreB.textContent = String(totalB);
  elements.liveScoreA.textContent = String(totalA);
  elements.liveScoreB.textContent = String(totalB);
  elements.liveSubA.textContent = `Thesen ${thesisA} + Figuren ${figureA}`;
  elements.liveSubB.textContent = `Thesen ${thesisB} + Figuren ${figureB}`;
  elements.winnerPill.textContent = winner === "draw" ? "Unentschieden" : `Gewinner: Spieler ${winner}`;
  drawBreakdown(elements.breakdownA, breakdownA);
  drawBreakdown(elements.breakdownB, breakdownB);

  const sum = Math.max(totalA + totalB, 1);
  elements.duelFillA.style.width = `${(totalA / sum) * 100}%`;
  elements.duelFillB.style.width = `${(totalB / sum) * 100}%`;
}

function drawBreakdown(target, items) {
  target.innerHTML = "";
  items.forEach((item) => {
    const node = document.createElement("div");
    node.className = "card neutral";
    node.textContent = item;
    target.append(node);
  });
}

function render() {
  updatePhaseLabels();
  renderDraftPool();
  renderDraftLists();
  renderFieldGrid("A", elements.fieldGridA);
  renderFieldGrid("B", elements.fieldGridB);
  renderFigures();
  renderMeta();
  renderResult();
}

function handleDraft(thesisId) {
  if (state.phase !== "draft") return;
  const thesis = getThesisById(thesisId);
  if (!thesis || thesis.draftedBy) return;

  thesis.draftedBy = state.activePlayer;
  state.drafted[state.activePlayer].push(thesisId);
  state.pickIndex += 1;

  if (state.pickIndex >= snakeOrder.length) {
    state.phase = "placement";
    state.selectedThesisId = null;
  } else {
    state.activePlayer = snakeOrder[state.pickIndex];
  }

  render();
}

function isThesisAlreadyPlaced(thesisId) {
  return [...state.fields.A, ...state.fields.B].some((field) => field.thesisId === thesisId);
}

function placeSelectedThesis(playerKey, slotId) {
  if (state.phase !== "placement" || !state.selectedThesisId) return;
  if (!state.drafted[playerKey].includes(state.selectedThesisId)) return;

  state.fields.A.forEach((field) => {
    if (field.thesisId === state.selectedThesisId) field.thesisId = null;
  });
  state.fields.B.forEach((field) => {
    if (field.thesisId === state.selectedThesisId) field.thesisId = null;
  });

  const field = state.fields[playerKey].find((entry) => entry.slotId === slotId);
  if (!field) return;

  field.thesisId = state.selectedThesisId;
  state.selectedThesisId = null;
  render();
}

function autoPlaceAll() {
  if (state.phase === "draft") return;

  ["A", "B"].forEach((playerKey) => {
    const unplaced = state.drafted[playerKey].filter((thesisId) => !isThesisAlreadyPlaced(thesisId));
    state.fields[playerKey].forEach((field) => {
      if (!field.thesisId && unplaced.length) {
        field.thesisId = unplaced.shift();
      }
    });
  });

  render();
}

function scoreField(field, thesis) {
  if (!thesis) return { points: 0, text: `${field.label}: leer` };
  const positive = thesis.result === "positive";

  if (field.type === "plus3") {
    return { points: positive ? 3 : -3, text: `${field.label}: ${thesis.text} => ${positive ? "+3" : "-3"}` };
  }
  if (field.type === "plus1") {
    return { points: positive ? 1 : 0, text: `${field.label}: ${thesis.text} => ${positive ? "+1" : "0"}` };
  }
  if (field.type === "minus1") {
    return { points: positive ? 0 : 1, text: `${field.label}: ${thesis.text} => ${positive ? "0" : "+1"}` };
  }
  if (field.type === "pm3") {
    return { points: positive ? 3 : -3, text: `${field.label}: ${thesis.text} => ${positive ? "+3" : "-3"}` };
  }

  const effect = field.randomEffect;
  const points = positive ? effect.positive : effect.negative;
  return {
    points,
    text: `${field.label} (${effect.label}): ${thesis.text} => ${points >= 0 ? `+${points}` : points}`
  };
}

function evaluatePlayer(playerKey) {
  const fieldScores = state.fields[playerKey].map((field) => scoreField(field, getThesisById(field.thesisId)));
  const thesisPoints = fieldScores.reduce((sum, item) => sum + item.points, 0);
  const figurePoints = state.figures.reduce((sum, figure) => sum + figure.scores[playerKey], 0);
  return {
    thesisPoints,
    figurePoints,
    total: thesisPoints + figurePoints,
    breakdown: [...fieldScores.map((item) => item.text), `Figurenbonus gesamt: +${figurePoints}`]
  };
}

function resolveGame() {
  if (state.phase === "draft") return;
  autoPlaceAll();

  const resultA = evaluatePlayer("A");
  const resultB = evaluatePlayer("B");
  const winner =
    resultA.total === resultB.total ? "draw" : resultA.total > resultB.total ? "A" : "B";

  state.result = {
    thesisA: resultA.thesisPoints,
    thesisB: resultB.thesisPoints,
    figureA: resultA.figurePoints,
    figureB: resultB.figurePoints,
    totalA: resultA.total,
    totalB: resultB.total,
    breakdownA: resultA.breakdown,
    breakdownB: resultB.breakdown,
    winner
  };
  state.phase = "resolved";
  render();
}

function resetGame() {
  state = createInitialState();
  render();
}

elements.autoPlaceButton.addEventListener("click", autoPlaceAll);
elements.resolveButton.addEventListener("click", resolveGame);
elements.resetButton.addEventListener("click", resetGame);

render();
