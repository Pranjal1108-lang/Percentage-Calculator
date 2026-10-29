
const $ = (id) => document.getElementById(id);

const historyKey = "percentProHistory";
let historyItems = [];

try {
  const saved = JSON.parse(localStorage.getItem(historyKey) || "[]");
  if (Array.isArray(saved)) {
    historyItems = saved.filter(
      item => item &&
        typeof item.label === "string" &&
        typeof item.result === "string"
    ).slice(0, 10);
  }
} catch {
  historyItems = [];
}

$("year").textContent = new Date().getFullYear();

function formatNumber(value) {
  return Number(value.toFixed(6)).toLocaleString("en-IN", {
    maximumFractionDigits: 6
  });
}

function showResult(resultId, title, value, details = "") {
  const box = $(resultId);
  box.replaceChildren();

  const label = document.createElement("span");
  label.textContent = "YOUR RESULT";

  const number = document.createElement("strong");
  number.textContent = value;

  box.append(label, number);

  if (details) {
    const note = document.createElement("small");
    note.textContent = details;
    box.append(note);
  }

  addHistory(title, value);
}

function showError(resultId, message) {
  const box = $(resultId);
  box.replaceChildren();

  const label = document.createElement("span");
  label.textContent = "CHECK YOUR INPUT";

  const note = document.createElement("small");
  note.textContent = message;
  note.style.color = "#c0392b";

  box.append(label, note);
}

function readNumber(id) {
  const value = $(id).value.trim();

  if (value === "") return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// Save the latest calculations
function addHistory(label, result) {
  historyItems.unshift({
    label,
    result,
    time: new Date().toLocaleString()
  });

  historyItems = historyItems.slice(0, 10);

  try {
    localStorage.setItem(historyKey, JSON.stringify(historyItems));
  } catch {
    // History will still work until this page is closed.
  }

  renderHistory();
}

// Display saved calculations safely
function renderHistory() {
  const list = $("historyList");
  list.replaceChildren();

  $("emptyHistory").hidden = historyItems.length > 0;

  historyItems.forEach((item, index) => {
    const li = document.createElement("li");
    const textBox = document.createElement("div");
    textBox.className = "history-text";

    const title = document.createElement("strong");
    title.textContent = item.label;

    const detail = document.createElement("small");
    detail.textContent = `${item.result} · ${item.time}`;

    textBox.append(title, detail);

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "copy-btn";
    copyButton.textContent = "Copy";
    copyButton.addEventListener("click", () => copyResult(item.result));

    li.append(textBox, copyButton);
    list.append(li);
  });
}

// Copy a result to the clipboard
async function copyResult(value) {
  try {
    await navigator.clipboard.writeText(value);
    alert("Result copied!");
  } catch {
    alert("Copy is unavailable here. Please select and copy the result manually.");
  }
}

// 1. Normal percentage
$("normalForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const percent = readNumber("percent");
  const number = readNumber("baseNumber");

  if (percent === null || number === null ||
      percent < 0 || number < 0) {
    showError("normalResult", "Enter valid, non-negative numbers.");
    return;
  }

  const answer = (percent / 100) * number;

  showResult(
    "normalResult",
    `${formatNumber(percent)}% of ${formatNumber(number)}`,
    formatNumber(answer),
    `${formatNumber(percent)} ÷ 100 × ${formatNumber(number)}`
  );
});

// 2. Marks percentage
$("marksForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const obtained = readNumber("obtained");
  const total = readNumber("total");

  if (obtained === null || total === null ||
      obtained < 0 || total <= 0 || obtained > total) {
    showError(
      "marksResult",
      "Use marks from 0 up to the total. Total must be greater than zero."
    );
    return;
  }

  const percentage = (obtained / total) * 100;

  showResult(
    "marksResult",
    `Marks: ${formatNumber(obtained)} / ${formatNumber(total)}`,
    `${formatNumber(percentage)}%`,
    `${formatNumber(obtained)} ÷ ${formatNumber(total)} × 100`
  );
});

// 3. Percentage increase or decrease
$("changeForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const oldValue = readNumber("oldValue");
  const newValue = readNumber("newValue");

  if (oldValue === null || newValue === null ||
      oldValue < 0 || newValue < 0) {
    showError("changeResult", "Enter valid, non-negative values.");
    return;
  }

  if (oldValue === 0) {
    showError(
      "changeResult",
      "Percentage change cannot be calculated from an original value of zero."
    );
    return;
  }

  const change = ((newValue - oldValue) / oldValue) * 100;
  const rounded = formatNumber(Math.abs(change));

  let description;

  if (change > 0) {
    description = `${rounded}% increase`;
  } else if (change < 0) {
    description = `${rounded}% decrease`;
  } else {
    description = "No change (0%)";
  }

  showResult(
    "changeResult",
    `${formatNumber(oldValue)} → ${formatNumber(newValue)}`,
    description,
    `Difference: ${formatNumber(newValue - oldValue)}`
  );
});

// Clear saved history
$("clearHistory").addEventListener("click", function () {
  historyItems = [];

  try {
    localStorage.removeItem(historyKey);
  } catch {
    // The visible history is cleared even if storage is unavailable.
  }

  renderHistory();
});

renderHistory();
