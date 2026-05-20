const pieces = [
  { id: "rook", name: "Turm", value: "-/+3", base: 3 },
  { id: "bishop", name: "Läufer", value: "-1", base: 1 },
  { id: "knight", name: "Springer", value: "?", base: 1 },
  { id: "queen", name: "Dame", value: "+1", base: 1 },
  { id: "king", name: "König", value: "+/-3", base: 3 },
];

const theses = Array.from({ length: 12 }, (_, index) => `These ${index + 1}`);

const initialBonuses = {
  white: { rook: 0, bishop: 0, knight: 0, queen: 0, king: 0 },
  black: { rook: 0, bishop: 0, knight: 0, queen: 0, king: 0 },
};
const initialKnightCategories = ["Tempo", "Zweikampf", "Passspiel", "Laufwege"];

const state = {
  assignments: theses.map((_, index) => ({
    id: index + 1,
    side: null,
    piece: null,
    polarity: null,
    knightSwing: Math.random() > 0.5 ? 1 : -1,
  })),
  results: structuredClone(initialBonuses),
  figureImages: loadFigureImages(),
  questionValue: null,
  knightCategories: [...initialKnightCategories],
  selectedKnightCategory: "",
};

const pieceGrid = document.querySelector("#pieceGrid");
const thesisList = document.querySelector("#thesisList");
const evaluationList = document.querySelector("#evaluationList");
const resultsGrid = document.querySelector("#resultsGrid");
const openSettingsButton = document.querySelector("#openSettingsButton");
const openMatchdayButton = document.querySelector("#openMatchdayButton");
const closeSettingsButton = document.querySelector("#closeSettingsButton");
const settingsDialog = document.querySelector("#settingsDialog");
const randomQuestionButton = document.querySelector("#randomQuestionButton");
const questionValueLabel = document.querySelector("#questionValueLabel");
const knightCategoriesInput = document.querySelector("#knightCategoriesInput");
const randomKnightButton = document.querySelector("#randomKnightButton");
const knightCategoryLabel = document.querySelector("#knightCategoryLabel");
const storageGrid = document.querySelector("#storageGrid");
const storageStatus = document.querySelector("#storageStatus");
const nameInputs = {
  white: document.querySelector("#whiteName"),
  black: document.querySelector("#blackName"),
};
let pointerDrag = null;

function createBoard() {
  pieceGrid.innerHTML = "";

  ["top", "white", "black", "bottom"].forEach((row) => {
    pieces.forEach((piece, index) => {
      const cell = document.createElement("article");
      cell.className = "grid-cell";

      if (row === "top" || row === "bottom") {
        cell.classList.add("piece-cell");
        cell.dataset.figureSlot = `${row}-${piece.id}`;
        cell.dataset.side = getFigureSide(row);
        cell.dataset.piece = piece.id;
        if ((row === "top" && index % 2 === 1) || (row === "bottom" && index % 2 === 0)) {
          cell.classList.add("light");
        }
        cell.setAttribute("aria-label", piece.name);
        renderFigureCell(cell, piece);
        cell.addEventListener("dragover", handleFigureDragOver);
        cell.addEventListener("dragleave", handleFigureDragLeave);
        cell.addEventListener("drop", handleFigureDrop);
        cell.addEventListener("dblclick", handleFigurePick);
      } else {
        cell.classList.add("drop-cell");
        cell.dataset.side = row;
        cell.dataset.piece = piece.id;
        cell.innerHTML = `
          <div class="cell-head">
            <div class="cell-value">${getDisplayValue(piece)}</div>
            <strong class="field-score ${getScoreTone(getThesisSlotScore(row, piece.id))}">${getSignedNumber(getThesisSlotScore(row, piece.id))}</strong>
          </div>
          <div class="placed-list" data-slot="${row}-${piece.id}"></div>
        `;
        cell.addEventListener("dragover", handleDragOver);
        cell.addEventListener("dragleave", handleDragLeave);
        cell.addEventListener("drop", handleDrop);
      }

      pieceGrid.appendChild(cell);
    });
  });
}

