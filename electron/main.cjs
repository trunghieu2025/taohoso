const { app, BrowserWindow, shell, ipcMain, dialog, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

// Detect dev mode (Vite dev server running)
const isDev = process.env.ELECTRON_DEV === 'true';

let mainWindow = null;
let tray = null;
let splashWindow = null;

// ── Splash Screen ──
function createSplashScreen() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    icon: path.join(__dirname, '..', 'public', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Inline HTML for splash screen
  const splashHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', sans-serif;
          display: flex; align-items: center; justify-content: center;
          height: 100vh; background: transparent;
          -webkit-app-region: drag;
        }
        .splash {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d9488 100%);
          border-radius: 20px;
          padding: 3rem 2.5rem;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          width: 380px;
          animation: fadeIn 0.5s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .logo { font-size: 3rem; margin-bottom: 1rem; }
        h1 {
          color: #fff; font-size: 1.5rem; font-weight: 700;
          margin-bottom: 0.5rem;
        }
        p { color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.5rem; }
        .loader {
          width: 200px; height: 4px;
          background: rgba(255,255,255,0.15);
          border-radius: 4px; margin: 0 auto;
          overflow: hidden;
        }
        .loader-bar {
          height: 100%; width: 30%;
          background: linear-gradient(90deg, #10b981, #3b82f6);
          border-radius: 4px;
          animation: loading 1.2s ease infinite;
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .version {
          color: #475569; font-size: 0.7rem;
          margin-top: 1rem;
        }
      </style>
    </head>
    <body>
      <div class="splash">
        <div class="logo">📋</div>
        <h1>Tạo Hồ Sơ</h1>
        <p>Tự động hóa hồ sơ văn phòng</p>
        <div class="loader"><div class="loader-bar"></div></div>
        <div class="version">v1.0.0 • Desktop</div>
      </div>
    </body>
    </html>
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
  splashWindow.center();
}

// ── Main Window ──
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Tạo Hồ Sơ',
    icon: path.join(__dirname, '..', 'public', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Custom title bar
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#e2e8f0',
      height: 36,
    },
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#0f172a',
  });

  // Show main window and close splash
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow.show();
    }, 1500); // Show splash for at least 1.5s
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Dynamic window title
  mainWindow.webContents.on('page-title-updated', (event, title) => {
    event.preventDefault();
    mainWindow.setTitle(title || 'Tạo Hồ Sơ');
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// ── System Tray ──
function createTray() {
  const iconPath = path.join(__dirname, '..', 'public', 'icon.ico');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('Tạo Hồ Sơ - Desktop');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '📋 Mở Tạo Hồ Sơ',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: '📄 Tạo hợp đồng',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.executeJavaScript("window.location.hash = '#/hop-dong-thue-nha'");
        }
      },
    },
    {
      label: '🏗️ Tự động hóa hồ sơ',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.executeJavaScript("window.location.hash = '#/ho-so-sua-chua'");
        }
      },
    },
    {
      label: '📦 Gói mẫu nhiều file',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.executeJavaScript("window.location.hash = '#/goi-mau'");
        }
      },
    },
    { type: 'separator' },
    {
      label: '❌ Thoát',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Double-click tray icon to show window
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
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

  const tmpDir = app.getPath('temp');
  const tmpFile = path.join(tmpDir, `taohoso_convert_${Date.now()}_${fileName}`);

  try {
    fs.writeFileSync(tmpFile, Buffer.from(data));

    const ext = path.extname(fileName).toLowerCase();
    const convertTo = (ext === '.doc') ? 'docx' : (ext === '.xls') ? 'xlsx' : 'docx';

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

    try { fs.unlinkSync(tmpFile); } catch { }
    try { fs.unlinkSync(convertedFile); } catch { }

    return result;
  } catch (err) {
    try { fs.unlinkSync(tmpFile); } catch { }
    return { success: false, error: err.message };
  }
});

// ── App Lifecycle ──

app.whenReady().then(() => {
  createSplashScreen();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Auto-update check (simple version check via GitHub releases)
  checkForUpdates();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.isQuitting = true;
    app.quit();
  }
});

// Ensure single instance
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ── Auto-Update (Simple) ──
async function checkForUpdates() {
  if (isDev) return;
  try {
    const { net } = require('electron');
    const request = net.request('https://api.github.com/repos/trunghieu2025/taohoso/releases/latest');
    request.on('response', (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk.toString(); });
      response.on('end', () => {
        try {
          const release = JSON.parse(body);
          const latestVersion = release.tag_name?.replace('v', '');
          const currentVersion = app.getVersion();
          if (latestVersion && latestVersion !== currentVersion) {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Cập nhật mới',
              message: `Phiên bản ${latestVersion} đã có. Bạn đang dùng ${currentVersion}.`,
              detail: release.body || 'Vui lòng liên hệ để nhận bản cập nhật mới.',
              buttons: ['OK'],
            });
          }
        } catch { }
      });
    });
    request.on('error', () => { });
    request.end();
  } catch { }
}
