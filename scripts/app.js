const FALLBACK_PRODUCTS = [
  {
    name: 'Eco Smart Bottle',
    stage: 'Prototype',
    owner: 'Alex Johnson',
    dueDate: '2026-06-15',
    priority: 'High',
    notes: 'Finalize drop-test results and prep pilot run.',
    percentComplete: 65
  },
  {
    name: 'Home Sensor Hub',
    stage: 'Discovery',
    owner: 'Morgan Lee',
    dueDate: '2026-08-01',
    priority: 'Medium',
    notes: 'Customer interviews in progress.',
    percentComplete: 25
  },
  {
    name: 'Wearable Patch v2',
    stage: 'Validation',
    owner: 'Sam Rivera',
    dueDate: '2026-05-20',
    priority: 'High',
    notes: 'Complete safety documentation package.',
    percentComplete: 90
  }
];

const productsRoot = document.getElementById('products-root');
const csvUploadInput = document.getElementById('csv-upload');
const importStatus = document.getElementById('import-status');

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeProduct(product) {
  const parsedPercent = Number.parseInt(product.percentComplete, 10);
  const percentComplete = Number.isFinite(parsedPercent)
    ? Math.min(100, Math.max(0, parsedPercent))
    : 0;

  return {
    name: product.name || 'Untitled Product',
    stage: product.stage || 'Unknown',
    owner: product.owner || 'Unassigned',
    dueDate: product.dueDate || '',
    priority: product.priority || 'Low',
    notes: product.notes || '',
    percentComplete
  };
}

function getBadgeClass(priority) {
  const value = String(priority).toLowerCase();
  if (value === 'high') return 'badge badge-high';
  if (value === 'medium') return 'badge badge-medium';
  return 'badge badge-low';
}

function formatDueDate(dateString) {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString();
}

function renderProducts(products) {
  if (!productsRoot) return;

  const rows = products
    .map((product) => {
      const normalized = normalizeProduct(product);
      return `
        <tr>
          <td>${escapeHtml(normalized.name)}</td>
          <td><span class="badge badge-stage">${escapeHtml(normalized.stage)}</span></td>
          <td>${escapeHtml(normalized.owner)}</td>
          <td>${escapeHtml(formatDueDate(normalized.dueDate))}</td>
          <td><span class="${getBadgeClass(normalized.priority)}">${escapeHtml(normalized.priority)}</span></td>
          <td>${escapeHtml(normalized.notes)}</td>
          <td>
            <div class="progress-cell">
              <div class="progress-track" aria-label="${escapeHtml(normalized.name)} completion">
                <div class="progress-fill" style="width: ${normalized.percentComplete}%"></div>
              </div>
              <span>${normalized.percentComplete}%</span>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  productsRoot.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Stage</th>
            <th>Owner</th>
            <th>Due Date</th>
            <th>Priority</th>
            <th>Notes</th>
            <th>Percent Complete</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    if (!row.dueDate && row['due date']) {
      row.dueDate = row['due date'];
    }

    if (!row.percentComplete && row['percent complete']) {
      row.percentComplete = row['percent complete'];
    }

    return row;
  });
}

function setStatus(message) {
  if (importStatus) {
    importStatus.textContent = message;
  }
}

if (csvUploadInput) {
  csvUploadInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const csvProducts = parseCsv(text);

      if (!csvProducts.length) {
        setStatus('CSV did not include data rows. Showing sample products instead.');
        renderProducts(FALLBACK_PRODUCTS);
        return;
      }

      renderProducts(csvProducts);
      setStatus(`Imported ${csvProducts.length} products from ${file.name}.`);
    } catch (error) {
      console.error(error);
      setStatus('Could not read that CSV file. Showing sample products instead.');
      renderProducts(FALLBACK_PRODUCTS);
    }
  });
}

renderProducts(FALLBACK_PRODUCTS);
setStatus('Showing sample products. Upload CSV to replace this table.');
