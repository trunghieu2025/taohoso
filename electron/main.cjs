const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

// Detect dev mode (Vite dev server running)
const isDev = process.env.ELECTRON_DEV === 'true';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Tạo Hồ Sơ - Desktop',
    icon: path.join(__dirname, '..', 'public', 'icon-512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Modern window appearance
    autoHideMenuBar: true,
    show: false,
  });

  // Show window when ready to avoid white flash
  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev) {
    // Dev mode: load from Vite dev server
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // Production: load built files
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Dynamic window title: update when page title changes
  win.webContents.on('page-title-updated', (event, title) => {
    event.preventDefault();
    win.setTitle(title || 'Tạo Hồ Sơ - Desktop');
  });

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ── IPC Handlers ──

// Save file with native "Save As" dialog
ipcMain.handle('save-file', async (event, { fileName, data, filters }) => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showSaveDialog(win, {
    defaultPath: fileName,
    filters: filters || [
      { name: 'Tất cả file', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  try {
    // data is a Uint8Array from renderer
    fs.writeFileSync(result.filePath, Buffer.from(data));
    return { success: true, filePath: result.filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Open file with native dialog
ipcMain.handle('open-file', async (event, { filters }) => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(win, {
    filters: filters || [
      { name: 'Tất cả file', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  try {
    const filePath = result.filePaths[0];
    const buffer = fs.readFileSync(filePath);
    return {
      success: true,
      filePath,
      fileName: path.basename(filePath),
      data: Array.from(new Uint8Array(buffer)),
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Export all data (backup)
ipcMain.handle('export-backup', async (event, { jsonString }) => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showSaveDialog(win, {
    defaultPath: `TaoHoSo_Backup_${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  try {
    fs.writeFileSync(result.filePath, jsonString, 'utf-8');
    return { success: true, filePath: result.filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Import backup data
ipcMain.handle('import-backup', async () => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(win, {
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  try {
    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    return { success: true, data: content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Convert .doc/.xls to .docx/.xlsx using LibreOffice
ipcMain.handle('convert-doc', async (event, { fileName, data }) => {
  // Find LibreOffice soffice.exe on Windows
  const possiblePaths = [
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'LibreOffice', 'program', 'soffice.exe'),
  ];
  
  let sofficePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      sofficePath = p;
      break;
    }
  }
  
  if (!sofficePath) {
    return {
      success: false,
      error: 'LibreOffice chưa được cài đặt. Vui lòng tải LibreOffice tại: https://www.libreoffice.org/download/',
      needInstall: true,
    };
  }
  
  // Write temp file
  const tmpDir = app.getPath('temp');
  const tmpFile = path.join(tmpDir, `taohoso_convert_${Date.now()}_${fileName}`);
  
  try {
    fs.writeFileSync(tmpFile, Buffer.from(data));
    
    // Determine output format
    const ext = path.extname(fileName).toLowerCase();
    const convertTo = (ext === '.doc') ? 'docx' : (ext === '.xls') ? 'xlsx' : 'docx';

    // Run LibreOffice conversion
    await new Promise((resolve, reject) => {
      execFile(sofficePath, [
        '--headless',
        '--convert-to', convertTo,
        '--outdir', tmpDir,
        tmpFile,
      ], { timeout: 30000 }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Read converted file
    const baseName = path.basename(tmpFile, path.extname(tmpFile));
    const convertedFile = path.join(tmpDir, `${baseName}.${convertTo}`);
    
    if (!fs.existsSync(convertedFile)) {
      throw new Error('Chuyển đổi thất bại — file output không tìm thấy.');
    }
    
    const convertedBuffer = fs.readFileSync(convertedFile);
    const result = {
      success: true,
      data: Array.from(new Uint8Array(convertedBuffer)),
      newFileName: fileName.replace(/\.(doc|xls)$/i, `.${convertTo}`),
    };
    
    // Cleanup temp files
    try { fs.unlinkSync(tmpFile); } catch { }
    try { fs.unlinkSync(convertedFile); } catch { }
    
    return result;
  } catch (err) {
    // Cleanup on error
    try { fs.unlinkSync(tmpFile); } catch { }
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
