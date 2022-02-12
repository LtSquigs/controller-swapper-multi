import { Runner } from './Runner.js';
import { State } from './State.js';
import { WebsocketClient } from './WebsocketClient.js';

const ipcRenderer = window.ipcRenderer;

const NEW_STATE = 1;
const NO_STATE = 2;

export class ControllerManager {

  static virtualController = null;
  
  static forwardedController = null;
  static forwardedControllerState = {};

  static controllerStates = {};
  static userControllerState = null;
  static polling = false;

  static nextChangedCallback = null;

  static setForwardedController(controller) {
    ControllerManager.forwardedController = controller;

    if (controller == null) {
      ControllerManager.userControllerState = null;

      if (State.getState("isHost")) {
        Runner.updateControllerState(State.getState("username"), null)
      } else {
        WebsocketClient.sendControllerState(null)
      }
    } else {
      ControllerManager.pollController();
    }
  }

  // Handles virtual controller creation if host
  static createVirtualController() {
    if (ControllerManager.virtualController) {
      return null;
    }

    const result = ipcRenderer.sendSync('connect-controller', {})
    if (result.err) {
        return result.err;
    }

    ControllerManager.virtualController = result.controller;

    // Look to see if this controller is already in our state, and if so remove it
    let connectedControllers = State.getState("connectedControllers");
    connectedControllers = connectedControllers.filter((pad) => { return pad.index !== result.controller.index });
    State.setState("connectedControllers", connectedControllers);
    State.setState("virtualController", ControllerManager.virtualController);

    // Register an event for deregistering this controller before the window unloads, seems to also work when the program is closed.
    window.onbeforeunload = function(event)
    {
        ipcRenderer.send('disconnect-controller', {})
    };
  }

  // Detects if the states have changed, and if so, returns the first item that has changed as an object
  // Two specical sentinel values are also sent: NEW_STATE if the state is new, and NO_STATE if the state is gone away
  static statesChanged(oldState, newState) {
    if(oldState == null && newState !== null) {
      return NEW_STATE;
    }
    if(newState == null && oldState !== null) {
      return NO_STATE;
    }

    for(let key in newState.buttons) {
      if (newState.buttons[key] != oldState.buttons[key]) {
        return {
          id: key,
          type: "button",
          value: newState.buttons[key]
        }
      }
    }

    for(let key in newState.axis) {
      // For it to qualify as a change in the axis, we want the user to really have to press it in that direction
      if (newState.axis[key] !== oldState.axis[key]) {
        return {
          id: key,
          type: "axis",
          value: newState.axis[key]
        }
      }
    }

    return null;
  }

  static pollController(forceSend) {
    if(ControllerManager.forwardedController === null) {
      return;
    }

    const oldController = ControllerManager.forwardedController;

    // Grab the newest controller data from our states
    const controllers = ControllerManager.controllerStates;
    let foundController = null;
    for(let key in controllers) {
      const controller = controllers[key]
      if (controller && controller.index == oldController.index) {
        foundController = controller;
      }
    }
    
    if (foundController == null) {
      ControllerManager.userControllerState = null;
      if (State.getState("isHost")) {
        Runner.updateControllerState(State.getState("username"), null)
      } else {
        WebsocketClient.sendControllerState(null)
      }
    } else {
      const changedItem = ControllerManager.statesChanged(ControllerManager.userControllerState, foundController);
      const userObj = State.getState("users")[State.getState("username")];
      if (changedItem || (userObj && !userObj.hasController) || forceSend) {
        if (ControllerManager.nextChangedCallback != null) {
          if(changedItem !== null && changedItem !== NEW_STATE && changedItem !== NO_STATE && Math.abs(changedItem.value) > 0.5) {
            ControllerManager.nextChangedCallback(changedItem);
            ControllerManager.nextChangedCallback = null;
          }
        }

        ControllerManager.userControllerState = {};
        ControllerManager.userControllerState.buttons = foundController.buttons;
        ControllerManager.userControllerState.axis = foundController.axis;

        const translatedState = ControllerManager.translateState(ControllerManager.userControllerState);

        if (State.getState("isHost")) {
          Runner.updateControllerState(State.getState("username"), translatedState)
        } else {
          WebsocketClient.sendControllerState(translatedState)
        }
      }
    }
  }