function renderFigureCell(cell, piece) {
  const image = state.figureImages[cell.dataset.figureSlot];
  const score = getPlayerScore(cell.dataset.side, piece.id);
  const scoreMarkup = `<strong class="field-watermark ${getScoreTone(score)}">${getSignedNumber(score)}</strong>`;
  if (image) {
    cell.classList.add("has-player-image");
    cell.innerHTML = `
      ${scoreMarkup}
      <img class="player-photo" src="${image}" alt="" />
      <img class="piece-svg piece-corner" src="assets/pieces/${piece.id}.svg" alt="" />
      <button class="remove-player-photo" type="button" aria-label="Bild entfernen">×</button>
    `;
    cell.querySelector(".remove-player-photo").addEventListener("click", (event) => {
      event.stopPropagation();
      delete state.figureImages[cell.dataset.figureSlot];
      saveFigureImages();
      renderFigureCell(cell, piece);
    });
    return;
  }

  cell.classList.remove("has-player-image");
  cell.innerHTML = `
    ${scoreMarkup}
    <img class="piece-svg" src="assets/pieces/${piece.id}.svg" alt="" />
  `;
}

function getFigureSide(row) {
  return row === "top" ? "white" : "black";
}

function getDisplayValue(piece) {
  if (piece.id === "knight" && state.questionValue !== null) {
    return state.questionValue > 0 ? `+${state.questionValue}` : String(state.questionValue);
  }

  return piece.value;
}

function handleFigurePick(event) {
  const cell = event.currentTarget;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) {
      readPlayerImageFile(file, cell);
    }
  });
  input.click();
}

function handleFigureDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  event.currentTarget.classList.add("image-drop-over");
}

function handleFigureDragLeave(event) {
  event.currentTarget.classList.remove("image-drop-over");
}

function handleFigureDrop(event) {
  event.preventDefault();
  const cell = event.currentTarget;
  cell.classList.remove("image-drop-over");

  const file = [...event.dataTransfer.files].find((item) => item.type.startsWith("image/"));
  if (file) {
    readPlayerImageFile(file, cell);
    return;
  }

  const url = getDroppedImageUrl(event.dataTransfer);
  if (url) {
    state.figureImages[cell.dataset.figureSlot] = url;
    saveFigureImages();
    const piece = pieces.find((item) => cell.dataset.figureSlot.endsWith(item.id));
    renderFigureCell(cell, piece);
  }
}

function readPlayerImageFile(file, cell) {
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.figureImages[cell.dataset.figureSlot] = reader.result;
    saveFigureImages();
    const piece = pieces.find((item) => cell.dataset.figureSlot.endsWith(item.id));
    renderFigureCell(cell, piece);
  });
  reader.readAsDataURL(file);
}

function getDroppedImageUrl(dataTransfer) {
  const uri = dataTransfer.getData("text/uri-list")?.split("\n").find((line) => line && !line.startsWith("#"));
  if (uri && isImageLikeUrl(uri)) return uri;

  const plainText = dataTransfer.getData("text/plain");
  if (plainText && isImageLikeUrl(plainText.trim())) return plainText.trim();

  const html = dataTransfer.getData("text/html");
  if (!html) return "";

  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || "";
}

function isImageLikeUrl(value) {
  return /^(https?:|data:image\/|blob:|file:)/i.test(value);
}

function loadFigureImages() {
  try {
    return JSON.parse(localStorage.getItem("rasenschach.figureImages")) || {};
  } catch {
    return {};
  }
}

function saveFigureImages() {
  try {
    localStorage.setItem(getStorageKey("images"), JSON.stringify(state.figureImages));
  } catch {
    // Large local images can exceed browser storage; the current board still keeps them in memory.
  }
}

