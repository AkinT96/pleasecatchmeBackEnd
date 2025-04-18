const Player = require('./Player');

class Room {
    constructor() {
        this.players = [];
        this.started = false;
        this.roundTimer = null;
        this.roundDuration = 2 * 60 * 1000; // 2 Minuten in Millisekunden

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

        this.startRoundTimer();

        // Zufälligen Spieler als Fänger bestimmen
        const taggerIndex = Math.floor(Math.random() * this.players.length);
        this.players[taggerIndex].isTagger = true;


        const playerData = this.players.map(p => ({
            ...p.getSpawnData(),
            isTagger: p.isTagger
        }));

        for (const player of this.players) {
            player.send({
                type: 'start',
                players: playerData
            });
        }
    }

    startRoundTimer() {
        this.roundTimer = setTimeout(() => {
            this.endRoundDueToTimeout();
        }, this.roundDuration);
    }

    endRoundDueToTimeout() {
        for (const player of this.players) {
            player.send({ type: "end", reason: "timeout" });
        }
        this.started = false;
        clearTimeout(this.roundTimer);
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

            // 👇 Neue Logik: Prüfen ob Tagger jemanden berührt
            if (player.isTagger && !player.isFrozen) {
                for (const other of this.players) {
                    if (other !== player && !other.isFrozen && !other.isTagger) {
                        const dist = Math.hypot(player.x - other.x, player.y - other.y);
                        if (dist < 30) {
                            this.infectPlayer(player, other);
                        }
                    }
                }
            }
        }
    }

    endGame(tagger, victim) {
        for (const player of this.players) {
            player.send({
                type: 'end',
                tagger: tagger.id,
                victim: victim.id
            });
        }

        this.started = false;
    }

    broadcast(jsonObject) {
        for (const player of this.players) {
            player.send(jsonObject); // ✅ Übergib das rohe Objekt!
        }
    }



    infectPlayer(tagger, victim) {
        if (tagger === victim || !tagger.isTagger || victim.isFrozen) return;

        // Infektion blockieren für 1 Sekunde
        tagger.isTagger = false;
        victim.isTagger = true;
        victim.isFrozen = true;

        this.broadcast({
            type: "infected",
            newTagger: victim.id,
            oldTagger: tagger.id
        });

        // Opfer darf sich nach 7 Sekunden bewegen
        setTimeout(() => {
            victim.isFrozen = false;
        }, 7000);
    }

    broadcastExcept(senderWs, jsonObject) {
        for (const player of this.players) {
            if (player.ws !== senderWs && player.ws.readyState === player.ws.OPEN) {
                player.send(jsonObject); // ✅ nicht selbst serialisieren
            }
        }
    }

}

module.exports = Room;
