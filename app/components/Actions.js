import { State } from './State.js';
import { Settings } from './Settings.js';
import { WebsocketClient } from './WebsocketClient.js';
import { CoordinationServer } from './CoordinationServer.js'
import { ControllerManager } from './ControllerManager.js';
import { Runner } from './Runner.js';

export class Actions {
  static setUsername(username) {
    Settings.setSetting("username", username);
    State.setState("username", username);
  }

  static setServerAddress(address) {
    Settings.setSetting("serverAddress", address);
    State.setState("serverAddress", address)
  }

  static startServer() {
    const virtualError = ControllerManager.createVirtualController();

    if (virtualError) {
      State.setState("vigmError", virtualError)
    } else {
      CoordinationServer.startServer(() => {
        State.setState("isHost", true);
        State.setState("serverRunning", true);
      }, () => {
        State.setState("isHost", false);
        State.setState("serverRunning", false);
      }, (error) => {
        State.setState("isHost", false);
        State.setState("serverRunning", false);
        State.setState("hostClientError", error);
      })
    }
  }

  static connectToHost() {
    const address = State.getState("serverAddress");
    State.setState("clientIsConnecting", true);
    WebsocketClient.connect(address,
    () => {
      State.setState("clientIsConnecting", false);
      State.setState("clientConnected", true);
    }, () => {
      State.setState("clientIsConnecting", false);
      State.setState("clientConnected", false);
    }, (error) => {
      State.setState("clientIsConnecting", false);
      State.setState("clientConnected", false);
      State.setState("hostClientError", error);
    });
  }

  static updateIsRunning(running) {
    State.setState("isRunning", running);
  }

  static updateMinTime(time) {
    State.setState("minSwapTime", time);
    Settings.setSetting("minTime", time);
  }

  static updateMaxTime(time) {
    State.setState("maxSwapTime", time);
    Settings.setSetting("maxTime", time);
  }
  
  static updateMode(value) {
    State.setState("mode", value);
    Settings.setSetting("mode", value);

    if (mode === "random") {
      Runner.registerNextShuffle();
    } else {
      Runner.clearTimeout();
    }
  }

  static forceSwap() {
    if (State.getState('isSwapping')) {
      return;
    }

    Runner.shufflePlayers();
  }

  static updateCountdown(countdown) {
    State.setState("enableCountdown", countdown);
    Settings.setSetting("countdown", countdown);
  }

  static swapPlayers() {
    if (State.getState('isSwapping')) {
      return;
    }

    Runner.shufflePlayers();
  }

  static run() {
    Runner.run();
  }

  static stop() {
    Runner.stop();
  }

  static swapUser(username) {
    Runner.updateCurrentPlayer(username);
  }
  
  static changeSettingsPage(page) {
    State.setState('settingsPage', page);
  }

  static createGamepadListener(onNewGamepad, onRemoveGamepad) {
    ControllerManager.listenControllers(onNewGamepad, onRemoveGamepad);
  }

  static captureControllerInput(callback) {
    ControllerManager.getNextChangedInput(callback);
  }

  static cancelCaptureControllerInput() {
    ControllerManager.clearNextChangedInput();
  }

  static updateControllerMapping(button, value) {
    let newValue = {};
    if (value.type == "button") {
      newValue = {
        type: "button",
        index: value.id
      }
    } else if (value.type == "axis") {
      newValue = {
        type: "axis",
        index: value.id,
        sign: value.value < 0 ? -1 : 1
      }
    }

    const curMapping = Settings.getSetting("controllerMapping");
    curMapping[button] = newValue;

    Settings.setSetting("controllerMapping", curMapping)
    State.setState('controllerMapping', curMapping);
  }

  static updateForwardedController(controllerIndex) {
    const connectedControllers = State.getState("connectedControllers");

    let foundController = null;

    if (controllerIndex == -1) {
      foundController = null;
    } else {
      for(let controller of connectedControllers) {
        if (controller.index == controllerIndex) {
          foundController = controller;
          break;
        }
      }
    }

    // The controller manager we send the real controller to
    ControllerManager.setForwardedController(foundController);

    // The State/Settings we want to update to just use the id
    const id = foundController ? foundController.id : null;

    State.setState("forwardedController", id);
    Settings.setSetting("forwardedController", id);
  }

  static updateUserLatency(username, latency) {
    const userLatency = State.getState("userLatency");

    userLatency[username] = latency;

    State.setState("userLatency", userLatency);
  }
}