function getStorageKey(section) {
  const keys = {
    theses: "rasenschach.save.theses",
    board: "rasenschach.save.board",
    results: "rasenschach.save.results",
    randomizer: "rasenschach.save.randomizer",
    images: "rasenschach.figureImages",
  };
  return keys[section];
}

function saveSection(section) {
  const payloads = {
    theses: () => ({
      theses: [...theses],
      polarities: state.assignments.map(({ id, polarity }) => ({ id, polarity })),
    }),
    board: () => ({
      positions: state.assignments.map(({ id, side, piece, knightSwing }) => ({ id, side, piece, knightSwing })),
    }),
    results: () => ({ results: state.results }),
    randomizer: () => ({
      questionValue: state.questionValue,
      knightCategories: state.knightCategories,
      selectedKnightCategory: state.selectedKnightCategory,
    }),
    images: () => ({ figureImages: state.figureImages }),
  };

  try {
    localStorage.setItem(getStorageKey(section), JSON.stringify(payloads[section]()));
    setStorageStatus(`${getSectionLabel(section)} gespeichert.`);
  } catch {
    setStorageStatus(`${getSectionLabel(section)} konnte nicht gespeichert werden.`);
  }
}

function loadSection(section) {
  const raw = localStorage.getItem(getStorageKey(section));
  if (!raw) {
    setStorageStatus(`${getSectionLabel(section)} hat keinen gespeicherten Stand.`);
    return;
  }

  try {
    const data = JSON.parse(raw);

    if (section === "theses") {
      data.theses?.forEach((value, index) => {
        theses[index] = value;
      });
      data.polarities?.forEach(({ id, polarity }) => {
        const assignment = state.assignments.find((item) => item.id === id);
        if (assignment) assignment.polarity = polarity || null;
      });
    }

    if (section === "board") {
      data.positions?.forEach(({ id, side, piece, knightSwing }) => {
        const assignment = state.assignments.find((item) => item.id === id);
        if (assignment) {
          assignment.side = side || null;
          assignment.piece = piece || null;
          assignment.knightSwing = knightSwing ?? assignment.knightSwing;
        }
      });
    }

    if (section === "results") {
      state.results = structuredClone(initialBonuses);
      Object.entries(data.results || {}).forEach(([side, values]) => {
        Object.assign(state.results[side] || {}, values);
      });
      createResultSettings();
    }

    if (section === "randomizer") {
      state.questionValue = data.questionValue ?? null;
      state.knightCategories = Array.isArray(data.knightCategories) ? data.knightCategories : [...initialKnightCategories];
      state.selectedKnightCategory = data.selectedKnightCategory || "";
    }

    if (section === "images") {
      state.figureImages = data.figureImages || data || {};
    }

    render();
    setStorageStatus(`${getSectionLabel(section)} geladen.`);
  } catch {
    setStorageStatus(`${getSectionLabel(section)} konnte nicht geladen werden.`);
  }
}

function clearSection(section) {
  localStorage.removeItem(getStorageKey(section));

  if (section === "images") {
    state.figureImages = {};
    render();
  }

  setStorageStatus(`${getSectionLabel(section)} Speicher gelöscht.`);
}

function getSectionLabel(section) {
  return {
    theses: "Thesen",
    board: "Brett",
    results: "Ergebnisse",
    randomizer: "Randomizer",
    images: "Fotos",
  }[section];
}

function setStorageStatus(message) {
  storageStatus.textContent = message;
}

function createThesisList() {
  thesisList.innerHTML = "";

  theses.forEach((_, index) => {
    const assignment = state.assignments[index];
    if (assignment.side && assignment.piece) return;

    const card = document.createElement("article");
    card.className = "thesis-card";
    card.draggable = true;
    card.dataset.id = assignment.id;
    card.innerHTML = `
      <div class="thesis-title">
        <span class="fit-text">${escapeHtml(theses[assignment.id - 1])}</span>
      </div>
    `;

    card.addEventListener("dragstart", handleDragStart);
    card.addEventListener("pointerdown", handlePointerDragStart);
    thesisList.appendChild(card);
  });
}

