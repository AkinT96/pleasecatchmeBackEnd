// ✅ RoomManager.js
const Room = require('./Room');

class RoomManager {
    constructor() {
        this.rooms = [];
        this.playerToRoom = new Map();
    }

    assignPlayerToRoom(ws, spawnPosition) {
        let room = this.rooms.find(r => !r.isFull() && !r.started);

        if (!room) {
            room = new Room(this);
            this.rooms.push(room);
        }

        room.addPlayer(ws, spawnPosition);
        this.playerToRoom.set(ws, room);
        return room;
    }

    removePlayer(ws) {
        const room = this.playerToRoom.get(ws);
        if (room) {
            room.removePlayer(ws);
            this.playerToRoom.delete(ws);

            if (room.players.length === 0) {
                this.rooms = this.rooms.filter(r => r !== room);
            }
        }
    }

    findRoomByPlayer(ws) {
        return this.playerToRoom.get(ws);
    }

    // Statt Spieler zu löschen, nur die Zuweisung aufheben
    clearRoomAssignments(room) {
        for (const player of room.players) {
            this.playerToRoom.delete(player.ws); // Spieler freigeben für neue Zuweisung
        }
    }
}

module.exports = RoomManager;
