// ✅ Room.js
const Player = require('./Player');

class Room {
    constructor(roomManager) {
        this.roomManager = roomManager;
        this.players = [];
        this.started = false;
        this.roundTimer = null;
        this.timeInterval = null;
        this.roundDuration = 2 * 60 * 1000;
        this.pingInterval = null;
        this.lastPing = new Map();
    }

    isFull() {
        return this.players.length >= 2;
    }

    addPlayer(ws, spawnPosition) {
        if (this.players.find(p => p.ws === ws)) return;

        const player = new Player(ws, this.players.length, spawnPosition);
        this.players.push(player);
        this.lastPing.set(ws, Date.now());

        player.send({ type: 'joined', playerIndex: player.id });

        this.setupPing(ws);

        if (this.isFull() && !this.started) {
            this.startGame();
        }
    }

    setupPing(ws) {
        ws.on('pong', () => {
            this.lastPing.set(ws, Date.now());
        });
    }

    monitorPings() {
        this.pingInterval = setInterval(() => {
            const now = Date.now();
            for (const player of this.players) {
                const last = this.lastPing.get(player.ws) || 0;
                if (now - last > 10000) { // 10 Sekunden Timeout
                    console.log("❌ Spieler wegen fehlendem Ping entfernt");
                    this.removePlayer(player.ws);
                    this.roomManager.removePlayer(player.ws);
                } else {
                    try {
                        player.ws.ping();
                    } catch (err) {
                        console.error("Ping fehlgeschlagen", err);
                    }
                }
            }
        }, 5000);
    }

    removePlayer(ws) {
        this.players = this.players.filter(p => p.ws !== ws);
        this.lastPing.delete(ws);

        if (!this.started) return;

        if (this.players.length < 2) {
            this.broadcast({ type: "end", reason: "disconnect" });
            this.cleanupRoom();
        }
    }

    startGame() {
        this.started = true;
        this.startRoundTimer();
        this.monitorPings();

        const taggerIndex = Math.floor(Math.random() * this.players.length);
        this.players[taggerIndex].isTagger = true;

        const playerData = this.players.map(p => ({
            ...p.getSpawnData(),
            isTagger: p.isTagger
        }));

        for (const player of this.players) {
            player.send({ type: 'start', players: playerData });
        }
    }

    startRoundTimer() {
        const startTime = Date.now();

        this.roundTimer = setTimeout(() => {
            this.endRoundDueToTimeout();
        }, this.roundDuration);

        this.timeInterval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const remaining = Math.max(0, (this.roundDuration / 1000) - elapsed);
            this.broadcast({ type: "time", remaining });
        }, 1000);
    }

    endRoundDueToTimeout() {
        for (const player of this.players) {
            player.send({ type: "end", reason: "timeout" });
        }
        this.cleanupRoom();
    }

    endGame(tagger, victim) {
        for (const player of this.players) {
            player.send({ type: 'end', tagger: tagger.id, victim: victim.id });
        }
        this.cleanupRoom();
    }

    cleanupRoom() {
        clearTimeout(this.roundTimer);
        clearInterval(this.timeInterval);
        clearInterval(this.pingInterval);
        this.started = false;

        this.roomManager.clearRoomAssignments(this);
        this.players = [];
        this.lastPing.clear();
    }

    broadcast(jsonObject) {
        for (const player of this.players) {
            player.send(jsonObject);
        }
    }

    broadcastExcept(senderWs, jsonObject) {
        for (const player of this.players) {
            if (player.ws !== senderWs && player.ws.readyState === player.ws.OPEN) {
                player.send(jsonObject);
            }
        }
    }

    handlePosition(ws, x, y, dx = 1, dy = 0) {
        const player = this.players.find(p => p.ws === ws);
        if (player) {
            this.lastPing.set(ws, Date.now());
            player.updatePosition(x, y, dx, dy);
            this.broadcastExcept(ws, { type: 'pos', index: player.id, x, y, dx, dy });

            if (player.isTagger && !player.isFrozen) {
                for (const other of this.players) {
                    if (other !== player && !other.isTagger && !other.isFrozen) {
                        const dist = Math.hypot(player.x - other.x, player.y - other.y);
                        if (dist < 30) {
                            this.infectPlayer(player, other);
                        }
                    }
                }
            }
        }
    }

    infectPlayer(tagger, victim) {
        if (tagger === victim || !tagger.isTagger || victim.isFrozen) return;

        tagger.isTagger = false;
        victim.isTagger = true;
        victim.isFrozen = true;

        this.broadcast({ type: "infected", newTagger: victim.id, oldTagger: tagger.id });
        this.broadcast({ type: "frozen", playerId: victim.id, value: true });

        setTimeout(() => {
            victim.isFrozen = false;
            this.broadcast({ type: "frozen", playerId: victim.id, value: false });
        }, 7000);
    }
}

module.exports = Room;