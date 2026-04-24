const STORAGE_KEY = "prdTracker.initiatives";
const SHEET_ID = "1535eiaY0oGmespf_QAfX3wB48C7Tba_YBRqukEubEo0";
const STRUCTURE_TAB = "2026";
const VALIDATION_TAB = "data validation";

const FALLBACK_HEADERS = [
  "Product",
  "Project Status",
  "Percentages",
  "R&D Channel",
  "Test Location",
  "Year Completed",
  "Cost",
  "Comments"
];

const sampleInitiatives = [
  {
    "Product": "Smart Inventory Assistant",
    "Project Status": "Discovery",
    Percentages: 30,
    "R&D Channel": "AI/ML",
    "Test Location": "Austin Lab",
    "Year Completed": "2026",
    Cost: "$120,000",
    Comments: "Customer interviews complete"
  },
  {
    "Product": "Mobile Checkout SDK",
    "Project Status": "Prototype",
    Percentages: 55,
    "R&D Channel": "Platform",
    "Test Location": "San Jose",
    "Year Completed": "2026",
    Cost: "$210,000",
    Comments: "Pilot integration with Partner A"
  },
  {
    "Product": "Supplier Risk Insights",
    "Project Status": "Validation",
    Percentages: 72,
    "R&D Channel": "Analytics",
    "Test Location": "Chicago Test Center",
    "Year Completed": "2026",
    Cost: "$180,000",
    Comments: "Model precision benchmark"
  }
];

let tableHeaders = [...FALLBACK_HEADERS];
let columnEOptions = [];
let initiatives = loadSavedInitiatives();

const csvFileInput = document.getElementById("csvFileInput");
const resetDataBtn = document.getElementById("resetDataBtn");
const importStatus = document.getElementById("importStatus");

function loadSavedInitiatives() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [...sampleInitiatives];
    }

    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (error) {
    console.warn("Unable to read saved initiatives", error);
  }

  return [...sampleInitiatives];
}

function saveInitiatives() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initiatives));
}

function renderKpis() {
  const total = initiatives.length;
  const progressHeader = findHeaderIncludes("percent");
  const costHeader = findHeaderIncludes("cost") || "Cost";
  const statusHeader = findHeaderIncludes("status") || "Project Status";

  const avgProgress = Math.round(
    initiatives.reduce((sum, item) => sum + normalizeProgress(item[progressHeader]), 0) / (total || 1)
  );
  const totalCost = initiatives.reduce((sum, item) => sum + normalizeCost(item[costHeader]), 0);
  const activeStages = new Set(initiatives.map((item) => item[statusHeader] || "Unknown")).size;

  const kpis = [
    { label: "Total products", value: total },
    { label: "Average completion", value: `${avgProgress}%` },
    { label: "Total cost", value: `$${totalCost.toLocaleString("en-US")}` },
    { label: "Active statuses", value: activeStages }
  ];

  document.getElementById("kpiGrid").innerHTML = kpis
    .map(
      (kpi) =>
        `<article class="kpi-card"><p class="kpi-label">${kpi.label}</p><p class="kpi-value">${kpi.value}</p></article>`
    )
    .join("");
}

