import { State } from './State.js';
import { Settings } from './Settings.js';
import { Actions } from './Actions.js';
import { WebsocketClient } from './WebsocketClient.js';
import { CoordinationServer } from './CoordinationServer.js'

const ipcRenderer = window.ipcRenderer;

function randomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

export class Runner {

  static currentPlayer = null;
  static currentTimer = null;

  static userControllerStates = {};

  static run() {
    Actions.updateIsRunning(true);
    Runner.clearTimeout();
    Runner.shufflePlayers(true);
  }

  static stop() {
    Actions.updateIsRunning(false);
    Runner.clearTimeout();
    Runner.currentPlayer = null;
  }
  static clearTimeout() {
    if(Runner.currentTimer) {
      clearTimeout(Runner.currentTimer);
    }
  }

  static registerNextShuffle() {
    Runner.clearTimeout();

    if(State.getState("mode") !== "random") {
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
    for(const username in Runner.userControllerStates) {
      if (Runner.userControllerStates[username]) playerList.push(username);
    }

    playerList = playerList.filter((username) => username != Runner.currentPlayer);

    // No valid players to shuffle to, just retry later
    if (playerList.length == 0) {
      Runner.registerNextShuffle();
      return;
    }

    const newPlayer = playerList[Math.floor(Math.random()*playerList.length)];


    if (State.getState("enableCountdown") && !noCountdown) {
      // Maybe Replace this with a single countdown to the targeted player?
      const countdownPromises = Object.keys(newMap).map((player) => {
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

    Runner.currentPlayer = newPlayer;
    
    State.setState('isSwapping', false);
  }

  static updateControllerState(username, state) {
    Runner.userControllerStates[username] = state;

    if (State.getState("mode") === "random" && username === Runner.currentPlayer) {
      ipcRenderer.send('sync-controller', state)
    } else if (State.getState("mode") === "consensus") {
      // If in consensus mode do the consensus logic
    } else if (State.getState("mode") === "all") {
      // If in all mode do the all logics
    }
  }
}

window.Runner = Runner;
