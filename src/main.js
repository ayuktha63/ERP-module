// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'src/preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // Development
    win.loadURL('http://localhost:3000');

    // For Production:
    // win.loadFile(path.join(__dirname, 'build/index.html'));
}

app.whenReady().then(createWindow);
