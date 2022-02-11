import { Settings } from './Settings.js';
import { Actions } from './Actions.js';
import { ControllerManager } from './ControllerManager.js';

export class State {
  static state = {};

  static stateUpdateHandlers = [];

  static initialize() {
    State.state = {
      controllerDeadzone: 0.07,
      connectedControllers: [],
      controllerMapping: {},
      forwardedController: null,
      hostClientError: null,
      clientConnected: false,
      clientIsConnecting: false,
      enableCountdown: true,
      lastSwap: 0,
      isHost: false,
      isRunning: false,
      isSwapping: false,
      serverAddress: '',
      serverRunning: false,
      username: "",
      users: {},
      userLatency: {},
      minSwapTime: 0,
      maxSwapTime: 0,
      settingsPage: 'main',
      vigmError: null,
      mode: 'random',
    }

    Settings.initialize();

    State.state.controllerDeadzone = Settings.getSetting("controllerDeadzone");
    State.state.forwardedController = Settings.getSetting("forwardedController");
    State.state.controllerMapping = Settings.getSetting("controllerMapping");
    State.state.username = Settings.getSetting("username");
    State.state.serverAddress = Settings.getSetting("serverAddress");
    State.state.enableCountdown = Settings.getSetting("countdown");
    State.state.minSwapTime = Settings.getSetting("minTime");
    State.state.maxSwapTime = Settings.getSetting("maxTime");
    State.state.forwardedController = Settings.getSetting("forwardedController");
    State.state.mode = Settings.getSetting("mode");

    Actions.createGamepadListener((gamepad) => {
      // If this gamepad is set as the currently forwarded controller than update the Controller manager to use it
      if(gamepad.id == State.state.forwardedController) {
        ControllerManager.setForwardedController(gamepad);
      }
      State.state.connectedControllers.push(gamepad);
      State.setState("connectedControllers", State.state.connectedControllers);
    }, (gamepad) => {
      const filteredControllers = State.state.connectedControllers.filter((pad) => pad.index !== gamepad.index);
      State.setState("connectedControllers", filteredControllers);
    });

    return State.state;
  }

  static getState(name) {
    return State.state[name];
  }

  static setState(name, value) {
    const oldState = { ...State.state };
    State.state[name] = value;

    State.stateUpdateHandlers.forEach(func => {
      func(State.state, oldState);
    });
  }

  static onUpdate(func) {
    State.stateUpdateHandlers.push(func);
  }
}

window.State = State;
