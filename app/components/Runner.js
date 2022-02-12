import { State } from './State.js';
import { Actions } from './Actions.js';
import { CoordinationServer } from './CoordinationServer.js'

const ipcRenderer = window.ipcRenderer;

function randomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

const buttonKeys = ["START", "BACK", "LEFT_THUMB", "RIGHT_THUMB", "LEFT_SHOULDER", "RIGHT_SHOULDER", "A", "B", "X", "Y"];
const axisKeys = ["leftX", "leftY", "rightX", "rightY", "leftTrigger", "rightTrigger", "dpadHorz", "dpadVert"];

export class Runner {

  static currentPlayer = null;
  static currentTimer = null;

  static userControllerStates = {};

  static run() {
    Actions.updateIsRunning(true);
    Runner.clearTimeout();

    // Only start Shuffling if mode is set to random
    if(State.getState("mode") !== "random") {
      return;
    }

    Runner.shufflePlayers(true);
  }

  static stop() {
    Actions.updateIsRunning(false);
    Runner.clearTimeout();
    Runner.updateCurrentPlayer(null);
  }
  static clearTimeout() {
    if(Runner.currentTimer) {
      clearTimeout(Runner.currentTimer);
    }
  }

  static registerNextShuffle() {
    Runner.clearTimeout();

    if(State.getState("mode") !== "random" || !State.getState("isRunning")) {
      return;
    }

    const minTime = State.getState("minSwapTime") * 1000;
    const maxTime = State.getState("maxSwapTime") * 1000;

    let randTime = 0;
    if (maxTime > minTime) randTime = randomNumber(minTime, maxTime + 1);
    if (maxTime <= minTime) randTime = randomNumber(maxTime, minTime + 1);

    Runner.currentTimer = setTimeout(Runner.shufflePlayers, randTime)
  }

  static shufflePlayers(noCountdown) {
    Runner.clearTimeout();
    State.setState('lastSwap', Date.now());
    State.setState('isSwapping', true);

    // Pick New Player To Swap To
    let playerList = [];
    let filteredPlayerList = [];
    for(const username in Runner.userControllerStates) {
      if (Runner.userControllerStates[username]) playerList.push(username);
    }

    filteredPlayerList = playerList.filter((username) => username != Runner.currentPlayer);

    // No valid players to shuffle to, just retry later
    if (filteredPlayerList.length == 0) {
      Runner.registerNextShuffle();
      return;
    }

    const newPlayer = filteredPlayerList[Math.floor(Math.random()*filteredPlayerList.length)];

    if (State.getState("enableCountdown") && !noCountdown) {
      // Maybe Replace this with a single countdown to the targeted player?
      const countdownPromises = playerList.map((player) => {
        return CoordinationServer.sendCountdown(player);
      });

      setTimeout(() => {
        Runner.updateCurrentPlayer(newPlayer);
        Runner.registerNextShuffle();
      }, 3000);
    } else {
      Runner.updateCurrentPlayer(newPlayer);
      Runner.registerNextShuffle();
    }
  }

  static updateCurrentPlayer(newPlayer) {
    State.setState('isSwapping', true);
    // From the controller state list, pick a random use who has a controller state as the new player

    CoordinationServer.updateUserSelected(Runner.currentPlayer, false);
    Runner.currentPlayer = newPlayer;
    CoordinationServer.updateUserSelected(newPlayer, true);
    State.setState('currentPlayer', newPlayer);
    
    State.setState('isSwapping', false);
  }

  // In All For One Mode, any One person pressing a button presses it, and all analog values are just added together!
  static allForOne() {
    const totalState = {}
    for(let key of buttonKeys) {
      totalState[key] = 0;
    }
    for(let key of axisKeys) {
      totalState[key] = 0;
    }

    for(let user in Runner.userControllerStates) {
      if (Runner.userControllerStates[user] !== null) {
        // If any one person is pressing a button, it is pressed
        for(let key of buttonKeys) {
          const val = Runner.userControllerStates[user][key] || 0;
          if (val > 0) {
            totalState[key] = 1;
          }
        }
        
        for(let key of axisKeys) {
          const val = Runner.userControllerStates[user][key] || 0;
          if (Math.abs(val) > 0.07) { // For non Neutral Axis, we are going to average these, we only count past a deadzone though
            totalState[key] += val;
          }
        }
      }
    }

    for(let key of axisKeys) {
      totalState[key] = totalState[key] > 1 ? 1 : totalState[key];
      totalState[key] = totalState[key] < -1 ? -1 : totalState[key];
    }

    return totalState;
  }

  static updateControllerState(username, state) {
    Runner.userControllerStates[username] = state;
    State.setState("userControllerStates", Runner.userControllerStates);
    CoordinationServer.updateUserHasController(username, state);

    // If we arent running, don't go syncing waterfalls
    if(!State.getState("isRunning")) {
      // If its not running but you are the host, then forward the controller
      if (username == State.getState("username")) {
        ipcRenderer.send('sync-controller', state)
      }
      return;
    }

    if (State.getState("mode") === "random" && username === Runner.currentPlayer) {
      ipcRenderer.send('sync-controller', state);
    } else if (State.getState("mode") === "all") {
      ipcRenderer.send('sync-controller', Runner.allForOne());
    } else if (State.getState("mode") === "manual" && username === Runner.currentPlayer) {
      ipcRenderer.send('sync-controller', state);
    }
  }
  
}

window.Runner = Runner;
