const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,

  // Save file with native "Save As" dialog
  // fileName: suggested file name
  // data: Uint8Array of file content
  // filters: [{ name: 'Word', extensions: ['docx'] }]
  saveFile: (fileName, data, filters) =>
    ipcRenderer.invoke('save-file', { fileName, data: Array.from(data), filters }),

  // Open file with native dialog
  openFile: (filters) =>
    ipcRenderer.invoke('open-file', { filters }),

  // Export all data as backup JSON
  exportBackup: (jsonString) =>
    ipcRenderer.invoke('export-backup', { jsonString }),

  // Import backup JSON
  importBackup: () =>
    ipcRenderer.invoke('import-backup'),
});
