const Player = require('./Player');

class Room {
    constructor() {
        this.players = [];
        this.started = false;
    }

    isFull() {
        return this.players.length >= 2;
    }

    addPlayer(ws, spawnPosition) {
        const player = new Player(ws, this.players.length, spawnPosition);
        this.players.push(player);

        player.send({
            type: 'joined',
            playerIndex: player.id
        });

        if (this.isFull() && !this.started) {
            this.startGame();
        }
    }

    removePlayer(ws) {
        this.players = this.players.filter(p => p.ws !== ws);
    }

    startGame() {
        this.started = true;
        const playerData = this.players.map(p => p.getSpawnData());

        for (const player of this.players) {
            player.send({
                type: 'start',
                players: playerData
            });
        }
    }

    handlePosition(ws, x, y, dx = 1, dy = 0) {
        const player = this.players.find(p => p.ws === ws);
        if (player) {
            player.updatePosition(x, y, dx, dy);
            this.broadcastExcept(ws, {
                type: 'pos',
                index: player.id,
                x,
                y,
                dx,
                dy
            });
        }
    }

    broadcastExcept(senderWs, jsonObject) {
        const jsonText = JSON.stringify(jsonObject);
        for (const player of this.players) {
            if (player.ws !== senderWs && player.ws.readyState === player.ws.OPEN) {
                player.ws.send(jsonText);
            }
        }
    }
}

module.exports = Room;
