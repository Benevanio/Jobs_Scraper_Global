'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  Vagas Full – Electron main process
//
//  Boot flow:
//    1. Show loading window while the backend starts
//    2. Import backend server in-process → Express starts on localhost:3001
//    3. Poll GET /api/health until the server accepts connections
//    4. Open the main window (React app served by Express)
//    5. Scraper execution is user-triggered from the UI via /api/scraper/run
//
//  Why in-process import() instead of spawn('node', ...)?
//    spawn('node', ...) requires Node to be installed on the user's machine.
//    import() works because Electron ships its own Node runtime – the app
//    runs fully standalone, no external Node installation needed.
// ─────────────────────────────────────────────────────────────────────────────

const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const http = require('http');
const { pathToFileURL } = require('url');

const BACKEND_PORT      = 3001;
const BACKEND_URL       = `http://localhost:${BACKEND_PORT}`;
const MAX_RETRIES       = 60;   // 60 × 500 ms = 30 s maximum wait
const RETRY_INTERVAL_MS = 500;  // ms between health-check polls

// ─── Path helpers ─────────────────────────────────────────────────────────────
//  app.getAppPath() returns:
//    development : workspace root (where root package.json lives)
//    packaged    : <install>/resources/app   (asar: false)

function getAppRootPath() {
  return app.getAppPath();
}

function getFrontendDistPath() {
  return path.join(getAppRootPath(), 'frontend', 'dist');
}

function getBackendServerPath() {
  return path.join(getAppRootPath(), 'backend', 'src', 'server.js');
}

// userData is the OS user-data directory – writable even under Program Files,
// and survives app updates.
function getOutputDir() {
  return path.join(app.getPath('userData'), 'output');
}

function getLoadingPagePath() {
  return path.join(getAppRootPath(), 'electron', 'loading.html');
}

// ─── Backend startup (in-process) ─────────────────────────────────────────────

async function startBackend() {
  // All env vars must be set BEFORE the ESM module is imported so they are
  // visible at module-evaluation time.
  const outDir = getOutputDir();
  process.env.PORT                = String(BACKEND_PORT);
  process.env.ELECTRON_OUTPUT_DIR = outDir;                                    // API reads XLSX files from here
  process.env.ELECTRON_STATIC_DIR = getFrontendDistPath();                     // Express serves the React build
  process.env.OUTPUT_FILE         = path.join(outDir, 'vagas_linkedin.xlsx'); // scraper writes here
  process.env.PDF_FILE            = path.join(outDir, 'vagas_linkedin.pdf');  // scraper writes here

  // pathToFileURL produces a correct file:// URL on Windows (handles spaces & backslashes)
  await import(pathToFileURL(getBackendServerPath()).href);
}

// ─── Health-check polling ──────────────────────────────────────────────────────

function waitForBackend() {
  return new Promise((resolve, reject) => {
    let retries = 0;

    function check() {
      const req = http.get(
        `${BACKEND_URL}/api/health`,
        { timeout: 2000 },
        (res) => {
          res.resume(); // drain body; only the status code matters
          if (res.statusCode === 200) {
            resolve();
          } else {
            scheduleRetry();
          }
        }
      );

      req.on('error', scheduleRetry);
      req.on('timeout', () => {
        req.destroy();
        scheduleRetry();
      });
    }

    function scheduleRetry() {
      retries += 1;
      if (retries >= MAX_RETRIES) {
        reject(
          new Error(
            `O servidor backend não respondeu após ${MAX_RETRIES} tentativas (${(MAX_RETRIES * RETRY_INTERVAL_MS) / 1000}s).`
          )
        );
        return;
      }
      setTimeout(check, RETRY_INTERVAL_MS);
    }

    check();
  });
}

// ─── Windows ──────────────────────────────────────────────────────────────────

function createLoadingWindow() {
  const win = new BrowserWindow({
    width: 520,
    height: 360,
    resizable: false,
    frame: false,
    show: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadFile(getLoadingPagePath());
  win.once('ready-to-show', () => win.show());
  return win;
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#0f172a',
    title: 'Vagas Full',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // The React app is served by Express as static files.
  // loadURL keeps relative /api/... fetch calls working correctly.
  win.loadURL(BACKEND_URL);
  win.once('ready-to-show', () => win.show());
  return win;
}

// ─── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  const loader = createLoadingWindow();

  try {
    // 1. Start Express (backend + static file serving) inside this process
    await startBackend();

    // 2. Wait until the HTTP server is accepting connections
    await waitForBackend();

    // 3. Open the dashboard; destroy loading screen when page is ready
    const main = createMainWindow();
    main.once('ready-to-show', () => loader.destroy());

  } catch (fatal) {
    loader.destroy();
    dialog.showErrorBox(
      'Falha ao iniciar o aplicativo',
      `O servidor não pôde ser iniciado.\n\n${fatal.message}`,
    );
    app.quit();
  }

  // macOS: recreate window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
