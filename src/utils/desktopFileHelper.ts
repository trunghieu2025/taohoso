/**
 * Desktop File Helper — abstracts file saving for Electron vs Web.
 * On desktop: uses native "Save As" dialog via electronAPI.
 * On web: falls back to browser download (Blob + <a> click).
 */

interface ElectronAPI {
  isDesktop: boolean;
  saveFile: (
    fileName: string,
    data: number[],
    filters?: { name: string; extensions: string[] }[]
  ) => Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }>;
  exportBackup: (jsonString: string) => Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }>;
  importBackup: () => Promise<{ success: boolean; canceled?: boolean; data?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

/** Check if running in Electron desktop mode */
export function isDesktop(): boolean {
  return !!(window.electronAPI?.isDesktop);
}

/** File filter presets */
export const FILE_FILTERS = {
  word: [{ name: 'Word Document', extensions: ['docx'] }],
  excel: [{ name: 'Excel Spreadsheet', extensions: ['xlsx'] }],
  pdf: [{ name: 'PDF Document', extensions: ['pdf'] }],
  json: [{ name: 'JSON File', extensions: ['json'] }],
  csv: [{ name: 'CSV File', extensions: ['csv'] }],
  all: [{ name: 'Tất cả file', extensions: ['*'] }],
};

/**
 * Save a file — uses native dialog on desktop, browser download on web.
 * @param fileName  Suggested file name (e.g. "ho-so.docx")
 * @param data      File content as Uint8Array, ArrayBuffer, or Blob
 * @param filters   Optional file type filters for the save dialog
 */
export async function saveFileAs(
  fileName: string,
  data: Uint8Array | ArrayBuffer | Blob,
  filters?: { name: string; extensions: string[] }[],
): Promise<{ success: boolean; filePath?: string }> {
  // Convert to Uint8Array if needed
  let bytes: Uint8Array;
  if (data instanceof Blob) {
    const buffer = await data.arrayBuffer();
    bytes = new Uint8Array(buffer);
  } else if (data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data);
  } else {
    bytes = data;
  }

  // Desktop: native save dialog
  if (window.electronAPI?.isDesktop) {
    const result = await window.electronAPI.saveFile(fileName, Array.from(bytes), filters);
    return { success: result.success, filePath: result.filePath };
  }

  // Web: browser download fallback
  const blob = new Blob([bytes.buffer as ArrayBuffer]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return { success: true };
}

/**
 * Helper to auto-detect filter from file extension.
 */
export function getFilterForFileName(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'docx': return FILE_FILTERS.word;
    case 'xlsx': return FILE_FILTERS.excel;
    case 'pdf': return FILE_FILTERS.pdf;
    case 'json': return FILE_FILTERS.json;
    case 'csv': return FILE_FILTERS.csv;
    default: return FILE_FILTERS.all;
  }
}
