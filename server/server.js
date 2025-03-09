const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

server.on("connection", (ws) => {
    console.log("✅ Neuer Client verbunden");

    ws.on("message", (message) => {
        console.log("📩 Nachricht erhalten:", message);
        ws.send(`Echo: ${message}`);
    });

    ws.on("close", () => {
        console.log("❌ Client getrennt");
    });
});

console.log("🚀 WebSocket-Server läuft auf ws://localhost:8080");
