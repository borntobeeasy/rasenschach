const theses = [
  {
    id: 1,
    spieltag: 5,
    title: "Bayern gewinnt trotz instabiler Restverteidigung.",
    copy: "Die Offensive erzeugt genug Druck, aber jeder Ballverlust kippt die Statik. Welche Karten sichern die These ab?",
    fixture: "Bayern vs Dortmund",
    focus: "Restverteidigung",
    stakes: 4,
    preferredLanes: ["defense", "middle"],
    keywords: ["absicherung", "kontrolle", "gegenpressing"]
  },
  {
    id: 2,
    spieltag: 6,
    title: "Leverkusen knackt den tiefen Block nur ueber den Halbraum.",
    copy: "Breite allein reicht nicht. Das Spiel kippt erst, wenn der Zwischenlinienraum besetzt und bespielt wird.",
    fixture: "Leverkusen vs Freiburg",
    focus: "Halbraum",
    stakes: 3,
    preferredLanes: ["middle", "attack"],
    keywords: ["halbraum", "kombination", "linienbruch"]
  },
  {
    id: 3,
    spieltag: 7,
    title: "Stuttgart verteidigt mutig, verliert aber die Tiefe hinter dem Pressing.",
    copy: "Vorne aggressiv, hinten offen. Die Runde entscheidet sich daran, ob der hohe Zugriff schnell genug abgesichert wird.",
    fixture: "Stuttgart vs Leipzig",
    focus: "Pressingtiefe",
    stakes: 5,
    preferredLanes: ["defense", "attack"],
    keywords: ["pressing", "tiefe", "umschalten"]
  }
];

const deck = [
  { id: "k1", title: "Pressingfalle", text: "Ballseite ueberladen und den Rueckpass erzwingen.", lane: "middle", tags: ["pressing", "kontrolle"], power: 3 },
  { id: "k2", title: "Halbraum-Lauf", text: "Dynamik zwischen Aussen- und Innenverteidiger erzeugen.", lane: "attack", tags: ["halbraum", "linienbruch"], power: 4 },
  { id: "k3", title: "Restfeld 3+2", text: "Hinter dem Ball bleibt eine saubere Sicherung stehen.", lane: "defense", tags: ["absicherung", "kontrolle"], power: 4 },
  { id: "k4", title: "Diagonalball", text: "Die Seite wechseln, bevor der Block nachschieben kann.", lane: "middle", tags: ["linienbruch", "tempo"], power: 2 },
  { id: "k5", title: "Tiefer Laufweg", text: "Die letzte Linie nach hinten ziehen und Raum oeffnen.", lane: "attack", tags: ["tiefe", "umschalten"], power: 3 },
  { id: "k6", title: "Gegenpressing", text: "Nach Ballverlust sofort den Rueckgewinn suchen.", lane: "defense", tags: ["pressing", "absicherung"], power: 3 }
];

const state = {
  thesisIndex: 0,
  activeSide: "calcio",
  selectedCards: [],
  scores: { calcio: 12, lukas: 10 },
  rounds: [],
  lastResolution: null
};

const slots = [
  { id: "slot-defense", lane: "defense", label: "Aufbau" },
  { id: "slot-middle", lane: "middle", label: "Zentrum" },
  { id: "slot-attack", lane: "attack", label: "Abschluss" }
];

const elements = {
  navLinks: [...document.querySelectorAll("[data-view-target]")],
  views: [...document.querySelectorAll(".view")],
  scoreCalcio: document.getElementById("score-calcio"),
  scoreLukas: document.getElementById("score-lukas"),
  scoreRound: document.getElementById("score-round"),
  thesisTitle: document.getElementById("thesis-title"),
  thesisCopy: document.getElementById("thesis-copy"),
  thesisFixture: document.getElementById("thesis-fixture"),
  thesisFocus: document.getElementById("thesis-focus"),
  thesisStakes: document.getElementById("thesis-stakes"),
  matchdayChip: document.getElementById("matchday-chip"),
  teamBadge: document.getElementById("team-badge"),
  resultHeadline: document.getElementById("result-headline"),
  confidenceBadge: document.getElementById("confidence-badge"),
  analysisTitle: document.getElementById("analysis-title"),
  analysisDescription: document.getElementById("analysis-description"),
  strengthsList: document.getElementById("strengths-list"),
  weaknessesList: document.getElementById("weaknesses-list"),
  notesList: document.getElementById("notes-list"),
  sideCalcio: document.getElementById("side-calcio"),
  sideLukas: document.getElementById("side-lukas"),
  resolveButton: document.getElementById("resolve-button"),
  nextThesisButton: document.getElementById("next-thesis-button"),
  resetLineupButton: document.getElementById("reset-lineup-button"),
  handCount: document.getElementById("hand-count"),
  lineFocus: document.getElementById("line-focus"),
  cardHand: document.getElementById("card-hand"),
  slotRow: document.getElementById("slot-row"),
  savedList: document.getElementById("saved-list"),
  tableBody: document.getElementById("table-body")
};

