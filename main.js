const { app, BrowserWindow, ipcMain, session } = require('electron')
const path = require('path');
const fs = require('fs');
const ViGEmClient = require('vigemclient');
const cwd = process.env.PORTABLE_EXECUTABLE_DIR || app.getAppPath();
const appPath = app.getAppPath();
const controller_lib = require('controller_lib');

const controllerStates = {};
let win = null;
let countDownWindow = null;
let playerDisplayWindow = null;


function fixPath(pathToFix, local) {
  if (!path.isAbsolute(pathToFix)) {
    if(local) {
      pathToFix = path.join(appPath, pathToFix);
    } else {
      pathToFix = path.join(cwd, pathToFix);
    }
  }

  return pathToFix;
}

let windowPositions = {
  main: { top: -1, left: -1, width: 500, height: 800 },
  countDown: { top: -1, left: -1, width: 400, height: 100 },
  player: { top: -1, left: -1, width: 400, height: 100 },
}

if(fs.existsSync(fixPath('window-pos.json', false))) {
  const savedWindowPositions = JSON.parse(fs.readFileSync(fixPath('window-pos.json', false)));
  windowPositions = {...windowPositions, ...savedWindowPositions};
} 

fs.writeFileSync(fixPath('window-pos.json', false), JSON.stringify(windowPositions));

const saveWindowPosition = function(name, window) {
  const bounds = window.getBounds();
  windowPositions[name] = { top: bounds.y, left: bounds.x, width: bounds.width, height: bounds.height };
  fs.writeFileSync(fixPath('window-pos.json', false), JSON.stringify(windowPositions));
}

controller_lib.startGamepadEngine((err, ...controllers) => {
  // For all controllers in the state, we do this
  for(let state of controllers) {
    state.id = state.name + ': ' + state.gilrs_id;
    state.index = state.gilrs_id;
    controllerStates[state.gilrs_id] = state;
  }

  const idsToRemove = [];
  // Then we remove any not in here
  for(let id in controllerStates) {
    let found = false;
    for(let state of controllers) {
      if (id == state.gilrs_id) {
        found = true;
        break;
      }
    }

    if (!found) {
      idsToRemove.push(id);
    }
  }

  for(let id of idsToRemove) {
    delete controllerStates[id];
  }
  
  if (win != null) {
    win.webContents.send('new-controller-states', controllerStates);
  }
})

function createWindow () {
  let posParams = {};
  if (windowPositions.main.left !== -1 && windowPositions.main.top !== -1) {
    posParams = {
      x: windowPositions.main.left,
      y: windowPositions.main.top,
    }
  }
  win = new BrowserWindow({
    ...posParams,
    width: windowPositions.main.width,
    height: windowPositions.main.height,
    resizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      backgroundThrottling: false,
      minimumFontSize : 12,
      defaultFontSize : 16,
      preload: path.join(__dirname, "preload.js") ,
    }
  })

  win.loadFile('app/index.html');

  win.on('close', (e) => {
    if (countDownWindow !== null) {
      countDownWindow.close();
      countDownWindow = null;
    }
    if (playerDisplayWindow !== null) {
      playerDisplayWindow.close();
      playerDisplayWindow = null;
    }
    win = null;
    disconnectController();
  })
  

  win.on('moved', (e) => {
    saveWindowPosition('main', win);
  })

  
  win.on('resized', (e) => {
    saveWindowPosition('main', win);
  })
}

let virtualClient = null;
let virtualController = null;

function disconnectController() {
  console.log('Disconnecting Controller')
  if (virtualController) {
    virtualController.disconnect();
  }

  virtualController = null;
  virtualClient = null;
}

