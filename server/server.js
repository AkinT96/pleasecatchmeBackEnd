const WebSocket = require('ws');
const RoomManager = require('./RoomManager');

const wss = new WebSocket.Server({ port: 8080 });
const roomManager = new RoomManager();

wss.on('connection', (ws) => {

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'join' && data.spawnPosition) {
                roomManager.assignPlayerToRoom(ws, data.spawnPosition);
            } else if (data.type === 'pos') {
                const room = roomManager.findRoomByPlayer(ws);
                if (room) {
                    room.handlePosition(ws, data.x, data.y);
                }
            } else {
            }
        } catch (err) {
        }
    });

    ws.on('close', () => {
        roomManager.removePlayer(ws);
    });
});

