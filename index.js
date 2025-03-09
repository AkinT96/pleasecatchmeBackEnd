const { Server } = require("socket.io");

const io = new Server(8080, {
    cors: {
        origin: "*"
    }
});

let players = {};

io.on("connection", (socket) => {
    console.log(`Neuer Spieler verbunden: ${socket.id}`);
    players[socket.id] = { x: 0, y: 0 }; // Beispiel: Position

    socket.on("updatePosition", (data) => {
        players[socket.id] = data;
        io.emit("playersUpdate", players); // Sende allen Spielern die neue Position
    });

    socket.on("disconnect", () => {
        console.log(`Spieler getrennt: ${socket.id}`);
        delete players[socket.id];
        io.emit("playersUpdate", players);
    });
});

console.log("WebSocket-Server läuft auf ws://localhost:8080");
