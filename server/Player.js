class Player {
    constructor(ws, id, spawnPosition) {
        this.ws = ws;
        this.id = id;
        this.x = spawnPosition.x;
        this.y = spawnPosition.y;
        this.dx = 1; // Default Richtung: rechts
        this.dy = 0;
        this.isTagger = false;
    }

    getSpawnData() {
        return {
            index: this.id,
            spawnPosition: {
                x: this.x,
                y: this.y
            },
            isTagger: this.isTagger
        };
    }


    updatePosition(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
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
