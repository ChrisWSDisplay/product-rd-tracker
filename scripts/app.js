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
let currentProducts = [...FALLBACK_PRODUCTS];

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

function normalizeHeaderName(header) {
  return String(header || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function findColumnIndex(headers, aliases) {
  const normalizedAliases = aliases.map((alias) => normalizeHeaderName(alias));
  return headers.findIndex((header) => normalizedAliases.includes(normalizeHeaderName(header)));
}

function parseCsvRows(text) {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
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

    if (character === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !insideQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1;
      }
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += character;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  if (insideQuotes) {
    throw new Error('CSV contains an unmatched quote.');
  }

  return rows.filter((row) => row.some((cell) => cell !== ''));
}

function parseCsv(text) {
  const rows = parseCsvRows(text);

  if (rows.length < 2) {
    throw new Error('CSV must include a header row and at least one data row.');
  }

  const headers = rows[0];
  console.log('CSV headers detected:', headers);

  const productIndex = findColumnIndex(headers, [
    'Product Name',
    'Product',
    'Name',
    'Item Name',
    'SKU',
    'Description',
    'Initiative'
  ]);
  if (productIndex < 0) {
    throw new Error(
      'CSV is missing a product-name column. Supported names: Product Name, Product, Name, Item Name, SKU, Description.'
    );
  }

  const stageIndex = findColumnIndex(headers, [
    'Status',
    'Stage',
    'Progress Status',
    'Product Stage',
    'Current Stage',
    'Phase'
  ]);
  const ownerIndex = findColumnIndex(headers, ['Owner', 'Lead', 'Product Owner', 'PM']);
  const dueDateIndex = findColumnIndex(headers, ['Due Date', 'Due', 'Target Date']);
  const priorityIndex = findColumnIndex(headers, ['Priority', 'Importance']);
  const notesIndex = findColumnIndex(headers, ['Notes', 'Note', 'Description']);
  const progressIndex = findColumnIndex(headers, [
    'Percent Complete',
    'Progress',
    'Completion',
    '% Complete'
  ]);

  const firstDataRow = rows[1] || [];
  const firstRowPreview = headers.reduce((preview, header, index) => {
    preview[header] = firstDataRow[index] || '';
    return preview;
  }, {});
  console.log('First imported row preview:', firstRowPreview);

  const products = rows.slice(1).map((cells) => ({
    name: cells[productIndex] || '',
    stage: stageIndex >= 0 ? (cells[stageIndex] || '') : '',
    owner: ownerIndex >= 0 ? (cells[ownerIndex] || '') : '',
    dueDate: dueDateIndex >= 0 ? (cells[dueDateIndex] || '') : '',
    priority: priorityIndex >= 0 ? (cells[priorityIndex] || '') : '',
    notes: notesIndex >= 0 ? (cells[notesIndex] || '') : '',
    percentComplete: progressIndex >= 0 ? (cells[progressIndex] || '') : ''
  }));

  const importedProducts = products.filter((product) => product.name.trim().length > 0);
  if (!importedProducts.length) {
    throw new Error('CSV did not include any rows with a product name.');
  }

  const mappingHints = [];
  if (stageIndex < 0) {
    mappingHints.push(
      'Status/Stage column not recognized. Supported names: Status, Stage, Progress Status, Product Stage, Current Stage.'
    );
  }

  return {
    products: importedProducts,
    mappingHints
  };
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
      setStatus(`Reading ${file.name}...`);
      const text = await file.text();
      const { products: csvProducts, mappingHints } = parseCsv(text);
      currentProducts = csvProducts;
      renderProducts(csvProducts);
      const mappingMessage = mappingHints.length ? ` ${mappingHints.join(' ')}` : '';
      setStatus(`Imported ${csvProducts.length} products from ${file.name}.${mappingMessage}`);
    } catch (error) {
      console.error('CSV import failed:', {
        fileName: file.name,
        error
      });
      setStatus(`Could not import ${file.name}. Please check the CSV format and try again.`);
      renderProducts(currentProducts);
    }
  });
}

renderProducts(currentProducts);
setStatus('Showing sample products. Upload CSV to replace this table.');