function createEvaluationList() {
  evaluationList.innerHTML = "";

  state.assignments.forEach((assignment) => {
    const card = document.createElement("article");
    card.className = "evaluation-card";
    card.innerHTML = `
      <strong>These ${assignment.id}</strong>
      <input aria-label="These ${assignment.id} Titel" data-id="${assignment.id}" data-field="thesis-text" value="${escapeAttribute(theses[assignment.id - 1])}" />
      <div class="evaluation-controls" aria-label="These ${assignment.id} auswerten">
        <button class="neutral-button ${!assignment.polarity ? "active" : ""}" data-id="${assignment.id}" data-polarity="" type="button">unausgewertet</button>
        <button class="polarity-button ${assignment.polarity === "positive" ? "active" : ""}" data-id="${assignment.id}" data-polarity="positive" type="button">+</button>
        <button class="polarity-button ${assignment.polarity === "negative" ? "active" : ""}" data-id="${assignment.id}" data-polarity="negative" type="button">-</button>
      </div>
    `;
    evaluationList.appendChild(card);
  });
}

function createResultSettings() {
  resultsGrid.innerHTML = "";

  ["white", "black"].forEach((side) => {
    const group = document.createElement("section");
    group.className = "result-group";
    group.innerHTML = `
      <h3>${side === "white" ? "Weiß" : "Schwarz"}</h3>
      ${pieces
        .map(
          (piece) => `
            <div class="result-row">
              <label for="${side}-${piece.id}-result">${piece.name}</label>
              <input id="${side}-${piece.id}-result" data-side="${side}" data-piece="${piece.id}" type="number" step="1" value="${state.results[side][piece.id]}" />
            </div>
          `,
        )
        .join("")}
    `;
    resultsGrid.appendChild(group);
  });
}

function getPolarityLabel(assignment) {
  if (assignment.polarity === "positive") return "+";
  if (assignment.polarity === "negative") return "-";
  return "unausgewertet";
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function handleDragStart(event) {
  const id = event.currentTarget.dataset.id;
  event.dataTransfer.setData("text/plain", id);
  event.dataTransfer.effectAllowed = "move";
}

function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add("drag-over");
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

function handleDrop(event) {
  event.preventDefault();
  const id = Number(event.dataTransfer.getData("text/plain"));
  const assignment = state.assignments.find((item) => item.id === id);
  const cell = event.currentTarget;

  cell.classList.remove("drag-over");
  if (!assignment) return;

  assignment.side = cell.dataset.side;
  assignment.piece = cell.dataset.piece;
  render();
}

function handlePointerDragStart(event) {
  if (event.target.closest("button")) return;

  const id = Number(event.currentTarget.dataset.id);
  if (!id) return;

  event.preventDefault();
  pointerDrag = {
    id,
    ghost: document.createElement("div"),
  };
  pointerDrag.ghost.className = "drag-ghost";
  pointerDrag.ghost.textContent = theses[id - 1];
  document.body.appendChild(pointerDrag.ghost);

  movePointerGhost(event.clientX, event.clientY);
  window.addEventListener("pointermove", handlePointerDragMove);
  window.addEventListener("pointerup", handlePointerDragEnd, { once: true });
}

function handlePointerDragMove(event) {
  if (!pointerDrag) return;
  movePointerGhost(event.clientX, event.clientY);

  document.querySelectorAll(".drop-cell.drag-over").forEach((cell) => {
    cell.classList.remove("drag-over");
  });

  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".drop-cell");
  if (target) {
    target.classList.add("drag-over");
  }
}

