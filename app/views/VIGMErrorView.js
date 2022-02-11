import { html, Component, render } from '../../node_modules/htm/preact/standalone.module.js';
import { Actions } from '../components/Actions.js';

export class VIGMErrorView extends Component {
  render() {
    return html`
      <div class="container-fluid vigm-error-modal">
        <p>There was an issue trying to create the virtual controller.</p>

        <p>This may be because the ViGEm Driver is not installed, this driver is necessary to create the virtual controller and can be downloaded at https://vigem.org/.</p>

        <code>
          Error from ViGEm: ${this.props.vigmError.message}
        </code>
      </div>
    `;
  }
}
