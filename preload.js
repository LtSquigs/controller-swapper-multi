const { ipcRenderer, contextBridge } = require('electron');
const ws = require('ws');
const controller_lib = require('controller_lib')

let websocketServer = null;
let websocketClient = null;

contextBridge.exposeInMainWorld('controller_lib', controller_lib)
contextBridge.exposeInMainWorld('onUpdateControllerStates', (callback) => {
  ipcRenderer.on("new-controller-states", callback)
})
contextBridge.exposeInMainWorld('ipcRenderer', { ...ipcRenderer })
contextBridge.exposeInMainWorld('nodeWS',{
  createWebsocketServer: (port) => {
    websocketServer = new ws.Server({
      port: port
    });

    return {
      on: function(messageType, callback) {
        if(messageType === "connection") {
          websocketServer.on(messageType, (ws) => {
            const wrappedWS = {
              on: function(messageType, callback) {
                ws.on(messageType, callback);
              },
              send: function(message) {
                ws.send(message);
              }
            }
            callback(wrappedWS);
          })
        } else {
          websocketServer.on(messageType, callback);
        }
      }
    }
  },
  createWebsocketClient: (host) => {
    websocketClient = new ws(host);

    return {
      on: function(messageType, callback) {
        websocketClient.on(messageType, callback);
      },
      send: function(data) {
        websocketClient.send(data);
      }
    }
  }
})
