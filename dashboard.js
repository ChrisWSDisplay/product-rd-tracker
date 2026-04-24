const STORAGE_KEY = "prdTracker.initiatives";

const sampleInitiatives = [
  {
    product: "Smart Inventory Assistant",
    stage: "Discovery",
    percentages: 30,
    channel: "AI/ML",
    location: "Austin Lab",
    yearCompleted: "2026",
    cost: "$120,000",
    notes: "Customer interviews complete"
  },
  {
    product: "Mobile Checkout SDK",
    stage: "Prototype",
    percentages: 55,
    channel: "Platform",
    location: "San Jose",
    yearCompleted: "2026",
    cost: "$210,000",
    notes: "Pilot integration with Partner A"
  },
  {
    product: "Supplier Risk Insights",
    stage: "Validation",
    percentages: 72,
    channel: "Analytics",
    location: "Chicago Test Center",
    yearCompleted: "2026",
    cost: "$180,000",
    notes: "Model precision benchmark"
  }
];

const productFields = [
  { key: "product", label: "Product", required: true },
  { key: "stage", label: "Project Status", required: false },
  { key: "percentages", label: "Percentages", required: false },
  { key: "channel", label: "R&D Channel", required: false },
  { key: "location", label: "Test Location", required: false },
  { key: "yearCompleted", label: "Year Completed", required: false },
  { key: "cost", label: "Cost", required: false },
  { key: "notes", label: "Comments", required: false }
];

let initiatives = loadSavedInitiatives();
let csvHeaders = [];
let csvRows = [];

const csvFileInput = document.getElementById("csvFileInput");
const mappingControls = document.getElementById("mappingControls");
const applyMappingBtn = document.getElementById("applyMappingBtn");
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
  const avgProgress = Math.round(
    initiatives.reduce((sum, item) => sum + normalizeProgress(item.percentages), 0) / (total || 1)
  );
  const totalCost = initiatives.reduce((sum, item) => sum + normalizeCost(item.cost), 0);
  const activeStages = new Set(initiatives.map((item) => item.stage || "Unknown")).size;

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

  document.getElementById("initiativeTableBody").innerHTML = initiatives
    .map((item) => {
      const progress = normalizeProgress(item.percentages);

      return `
      <tr>
        <td>${escapeHtml(item.product || "Untitled product")}</td>
        <td>${escapeHtml(item.stage || "Unknown")}</td>
        <td>${progress}%</td>
        <td>${escapeHtml(item.channel || "—")}</td>
        <td>${escapeHtml(item.location || "—")}</td>
        <td>${escapeHtml(item.yearCompleted || "—")}</td>
        <td>${escapeHtml(item.cost || "—")}</td>
        <td>${escapeHtml(item.notes || "")}</td>
      </tr>
    `;
    })
    .join("");
}

