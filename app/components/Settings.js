const ipcRenderer = window.ipcRenderer;

export class Settings {
  static settingUpdateHandlers = [];
  static settings = {
    controllerDeadzone: 0.07,
    controllerMapping: {
      start: {
        type: 'button',
        index: 9
      }, // START
      back:  {
        type: 'button',
        index: 8
      }, // BACK
      ls_press:  {
        type: 'button',
        index: 10
      }, // LEFT_THUMB
      rs_press:  {
        type: 'button',
        index: 11
      }, //  RIGHT_THUMB
      l_trigger:  {
        type: 'button',
        index: 5
      }, // leftTrigger Analog on Xbox?
      r_trigger:  {
        type: 'button',
        index: 7
      }, // rightTrigger Analog on Xbox
      l_bumper:  {
        type: 'button',
        index: 4
      }, // LEFT_SHOULDER
      r_bumper:  {
        type: 'button',
        index: 5
      }, // RIGHT_SHOULDER
      a:  {
        type: 'button',
        index: 0
      }, // A
      x:  {
        type: 'button',
        index: 2
      },  // X
      b:  {
        type: 'button',
        index: 1
      }, // B
      y:  {
        type: 'button',
        index: 3
      }, // Y
      ls_left:  {
        type: 'axis',
        index: 0,
        sign: -1,
      }, // leftX
      ls_right:  {
        type: 'axis',
        index: 0,
        sign: 1,
      }, // leftX
      ls_up: {
        type: 'axis',
        index: 1,
        sign: -1,
      }, // leftY
      ls_down: {
        type: 'axis',
        index: 1,
        sign: 1,
      }, // leftY
      rs_left: {
        type: 'axis',
        index: 2,
        sign: -1,
      }, // rightX
      rs_right: {
        type: 'axis',
        index: 2,
        sign: 1,
      }, // rightX
      rs_up: {
        type: 'axis',
        index: 3,
        sign: -1,
      }, // rightY
      rs_down: {
        type: 'axis',
        index: 3,
        sign: 1,
      }, // rightY
      d_left: {
        type: 'button',
        index: 14
      }, // dpadHorz = Analog on Xbox?
      d_right: {
        type: 'button',
        index: 15
      }, // dpadHorz = Analog on Xbox?
      d_up: {
        type: 'button',
        index: 12
      }, // dpadVert = Analog on Xbox?
      d_down: {
        type: 'button',
        index: 13
      }, // dpadVert = Analog on Xbox?
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
