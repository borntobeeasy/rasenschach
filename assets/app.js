import { createPlayersForFormation, formations } from "./formulas.js";
import { evaluateSimulation } from "./simulation.js";

const STORAGE_KEY = "rasenschach-saves";

const elements = {
  pitch: document.getElementById("pitch"),
  playersLayer: document.getElementById("players-layer"),
  zonesLayer: document.getElementById("zones-layer"),
  arrowsLayer: document.getElementById("arrows-layer"),
  scenarioName: document.getElementById("scenario-name"),
  formationSelect: document.getElementById("formation-select"),
  toolButtons: [...document.querySelectorAll("[data-tool]")],
  homeTeamButton: document.getElementById("home-team-button"),
  awayTeamButton: document.getElementById("away-team-button"),
  undoButton: document.getElementById("undo-button"),
  redoButton: document.getElementById("redo-button"),
  clearButton: document.getElementById("clear-button"),
  resetButton: document.getElementById("reset-button"),
  saveButton: document.getElementById("save-button"),
  shareButton: document.getElementById("share-button"),
  shareOutput: document.getElementById("share-output"),
  savedList: document.getElementById("saved-list"),
  teamBadge: document.getElementById("team-badge"),
  simOutcome: document.getElementById("sim-outcome"),
  simConfidence: document.getElementById("sim-confidence"),
  analysisTitle: document.getElementById("analysis-title"),
  analysisDescription: document.getElementById("analysis-description"),
  strengthsList: document.getElementById("strengths-list"),
  weaknessesList: document.getElementById("weaknesses-list"),
  notesList: document.getElementById("notes-list")
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cloneSnapshot(snapshot) {
  return {
    players: snapshot.players.map((player) => ({ ...player })),
    arrows: snapshot.arrows.map((arrow) => ({ ...arrow, to: { ...arrow.to } })),
    zones: snapshot.zones.map((zone) => ({ ...zone })),
    selectedPlayerId: snapshot.selectedPlayerId,
    activeTeam: snapshot.activeTeam,
    toolMode: snapshot.toolMode,
    formation: snapshot.formation,
    name: snapshot.name
  };
}

function readSavedTactics() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function persistSavedTactics(savedTactics) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedTactics));
}

function createInitialSnapshot() {
  return {
    players: [...createPlayersForFormation("4-3-3", "home"), ...createPlayersForFormation("4-4-2", "away")],
    arrows: [],
    zones: [],
    selectedPlayerId: "home-10",
    activeTeam: "home",
    toolMode: "move",
    formation: "4-3-3",
    name: "Training Ground"
  };
}

const state = {
  ...createInitialSnapshot(),
  pendingArrowFromId: null,
  dragPlayerId: null,
  past: [],
  future: [],
  savedTactics: readSavedTactics()
};

function snapshotFromState() {
  return cloneSnapshot(state);
}

function pushHistory() {
  state.past.push(snapshotFromState());
  if (state.past.length > 80) state.past.shift();
  state.future = [];
}

function loadSnapshot(snapshot, trackHistory = true) {
  if (trackHistory) pushHistory();
  Object.assign(state, cloneSnapshot(snapshot));
  state.pendingArrowFromId = state.toolMode === "arrow" ? state.selectedPlayerId : null;
  state.dragPlayerId = null;
  render();
}

function encodeState(snapshot) {
  return btoa(encodeURIComponent(JSON.stringify(snapshot)));
}

function decodeState(value) {
  try {
    return JSON.parse(decodeURIComponent(atob(value)));
  } catch {
    return null;
  }
}

function positionFromEvent(event) {
  const rect = elements.pitch.getBoundingClientRect();
  return {
    x: clamp(((event.clientX - rect.left) / rect.width) * 100, 4, 96),
    y: clamp(((event.clientY - rect.top) / rect.height) * 100, 6, 94)
  };
}

function populateFormationSelect() {
  Object.entries(formations).forEach(([key, value]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = `${key} · ${value.label}`;
    elements.formationSelect.append(option);
  });
}

function renderTextCards(target, items, className) {
  target.innerHTML = "";
  const values = items.length ? items : ["Noch keine markanten Muster erkannt."];
  values.forEach((item) => {
    const node = document.createElement("div");
    node.className = className;
    node.textContent = item;
    target.append(node);
  });
}

