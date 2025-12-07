const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

let mainWindow;
let splashWindow;

function createWindows() {
  // --- スプラッシュ（先に表示） ---
  splashWindow = new BrowserWindow({
    width: 900,
    height: 600,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    center: true,
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  // --- メイン（最初は非表示） ---
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    show: false,
    icon: path.join(__dirname, 'assets/logo.png'),
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, '..', 'frontend', 'dist', 'index.html')
    );
  }

  // --- バックエンドが返ってきた時だけメインへ ---
  waitApi()
    .then(() => {
      // ✔ 成功したときだけ mainWindow を開く
      splashWindow.close();
      mainWindow.show();
    })
    .catch((err) => {
      // ❌ エラー時は何もしない（スプラッシュのまま）
      console.error("API not available. Waiting…");
      // ここでは splashWindow を閉じない
      // mainWindow も show しない
    });
}

app.whenReady().then(() => {
  createWindows();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


// =================================
//  API が生きるまでリトライし続ける関数
// =================================
async function waitApi() {
  while (true) {
    try {
      const res = await fetch("http://127.0.0.1:8000/wait", { timeout: 3000 });

      if (res.ok) {
        return await res.json(); // 起動成功！
      }

      console.log("APIまだ起動していない…", res.status);
    } catch (err) {
      console.log("接続失敗、再試行するよ…");
    }

    // 2秒待って再試行
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