let ignoreMouseEvents = true;
ipcMain.on('spawn-countdown-window', (event, arg) => {
  if(countDownWindow) {
    return;
  }

  let posParams = {};
  if (windowPositions.countDown.left !== -1 && windowPositions.countDown.top !== -1) {
    posParams = {
      x: windowPositions.countDown.left,
      y: windowPositions.countDown.top,
    }
  }

  countDownWindow = new BrowserWindow({
    ...posParams,
    width: windowPositions.countDown.width,
    height: windowPositions.countDown.height,
    resizable: false,
    autoHideMenuBar: true,
    frame: false,
    movable: true,
    transparent: true,
    titleBarStyle: 'customButtonsOnHover',
    alwaysOnTop: true,
    useContentSize: true,
    webPreferences: {
      backgroundThrottling: false,
      minimumFontSize : 12,
      defaultFontSize : 16,
      preload: path.join(__dirname, "preload.js") ,
    }
  });

  countDownWindow.loadFile('app/countdown.html');
  countDownWindow.setIgnoreMouseEvents(ignoreMouseEvents);

  countDownWindow.on('moved', (e) => {
    saveWindowPosition('countDown', countDownWindow);
  })

  
  countDownWindow.on('resized', (e) => {
    saveWindowPosition('countDown', countDownWindow);
  })
});

ipcMain.on('update-countdown', (event, arg) => {
  if(countDownWindow) {
    countDownWindow.webContents.send('update-countdown', arg);
  }
})

ipcMain.on('allow-move-countdown-window', (event, arg) => {
  ignoreMouseEvents = false;
  if (countDownWindow) {
    countDownWindow.setIgnoreMouseEvents(ignoreMouseEvents);
  }
});

ipcMain.on('disallow-move-countdown-window', (event, arg) => {
  ignoreMouseEvents = true;
  if (countDownWindow) {
    countDownWindow.setIgnoreMouseEvents(ignoreMouseEvents);
  }
});

ipcMain.on('close-countdown-window', (event, arg) => {
  if (countDownWindow) {
    countDownWindow.close();
  }

  countDownWindow = null;
})

let playerIgnoreMouseEvents = true;
ipcMain.on('spawn-player-window', (event, arg) => {
  if(playerDisplayWindow) {
    return;
  }

  let posParams = {};
  if (windowPositions.player.left !== -1 && windowPositions.player.top !== -1) {
    posParams = {
      x: windowPositions.player.left,
      y: windowPositions.player.top,
    }
  }

  playerDisplayWindow = new BrowserWindow({
    ...posParams,
    width: windowPositions.player.width,
    height: windowPositions.player.height,
    resizable: false,
    autoHideMenuBar: true,
    frame: false,
    movable: true,
    transparent: true,
    titleBarStyle: 'customButtonsOnHover',
    alwaysOnTop: true,
    useContentSize: true,
    webPreferences: {
      backgroundThrottling: false,
      minimumFontSize : 12,
      defaultFontSize : 16,
      preload: path.join(__dirname, "preload.js") ,
    }
  });

  playerDisplayWindow.loadFile('app/player.html');
  playerDisplayWindow.setIgnoreMouseEvents(playerIgnoreMouseEvents);

  playerDisplayWindow.on('moved', (e) => {
    saveWindowPosition('player', playerDisplayWindow);
  })

  
  playerDisplayWindow.on('resized', (e) => {
    saveWindowPosition('player', playerDisplayWindow);
  })
});

ipcMain.on('update-player', (event, arg) => {
  if(playerDisplayWindow) {
    playerDisplayWindow.webContents.send('update-player', arg);
  }
})

ipcMain.on('allow-move-player-window', (event, arg) => {
  playerIgnoreMouseEvents = false;
  if (playerDisplayWindow) {
    playerDisplayWindow.setIgnoreMouseEvents(playerIgnoreMouseEvents);
  }
});

ipcMain.on('disallow-move-player-window', (event, arg) => {
  playerIgnoreMouseEvents = true;
  if (playerDisplayWindow) {
    playerDisplayWindow.setIgnoreMouseEvents(playerIgnoreMouseEvents);
  }
});

ipcMain.on('close-player-window', (event, arg) => {
  if (playerDisplayWindow) {
    playerDisplayWindow.close();
  }

  playerDisplayWindow = null;
})

ipcMain.on('get-controll-states', (event, arg) => {
  event.returnValue = controllerStates;
  return;
})

