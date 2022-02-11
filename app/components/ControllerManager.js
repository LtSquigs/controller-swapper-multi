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

      ControllerManager.killPollingLoop();
    } else {
      ControllerManager.startPollingLoop(controller);
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

    // Register an event for deregistering this controller before the window unloads, seems to also work when the program is closed.
    window.onbeforeunload = function(event)
    {
        ipcRenderer.send('disconnect-controller', {})
    };
  }

  static startPollingLoop(controller) {
    ControllerManager.polling = true;
    const timeoutPromise = ipcRenderer.invoke('timeout', 4);
    timeoutPromise.then(() => {
      ControllerManager.pollController(controller) 
    })
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

    // If we have a different length of buttons, that likely means we are in a NEW_STATE scenario
    if (newState.buttons.length > oldState.buttons.length) {
      return NEW_STATE;
    }

    const deadZone = State.getState("controllerDeadzone");

    for(let i = 0; i < newState.buttons.length; i++) {
      if (newState.buttons[i].value != oldState.buttons[i].value) {
        return {
          id: i,
          type: "button",
          value: newState.buttons[i].value
        }
      }
    }
   if (newState.axes.length > oldState.axes.length) {
      return NEW_STATE;
    }

    for(let i = 0; i < newState.axes.length; i++) {
      // For it to qualify as a change in the axis, we want the user to really have to press it in that direction
      if (newState.axes[i] !== oldState.axes[i] && Math.abs(newState.axes[i]) > deadZone && Math.abs(newState.axes[i] - oldState.axes[i]) > 0.01) {
        // Should Implement a filter for how big of a change before its considered different. Maybe == deadzone?
        return {
          id: i,
          type: "axis",
          value: newState.axes[i]
        }
      }
    }

    return null;
  }

  static pollController(oldController) {
    // Chrome is insane and requires you to always get the full list of controllers every time for a live snapshot.
    const controllers = navigator.getGamepads();
    let foundController = null;
    for(let controller of controllers) {
      if (controller && controller.index == oldController.index) {
        foundController = controller;
      }
    }
    
    if (foundController == null) {
      ControllerManager.userControllerState = null;
    } else {
      const changedItem = ControllerManager.statesChanged(ControllerManager.userControllerState, foundController);


      if (changedItem != null) {
        ControllerManager.userControllerState = {};
        ControllerManager.userControllerState.buttons = foundController.buttons;
        ControllerManager.userControllerState.axes = foundController.axes;
  
        if (changedItem == NO_STATE) {
          if (State.getState("isHost")) {
            Runner.updateControllerState(State.getState("username"), null)
          } else {
            WebsocketClient.sendControllerState(null)
          }
        } else {
          const translatedState = ControllerManager.translateState(ControllerManager.userControllerState);

          if (State.getState("isHost")) {
            Runner.updateControllerState(State.getState("username"), translatedState)
          } else {
            WebsocketClient.sendControllerState(translatedState)
          }
        }
      }

      if (ControllerManager.nextChangedCallback != null && changedItem !== null && changedItem !== NEW_STATE && changedItem !== NO_STATE && Math.abs(changedItem.value) > 0.5) {
        ControllerManager.nextChangedCallback(changedItem);
        ControllerManager.nextChangedCallback = null;
      }
    }

    if (ControllerManager.polling) {
      const timeoutPromise = ipcRenderer.invoke('timeout', 4);
      timeoutPromise.then(() => {
        ControllerManager.pollController(oldController) 
      })
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
      leftY: ControllerManager.translateToAxis(state, mapping.ls_up, mapping.ls_down),
      rightX: ControllerManager.translateToAxis(state, mapping.rs_left, mapping.rs_right),
      rightY: ControllerManager.translateToAxis(state, mapping.rs_up, mapping.rs_down),
      leftTrigger: ControllerManager.translateToButton(state, mapping.l_trigger),
      rightTrigger: ControllerManager.translateToButton(state, mapping.l_trigger),
      dpadHorz: ControllerManager.translateToAxis(state, mapping.d_left, mapping.d_right),
      dpadVert: ControllerManager.translateToAxis(state, mapping.d_up, mapping.d_down),
    }

    return xboxState;
  }

  static translateToButton(state, mapping) {
    const type = mapping.type;
    const index = mapping.index;

    if (type === "button") {
      const value = state.buttons[index].value;

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
      if (state.buttons[negativeMapping.index].value > 0) {
        negativeValue = -1;
      } else {
        negativeValue = 0;
      }
    } else if (negativeMapping.type === "axis") {
      // Only record this value if the sign matches the mapping.
      const axes = state.axes[negativeMapping.index]
      if (negativeMapping.sign === -1 && axes < 0) {
        negativeValue = state.axes[negativeMapping.index];
      } else if (negativeMapping.sign === 1 && axes > 0) {
        negativeValue = state.axes[negativeMapping.index] * -1;
      }
    }
    
    if (positiveMapping.type === "button") {
      if (state.buttons[positiveMapping.index].value > 0) {
        positiveValue = -1;
      } else {
        positiveValue = 0;
      }
    } else if (positiveMapping.type === "axis") {
      // Only record this value if the sign matches the mapping.
      const axes = state.axes[positiveMapping.index]
      if (positiveMapping.sign === -1 && axes < 0) {
        positiveValue = state.axes[positiveMapping.index] * -1;
      } else if (positiveMapping.sign === 1 && axes > 0) {
        positiveValue = state.axes[positiveMapping.index];
      }
    }

    if (Math.abs(positiveValue) > Math.abs(negativeValue)) {
      return positiveValue;
    } else {
      return negativeValue
    }
  }

  static killPollingLoop() {
    ControllerManager.userControllerState = null;
    ControllerManager.polling = false;
  }

  static listenControllers(onNewGamepad, onRemoveGamepad) {
    window.addEventListener("gamepadconnected", function(e) {
        if (ControllerManager.virtualController && e.gamepad.index == ControllerManager.virtualController.index) {
            return;
        }

        onNewGamepad(e.gamepad);
    });

    window.addEventListener("gamepaddisconnected", function(e) {
        if (ControllerManager.virtualController && e.gamepad.index == ControllerManager.virtualController.index) {
            return;
        }

        onRemoveGamepad(e.gamepad);
    });
    
    // Add event listeners for button and axis change
    // If from forwardedController, use button mapping to map buttons/axis change to gamepads current state
    // Call update gamepad state in self for host or in websocket client for client
  }

  static getNextChangedInput(callback) {
    ControllerManager.nextChangedCallback = callback;
  }

  static clearNextChangedInput() {
    ControllerManager.nextChangedCallback = null;
  }
}

window.ControllerManager = ControllerManager;
