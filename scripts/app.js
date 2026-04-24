const REQUIRED_COLUMNS = [
  'Year Completed',
  'Product',
  'R&D Channel',
  'Test Location',
  'Project Status',
  'Percentages',
  'Cost'
];

const FALLBACK_ROWS = [
  {
    'Year Completed': '2026',
    Product: 'Eco Smart Bottle',
    'R&D Channel': 'Materials',
    'Test Location': 'Austin Lab',
    'Project Status': 'Prototype',
    Percentages: '65',
    Cost: '$85,000'
  },
  {
    'Year Completed': '2026',
    Product: 'Home Sensor Hub',
    'R&D Channel': 'IoT',
    'Test Location': 'San Jose',
    'Project Status': 'Discovery',
    Percentages: '25',
    Cost: '$120,000'
  }
];

const productsRoot = document.getElementById('products-root');
const csvUploadInput = document.getElementById('csv-upload');
const importStatus = document.getElementById('import-status');
const debugBox = document.getElementById('import-debug');

let currentRows = [...FALLBACK_ROWS];
let activeColumns = [...REQUIRED_COLUMNS];

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setStatus(message, isError = false) {
  if (!importStatus) return;
  importStatus.textContent = message;
  importStatus.style.color = isError ? '#9d2222' : '#2f3d67';
}

function renderDebugInfo({ headers = [], rowCount = 0, firstRow = null } = {}) {
  if (!debugBox) return;

  const firstRowString = firstRow ? JSON.stringify(firstRow, null, 2) : 'None';
  debugBox.innerHTML = `
    <h3>Import Debug</h3>
    <p><strong>Detected headers:</strong> ${escapeHtml(headers.join(', ') || 'None')}</p>
    <p><strong>Row count:</strong> ${rowCount}</p>
    <p><strong>First imported row:</strong></p>
    <pre>${escapeHtml(firstRowString)}</pre>
  `;
}

function renderTable(columns, rows) {
  if (!productsRoot) return;

  const tableHead = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('');

  const tableRows = rows
    .map((row) => {
      const cells = columns
        .map((column) => {
          const value = row[column] ?? '';
          return `<td>${escapeHtml(value || '—')}</td>`;
        })
        .join('');

      return `<tr>${cells}</tr>`;
    })
    .join('');

  productsRoot.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>${tableHead}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  return tabCount > commaCount ? '\t' : ',';
}

function parseDelimitedRows(text, delimiter) {
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

    if (character === delimiter && !insideQuotes) {
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
    throw new Error('File has an unmatched quote.');
  }

  return rows.filter((row) => row.some((cell) => cell !== ''));
}

function importRowsFromFile(text) {
  const delimiter = detectDelimiter(text);
  const rows = parseDelimitedRows(text, delimiter);

  if (rows.length < 2) {
    throw new Error('File must include row 1 headers and at least one data row.');
  }

  const detectedHeaders = rows[0];
  const missingRequired = REQUIRED_COLUMNS.filter((column) => !detectedHeaders.includes(column));
  if (missingRequired.length > 0) {
    throw new Error(`Missing required headers: ${missingRequired.join(', ')}`);
  }

  const extraColumns = detectedHeaders.filter((header) => !REQUIRED_COLUMNS.includes(header));
  const columns = [...REQUIRED_COLUMNS, ...extraColumns];

  const importedRows = rows.slice(1).map((cells) => {
    const record = {};
    columns.forEach((column) => {
      const index = detectedHeaders.indexOf(column);
      record[column] = index >= 0 ? cells[index] || '' : '';
    });
    return record;
  });

  const filteredRows = importedRows.filter((row) => {
    return REQUIRED_COLUMNS.some((column) => String(row[column] || '').trim().length > 0);
  });

  if (!filteredRows.length) {
    throw new Error('No importable data rows were found under the required columns.');
  }

  return {
    detectedHeaders,
    columns,
    rows: filteredRows,
    firstRow: filteredRows[0]
  };
}

if (csvUploadInput) {
  csvUploadInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setStatus(`Reading ${file.name}...`);
      const text = await file.text();
      const imported = importRowsFromFile(text);
      activeColumns = imported.columns;
      currentRows = imported.rows;
      renderTable(activeColumns, currentRows);
      renderDebugInfo({
        headers: imported.detectedHeaders,
        rowCount: imported.rows.length,
        firstRow: imported.firstRow
      });
      setStatus(`Imported ${imported.rows.length} rows from ${file.name}.`);
    } catch (error) {
      console.error('File import failed:', { fileName: file.name, error });
      setStatus(error.message || `Could not import ${file.name}.`, true);
      renderTable(activeColumns, currentRows);
    }
  });
}

renderTable(activeColumns, currentRows);
renderDebugInfo({
  headers: activeColumns,
  rowCount: currentRows.length,
  firstRow: currentRows[0]
});
setStatus('Showing sample data. Upload a CSV or TSV to replace this table.');
