const { contextBridge, ipcRenderer } = require("electron");
console.log("Preload loaded");
contextBridge.exposeInMainWorld("electronAPI", {
    selectFile: () => ipcRenderer.invoke("select-file")



});
