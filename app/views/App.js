import { html, Component, render } from '../../node_modules/htm/preact/standalone.module.js';
import { HostClientSelectionView } from './HostClientSelectionView.js';
import { VIGMErrorView } from './VIGMErrorView.js';
import { MainView } from './MainView.js';
import { State } from '../components/State.js';

class App extends Component {
  constructor() {
    super();

    this.state = State.initialize();

    State.onUpdate((newState) => {
      this.setState(newState)
    });
  }

  render() {
    if (this.state.vigmError) {
      return html`
        <${VIGMErrorView} vigmError=${this.state.vigmError}/>
      `
    }

    if (!this.state.serverRunning && !this.state.clientConnected) {
      return html`
        <${HostClientSelectionView}
          canHost=${this.state.canHost}
          isConnecting=${this.state.clientIsConnecting}
          username=${this.state.username}
          serverAddress=${this.state.serverAddress}
          hostClientError=${this.state.hostClientError}
      />
      `
    }

    return html`<${MainView}
      isHost=${this.state.isHost}
      isRunning=${this.state.isRunning}
      mode=${this.state.mode}
      controllerMapping=${this.state.controllerMapping}
      connectedControllers=${this.state.connectedControllers}
      countDown=${this.state.swapCountdown}
      enableCountdown=${this.state.enableCountdown}
      countdownDisplay=${this.state.countdownDisplay}
      forwardedController=${this.state.forwardedController}
      minSwapTime=${this.state.minSwapTime}
      maxSwapTime=${this.state.maxSwapTime}
      moveCountdownWindow=${this.state.moveCountdownWindow}
      playerDisplay=${this.state.playerDisplay}
      movePlayerWindow=${this.state.movePlayerWindow}
      users=${this.state.users}
      settingsPage=${this.state.settingsPage}
      virtualController=${this.state.virtualController}
    />`;
  }
}

render(html`<${App} />`, document.body);
