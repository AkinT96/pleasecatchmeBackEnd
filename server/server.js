const WebSocket = require('ws');
const RoomManager = require('./RoomManager');

const wss = new WebSocket.Server({ port: 8080 });
const roomManager = new RoomManager();

wss.on('connection', (ws) => {
    console.log('🔌 Neuer Spieler verbunden');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            const room = roomManager.findRoomByPlayer(ws);

            if (data.type === 'join' && data.spawnPosition) {
                roomManager.assignPlayerToRoom(ws, data.spawnPosition);
                console.log('👤 Spieler beigetreten mit Spawn:', data.spawnPosition);
            } else if (room) {
                switch (data.type) {
                    case 'pos':
                        room.handlePosition(ws, data.x, data.y, data.dx, data.dy);
                        break;
                    case 'spawnItem':
                        room.handleItemSpawn(ws, data.x, data.y);
                        break;
                    case 'pickupItem':
                        room.handleItemPickup(ws, data.x, data.y);
                        break;
                    case 'freezeOther':
                        room.handleFreezeOther(ws);
                        break;
                    case 'setInvisible':
                        room.handleSetInvisible(ws, data.value);
                        break;
                    default:
                        console.log('⚠️ Unbekannter Nachrichtentyp:', data.type);
                }
            }
        } catch (err) {
            console.error('❌ Fehler beim Verarbeiten einer Nachricht:', err);
        }
    });

    ws.on('close', () => {
        roomManager.removePlayer(ws);
        console.log('🔌 Spieler getrennt');
    });
});
