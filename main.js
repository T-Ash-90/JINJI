const { app, BrowserWindow } = require('electron');
const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');

let backendProcess;

// -------------------------
// Start backend using .venv
// -------------------------
function startBackend() {
  let python;

  if (process.platform === 'win32') {
    // Windows
    python = path.join(__dirname, '.venv', 'Scripts', 'python.exe');
  } else {
    // macOS / Linux
    python = path.join(__dirname, '.venv', 'bin', 'python');
  }

  const script = path.join(__dirname, 'run.py');

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
      // Windows: kill process tree using taskkill
      execSync(`taskkill /PID ${backendProcess.pid} /T /F`);
    } else {
      // Unix/macOS: kill process group
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
// Create Electron window
// -------------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'frontend/assets/images/logo.png'),
  });

  win.loadURL('http://127.0.0.1:8000');

  win.on('closed', () => stopBackend());
}

// -------------------------
// App lifecycle
// -------------------------
app.whenReady().then(async () => {
  startBackend();

  try {
    console.log('Waiting for backend to be ready...');
    await waitForBackend('http://127.0.0.1:8000');
    console.log('Backend ready. Launching window...');
    createWindow();
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