function renderPlayers() {
  elements.playersLayer.innerHTML = "";
  state.players.forEach((player) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `player token-${player.team}${player.id === state.selectedPlayerId ? " is-selected" : ""}`;
    button.style.left = `${player.x}%`;
    button.style.top = `${player.y}%`;
    button.innerHTML = `<span>${player.role}</span><small>${player.team === "home" ? "Home" : "Away"}</small>`;

    button.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      state.selectedPlayerId = player.id;
      state.activeTeam = player.team;
      if (state.toolMode === "move") {
        pushHistory();
        state.dragPlayerId = player.id;
      }
      if (state.toolMode === "arrow") {
        state.pendingArrowFromId = player.id;
      }
      render();
    });

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      state.selectedPlayerId = player.id;
      state.activeTeam = player.team;
      render();
    });

    elements.playersLayer.append(button);
  });
}

function renderZones() {
  elements.zonesLayer.innerHTML = "";
  state.zones.forEach((zone) => {
    const div = document.createElement("div");
    div.className = `zone zone-${zone.team}`;
    div.style.left = `${zone.x}%`;
    div.style.top = `${zone.y}%`;
    div.style.width = `${zone.width}%`;
    div.style.height = `${zone.height}%`;
    elements.zonesLayer.append(div);
  });
}

function renderArrows() {
  const defs = elements.arrowsLayer.querySelector("defs");
  elements.arrowsLayer.innerHTML = "";
  elements.arrowsLayer.append(defs);

  state.arrows.forEach((arrow) => {
    const origin = state.players.find((player) => player.id === arrow.fromPlayerId);
    if (!origin) return;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", origin.x);
    line.setAttribute("y1", origin.y);
    line.setAttribute("x2", arrow.to.x);
    line.setAttribute("y2", arrow.to.y);
    line.setAttribute("stroke", arrow.team === "home" ? "#d9ff66" : "#62d2ff");
    line.setAttribute("stroke-width", "0.75");
    line.setAttribute("stroke-dasharray", "3 2");
    line.setAttribute("marker-end", `url(#arrowhead-${arrow.team})`);
    line.setAttribute("opacity", "0.95");
    elements.arrowsLayer.append(line);
  });
}

function renderAnalysis() {
  const simulation = evaluateSimulation({
    players: state.players,
    arrows: state.arrows,
    zones: state.zones,
    activeTeam: state.activeTeam
  });

  const selected = state.players.find((player) => player.id === state.selectedPlayerId);

  elements.simOutcome.textContent = `${simulation.outcome} · ${simulation.confidence}%`;
  elements.simConfidence.textContent = `${simulation.confidence}% edge`;
  elements.analysisTitle.textContent = simulation.outcome;
  elements.analysisDescription.textContent = selected
    ? `${selected.role} ist aktiv. Nutze die Stellung, um die naechste Aktion taktisch vorzubereiten.`
    : "Waehle einen Spieler oder veraendere die Staffelung, um die Szene neu zu bewerten.";

  renderTextCards(elements.strengthsList, simulation.strengths, "card positive");
  renderTextCards(elements.weaknessesList, simulation.weaknesses, "card negative");
  renderTextCards(elements.notesList, simulation.notes, "card neutral");
}

function renderSavedTactics() {
  elements.savedList.innerHTML = "";
  if (!state.savedTactics.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Noch keine gespeicherten Taktiken. Speichere eine Szene, sobald die Form passt.";
    elements.savedList.append(empty);
    return;
  }

  state.savedTactics.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "saved-item";
    item.innerHTML = `
      <div>
        <strong>${entry.name}</strong>
        <span>${new Date(entry.createdAt).toLocaleString("de-DE")}</span>
      </div>
      <div class="saved-actions">
        <button class="mini-button" data-load="${entry.id}">Load</button>
        <button class="mini-button danger" data-delete="${entry.id}">Delete</button>
      </div>
    `;
    elements.savedList.append(item);
  });

  elements.savedList.querySelectorAll("[data-load]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = state.savedTactics.find((entry) => entry.id === button.dataset.load);
      if (target) loadSnapshot(target.snapshot);
    });
  });

  elements.savedList.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.savedTactics = state.savedTactics.filter((entry) => entry.id !== button.dataset.delete);
      persistSavedTactics(state.savedTactics);
      renderSavedTactics();
    });
  });
}

