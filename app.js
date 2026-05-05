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

const state = {
  assignments: theses.map((_, index) => ({
    id: index + 1,
    side: null,
    piece: null,
    polarity: null,
    knightSwing: Math.random() > 0.5 ? 1 : -1,
  })),
  results: structuredClone(initialBonuses),
};

const pieceGrid = document.querySelector("#pieceGrid");
const thesisList = document.querySelector("#thesisList");
const evaluationList = document.querySelector("#evaluationList");
const resultsGrid = document.querySelector("#resultsGrid");
const resetButton = document.querySelector("#resetButton");
const openSettingsButton = document.querySelector("#openSettingsButton");
const closeSettingsButton = document.querySelector("#closeSettingsButton");
const settingsDialog = document.querySelector("#settingsDialog");
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
        if ((row === "top" && index % 2 === 1) || (row === "bottom" && index % 2 === 0)) {
          cell.classList.add("light");
        }
        cell.textContent = piece.name;
      } else {
        cell.classList.add("drop-cell");
        cell.dataset.side = row;
        cell.dataset.piece = piece.id;
        cell.innerHTML = `
          <div class="cell-value">${piece.value}</div>
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

function getResultBonus(assignment) {
  if (!assignment.side || !assignment.piece || !assignment.polarity) return 0;
  return Number(state.results[assignment.side][assignment.piece]) || 0;
}

function getBaseScore(assignment) {
  if (!assignment.piece || !assignment.polarity) return 0;
  const piece = pieces.find((item) => item.id === assignment.piece);
  const sign = assignment.polarity === "positive" ? 1 : -1;

  if (piece.id === "knight") {
    return assignment.knightSwing * sign;
  }

  if (piece.id === "rook") {
    return piece.base * sign * -1;
  }

  return piece.base * sign;
}

function calculateTotals() {
  const totals = { white: 0, black: 0 };

  state.assignments.forEach((assignment) => {
    if (!assignment.side || !assignment.piece || !assignment.polarity) return;
    totals[assignment.side] += getBaseScore(assignment) + getResultBonus(assignment);
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
    chip.className = "placed-chip";
    chip.draggable = true;
    chip.dataset.id = assignment.id;
    chip.innerHTML = `<span class="fit-text">${escapeHtml(theses[assignment.id - 1])}</span>`;
    chip.title = `${theses[assignment.id - 1]} ${getPolarityLabel(assignment)}`;
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

  while (size > minSize && (text.scrollHeight > container.clientHeight - 4 || text.scrollWidth > container.clientWidth - 4)) {
    size -= 1;
    text.style.fontSize = `${size}px`;
  }
}

function renderTotals() {
  const totals = calculateTotals();
  const max = Math.max(Math.abs(totals.white), Math.abs(totals.black), 1);

  document.querySelector("#whiteTotal").textContent = totals.white;
  document.querySelector("#blackTotal").textContent = totals.black;
  document.querySelector("#whiteBarValue").textContent = totals.white;
  document.querySelector("#blackBarValue").textContent = totals.black;
  document.querySelector("#whiteBar").style.width = `${Math.min(100, (Math.abs(totals.white) / max) * 100)}%`;
  document.querySelector("#blackBar").style.width = `${Math.min(100, (Math.abs(totals.black) / max) * 100)}%`;

  ["white", "black"].forEach((side) => {
    const label = nameInputs[side].value.trim() || (side === "white" ? "Weiß" : "Schwarz");
    document.querySelector(`#${side}Label`).textContent = label;
    document.querySelector(`#${side}BarLabel`).textContent = label;
  });
}

function render() {
  createThesisList();
  createEvaluationList();
  renderPlacements();
  renderTotals();
  fitAllCardText();
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

resultsGrid.addEventListener("input", (event) => {
  const input = event.target;
  if (!input.matches("[data-side][data-piece]")) return;

  state.results[input.dataset.side][input.dataset.piece] = Number(input.value);
  renderTotals();
});

Object.values(nameInputs).forEach((input) => {
  input.addEventListener("input", renderTotals);
});

openSettingsButton.addEventListener("click", () => {
  if (typeof settingsDialog.showModal === "function") {
    settingsDialog.showModal();
  } else {
    settingsDialog.setAttribute("open", "");
    settingsDialog.classList.add("is-open");
  }
});

closeSettingsButton.addEventListener("click", () => {
  if (typeof settingsDialog.close === "function") {
    settingsDialog.close();
  } else {
    settingsDialog.removeAttribute("open");
    settingsDialog.classList.remove("is-open");
  }
});

resetButton.addEventListener("click", () => {
  state.assignments = theses.map((_, index) => ({
    id: index + 1,
    side: null,
    piece: null,
    polarity: null,
    knightSwing: Math.random() > 0.5 ? 1 : -1,
  }));
  state.results = structuredClone(initialBonuses);
  createResultSettings();
  render();
});

createBoard();
createResultSettings();
render();
