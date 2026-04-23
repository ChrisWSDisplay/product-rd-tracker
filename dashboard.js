const initiatives = [
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

function renderKpis() {
  const total = initiatives.length;
  const avgProgress = Math.round(
    initiatives.reduce((sum, item) => sum + item.progress, 0) / total
  );
  const highPriority = initiatives.filter((item) => item.priority === "High").length;
  const activeStages = new Set(initiatives.map((item) => item.stage)).size;

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
    .map(
      (item) => `
      <tr>
        <td>${item.product}</td>
        <td>${item.owner}</td>
        <td>${item.stage}</td>
        <td><span class="priority ${item.priority.toLowerCase()}">${item.priority}</span></td>
        <td>
          <div class="progress-bar" aria-label="Progress for ${item.product}">
            <div class="progress-fill" style="width: ${item.progress}%"></div>
          </div>
        </td>
        <td>${item.updated}</td>
      </tr>
    `
    )
    .join("");
}

function renderStageBreakdown() {
  const counts = initiatives.reduce((acc, item) => {
    acc[item.stage] = (acc[item.stage] || 0) + 1;
    return acc;
  }, {});

  document.getElementById("stageBreakdown").innerHTML = Object.entries(counts)
    .map(
      ([stage, count]) =>
        `<li class="stage-item"><span>${stage}</span><strong>${count}</strong></li>`
    )
    .join("");
}

function renderMilestones() {
  const sorted = [...initiatives].sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
  );

  document.getElementById("milestoneList").innerHTML = sorted
    .map(
      (item) =>
        `<li class="timeline-item"><strong>${item.milestone}</strong><p>${item.product} · Due ${item.dueDate}</p></li>`
    )
    .join("");
}

renderKpis();
renderTable();
renderStageBreakdown();
renderMilestones();
