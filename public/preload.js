const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipc', {
  invoke: (channel, data) => ipcRenderer.invoke(channel, data)
});