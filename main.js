const { BrowserWindow, globalShortcut } = require('electron'); //aggiungere app poi
const path = require('path');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');

const app = require('electron').app;

Object.defineProperty(app, 'isPackaged', {
  get() {
    return true;
  }
});


const logFile = path.join(__dirname, 'app.log');

function log(message) {
  console.log(message);
  fs.appendFileSync(logFile, message + '\n');
}

let mainWindow;
let currentURL;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 750,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      devTools: true
    }
  });

  mainWindow.setMenu(null);
  const initialURL = 'https://accademia.testammissione.com';
  mainWindow.loadURL(initialURL);

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if ((input.control || input.meta) && input.key.toLowerCase() === 'c') {
        event.preventDefault();
        log('Copy command was prevented');
      }
    });

    setInterval(async () => {
      if (mainWindow.isMinimized()) {
        return;
      }

      if (!mainWindow.isMaximized()) {
        mainWindow.webContents.executeJavaScript('window.location.href').then(async (newURL) => {
          currentURL = newURL;
          const shouldShowFullScreen = shouldShowFullScreenForURL(currentURL);

          setTimeout(() => {
            if (shouldShowFullScreen) {
              mainWindow.maximize();
            }
          }, 100);
        });
      }
    }, 1000);
  });
}

function shouldShowFullScreenForURL(url) {
  const excludedUrls = [
    'https://accademia.testammissione.com/login',
    'https://accademia.testammissione.com/register',
    'https://accademia.testammissione.com/',
    'https://accademia.testammissione.com/forgot-password'
  ];
  return !excludedUrls.includes(url);
}

app.whenReady().then(() => {
  createWindow();

  autoUpdater.setFeedURL({
    provider: 'github',
    repo: 'accademia',
    owner: 'accademiatestammissione',
    private: false
  });
  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.on('update-available', () => log('Update available'));
  autoUpdater.on('update-downloaded', () => log('Update downloaded'));

  globalShortcut.register('PrintScreen', () => {
    log('PrintScreen key combination pressed - No action performed');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
