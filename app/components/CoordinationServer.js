import { State } from './State.js';
import { Settings } from './Settings.js';
import { Runner } from './Runner.js';
import { Actions } from './Actions.js';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class CoordinationServer {
  static server = null;
  static connections = {};
  static users = {};

  static addUser(username, userObj) {
    CoordinationServer.users[username] = userObj;

    State.setState("users", {...CoordinationServer.users});
    CoordinationServer.broadcastUsers();
  }

  static removeUser(username) {
    delete CoordinationServer.users[username];

    State.setState("users", {...CoordinationServer.users});
    CoordinationServer.broadcastUsers();
  }

  static broadcastUsers() {
    for(let id in CoordinationServer.connections) {
      const ws = CoordinationServer.connections[id].ws;
      ws.send(JSON.stringify({
        type: "update_users",
        users: CoordinationServer.users
      }))
    }
  }

  static sendCountdown(player) {
    return new Promise((resolve, reject) => {
      const myUsername = Settings.getSetting('username');

      if(player == myUsername) {
        // Need Countdown Outside of Bizhawk
      } else {
        let connection = null;
        for(let id in CoordinationServer.connections) {
          if (CoordinationServer.connections[id].username === player) {
            connection = CoordinationServer.connections[id];
          }
        }

        if(connection) {
          const ws = connection.ws;

          ws.send(JSON.stringify({
            type: "start_countdown"
          }));
        }
      }
      resolve();
    });
  }

  static startServer(onListening, onClose, onError) {
    CoordinationServer.server = new window.nodeWS.createWebsocketServer(54545);

    CoordinationServer.server.on('listening', () => {
      onListening();

      const myUsername = Settings.getSetting('username');

      CoordinationServer.addUser(myUsername, { username: myUsername })
    });

    CoordinationServer.server.on('connection', (ws) => {
      const id = uuidv4();
      CoordinationServer.connections[id] = { ws: ws, username: null };

      ws.on('message', (message) => {
        message = JSON.parse(message);
        switch(message.type) {
          case 'update_user':
            CoordinationServer.connections[id].username = message.username;
            CoordinationServer.addUser(message.username, message);
            break;
          case 'update_controller_state':
            Runner.updateControllerState(message.username, message.state);
            Actions.updateUserLatency(message.username, Date.now() - message.timestamp);
            break;
        }
      })

      ws.on('close', (closed) => {
        if (CoordinationServer.connections[id].username) {
          CoordinationServer.removeUser(CoordinationServer.connections[id].username);
        }

        delete CoordinationServer.connections[id];
      })
    });

    CoordinationServer.server.on('close', () => {
      onClose();
    });

    CoordinationServer.server.on('error', (error) => {
      onError(error.message);
    });
  }
}
