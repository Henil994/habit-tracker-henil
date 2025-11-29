const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // Platform information
  platform: process.platform,
  version: process.version,

  // File operations
  saveFile: (filename, content) => ipcRenderer.invoke('save-file', filename, content),
  openFile: () => ipcRenderer.invoke('open-file'),

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Window control
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),

  // Data sync
  onBeforeQuit: (callback) => ipcRenderer.on('app-before-quit', callback),
  onSaveDataManual: (callback) => ipcRenderer.on('save-data-manual', callback),
  appDataReady: (data) => ipcRenderer.send('app-data-ready', data),

  // System info
  getSystemInfo: () => ({
    platform: process.platform,
    arch: process.arch,
    cpus: require('os').cpus().length
  })
});

// Allow console logging in development
if (process.env.NODE_ENV === 'development') {
  window.electronAPI = contextBridge;
}
