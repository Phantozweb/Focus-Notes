
// No changes needed to this file based on the request, 
// but its usage in /app/cases/page.tsx might need adjustment if the data structure of cases changes significantly.
// For now, assuming the StoredOptometryCase structure can be reasonably flattened or selected for CSV.

// The current version of this file expects OptometryCase (the simpler one).
// We will update /app/cases/page.tsx to correctly prepare data for this function.

export function exportToCsv(filename: string, csvContent: string): void {
  if (typeof window === 'undefined' || !csvContent) {
    return;
  }
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