function handlePointerDragEnd(event) {
  if (!pointerDrag) return;

  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".drop-cell");
  const assignment = state.assignments.find((item) => item.id === pointerDrag.id);

  if (target && assignment) {
    assignment.side = target.dataset.side;
    assignment.piece = target.dataset.piece;
  }

  pointerDrag.ghost.remove();
  pointerDrag = null;
  window.removeEventListener("pointermove", handlePointerDragMove);
  document.querySelectorAll(".drop-cell.drag-over").forEach((cell) => {
    cell.classList.remove("drag-over");
  });
  render();
}

function movePointerGhost(x, y) {
  pointerDrag.ghost.style.left = `${x}px`;
  pointerDrag.ghost.style.top = `${y}px`;
}

function getAssignmentScore(assignment) {
  if (!assignment.side || !assignment.piece || !assignment.polarity) return 0;
  return getBaseScore(assignment);
}

function getThesisSlotScore(side, pieceId) {
  return state.assignments
    .filter((assignment) => assignment.side === side && assignment.piece === pieceId)
    .reduce((sum, assignment) => sum + getAssignmentScore(assignment), 0);
}

function getPlayerScore(side, pieceId) {
  return Number(state.results[side]?.[pieceId]) || 0;
}

function getSidePlayerScore(side) {
  return pieces.reduce((sum, piece) => sum + getPlayerScore(side, piece.id), 0);
}

function getScoreTone(value) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function getBaseScore(assignment) {
  if (!assignment.piece || !assignment.polarity) return 0;
  const piece = pieces.find((item) => item.id === assignment.piece);
  const sign = assignment.polarity === "positive" ? 1 : -1;

  if (piece.id === "knight") {
    return (state.questionValue ?? assignment.knightSwing) * sign;
  }

  if (piece.id === "rook") {
    return piece.base * sign * -1;
  }

  return piece.base * sign;
}

function calculateTotals() {
  const totals = {
    white: getSidePlayerScore("white"),
    black: getSidePlayerScore("black"),
  };

  state.assignments.forEach((assignment) => {
    if (assignment.side) {
      totals[assignment.side] += getAssignmentScore(assignment);
    }
  });

  return totals;
}

function renderPlacements() {
  document.querySelectorAll(".placed-list").forEach((slot) => {
    slot.innerHTML = "";
  });

  state.assignments.forEach((assignment) => {
    if (!assignment.side || !assignment.piece) return;
    const slot = document.querySelector(`[data-slot="${assignment.side}-${assignment.piece}"]`);
    if (!slot) return;

    const chip = document.createElement("span");
    const score = getAssignmentScore(assignment);
    chip.className = `placed-chip ${getScoreTone(score)}`;
    chip.draggable = true;
    chip.dataset.id = assignment.id;
    chip.innerHTML = `
      <strong class="chip-watermark">${getSignedNumber(score)}</strong>
      <span class="fit-text">${escapeHtml(theses[assignment.id - 1])}</span>
      <strong class="chip-score">${getSignedNumber(score)}</strong>
    `;
    chip.title = `${theses[assignment.id - 1]} ${getPolarityLabel(assignment)} ${getSignedNumber(score)}`;
    chip.addEventListener("dragstart", handleDragStart);
    chip.addEventListener("pointerdown", handlePointerDragStart);
    slot.appendChild(chip);
  });
}

function fitAllCardText() {
  requestAnimationFrame(() => {
    document.querySelectorAll(".thesis-card .fit-text, .placed-chip .fit-text").forEach((text) => {
      fitTextToContainer(text);
    });
  });
}

function fitTextToContainer(text) {
  const container = text.closest(".thesis-card, .placed-chip");
  if (!container) return;

  let size = text.closest(".placed-chip") ? 11 : 16;
  const minSize = text.closest(".placed-chip") ? 6 : 8;
  text.style.fontSize = `${size}px`;

  while (size > minSize && (text.scrollHeight > container.clientHeight - 4 || text.scrollWidth > text.clientWidth)) {
    size -= 1;
    text.style.fontSize = `${size}px`;
  }
}

