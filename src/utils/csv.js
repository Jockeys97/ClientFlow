export function toCsvValue(value) {
  if (value == null) return '';
  const str = String(value);
  // Escape quotes and wrap if needed
  const needsWrap = /[",\n]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsWrap ? `"${escaped}"` : escaped;
}

function detectDelimiter() {
  try {
    // If decimal separator is comma, use semicolon as CSV delimiter (Excel conventions)
    const decimalSample = (1.1).toLocaleString();
    return decimalSample.includes(',') ? ';' : ',';
  } catch {
    return ',';
  }
}

export function toCsv(rows, delimiter = detectDelimiter()) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const headerLine = headers.map(toCsvValue).join(delimiter);
  const lines = rows.map((row) => headers.map((h) => toCsvValue(row[h])).join(delimiter));
  return [headerLine, ...lines].join('\n');
}

export function downloadCsv(filename, rows, options = {}) {
  const delimiter = options.delimiter || detectDelimiter();
  const csv = toCsv(rows, delimiter);
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


