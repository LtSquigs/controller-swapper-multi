import { Actions } from './Actions.js';
import { State } from './State.js';

export class WebsocketClient {
  static client = null;
  static dataMessage = null;
  static dataCallback = null;

  static updateUser() {
    if (!WebsocketClient.client) {
      return;
    }

    WebsocketClient.client.send(JSON.stringify({
      type: "update_user",
      username: State.getState("username")
    }));
  }

  static sendControllerState(state) {
    if (!WebsocketClient.client) {
      return;
    }

    WebsocketClient.client.send(JSON.stringify({
      type: "update_controller_state",
      username: State.getState("username"),
      state: state,
      timestamp: Date.now()
    }));
  }

  static connect(host, onopen, onclose, onerror) {
    host = 'ws://' + host + ':54545';

    try {
      WebsocketClient.client = new window.nodeWS.createWebsocketClient(host);
    } catch (e) {
      return onerror(e.message);
    }

    WebsocketClient.client.on('open', () => {
      onopen();

      WebsocketClient.updateUser();
    });

    WebsocketClient.client.on('message', (message) => {
      message = JSON.parse(message);

      let romName = null;

      switch(message.type) {
        case "update_users":
          State.setState("users", {...message.users});
          break;
        case "start_countdown":
          Actions.startCountdown();
          break;

      }
    });

    WebsocketClient.client.on('close', () => {
      WebsocketClient.client = null;
      onclose()
    });

    WebsocketClient.client.on('error', () => {
      WebsocketClient.client = null;
      onerror("Error trying to connect to websocket server.");
    });
  }
}

window.WebsocketClient = WebsocketClient;