import { html, Component, render } from '../../node_modules/htm/preact/standalone.module.js';
import { Actions } from '../components/Actions.js';

const BUTTON_LABELS = {
  south: 'South Button',
  east: 'East Button',
  north: 'North Button',
  west: 'West Button',
  c: 'C Button',
  z: 'Z Button',
  left_trigger: 'Left Shoulder',
  left_trigger_2: 'Left Trigger',
  right_trigger: 'Right Shoulder',
  right_trigger_2: 'Right Trigger',
  select: 'Select',
  start: 'Start',
  mode: 'Mode',
  left_thumb: 'Left Thumb',
  right_thumb: 'Right Thumb',
  d_pad_up: 'D-Pad Up',
  d_pad_down: 'D-Pad Down',
  d_pad_left: 'D-Pad Left',
  d_pad_right: 'D-Pad Right',
  unknown: 'Unknown Button'
}
  
const AXIS_LABELS = {
  left_stick_x: "Left X",
  left_stick_y: "Left Y",
  left_z: "Left Z",
  right_stick_x: "Right X",
  right_stick_y: "Right Y",
  right_z: "Right Z",
  d_pad_x: "D-Pad X",
  d_pad_y: "D-Pad Y",
  unknown: "Uknown Axis"
}

export class MainView extends Component {

  updateMinTime(event) {
    Actions.updateMinTime(event.target.value);
  }

  updateMaxTime(event) {
    Actions.updateMaxTime(event.target.value);
  }

  updateMode(event) {
    Actions.updateMode(event.target.value);
  }

  updateCountdown(event) {
    Actions.updateCountdown(event.target.checked);
  }

  updateForwardedController(event) {
    Actions.updateForwardedController(event.target.value);
  }

  forceSwap() {
    Actions.forceSwap();
  }

  changeUser(username) {
    return (e) => {
      Actions.swapUser(username);
      e.preventDefault();
      e.stopPropagation();
    }
  }

  run() {
    Actions.run();
  }

  stop() {
    Actions.stop();
  }

  changeSettingsPage(page) {
    return () => {
      Actions.changeSettingsPage(page);
    }
  }

  captureControllerInput(button) {
    return (event) => {
      const target = event.target;
      target.style.backgroundColor = "yellow";
    
      Actions.captureControllerInput((value) => {
        target.style.backgroundColor = null;
        Actions.updateControllerMapping(button, value);
      });
    }
  }

  cancelControllerCapture(event) {
    event.target.style.backgroundColor = null;
    Actions.cancelCaptureControllerInput();
  }

  renderUsers() {
    const userItems = [];
    for(let userName in this.props.users) {
      const user = this.props.users[userName];

      userItems.push(html`
        <div class="row">
          <div class="col-2">
            ${
              user.username == this.props.currentPlayer ? 
              html`<span class="badge badge-pill badge-success">Runner</span>` :
              (
                this.props.userControllerStates[user.username] ? 
                html`<span class="badge badge-pill badge-primary">Ready</span>` : 
                html`<span class="badge badge-pill badge-danger">No Controller</span>`
              )
            }
          </div>
          <div class="col-4">
            <span>${user.username}</span>
          </div>
          <div class="col-2">
            ${this.props.userLatency[user.username] || '0' } ms
          </div>
          <div class="col-3">
          ${ this.props.userControllerStates[user.username] && user.username !== this.props.currentPlayer ? 
              html`<a href="#" disabled=${!this.props.isRunning} onClick=${this.changeUser(user.username)}>Force Swap</a>` : null }
          </div>
        </div>
      `);
    }

    return userItems;
  }

  getMappingDisplay(mapping, input) {
    if (mapping[input].type == "button") {
      return BUTTON_LABELS[mapping[input].index];
    }
    
    const sign = mapping[input].sign == -1 ? '-' : '+';

    return AXIS_LABELS[mapping[input].index] + sign;
  }