function getCurrentThesis() {
  return theses[state.thesisIndex];
}

function getSelectedForLane(lane) {
  return state.selectedCards.find((card) => card.lane === lane) || null;
}

function drawTextCards(target, items, className) {
  target.innerHTML = "";
  const entries = items.length ? items : ["Noch keine Runde gespielt."];
  entries.forEach((item) => {
    const node = document.createElement("div");
    node.className = className;
    node.textContent = item;
    target.append(node);
  });
}

function computeResolution() {
  const thesis = getCurrentThesis();
  const chosen = state.selectedCards;
  const laneMatches = chosen.filter((card) => thesis.preferredLanes.includes(card.lane)).length;
  const keywordMatches = chosen.reduce(
    (sum, card) => sum + card.tags.filter((tag) => thesis.keywords.includes(tag)).length,
    0
  );
  const power = chosen.reduce((sum, card) => sum + card.power, 0);
  const score = Math.min(96, Math.max(18, 26 + power * 8 + laneMatches * 10 + keywordMatches * 7));
  const winner = score >= 70 ? state.activeSide : state.activeSide === "calcio" ? "lukas" : "calcio";
  const pointsWon = score >= 70 ? thesis.stakes : Math.max(1, thesis.stakes - 2);

  const strengths = [];
  const weaknesses = [];
  const notes = [];

  if (laneMatches >= 2) strengths.push("Die Karten liegen in den richtigen Spielfeldzonen fuer diese These.");
  if (keywordMatches >= 2) strengths.push("Die Spielidee der These wird durch passende Mechaniken gestuetzt.");
  if (power >= 9) strengths.push("Der Zug hat genug Wucht, um als klare Stellung zu wirken.");

  if (chosen.length < 2) weaknesses.push("Zu wenige Karten im Zug. Die These bleibt unterentwickelt.");
  if (laneMatches === 0) weaknesses.push("Die Karten besetzen nicht die entscheidenden Linien der These.");
  if (keywordMatches === 0) weaknesses.push("Der Zug greift den Kerngedanken der Runde nicht sauber auf.");

  notes.push(`${chosen.length} von 3 moeglichen Karten wurden gespielt.`);
  notes.push(`${laneMatches} Karten liegen in Schluesselzonen fuer die aktuelle These.`);
  notes.push(`${keywordMatches} thematische Treffer verbinden Zug und Spielidee.`);

  return {
    winner,
    score,
    pointsWon,
    strengths,
    weaknesses,
    notes,
    headline: score >= 70 ? "These sauber ausgespielt" : "These kippt im Verlauf der Runde",
    description:
      score >= 70
        ? `${state.activeSide === "calcio" ? "Calcio" : "Lukas"} bringt die These auf dem Brett in eine stabile Stellung.`
        : `Der Zug wirkt nicht zwingend genug. ${winner === "calcio" ? "Calcio" : "Lukas"} sammelt die besseren Punkte.`
  };
}

function renderThesis() {
  const thesis = getCurrentThesis();
  elements.thesisTitle.textContent = thesis.title;
  elements.thesisCopy.textContent = thesis.copy;
  elements.thesisFixture.textContent = thesis.fixture;
  elements.thesisFocus.textContent = thesis.focus;
  elements.thesisStakes.textContent = `${thesis.stakes} Punkte`;
  elements.matchdayChip.textContent = `Spieltag ${thesis.spieltag}`;
  elements.scoreRound.textContent = String(thesis.spieltag).padStart(2, "0");
}

function renderScores() {
  elements.scoreCalcio.textContent = state.scores.calcio;
  elements.scoreLukas.textContent = state.scores.lukas;
  elements.teamBadge.textContent = `Aktive Seite: ${state.activeSide === "calcio" ? "Calcio" : "Lukas"}`;
  elements.sideCalcio.classList.toggle("is-active", state.activeSide === "calcio");
  elements.sideLukas.classList.toggle("is-active", state.activeSide === "lukas");
}

