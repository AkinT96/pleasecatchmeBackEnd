// ✅ RoomManager.js
const Room = require('./Room');

class RoomManager {
    constructor() {
        this.rooms = [];
        this.playerToRoom = new Map();
    }

    assignPlayerToRoom(ws, spawnPosition) {
        // Nur Räume suchen, die nicht voll UND noch nicht gestartet sind
        let room = this.rooms.find(r => !r.isFull() && !r.started);

        if (!room) {
            room = new Room();
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
        }
    }

    findRoomByPlayer(ws) {
        return this.playerToRoom.get(ws);
    }
}

module.exports = RoomManager;