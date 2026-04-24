const STORAGE_KEY = "prdTracker.initiatives";

const sampleInitiatives = [
  {
    product: "Smart Inventory Assistant",
    owner: "Maya Chen",
    stage: "Discovery",
    priority: "High",
    progress: 30,
    updated: "Apr 21, 2026",
    milestone: "Customer interviews complete",
    dueDate: "May 2, 2026"
  },
  {
    product: "Mobile Checkout SDK",
    owner: "Jordan Patel",
    stage: "Prototype",
    priority: "Medium",
    progress: 55,
    updated: "Apr 22, 2026",
    milestone: "Pilot integration with Partner A",
    dueDate: "May 10, 2026"
  },
  {
    product: "Supplier Risk Insights",
    owner: "Nina Alvarez",
    stage: "Validation",
    priority: "High",
    progress: 72,
    updated: "Apr 23, 2026",
    milestone: "Model precision benchmark",
    dueDate: "May 7, 2026"
  },
  {
    product: "Demand Forecast API v2",
    owner: "Leo Thompson",
    stage: "Build",
    priority: "Low",
    progress: 88,
    updated: "Apr 18, 2026",
    milestone: "Performance load test",
    dueDate: "May 15, 2026"
  },
  {
    product: "Returns Intelligence Portal",
    owner: "Sara Kim",
    stage: "Launch Prep",
    priority: "Medium",
    progress: 93,
    updated: "Apr 20, 2026",
    milestone: "Enable customer-facing dashboard",
    dueDate: "Apr 30, 2026"
  }
];

const productFields = [
  { key: "product", label: "Product name", required: true },
  { key: "owner", label: "Owner", required: false },
  { key: "stage", label: "Stage", required: false },
  { key: "priority", label: "Priority", required: false },
  { key: "progress", label: "Progress %", required: false },
  { key: "updated", label: "Updated date", required: false },
  { key: "milestone", label: "Milestone", required: false },
  { key: "dueDate", label: "Due date", required: false }
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
    initiatives.reduce((sum, item) => sum + normalizeProgress(item.progress), 0) / total
  );
  const highPriority = initiatives.filter(
    (item) => normalizePriority(item.priority) === "High"
  ).length;
  const activeStages = new Set(initiatives.map((item) => item.stage || "Unknown")).size;

  const kpis = [
    { label: "Total initiatives", value: total },
    { label: "Average progress", value: `${avgProgress}%` },
    { label: "High priority", value: highPriority },
    { label: "Active stages", value: activeStages }
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
      const priority = normalizePriority(item.priority);
      const priorityClass = priority.toLowerCase();
      const progress = normalizeProgress(item.progress);

      return `
      <tr>
        <td>${escapeHtml(item.product || "Untitled product")}</td>
        <td>${escapeHtml(item.owner || "Unassigned")}</td>
        <td>${escapeHtml(item.stage || "Unknown")}</td>
        <td><span class="priority ${priorityClass}">${priority}</span></td>
        <td>
          <div class="progress-bar" aria-label="Progress for ${escapeHtml(item.product || "product")}">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
        </td>
        <td>${escapeHtml(item.updated || "—")}</td>
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
    const dateA = asDate(a.dueDate);
    const dateB = asDate(b.dueDate);
    return dateA - dateB;
  });

  document.getElementById("milestoneList").innerHTML = sorted
    .map(
      (item) =>
        `<li class="timeline-item"><strong>${escapeHtml(item.milestone || "No milestone provided")}</strong><p>${escapeHtml(item.product || "Untitled")} · Due ${escapeHtml(item.dueDate || "TBD")}</p></li>`
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

      const guessedHeader = guessHeader(headers, field.key);

      return `
        <label for="map-${field.key}">
          ${field.label}${field.required ? " *" : ""}
          <select id="map-${field.key}" data-field="${field.key}">
            ${options}
          </select>
        </label>
      `;
      // selection is applied after rendering
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
    owner: ["owner", "lead", "pm", "product owner"],
    stage: ["stage", "status", "phase"],
    priority: ["priority", "importance"],
    progress: ["progress", "percent complete", "completion", "% complete"],
    updated: ["updated", "last updated", "updated at"],
    milestone: ["milestone", "next milestone", "goal"],
    dueDate: ["due", "due date", "target date", "deadline"]
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
    setImportStatus("Please map at least the Product name field.", true);
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
  setImportStatus(`Imported ${mapped.length} rows from CSV and saved in your browser.`);
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

  const product = valueFor("product");
  const owner = valueFor("owner") || "Unassigned";
  const stage = valueFor("stage") || "Unknown";
  const priority = normalizePriority(valueFor("priority"));
  const progress = normalizeProgress(valueFor("progress"));
  const dueDateRaw = valueFor("dueDate");
  const dueDate = dueDateRaw || "TBD";
  const milestone = valueFor("milestone") || "No milestone provided";
  const updatedRaw = valueFor("updated");
  const updated = updatedRaw || new Date().toLocaleDateString("en-US");

  return {
    product,
    owner,
    stage,
    priority,
    progress,
    updated,
    milestone,
    dueDate
  };
}

function normalizeProgress(value) {
  const number = Number.parseFloat(String(value).replace("%", ""));
  if (Number.isNaN(number)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(number)));
}

function normalizePriority(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "high") {
    return "High";
  }
  if (normalized === "low") {
    return "Low";
  }
  return "Medium";
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
    `Loaded "${file.name}". Map columns and click "Apply mapping" to refresh the table.`
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