function renderHand() {
  elements.cardHand.innerHTML = "";
  deck.forEach((card) => {
    const selected = state.selectedCards.some((entry) => entry.id === card.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `play-card${selected ? " is-selected" : ""}`;
    button.innerHTML = `
      <span class="play-card-lane">${card.lane.toUpperCase()}</span>
      <strong>${card.title}</strong>
      <p>${card.text}</p>
    `;
    button.addEventListener("click", () => toggleCard(card));
    elements.cardHand.append(button);
  });
}

function renderSlots() {
  elements.slotRow.innerHTML = "";
  slots.forEach((slot) => {
    const card = getSelectedForLane(slot.lane);
    const node = document.createElement("button");
    node.type = "button";
    node.className = `pitch-slot${card ? " has-card" : ""}`;
    node.innerHTML = card
      ? `<span>${slot.label}</span><strong>${card.title}</strong><small>${card.text}</small>`
      : `<span>${slot.label}</span><strong>Karte platzieren</strong><small>${slot.lane}</small>`;
    node.addEventListener("click", () => removeLaneCard(slot.lane));
    elements.slotRow.append(node);
  });
  elements.handCount.textContent = `${state.selectedCards.length} / 3`;
  elements.lineFocus.textContent =
    state.selectedCards.length === 0
      ? "Offen"
      : state.selectedCards.map((card) => card.lane).join(" / ").replace("defense", "Aufbau").replace("middle", "Zentrum").replace("attack", "Abschluss");
}

function renderArchive() {
  elements.savedList.innerHTML = "";
  if (!state.rounds.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Noch keine Runde gespielt. Spiele den ersten Zug aus.";
    elements.savedList.append(empty);
    return;
  }

  [...state.rounds].reverse().forEach((round) => {
    const item = document.createElement("article");
    item.className = "saved-item";
    item.innerHTML = `
      <div>
        <strong>Spieltag ${round.spieltag}: ${round.winner === "calcio" ? "Calcio" : "Lukas"}</strong>
        <span>${round.title}</span>
      </div>
      <div class="saved-points">+${round.pointsWon}</div>
    `;
    elements.savedList.append(item);
  });
}

function renderTable() {
  elements.tableBody.innerHTML = "";
  if (!state.rounds.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5">Noch keine Spieltage entschieden.</td>`;
    elements.tableBody.append(row);
    return;
  }

  state.rounds.forEach((round) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${round.spieltag}</td>
      <td>${round.title}</td>
      <td>${round.winner === "calcio" ? "Calcio" : "Lukas"}</td>
      <td>${round.scoreCalcio}</td>
      <td>${round.scoreLukas}</td>
    `;
    elements.tableBody.append(row);
  });
}

function renderResolution() {
  const resolution = state.lastResolution;
  if (!resolution) {
    elements.resultHeadline.textContent = "Noch kein Zug gespielt";
    elements.confidenceBadge.textContent = "0%";
    elements.analysisTitle.textContent = "Ziehe eine These und setze Karten.";
    elements.analysisDescription.textContent =
      "Waehle eine Seite, spiele bis zu drei Karten in die Rasenlinien und loese danach die Runde aus.";
    drawTextCards(elements.strengthsList, [], "card positive");
    drawTextCards(elements.weaknessesList, [], "card negative");
    drawTextCards(elements.notesList, [], "card neutral");
    return;
  }

  elements.resultHeadline.textContent = resolution.headline;
  elements.confidenceBadge.textContent = `${resolution.score}%`;
  elements.analysisTitle.textContent = resolution.headline;
  elements.analysisDescription.textContent = resolution.description;
  drawTextCards(elements.strengthsList, resolution.strengths, "card positive");
  drawTextCards(elements.weaknessesList, resolution.weaknesses, "card negative");
  drawTextCards(elements.notesList, resolution.notes, "card neutral");
}

function render() {
  renderThesis();
  renderScores();
  renderHand();
  renderSlots();
  renderArchive();
  renderTable();
  renderResolution();
}

function toggleCard(card) {
  const exists = state.selectedCards.some((entry) => entry.id === card.id);
  if (exists) {
    state.selectedCards = state.selectedCards.filter((entry) => entry.id !== card.id);
    render();
    return;
  }

  if (state.selectedCards.some((entry) => entry.lane === card.lane)) {
    state.selectedCards = state.selectedCards.filter((entry) => entry.lane !== card.lane);
  }

  if (state.selectedCards.length >= 3) return;
  state.selectedCards = [...state.selectedCards, card];
  render();
}

function removeLaneCard(lane) {
  state.selectedCards = state.selectedCards.filter((card) => card.lane !== lane);
  render();
}

function resolveRound() {
  if (!state.selectedCards.length) return;
  const thesis = getCurrentThesis();
  const resolution = computeResolution();
  state.lastResolution = resolution;
  state.scores[resolution.winner] += resolution.pointsWon;
  state.rounds.push({
    spieltag: thesis.spieltag,
    title: thesis.title,
    winner: resolution.winner,
    pointsWon: resolution.pointsWon,
    scoreCalcio: state.scores.calcio,
    scoreLukas: state.scores.lukas
  });
  render();
}

function nextThesis() {
  state.thesisIndex = (state.thesisIndex + 1) % theses.length;
  state.selectedCards = [];
  state.lastResolution = null;
  render();
}

function setupViews() {
  elements.navLinks.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.viewTarget;
      elements.navLinks.forEach((link) => link.classList.toggle("is-active", link === button));
      elements.views.forEach((view) => view.classList.toggle("is-visible", view.id === target));
    });
  });
}

function setupEvents() {
  setupViews();

  elements.sideCalcio.addEventListener("click", () => {
    state.activeSide = "calcio";
    render();
  });

  elements.sideLukas.addEventListener("click", () => {
    state.activeSide = "lukas";
    render();
  });

  elements.resolveButton.addEventListener("click", resolveRound);
  elements.nextThesisButton.addEventListener("click", nextThesis);
  elements.resetLineupButton.addEventListener("click", () => {
    state.selectedCards = [];
    state.lastResolution = null;
    render();
  });
}

setupEvents();
render();