  renderControllerSettings() {
    if(this.props.settingsPage !== 'controller') {
      return null;
    }

    return  html`
    <div class="controller-settings">
      <div class="form-row">
        <div class="form-group col-3">
          <label>A Button</label>
          <input type="text" class="form-control" value=${this.getMappingDisplay(this.props.controllerMapping, "a")} readonly onClick=${this.captureControllerInput("a")} onBlur=${this.cancelControllerCapture}></input>
        </div>
        <div class="form-group  col-3">
          <label>B Button</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "b")} readonly onClick=${this.captureControllerInput("b")}></input>
        </div>
        <div class="form-group  col-3">
          <label>X Button</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "x")} readonly onClick=${this.captureControllerInput("x")}></input>
        </div>
        <div class="form-group  col-3">
          <label>Y Button</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "y")} readonly onClick=${this.captureControllerInput("y")}></input>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group col-3">
          <label>Left Trigger</label>
          <input type="text" class="form-control" value=${this.getMappingDisplay(this.props.controllerMapping, "l_trigger")} readonly onClick=${this.captureControllerInput("l_trigger")}></input>
        </div>
        <div class="form-group  col-3">
          <label>Left Bumper</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "l_bumper")} readonly onClick=${this.captureControllerInput("l_bumper")}></input>
        </div>
        <div class="form-group  col-3">
          <label>Right Trigger</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "r_trigger")} readonly onClick=${this.captureControllerInput("r_trigger")}></input>
        </div>
        <div class="form-group  col-3">
          <label>Right Bumper</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "r_bumper")} readonly  onClick=${this.captureControllerInput("r_bumper")}></input>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group col-3">
          <label>D-Pad ←</label>
          <input type="text" class="form-control" value=${this.getMappingDisplay(this.props.controllerMapping, "d_left")} readonly  onClick=${this.captureControllerInput("d_left")}></input>
        </div>
        <div class="form-group  col-3">
          <label>D-Pad →</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "d_right")} readonly  onClick=${this.captureControllerInput("d_right")}></input>
        </div>
        <div class="form-group  col-3">
          <label>D-Pad ↑</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "d_up")} readonly onClick=${this.captureControllerInput("d_up")}></input>
        </div>
        <div class="form-group  col-3">
          <label>D-Pad ↓</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "d_down")} readonly  onClick=${this.captureControllerInput("d_down")}></input>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group col-3">
          <label>Left Stick ←</label>
          <input type="text" class="form-control" value=${this.getMappingDisplay(this.props.controllerMapping, "ls_left")} readonly  onClick=${this.captureControllerInput("ls_left")}></input>
        </div>
        <div class="form-group  col-3">
          <label>Left Stick →</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "ls_right")} readonly onClick=${this.captureControllerInput("ls_right")}></input>
        </div>
        <div class="form-group  col-3">
          <label>Left Stick ↑</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "ls_up")} readonly onClick=${this.captureControllerInput("ls_up")}></input>
        </div>
        <div class="form-group  col-3">
          <label>Left Stick ↓</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "ls_down")} readonly onClick=${this.captureControllerInput("ls_down")}></input>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group col-3">
          <label>Right Stick ←</label>
          <input type="text" class="form-control" value=${this.getMappingDisplay(this.props.controllerMapping, "rs_left")} readonly onClick=${this.captureControllerInput("rs_left")}></input>
        </div>
        <div class="form-group  col-3">
          <label>Right Stick →</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "rs_right")} readonly onClick=${this.captureControllerInput("rs_right")}></input>
        </div>
        <div class="form-group  col-3">
          <label>Right Stick ↑</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "rs_up")} readonly onClick=${this.captureControllerInput("rs_up")}></input>
        </div>
        <div class="form-group  col-3">
          <label>Right Stick ↓</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "rs_down")} readonly onClick=${this.captureControllerInput("rs_down")}></input>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group col-4">
          <label>Right Stick Press</label>
          <input type="text" class="form-control" value=${this.getMappingDisplay(this.props.controllerMapping, "rs_press")} readonly onClick=${this.captureControllerInput("rs_press")}></input>
        </div>
        <div class="form-group  col-4">
          <label>Left Stick Press</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "ls_press")} readonly onClick=${this.captureControllerInput("ls_press")}></input>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group col-4">
          <label>Start Button</label>
          <input type="text" class="form-control" value=${this.getMappingDisplay(this.props.controllerMapping, "start")} readonly onClick=${this.captureControllerInput("start")}></input>
        </div>
        <div class="form-group  col-4">
          <label>Back Button</label>
          <input type="text" class="form-control"  value=${this.getMappingDisplay(this.props.controllerMapping, "back")} readonly onClick=${this.captureControllerInput("back")}></input>
        </div>
      </div>
    </div>
    `
  }

