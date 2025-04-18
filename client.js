const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    ws.send(JSON.stringify({
        type: 'join',
        spawnPosition: { x: Math.random() * 100, y: Math.random() * 100 }
    }));
});

ws.on('message', (message) => {
});
