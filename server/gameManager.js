const Player = require("./player");

class GameManager {
    constructor() {
        this.players = {};
    }

    addPlayer(id) {
        this.players[id] = new Player(id, 0, 0);
    }

    updatePlayer(id, data) {
        if (this.players[id]) {
            this.players[id].x = data.x;
            this.players[id].y = data.y;
        }
    }

    removePlayer(id) {
        delete this.players[id];
    }

    getPlayers() {
        return this.players;
    }
}

module.exports = GameManager;