  renderControllers() {
    if (this.props.connectedControllers.length == 0) {
      return null;
    }

    let options = [];
    for(let controller of this.props.connectedControllers) {
      if (this.props.forwardedController == controller.id) {
        options.push(html`
          <option value=${controller.index} selected>${controller.id}</option>
        `)
      } else {
        options.push(html`
          <option value=${controller.index}>${controller.id}</option>
        `)
      }
    }

    return options;
  }

  renderModeOption(label, value) {
    if(this.props.mode === value) {
      return html`
        <option value=${value} selected>${label}</option>
      `
    }
    return html`
      <option value=${value}>${label}</option>
    `
  }

  renderMainSettings() {
    if(this.props.settingsPage !== 'main') {
      return null;
    }

    return  html`
    <div class="form-row">
      <div class="form-group col-12">
        <label>Forwarded Controller</label>
        <select class="custom-select" required onChange=${this.updateForwardedController}>
          <option value="-1">None</option>
          ${ this.renderControllers() }
        </select>
        <small class="form-text text-muted">
          Which controller to forward to the virtual controller. Choose None if you do not want to be in the rotation.
        </small>
      </div>
    </div>
      <div class="form-row">
        <div class="form-group col-12">
          <label>Swapping Mode</label>
          <select class="custom-select" required onChange=${this.updateMode}>
            ${this.renderModeOption("Random", "random")}
            ${this.renderModeOption("Manual", "manual")}
            ${this.renderModeOption("All For One", "all")}
          </select>
          <small class="form-text text-muted">
            Random mode will swap one person in to control the controller in the random time intervals given below.
          </small>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group col-6">
          <label>Minimum Swap Time (s)</label>
          <input type="number" class="form-control" value=${this.props.minSwapTime} onChange=${this.updateMinTime} disabled=${!this.props.isHost}></input>
        </div>
        <div class="form-group  col-6">
          <label>Maximum Swap Time (s)</label>
           <input type="number" class="form-control"  value=${this.props.maxSwapTime} onChange=${this.updateMaxTime} disabled=${!this.props.isHost}></input>
        </div>
      </div>
      <div class="form-check-inline">
        <input type="checkbox" class="form-check-input" checked=${this.props.enableCountdown} onChange=${this.updateCountdown} disabled=${!this.props.isHost}></input>
        <label class="form-check-label">Enable Countdown</label>
      </div>
      <div class="form-row pt-3">
        <div class="swap-controls">
        <div>
          ${!this.props.isRunning ? html`<button class="btn btn-primary ml-2" onClick=${this.run}>Start</button>` : null }
          ${this.props.isRunning ? html`<button class="btn btn-danger ml-2" onClick=${this.stop}>Stop</button>` : null }
        </div>
        </div>
      </div>
      <div class="pt-3">
        <div>
          <h3>User List</h3>
          <div class="user-list">
            ${ this.renderUsers() }
          </div>
        </div>
      </div>
    `
  }

  render() {
    return html`
      <div class="container main-view">
        <div class="row pt-3 pb-3">
          <div class="col-12">
            <h3><span>Settings </span></h3>
            <ul class="nav">
              <li class="nav-item">
                <a class=${"nav-link " + (this.props.settingsPage == 'main' ? 'disabled' : '')} href="#" onClick=${this.changeSettingsPage('main')}>Main</a>
              </li>
              <li class="nav-item">
                <a class=${"nav-link " + (this.props.settingsPage == 'controller' ? 'disabled' : '')} href="#" onClick=${this.changeSettingsPage('controller')}>Controller Mapping</a>
              </li>
            </ul>
            ${ this.renderMainSettings() }
            ${ this.renderControllerSettings() }
          </div>
        </div>
      </div>
    `;
  }
}