function renderControls() {
  elements.scenarioName.value = state.name;
  elements.formationSelect.value = state.formation;
  elements.teamBadge.textContent = `Aktives Team: ${state.activeTeam === "home" ? "Home" : "Away"}`;
  elements.toolButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tool === state.toolMode);
  });
  elements.homeTeamButton.classList.toggle("is-active", state.activeTeam === "home");
  elements.awayTeamButton.classList.toggle("is-active", state.activeTeam === "away");
  elements.undoButton.disabled = !state.past.length;
  elements.redoButton.disabled = !state.future.length;
}

function render() {
  renderPlayers();
  renderZones();
  renderArrows();
  renderAnalysis();
  renderSavedTactics();
  renderControls();
}

function applyFormation(key) {
  pushHistory();
  state.formation = key;
  state.players = [...createPlayersForFormation(key, "home"), ...createPlayersForFormation("4-4-2", "away")];
  state.arrows = [];
  state.zones = [];
  state.selectedPlayerId = state.players.find((player) => player.team === "home" && player.role === "ST")?.id || "home-10";
  state.activeTeam = "home";
  state.pendingArrowFromId = null;
  render();
}

function resetBoard() {
  const fresh = createInitialSnapshot();
  loadSnapshot(fresh, true);
  state.savedTactics = readSavedTactics();
  renderSavedTactics();
}

function setupEvents() {
  elements.scenarioName.addEventListener("input", (event) => {
    state.name = event.target.value;
  });

  elements.formationSelect.addEventListener("change", (event) => {
    applyFormation(event.target.value);
  });

  elements.toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.toolMode = button.dataset.tool;
      state.pendingArrowFromId = state.toolMode === "arrow" ? state.selectedPlayerId : null;
      renderControls();
    });
  });

  elements.homeTeamButton.addEventListener("click", () => {
    state.activeTeam = "home";
    render();
  });

  elements.awayTeamButton.addEventListener("click", () => {
    state.activeTeam = "away";
    render();
  });

  elements.undoButton.addEventListener("click", () => {
    const previous = state.past.pop();
    if (!previous) return;
    state.future.unshift(snapshotFromState());
    loadSnapshot(previous, false);
  });

  elements.redoButton.addEventListener("click", () => {
    const next = state.future.shift();
    if (!next) return;
    state.past.push(snapshotFromState());
    loadSnapshot(next, false);
  });

  elements.clearButton.addEventListener("click", () => {
    pushHistory();
    state.arrows = [];
    state.zones = [];
    render();
  });

  elements.resetButton.addEventListener("click", resetBoard);

  elements.saveButton.addEventListener("click", () => {
    const saved = {
      id: uid(),
      name: state.name || `Taktik ${state.savedTactics.length + 1}`,
      createdAt: new Date().toISOString(),
      snapshot: snapshotFromState()
    };
    state.savedTactics = [saved, ...state.savedTactics].slice(0, 8);
    persistSavedTactics(state.savedTactics);
    renderSavedTactics();
  });

  elements.shareButton.addEventListener("click", async () => {
    const url = `${window.location.origin}${window.location.pathname}?state=${encodeState(snapshotFromState())}`;
    elements.shareOutput.value = url;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    }
  });

  elements.pitch.addEventListener("pointermove", (event) => {
    if (!state.dragPlayerId) return;
    const next = positionFromEvent(event);
    const player = state.players.find((entry) => entry.id === state.dragPlayerId);
    if (!player) return;
    player.x = next.x;
    player.y = next.y;
    render();
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach((type) => {
    elements.pitch.addEventListener(type, () => {
      state.dragPlayerId = null;
    });
  });

  elements.pitch.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".player")) return;
    const point = positionFromEvent(event);

    if (state.toolMode === "arrow" && state.pendingArrowFromId) {
      pushHistory();
      const origin = state.players.find((player) => player.id === state.pendingArrowFromId);
      if (origin) {
        state.arrows.push({
          id: uid(),
          team: origin.team,
          fromPlayerId: origin.id,
          to: point,
          kind: "pass"
        });
      }
      render();
      return;
    }

    if (state.toolMode === "zone") {
      pushHistory();
      state.zones.push({
        id: uid(),
        team: state.activeTeam,
        x: clamp(point.x - 8, 6, 82),
        y: clamp(point.y - 10, 6, 78),
        width: 16,
        height: 20
      });
      render();
    }
  });
}

function hydrateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("state");
  if (!encoded) return;
  const snapshot = decodeState(encoded);
  if (snapshot) loadSnapshot(snapshot, false);
}

populateFormationSelect();
setupEvents();
hydrateFromUrl();
render();
