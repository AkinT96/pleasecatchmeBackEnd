const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    console.log('🟢 Verbunden mit dem Server');
    ws.send(JSON.stringify({
        type: 'join',
        spawnPosition: { x: Math.random() * 100, y: Math.random() * 100 }
    }));
});

ws.on('message', (message) => {
    console.log('📩 Nachricht vom Server:', message.toString());
});
