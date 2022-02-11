const ipcRenderer = window.ipcRenderer;

export class Settings {
  static settingUpdateHandlers = [];
  static settings = {
    controllerDeadzone: 0.07,
    "controllerMapping": {
      "start": {
        "type": "button",
        "index": "start"
      },
      "back": {
        "type": "button",
        "index": "select"
      },
      "ls_press": {
        "type": "button",
        "index": "left_thumb"
      },
      "rs_press": {
        "type": "button",
        "index": "right_thumb"
      },
      "l_trigger": {
        "type": "button",
        "index": "left_trigger_2"
      },
      "r_trigger": {
        "type": "button",
        "index": "right_trigger_2"
      },
      "l_bumper": {
        "type": "button",
        "index": "left_trigger"
      },
      "r_bumper": {
        "type": "button",
        "index": "right_trigger"
      },
      "a": {
        "type": "button",
        "index": "south"
      },
      "x": {
        "type": "button",
        "index": "west"
      },
      "b": {
        "type": "button",
        "index": "east"
      },
      "y": {
        "type": "button",
        "index": "north"
      },
      "ls_left": {
        "type": "axis",
        "index": "left_stick_x",
        "sign": -1
      },
      "ls_right": {
        "type": "axis",
        "index": "left_stick_x",
        "sign": 1
      },
      "ls_up": {
        "type": "axis",
        "index": "left_stick_y",
        "sign": 1
      },
      "ls_down": {
        "type": "axis",
        "index": "left_stick_y",
        "sign": -1
      },
      "rs_left": {
        "type": "axis",
        "index": "right_stick_x",
        "sign": -1
      },
      "rs_right": {
        "type": "axis",
        "index": "right_stick_x",
        "sign": 1
      },
      "rs_up": {
        "type": "axis",
        "index": "right_stick_y",
        "sign": 1
      },
      "rs_down": {
        "type": "axis",
        "index": "right_stick_y",
        "sign": -1
      },
      "d_left": {
        "type": "button",
        "index": "d_pad_left"
      },
      "d_right": {
        "type": "button",
        "index": "d_pad_right"
      },
      "d_up": {
        "type": "button",
        "index": "d_pad_up"
      },
      "d_down": {
        "type": "button",
        "index": "d_pad_down"
      }
    },
    // Things needed: Convert Analog to Digital Type buttons and vice versa
    // Split D-Pad from buttons (or axes) to d-pad axes, could be digital -> analog
    forwardedController: null,
    username: null,
    serverAddress: null,
    minTime: 60,
    maxTime: 180,
    countdown: true,
    mode: 'random',
  };

  static initialize() {
    const currentSettings = ipcRenderer.sendSync('initialize-settings', {})
    if (currentSettings) {
      Settings.settings = {
        ...Settings.settings,
        ...currentSettings
      }
    }

    Settings.syncSettings();
  }

  static syncSettings() {
    ipcRenderer.send('write-settings', JSON.stringify(Settings.settings, null, 2))
  }

  static setSetting(name, value) {
    Settings.settings[name] = value;

    Settings.syncSettings();
  }

  static getSetting(name) {
    return Settings.settings[name];
  }

  static getSettings() {
    return Settings.settings;
  }
}
