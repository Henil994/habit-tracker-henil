const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;
const dataFilePath = path.join(os.homedir(), '.habittracker', 'data.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(dataFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Save Data',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('save-data-manual');
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Habit Tracker',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Habit Tracker',
              message: 'Habit Tracker v1.0.1',
              detail: 'A professional habit tracking application.\n\nTrack your daily habits, set goals, and visualize your progress with beautiful charts.\n\nYour data is automatically saved when you exit the application.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('save-file', async (event, filename, content) => {
  try {
    ensureDataDirectory();
    const filepath = path.join(os.homedir(), '.habittracker', filename);
    fs.writeFileSync(filepath, content, 'utf-8');
    return { success: true, path: filepath };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-file', async (event) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    if (!result.canceled) {
      const content = fs.readFileSync(result.filePaths[0], 'utf-8');
      return { success: true, content, path: result.filePaths[0] };
    }
    return { success: false, canceled: true };
  } catch (error) {
    console.error('Error opening file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

// Auto-save data when app is closing
ipcMain.on('app-data-ready', (event, data) => {
  // Store data for auto-save
  app.userData = data;
});

app.on('before-quit', () => {
  // Send signal to renderer to save data before quitting
  if (mainWindow) {
    mainWindow.webContents.send('app-before-quit');
  }
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