  // Converts the current state into xbox state using the controller mapper.
  static translateState(state) {
    const mapping = State.getState("controllerMapping");
    const xboxState = {
      START: ControllerManager.translateToButton(state, mapping.start),
      BACK: ControllerManager.translateToButton(state, mapping.back),
      LEFT_THUMB: ControllerManager.translateToButton(state, mapping.ls_press), 
      RIGHT_THUMB: ControllerManager.translateToButton(state, mapping.rs_press),
      LEFT_SHOULDER: ControllerManager.translateToButton(state, mapping.l_bumper),
      RIGHT_SHOULDER: ControllerManager.translateToButton(state, mapping.r_bumper),
      A: ControllerManager.translateToButton(state, mapping.a),
      B: ControllerManager.translateToButton(state, mapping.b),
      X: ControllerManager.translateToButton(state, mapping.x),
      Y: ControllerManager.translateToButton(state, mapping.y),
      leftX: ControllerManager.translateToAxis(state, mapping.ls_left, mapping.ls_right),
      leftY: ControllerManager.translateToAxis(state, mapping.ls_down, mapping.ls_up),
      rightX: ControllerManager.translateToAxis(state, mapping.rs_left, mapping.rs_right),
      rightY: ControllerManager.translateToAxis(state, mapping.rs_down, mapping.rs_up),
      leftTrigger: ControllerManager.translateToButton(state, mapping.l_trigger),
      rightTrigger: ControllerManager.translateToButton(state, mapping.r_trigger),
      dpadHorz: ControllerManager.translateToAxis(state, mapping.d_left, mapping.d_right),
      dpadVert: ControllerManager.translateToAxis(state, mapping.d_down, mapping.d_up),
    }

    return xboxState;
  }

  static translateToButton(state, mapping) {
    const type = mapping.type;
    const index = mapping.index;

    if (type === "button") {
      const value = state.buttons[index];

      return value > 0 ? 1 : 0;
    } else if (type === "axis") {
      // If an Axis is meant to be a button, we will just translate anything above 0.5 as pressed
      const value = state.axes[index];

      return Math.abs(value) >= 0.5 ? 1 : 0;
    }

    return 0;
  }

  static translateToAxis(state, negativeMapping, positiveMapping) {
    let negativeValue = 0;
    let positiveValue = 0;

    if (negativeMapping.type === "button") {
      if (state.buttons[negativeMapping.index] > 0) {
        negativeValue = -1;
      } else {
        negativeValue = 0;
      }
    } else if (negativeMapping.type === "axis") {
      // Only record this value if the sign matches the mapping.
      const axis = state.axis[negativeMapping.index]
      if (negativeMapping.sign === -1 && axis < 0) {
        negativeValue = state.axis[negativeMapping.index];
      } else if (negativeMapping.sign === 1 && axis > 0) {
        negativeValue = state.axis[negativeMapping.index] * -1;
      }
    }
    
    if (positiveMapping.type === "button") {
      if (state.buttons[positiveMapping.index] > 0) {
        positiveValue = 1;
      } else {
        positiveValue = 0;
      }
    } else if (positiveMapping.type === "axis") {
      // Only record this value if the sign matches the mapping.
      const axis = state.axis[positiveMapping.index]
      if (positiveMapping.sign === -1 && axis < 0) {
        positiveValue = state.axis[positiveMapping.index] * -1;
      } else if (positiveMapping.sign === 1 && axis > 0) {
        positiveValue = state.axis[positiveMapping.index];
      }
    }

    if (Math.abs(positiveValue) > Math.abs(negativeValue)) {
      return positiveValue;
    } else {
      return negativeValue
    }
  }

  static listenControllers(onNewGamepad, onRemoveGamepad) {
    window.onUpdateControllerStates((event, controllers) => {
      const oldState = ControllerManager.controllerStates;
      for(let key in controllers) {
        const gamepad = controllers[key];
        if (!(key in oldState)) { // New controller in the mix
          if (ControllerManager.virtualController && gamepad.gilrs_id == ControllerManager.virtualController.index) {
            continue;
          }
    
          onNewGamepad(gamepad);
        }
      }

      for(let key in oldState) {
        const gamepad = oldState[key];
        if (!(key in controllers)) { // Controller was removed
          if (ControllerManager.virtualController && gamepad.gilrs_id == ControllerManager.virtualController.index) {
            continue;
          }
    
          onRemoveGamepad(gamepad);
        }
      }
      
      ControllerManager.controllerStates = controllers;
      ControllerManager.pollController();
    });

    // For initial load we just add them all
    const controllers = ipcRenderer.sendSync('get-controll-states', {})

    for(let key in controllers) {
      let gamepad = controllers[key];
      if (ControllerManager.virtualController && gamepad.gilrs_id == ControllerManager.virtualController.index) {
        continue;
      }

      onNewGamepad(gamepad);
    }

    ControllerManager.controllerStates = controllers;
    ControllerManager.pollController();
  }

  static getNextChangedInput(callback) {
    ControllerManager.nextChangedCallback = callback;
  }

  static clearNextChangedInput() {
    ControllerManager.nextChangedCallback = null;
  }
}

window.ControllerManager = ControllerManager;
