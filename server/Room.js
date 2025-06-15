const Player = require('./Player');

class Room {
    constructor(roomManager) {
        this.roomManager = roomManager;
        this.players = [];
        this.started = false;
        this.locked = false;
        this.roundTimer = null;
        this.timeInterval = null;
        this.roundDuration = 2 * 60 * 1000;
        this.pingInterval = null;
        this.itemInterval = null; // 🆕 NEU: Intervall-Referenz speichern
        this.lastPing = new Map();
        this.items = [];
        this.ended = false;

    }

    isFull() {
        return this.players.length >= 2;
    }

    addPlayer(ws, spawnPosition) {
        if (this.locked || this.players.find(p => p.ws === ws)) return;

        const player = new Player(ws, this.players.length, spawnPosition);
        this.players.push(player);
        if (!this.lastPing.has(ws)) {
            // Erstkontakt: großzügig Zeit geben
            this.lastPing.set(ws, Date.now() + 10000); // 10 Sekunden Gnadenzeit nach Verbindungsaufbau
        }

        player.send({type: 'joined', playerIndex: player.id});

        if (this.isFull() && !this.started) {
            this.startGame();
        }
    }

    updatePing(ws) {
        this.lastPing.set(ws, Date.now());
        console.log('✅ Ping aktualisiert für Spieler');

        if (this.ended) {
            const player = this.players.find(p => p.ws === ws);
            if (player) {
                console.log("📤 Sende verspätetes Endsignal an wieder aktiven Client");
                player.send({ type: "end", reason: "disconnect" });
            }
        }
    }


    monitorPings() {
        this.pingInterval = setInterval(() => {
            const now = Date.now();
            for (const player of [...this.players]) {
                const last = this.lastPing.get(player.ws) || 0;
                if (now - last > 5000) {
                    console.log("❌ Spieler wegen Inaktivität entfernt");
                    this.broadcastExcept(player.ws, {type: "opponentLeft"});
                    this.removePlayer(player.ws);
                    this.roomManager.removePlayer(player.ws);
                }
            }
        }, 3000);
    }

    startGame() {
        this.started = true;
        this.locked = true; // 🆕 Raum sperren nach Start
        this.startRoundTimer();
        setTimeout(() => this.monitorPings(), 5000);

        const taggerIndex = Math.floor(Math.random() * this.players.length);
        this.players[taggerIndex].isTagger = true;

        const playerData = this.players.map(p => ({
            ...p.getSpawnData(),
            isTagger: p.isTagger
        }));

        for (const player of this.players) {
            player.send({type: 'start', players: playerData});
        }

        // 🆕 Direkt ein erstes Item zur Kontrolle erzeugen
        this.handleItemSpawn(null, 256, 256);

        // 🆕 Alle 10 Sekunden ein neues Item spawnen (max. 5 gleichzeitig)
        this.itemInterval = setInterval(() => {
            if (!this.started) return;
            if (this.items.length >= 5) return;

            const x = Math.floor(Math.random() * 500) + 100;
            const y = Math.floor(Math.random() * 400) + 100;

            this.handleItemSpawn(null, x, y);
        }, 10000);
    }

    startRoundTimer() {
        const startTime = Date.now();

        this.roundTimer = setTimeout(() => {
            this.endRoundDueToTimeout();
        }, this.roundDuration);

        this.timeInterval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const remaining = Math.max(0, (this.roundDuration / 1000) - elapsed);
            this.broadcast({type: "time", remaining});
        }, 1000);
    }

    endRoundDueToTimeout() {
        console.log("⏰ Runde endet wegen Zeitablauf");
        this.ended = true;
        this.broadcast({type: "end", reason: "timeout"});
        this.cleanupRoom();
    }

    removePlayer(ws) {
        console.log("🚫 Spieler wurde entfernt");
        this.players = this.players.filter(p => p.ws !== ws);
        this.lastPing.delete(ws);

        if (this.players.length === 0) {
            this.cleanupRoom();
        } else {
            this.locked = true;
            this.broadcast({ type: "opponentLeft" });

            // Warte 6 Sekunden, bevor Raum wirklich gelöscht wird
            setTimeout(() => {
                this.cleanupRoom();
            }, 6000);
        }
    }



    endGame(tagger, victim) {
        this.broadcast({type: 'end', tagger: tagger.id, victim: victim.id});
        this.cleanupRoom();
    }

    cleanupRoom() {
        clearTimeout(this.roundTimer);
        clearInterval(this.timeInterval);
        clearInterval(this.pingInterval);
        clearInterval(this.itemInterval); // 🆕 Intervall stoppen

        this.started = false;
        this.roomManager.clearRoomAssignments(this);
        this.roomManager.rooms = this.roomManager.rooms.filter(r => r !== this);
        this.players = [];
        this.items = [];
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
            this.broadcastExcept(ws, {type: 'pos', index: player.id, x, y, dx, dy});

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

        this.broadcast({type: "infected", newTagger: victim.id, oldTagger: tagger.id});
        this.broadcast({type: "frozen", playerId: victim.id, value: true});

        setTimeout(() => {
            victim.isFrozen = false;
            this.broadcast({type: "frozen", playerId: victim.id, value: false});
        }, 7000);
    }

    handleItemSpawn(ws, x, y) {
        const newItem = {x, y};
        this.items.push(newItem);
        this.broadcast({type: "spawnItem", x, y});
    }

    handleItemPickup(ws, x, y) {
        const player = this.players.find(p => p.ws === ws);
        if (!player) return;

        this.items = this.items.filter(item => Math.hypot(item.x - x, item.y - y) > 20);
        this.broadcast({type: "pickupItem", x, y, playerId: player.id});
    }

    handleFreezeOther(ws) {
        const other = this.players.find(p => p.ws !== ws);
        if (other) {
            other.send({type: 'frozen', playerId: other.id, value: true});
            setTimeout(() => {
                if (other.ws.readyState === 1) {
                    other.send({type: 'frozen', playerId: other.id, value: false});
                }
            }, 4000);
        }
    }

    handleSetInvisible(ws, value) {
        const player = this.players.find(p => p.ws === ws);
        if (!player) return;

        this.broadcast({type: 'setInvisible', playerId: player.id, value});
    }
}

module.exports = Room;