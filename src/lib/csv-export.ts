import type { OptometryCase } from '@/types/case';

export function exportToCsv(filename: string, rows: OptometryCase[]): void {
  if (typeof window === 'undefined' || !rows || rows.length === 0) {
    return;
  }

  const headers = [
    'ID',
    'Timestamp',
    'Visual Acuity',
    'Refraction',
    'Ocular Health Status',
    'Additional Notes',
  ];

  // Function to escape CSV special characters for a single field
  const escapeCsvField = (field: string | undefined): string => {
    if (field === null || field === undefined) {
      return '""';
    }
    const stringField = String(field);
    // Replace " with "" and wrap in " if it contains , " or newline
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return `"${stringField}"`; // Always quote fields for simplicity and robustness
  };
  
  const csvRows = [
    headers.map(header => escapeCsvField(header)).join(','), // header row
    ...rows.map(row =>
      [
        escapeCsvField(row.id),
        escapeCsvField(new Date(row.timestamp).toISOString()),
        escapeCsvField(row.visualAcuity),
        escapeCsvField(row.refraction),
        escapeCsvField(row.ocularHealthStatus),
        escapeCsvField(row.additionalNotes),
      ].join(',')
    ),
  ];

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
