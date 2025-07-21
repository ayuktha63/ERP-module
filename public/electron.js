const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('../src/db/database');

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL('http://localhost:3000');
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  db = new Database(path.join(app.getPath('userData'), 'erp.db'));

  ipcMain.handle('login', async (event, { username, password }) => {
    return await db.login(username, password);
  });

  ipcMain.handle('get-products', async () => {
    return await db.getProducts();
  });

  ipcMain.handle('add-product', async (event, product) => {
    return await db.addProduct(product);
  });

  ipcMain.handle('update-product', async (event, id, product) => {
    return await db.updateProduct(id, product);
  });

  ipcMain.handle('delete-product', async (event, id) => {
    return await db.deleteProduct(id);
  });

  ipcMain.handle('get-customers', async () => {
    return await db.getCustomers();
  });

  ipcMain.handle('add-customer', async (event, customer) => {
    return await db.addCustomer(customer);
  });

  ipcMain.handle('find-customer', async (event, mobile) => {
    return await db.findCustomerByMobile(mobile);
  });

  ipcMain.handle('save-bill', async (event, bill) => {
    return await db.saveBill(bill);
  });

  ipcMain.handle('get-bills', async () => {
    return await db.getBills();
  });

  ipcMain.handle('add-purchase', async (event, purchase) => {
    return await db.addPurchase(purchase);
  });

  ipcMain.handle('get-purchases', async () => {
    return await db.getPurchases();
  });

  ipcMain.handle('get-sales-report', async (event, filters) => {
    return await db.getSalesReport(filters);
  });

  ipcMain.handle('get-daybook', async (event, date) => {
    return await db.getDaybook(date);
  });

  ipcMain.handle('get-settings', async () => {
    return await db.getSettings();
  });

  ipcMain.handle('update-settings', async (event, settings) => {
    return await db.updateSettings(settings);
  });

  ipcMain.handle('test-ipc', async () => 'IPC is working');

  createWindow();
});

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