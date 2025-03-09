class Player {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.isTagger = false; // Ob der Spieler der Fänger ist
    }
}

module.exports = Player;
