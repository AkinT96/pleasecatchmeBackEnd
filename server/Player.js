class Player {
    constructor(ws, id, spawnPosition) {
        this.ws = ws;
        this.id = id;
        this.x = spawnPosition.x;
        this.y = spawnPosition.y;
        this.isTagger = false;
    }

    getSpawnData() {
        return {
            index: this.id,
            spawnPosition: {
                x: this.x,
                y: this.y
            }
        };
    }

    updatePosition(x, y) {
        this.x = x;
        this.y = y;
    }

    send(jsonObject) {
        try {
            if (this.ws.readyState === this.ws.OPEN) {
                this.ws.send(JSON.stringify(jsonObject));
            }
        } catch (e) {
            console.warn(`❌ Fehler beim Senden an Spieler ${this.id}:`, e);
        }
    }
}

module.exports = Player;