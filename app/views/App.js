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
      currentPlayer=${this.state.currentPlayer}
      controllerMapping=${this.state.controllerMapping}
      connectedControllers=${this.state.connectedControllers}
      enableCountdown=${this.state.enableCountdown}
      forwardedController=${this.state.forwardedController}
      minSwapTime=${this.state.minSwapTime}
      maxSwapTime=${this.state.maxSwapTime}
      users=${this.state.users}
      userControllerStates=${this.state.userControllerStates}
      userLatency=${this.state.userLatency}
      settingsPage=${this.state.settingsPage}
    />`;
  }
}

render(html`<${App} />`, document.body);