function renderStageBreakdown() {
  const counts = initiatives.reduce((acc, item) => {
    const stage = item.stage || "Unknown";
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
  const sorted = [...initiatives].sort((a, b) => {
    const yearA = Number.parseInt(a.yearCompleted, 10) || Number.MAX_SAFE_INTEGER;
    const yearB = Number.parseInt(b.yearCompleted, 10) || Number.MAX_SAFE_INTEGER;
    return yearA - yearB;
  });

  document.getElementById("milestoneList").innerHTML = sorted
    .map(
      (item) =>
        `<li class="timeline-item"><strong>${escapeHtml(item.product || "Untitled")}</strong><p>${escapeHtml(item.stage || "Unknown")} · ${normalizeProgress(item.percentages)}% · ${escapeHtml(item.yearCompleted || "Year TBD")}</p></li>`
    )
    .join("");
}

function renderAll() {
  renderKpis();
  renderTable();
  renderStageBreakdown();
  renderMilestones();
}

function parseCsv(csvText) {
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentCell += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (character === "," && !insideQuotes) {
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

  return rows.filter((row) => row.some((cell) => cell !== ""));
}

function buildMappingControls(headers) {
  mappingControls.innerHTML = productFields
    .map((field) => {
      const options = [
        `<option value="">-- Not mapped --</option>`,
        ...headers.map(
          (header) => `<option value="${escapeHtml(header)}">${escapeHtml(header)}</option>`
        )
      ].join("");

      return `
        <label for="map-${field.key}">
          ${field.label}${field.required ? " *" : ""}
          <select id="map-${field.key}" data-field="${field.key}">
            ${options}
          </select>
        </label>
      `;
    })
    .join("");

  productFields.forEach((field) => {
    const select = document.getElementById(`map-${field.key}`);
    if (!select) {
      return;
    }
    const guessed = guessHeader(headers, field.key);
    if (guessed) {
      select.value = guessed;
    }
  });
}

function guessHeader(headers, fieldKey) {
  const aliases = {
    product: ["product", "product name", "name", "initiative"],
    stage: ["project status", "status", "stage", "phase"],
    percentages: ["percentages", "percent complete", "progress", "completion", "% complete"],
    channel: ["r&d channel", "rd channel", "channel", "category"],
    location: ["test location", "location", "site"],
    yearCompleted: ["year completed", "completed year", "year"],
    cost: ["cost", "budget", "amount"],
    notes: ["comments", "notes", "note", "description"]
  };

  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header)
  }));

  const fieldAliases = aliases[fieldKey] || [];
  const match = normalizedHeaders.find((header) =>
    fieldAliases.includes(header.normalized)
  );
  return match ? match.original : "";
}

function normalizeHeader(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ");
}

function getMapping() {
  return productFields.reduce((mapping, field) => {
    const select = document.getElementById(`map-${field.key}`);
    mapping[field.key] = select ? select.value : "";
    return mapping;
  }, {});
}

function applyMapping() {
  const mapping = getMapping();

  if (!mapping.product) {
    setImportStatus("Please map at least the Product field.", true);
    return;
  }

  const mapped = csvRows
    .map((row) => mapRowToInitiative(row, mapping, csvHeaders))
    .filter((item) => item.product);

  if (mapped.length === 0) {
    setImportStatus("No rows were imported. Check your mapping selections.", true);
    return;
  }

  initiatives = mapped;
  saveInitiatives();
  renderAll();
  setImportStatus(
    `Imported ${mapped.length} rows from CSV. Sample data has been replaced in the table.`
  );
}

function mapRowToInitiative(row, mapping, headers) {
  const valueFor = (fieldKey) => {
    const headerName = mapping[fieldKey];
    if (!headerName) {
      return "";
    }
    const index = headers.indexOf(headerName);
    return index >= 0 ? row[index] || "" : "";
  };

  return {
    product: valueFor("product"),
    stage: valueFor("stage") || "Unknown",
    percentages: normalizeProgress(valueFor("percentages")),
    channel: valueFor("channel"),
    location: valueFor("location"),
    yearCompleted: valueFor("yearCompleted"),
    cost: valueFor("cost"),
    notes: valueFor("notes")
  };
}

function normalizeProgress(value) {
  const number = Number.parseFloat(String(value).replace("%", ""));
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

function asDate(value) {
  const parsed = new Date(value);
  const timestamp = parsed.getTime();
  if (Number.isNaN(timestamp)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return timestamp;
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

csvFileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  const text = await file.text();
  const rows = parseCsv(text);

  if (rows.length < 2) {
    setImportStatus("CSV file needs a header row plus at least one data row.", true);
    return;
  }

  csvHeaders = rows[0];
  csvRows = rows.slice(1);
  buildMappingControls(csvHeaders);
  applyMappingBtn.disabled = false;
  setImportStatus(
    `Loaded "${file.name}". Mapping was auto-suggested; click \"Apply mapping\" to replace sample data.`
  );
});

applyMappingBtn.addEventListener("click", applyMapping);

resetDataBtn.addEventListener("click", () => {
  initiatives = [...sampleInitiatives];
  localStorage.removeItem(STORAGE_KEY);
  renderAll();
  setImportStatus("Reset to sample data.");
});

renderAll();
