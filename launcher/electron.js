const { app, BrowserWindow } = require('electron');
const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');

let backendProcess;
let splashWindow; // Declare the splash screen window
let mainWindow;

// -------------------------
// Start backend using .venv
// -------------------------
function startBackend() {
  let python;

  if (process.platform === 'win32') {
    python = path.join(__dirname, '../.venv', 'Scripts', 'python.exe');
  } else {
    python = path.join(__dirname, '../.venv', 'bin', 'python');
  }

  const script = path.join(__dirname, '../backend/run.py');

  backendProcess = spawn(python, [script], {
    stdio: 'inherit',
    detached: true,
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend exited with code ${code}`);
  });
}

// -------------------------
// Stop backend (kill full process tree)
// -------------------------
function stopBackend() {
  if (!backendProcess) return;

  console.log('Stopping backend...');
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${backendProcess.pid} /T /F`);
    } else {
      process.kill(-backendProcess.pid, 'SIGTERM');
    }
  } catch (err) {
    console.error('Error stopping backend:', err);
  }
}

// -------------------------
// Poll backend readiness
// -------------------------
function waitForBackend(url, timeout = 30000, interval = 500) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, () => resolve(true)).on('error', () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error('Backend did not start in time'));
        } else {
          setTimeout(check, interval);
        }
      });
    };
    check();
  });
}

// -------------------------
// Create main window
// -------------------------
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../frontend/assets/images/logo.png'),
  });

  mainWindow.loadURL('http://127.0.0.1:8000');
  mainWindow.on('closed', () => stopBackend());
}

// -------------------------
// Create splash window
// -------------------------
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    center: true,
    icon: path.join(__dirname, '../frontend/assets/images/logo.png'),
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

// -------------------------
// App lifecycle
// -------------------------
app.whenReady().then(async () => {
  createSplashWindow();
  startBackend();

  try {
    console.log('Waiting for backend to be ready...');
    await waitForBackend('http://127.0.0.1:8000');
    console.log('Backend ready. Launching main window...');

    splashWindow.close();
    createMainWindow();
  } catch (err) {
    console.error(err);
    stopBackend();
    app.quit();
  }
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => stopBackend());

process.on('SIGINT', stopBackend);
process.on('SIGTERM', stopBackend);