function renderTotals() {
  const totals = calculateTotals();

  document.querySelector("#whiteTotal").textContent = totals.white;
  document.querySelector("#blackTotal").textContent = totals.black;

  ["white", "black"].forEach((side) => {
    const label = nameInputs[side].value.trim() || (side === "white" ? "Weiß" : "Schwarz");
    document.querySelector(`#${side}Label`).textContent = label;
  });
}

function render() {
  createBoard();
  createThesisList();
  createEvaluationList();
  renderPlacements();
  renderTotals();
  renderRandomizerState();
  fitAllCardText();
}

function renderRandomizerState() {
  if (questionValueLabel) {
    questionValueLabel.textContent = state.questionValue === null ? "noch nicht gewürfelt" : getSignedNumber(state.questionValue);
  }

  if (knightCategoriesInput && document.activeElement !== knightCategoriesInput) {
    knightCategoriesInput.value = state.knightCategories.join("\n");
  }

  if (knightCategoryLabel) {
    knightCategoryLabel.textContent = state.selectedKnightCategory || "noch nicht gewählt";
  }
}

function getSignedNumber(value) {
  return value > 0 ? `+${value}` : String(value);
}

evaluationList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-polarity]");
  if (!button) return;

  const assignment = state.assignments.find((item) => item.id === Number(button.dataset.id));
  if (!assignment) return;

  assignment.polarity = button.dataset.polarity || null;
  render();
});

evaluationList.addEventListener("input", (event) => {
  const input = event.target;
  if (!input.matches('[data-field="thesis-text"]')) return;

  theses[Number(input.dataset.id) - 1] = input.value;
  createThesisList();
  renderPlacements();
  fitAllCardText();
});

function handleResultSettingChange(event) {
  const input = event.target;
  if (!input.matches("[data-side][data-piece]")) return;

  state.results[input.dataset.side][input.dataset.piece] = Number(input.value);
  createBoard();
  renderPlacements();
  renderTotals();
  fitAllCardText();
}

resultsGrid.addEventListener("input", handleResultSettingChange);
resultsGrid.addEventListener("change", handleResultSettingChange);

Object.values(nameInputs).forEach((input) => {
  input.addEventListener("input", renderTotals);
});

window.addEventListener("resize", fitAllCardText);

openSettingsButton.addEventListener("click", () => {
  if (typeof settingsDialog.showModal === "function") {
    settingsDialog.showModal();
  } else {
    settingsDialog.setAttribute("open", "");
    settingsDialog.classList.add("is-open");
  }
});

openMatchdayButton.addEventListener("click", () => {
  // Der Button bleibt sichtbar; die Spieltag-Funktion dahinter ist bewusst entfernt.
});

closeSettingsButton.addEventListener("click", () => {
  if (typeof settingsDialog.close === "function") {
    settingsDialog.close();
  } else {
    settingsDialog.removeAttribute("open");
    settingsDialog.classList.remove("is-open");
  }
});

storageGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-storage-action]");
  const card = event.target.closest("[data-storage-section]");
  if (!button || !card) return;

  const section = card.dataset.storageSection;
  const action = button.dataset.storageAction;

  if (action === "save") saveSection(section);
  if (action === "load") loadSection(section);
  if (action === "clear") clearSection(section);
});

createBoard();
createResultSettings();
renderRandomizerState();
render();

randomQuestionButton.addEventListener("click", () => {
  const values = [-3, -2, -1, 1, 2, 3];
  state.questionValue = values[Math.floor(Math.random() * values.length)];
  render();
});

knightCategoriesInput.addEventListener("input", () => {
  state.knightCategories = knightCategoriesInput.value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
});

randomKnightButton.addEventListener("click", () => {
  if (!state.knightCategories.length) {
    state.selectedKnightCategory = "";
  } else {
    const index = Math.floor(Math.random() * state.knightCategories.length);
    state.selectedKnightCategory = state.knightCategories[index];
  }
  renderRandomizerState();
});
