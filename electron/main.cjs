const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

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

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

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
