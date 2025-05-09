const Room = require('./Room');

class RoomManager {
    constructor() {
        this.rooms = [];
        this.playerToRoom = new Map();
    }

    assignPlayerToRoom(ws, spawnPosition) {
        let room = this.rooms.find(r =>
            !r.started && !r.isFull()
        );

        if (!room) {
            room = new Room(this);
            this.rooms.push(room);
        }

        if (room.started) {
            ws.send(JSON.stringify({ type: "roomFull" }));
            ws.close();
            return;
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

    clearRoomAssignments(room) {
        for (const player of room.players) {
            this.playerToRoom.delete(player.ws);
        }
    }
}

module.exports = RoomManager;