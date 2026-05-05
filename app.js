const pieces = [
  { id: "rook", name: "Turm", value: "-/+3", base: 3 },
  { id: "bishop", name: "Läufer", value: "-1", base: 1 },
  { id: "knight", name: "Springer", value: "?", base: 1 },
  { id: "queen", name: "Dame", value: "+1", base: 1 },
  { id: "king", name: "König", value: "+/-3", base: 3 },
];

const theses = [
  "These 1",
  "These 2",
  "These 3",
  "These 4",
  "These 5",
  "These 6",
  "These 7",
  "These 8",
  "These 9",
  "These 10",
  "These 11",
  "These 12",
];

const state = {
  assignments: theses.map((_, index) => ({
    id: index + 1,
    side: index % 2 === 0 ? "white" : "black",
    piece: pieces[index % pieces.length].id,
    polarity: index % 3 === 0 ? "negative" : "positive",
    bonus: [1, 2, 0, 1, 1, 0, 1, 2, 0, 1, 1, 0][index],
    knightSwing: Math.random() > 0.5 ? 1 : -1,
  })),
};

const pieceGrid = document.querySelector("#pieceGrid");
const thesisList = document.querySelector("#thesisList");
const resetButton = document.querySelector("#resetButton");
const nameInputs = {
  white: document.querySelector("#whiteName"),
  black: document.querySelector("#blackName"),
};

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
          <div class="cell-meta">${row === "white" ? "Weiß" : "Schwarz"} · ${piece.name}</div>
          <div class="placed-list" data-slot="${row}-${piece.id}"></div>
        `;
      }

      pieceGrid.appendChild(cell);
    });
  });
}

function createThesisList() {
  thesisList.innerHTML = "";

  theses.forEach((text, index) => {
    const assignment = state.assignments[index];
    const card = document.createElement("article");
    card.className = "thesis-card";
    card.innerHTML = `
      <div class="thesis-title">
        <span>${text}</span>
        <span>#${assignment.id}</span>
      </div>
      <div class="thesis-controls">
        <label>
          Spieler
          <select data-id="${assignment.id}" data-field="side">
            <option value="white">Weiß</option>
            <option value="black">Schwarz</option>
          </select>
        </label>
        <label>
          Figur
          <select data-id="${assignment.id}" data-field="piece">
            ${pieces.map((piece) => `<option value="${piece.id}">${piece.name}</option>`).join("")}
          </select>
        </label>
        <label>
          These
          <select data-id="${assignment.id}" data-field="polarity">
            <option value="positive">positiv</option>
            <option value="negative">negativ</option>
          </select>
        </label>
        <label>
          Bonus
          <select data-id="${assignment.id}" data-field="bonus">
            <option value="0">kein Bonus</option>
            <option value="1">+1</option>
            <option value="2">+2</option>
            <option value="3">+3</option>
          </select>
        </label>
      </div>
    `;

    thesisList.appendChild(card);
    card.querySelector('[data-field="side"]').value = assignment.side;
    card.querySelector('[data-field="piece"]').value = assignment.piece;
    card.querySelector('[data-field="polarity"]').value = assignment.polarity;
    card.querySelector('[data-field="bonus"]').value = getBonusForAssignment(assignment);
  });
}

function getBonusForAssignment(assignment) {
  return assignment.bonus || 0;
}

function getBaseScore(assignment) {
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
    totals[assignment.side] += getBaseScore(assignment) + getBonusForAssignment(assignment);
  });

  return totals;
}

function renderPlacements() {
  document.querySelectorAll(".placed-list").forEach((slot) => {
    slot.innerHTML = "";
  });

  state.assignments.forEach((assignment) => {
    const slot = document.querySelector(`[data-slot="${assignment.side}-${assignment.piece}"]`);
    if (!slot) return;

    const chip = document.createElement("span");
    chip.className = "placed-chip";
    chip.textContent = assignment.id;
    chip.title = theses[assignment.id - 1];
    slot.appendChild(chip);
  });
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
  renderPlacements();
  renderTotals();
}

thesisList.addEventListener("change", (event) => {
  const select = event.target;
  const id = Number(select.dataset.id);
  const field = select.dataset.field;
  const assignment = state.assignments.find((item) => item.id === id);

  if (!assignment) return;

  if (field === "bonus") {
    assignment.bonus = Number(select.value);
  } else {
    assignment[field] = select.value;
  }

  render();
});

Object.values(nameInputs).forEach((input) => {
  input.addEventListener("input", renderTotals);
});

resetButton.addEventListener("click", () => {
  state.assignments = theses.map((_, index) => ({
    id: index + 1,
    side: index % 2 === 0 ? "white" : "black",
    piece: pieces[index % pieces.length].id,
    polarity: index % 3 === 0 ? "negative" : "positive",
    bonus: [1, 2, 0, 1, 1, 0, 1, 2, 0, 1, 1, 0][index],
    knightSwing: Math.random() > 0.5 ? 1 : -1,
  }));
  createThesisList();
  render();
});

createBoard();
createThesisList();
render();