function renderTable() {
  document.getElementById("initiativeCount").textContent = `${initiatives.length} tracked`;

  const tableHead = document.getElementById("initiativeTableHead");
  const tableBody = document.getElementById("initiativeTableBody");
  const eColumnIndex = 4;

  tableHead.innerHTML = `<tr>${tableHeaders
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("")}</tr>`;

  tableBody.innerHTML = initiatives
    .map((item, rowIndex) => {
      const cells = tableHeaders
        .map((header, columnIndex) => {
          const rawValue = item[header] || "";

          if (columnIndex === eColumnIndex && columnEOptions.length) {
            const options = [
              `<option value="">-- Select --</option>`,
              ...columnEOptions.map((option) => {
                const isSelected = option === rawValue ? "selected" : "";
                return `<option value="${escapeHtml(option)}" ${isSelected}>${escapeHtml(option)}</option>`;
              })
            ].join("");

            return `<td><select data-row="${rowIndex}" data-header="${escapeHtml(
              header
            )}" class="inline-select">${options}</select></td>`;
          }

          if (normalizeHeader(header).includes("percent")) {
            return `<td>${normalizeProgress(rawValue)}%</td>`;
          }

          return `<td>${escapeHtml(rawValue || "—")}</td>`;
        })
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");
}

function renderStageBreakdown() {
  const statusHeader = findHeaderIncludes("status") || "Project Status";
  const counts = initiatives.reduce((acc, item) => {
    const stage = item[statusHeader] || "Unknown";
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});

  document.getElementById("stageBreakdown").innerHTML = Object.entries(counts)
    .map(
      ([stage, count]) =>
        `<li class="stage-item"><span>${escapeHtml(stage)}</span><strong>${count}</strong></li>`
    )
    .join("");
}

function renderMilestones() {
  const productHeader = tableHeaders[0] || "Product";
  const statusHeader = findHeaderIncludes("status") || "Project Status";
  const yearHeader = findHeaderIncludes("year") || "Year Completed";
  const progressHeader = findHeaderIncludes("percent") || "Percentages";

  const sorted = [...initiatives].sort((a, b) => {
    const yearA = Number.parseInt(a[yearHeader], 10) || Number.MAX_SAFE_INTEGER;
    const yearB = Number.parseInt(b[yearHeader], 10) || Number.MAX_SAFE_INTEGER;
    return yearA - yearB;
  });

  document.getElementById("milestoneList").innerHTML = sorted
    .map(
      (item) =>
        `<li class="timeline-item"><strong>${escapeHtml(item[productHeader] || "Untitled")}</strong><p>${escapeHtml(item[statusHeader] || "Unknown")} · ${normalizeProgress(item[progressHeader])}% · ${escapeHtml(item[yearHeader] || "Year TBD")}</p></li>`
    )
    .join("");
}

function renderAll() {
  renderKpis();
  renderTable();
  renderStageBreakdown();
  renderMilestones();
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  return tabCount > commaCount ? "\t" : ",";
}

function parseDelimitedText(text, delimiter = ",") {
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentCell += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (character === delimiter && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += character;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  if (insideQuotes) {
    throw new Error("File has an unmatched quote.");
  }

  return rows.filter((row) => row.some((cell) => cell !== ""));
}

function importUsing2026Headers(text) {
  const delimiter = detectDelimiter(text);
  const rows = parseDelimitedText(text, delimiter);

  if (rows.length < 2) {
    throw new Error("File needs a header row and at least one data row.");
  }

  const detectedHeaders = rows[0];
  console.log("Detected headers:", detectedHeaders);

  const missingHeaders = tableHeaders.filter((header) => !detectedHeaders.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers from 2026 row 1: ${missingHeaders.join(", ")}`);
  }

  const importedRows = rows.slice(1).map((row) => {
    return tableHeaders.reduce((record, header) => {
      const index = detectedHeaders.indexOf(header);
      record[header] = index >= 0 ? row[index] || "" : "";
      return record;
    }, {});
  });

  const nonEmptyRows = importedRows.filter((row) => String(row[tableHeaders[0]] || "").trim());

  console.log("Imported row count:", nonEmptyRows.length);
  console.log("First imported row:", nonEmptyRows[0] || null);

  if (nonEmptyRows.length === 0) {
    throw new Error("No data rows were imported. Make sure the first column has values.");
  }

  return nonEmptyRows;
}

function normalizeProgress(value) {
  const number = Number.parseFloat(String(value || "").replace("%", ""));
  if (Number.isNaN(number)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(number)));
}

function normalizeCost(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value || "").replace(/[^0-9.-]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function setImportStatus(message, isError = false) {
  importStatus.textContent = message;
  importStatus.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeHeader(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ");
}

function findHeaderIncludes(partialName) {
  const normalizedPartial = normalizeHeader(partialName);
  return tableHeaders.find((header) => normalizeHeader(header).includes(normalizedPartial));
}

function buildGvizCsvUrl(tabName) {
  const encodedSheet = encodeURIComponent(tabName);
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodedSheet}`;
}

async function loadSheetStructure() {
  try {
    const structureResponse = await fetch(buildGvizCsvUrl(STRUCTURE_TAB));
    if (!structureResponse.ok) {
      throw new Error(`Failed to fetch 2026 tab: ${structureResponse.status}`);
    }

    const structureText = await structureResponse.text();
    const structureRows = parseDelimitedText(structureText, detectDelimiter(structureText));
    const row1 = structureRows[0] || [];

    if (row1.length > 0) {
      tableHeaders = row1;
    }

    const validationResponse = await fetch(buildGvizCsvUrl(VALIDATION_TAB));
    if (validationResponse.ok) {
      const validationText = await validationResponse.text();
      const validationRows = parseDelimitedText(validationText, detectDelimiter(validationText));
      columnEOptions = validationRows
        .slice(1)
        .map((row) => row[4] || "")
        .filter((value, index, all) => value && all.indexOf(value) === index);
    }

    setImportStatus(
      `Loaded 2026 structure (${tableHeaders.length} columns). Column E dropdown has ${columnEOptions.length} options.`
    );
  } catch (error) {
    console.warn("Could not load Google Sheet structure. Using built-in fallback.", error);
    setImportStatus(
      "Could not access Google Sheet directly. Publish the sheet to web OR export the 2026 tab as CSV before importing.",
      true
    );
  }
}

csvFileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const imported = importUsing2026Headers(text);
    initiatives = imported;
    saveInitiatives();
    renderAll();
    setImportStatus(`Imported ${imported.length} rows from ${file.name}.`);
  } catch (error) {
    console.error("Import failed:", error);
    setImportStatus(error.message || "Import failed.", true);
  }
});

document.getElementById("initiativeTableBody").addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) {
    return;
  }

  const rowIndex = Number.parseInt(target.dataset.row, 10);
  const header = target.dataset.header;
  if (!Number.isInteger(rowIndex) || !header || !initiatives[rowIndex]) {
    return;
  }

  initiatives[rowIndex][header] = target.value;
  saveInitiatives();
  renderAll();
});

resetDataBtn.addEventListener("click", () => {
  initiatives = [...sampleInitiatives];
  localStorage.removeItem(STORAGE_KEY);
  renderAll();
  setImportStatus("Reset to sample data.");
});

loadSheetStructure().finally(() => {
  renderAll();
});