ipcMain.on('connect-controller', (event, arg) => {
  console.log('Connecting Virtual Controller')
  // Reuse virtual client across reconnects
  if (virtualClient == null) {
    const client = new ViGEmClient();
    const err = client.connect();

    if (!err) {
      virtualClient = client;
    } else {
      event.returnValue = { err : err }
      return;
    }
  }

  if (virtualController !== null) {
    event.returnValue = { controller: { index: virtualController.userIndex  } }
    return;
  }

  const controller = virtualClient.createX360Controller();
  // Arbitrary IDs here to hopefully avoid conflicts (worse case in conflict is just duplicate devices)
  const controllerErr = controller.connect({
    vendorID: 0xF3EA,
    productID: 0xB42D
  })

  if (!controllerErr) {
    virtualController = controller;
    virtualController.updateMode = "manual";
    event.returnValue = { controller: { index: controller.userIndex  } }
    return;
  }
  
  event.returnValue = { err: controllerErr }
  return;
});

ipcMain.handle('timeout', async (event, ...args) => {
  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => { resolve() }, args[0])
  })

  return timeoutPromise;
})

ipcMain.on('sync-controller', (event, arg) => {
  if (!virtualController) {
    return;
  }

  if (arg == null) {
    virtualController.button.START.setValue(0);
    virtualController.button.BACK.setValue(0);
    virtualController.button.LEFT_THUMB.setValue(0);
    virtualController.button.RIGHT_THUMB.setValue(0);
    virtualController.button.LEFT_SHOULDER.setValue(0);
    virtualController.button.RIGHT_SHOULDER.setValue(0);
    virtualController.button.A.setValue(0);
    virtualController.button.B.setValue(0);
    virtualController.button.X.setValue(0);
    virtualController.button.Y.setValue(0);
    virtualController.axis.leftX.setValue(0);
    virtualController.axis.leftY.setValue(0);
    virtualController.axis.rightX.setValue(0);
    virtualController.axis.rightY.setValue(0);
    virtualController.axis.leftTrigger.setValue(0);
    virtualController.axis.rightTrigger.setValue(0);
    virtualController.axis.dpadHorz.setValue(0);
    virtualController.axis.dpadVert.setValue(0);
    virtualController.update();
  } else {
    virtualController.button.START.setValue(arg.START);
    virtualController.button.BACK.setValue(arg.BACK);
    virtualController.button.LEFT_THUMB.setValue(arg.LEFT_THUMB);
    virtualController.button.RIGHT_THUMB.setValue(arg.RIGHT_THUMB);
    virtualController.button.LEFT_SHOULDER.setValue(arg.LEFT_SHOULDER);
    virtualController.button.RIGHT_SHOULDER.setValue(arg.RIGHT_SHOULDER);
    virtualController.button.A.setValue(arg.A);
    virtualController.button.B.setValue(arg.B);
    virtualController.button.X.setValue(arg.X);
    virtualController.button.Y.setValue(arg.Y);
    virtualController.axis.leftX.setValue(arg.leftX);
    virtualController.axis.leftY.setValue(arg.leftY);
    virtualController.axis.rightX.setValue(arg.rightX);
    virtualController.axis.rightY.setValue(arg.rightY);
    virtualController.axis.leftTrigger.setValue(arg.leftTrigger);
    virtualController.axis.rightTrigger.setValue(arg.rightTrigger);
    virtualController.axis.dpadHorz.setValue(arg.dpadHorz);
    virtualController.axis.dpadVert.setValue(arg.dpadVert);
    virtualController.update();
  }
})

ipcMain.on('disconnect-controller', (event, arg) => {
  disconnectController();
})

ipcMain.on('initialize-settings', (event, arg) => {
  if (fs.existsSync(fixPath('settings.json', false))) {
    let currentSettings =  JSON.parse(fs.readFileSync(fixPath('settings.json', false)));

    event.returnValue = currentSettings;
    return;
  }

  event.returnValue = null;
})

ipcMain.on('write-settings', (event, arg) => {
  fs.writeFileSync(fixPath('settings.json', false), arg);
})

app.whenReady().then(() => {
  createWindow();
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('before-quit',function()
{
  disconnectController();
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
});
