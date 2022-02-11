const { app, BrowserWindow, ipcMain, session } = require('electron')
const path = require('path');
const fs = require('fs');
const ViGEmClient = require('vigemclient');
const cwd = process.env.PORTABLE_EXECUTABLE_DIR || app.getAppPath();
const appPath = app.getAppPath();
const controller_lib = require('controller_lib');

controller_lib.startGamepadEngine((err, ...controllers) => {
  console.log('here I am');
  console.log(controllers);
})

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      backgroundThrottling: false,
      minimumFontSize : 12,
      defaultFontSize : 16,
      preload: fixPath('preload.js'),
    }
  })

  win.loadFile('app/index.html');

  win.on('close', (e) => {
    disconnectController();
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

ipcMain.on('connect-controller', (event, arg) => {
  console.log('Connecting Virtual Client')
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

  console.log('Connecting Virtual Controller')
  const controller = virtualClient.createX360Controller();
  // Arbitrary IDs here to hopefully avoid conflicts (worse case in conflict is just duplicate devices)
  const controllerErr = controller.connect({
    vendorID: 0xF3EA,
    productID: 0xB42D
  })

  if (!controllerErr) {
    virtualController = controller;
    virtualController.updateMode = "manual";
    console.log(controller);
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

ipcMain.on('ping', (event, arg) => {
  console.log(Date.now() + " " + arg)
});

ipcMain.on('sync-controller', (event, arg) => {
  console.log(Date.now() +  ' sync controller');
  if (!virtualController) {
    return;
  }

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
})

ipcMain.on('disconnect-controller', (event, arg) => {
  disconnectController();
})


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
