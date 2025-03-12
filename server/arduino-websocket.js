const { SerialPort } = require('serialport');  // ✅ Korrekte Importweise
const { ReadlineParser } = require('@serialport/parser-readline');

const port = new SerialPort({ path: 'COM3', baudRate: 9600 });  // ✅ Neue SerialPort-Syntax
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

const WebSocket = require('ws');
const ws = new WebSocket("https://websocket-server-1000851228879.europe-west3.run.app/"); // Ersetze mit deiner WebSocket-URL

ws.on("open", () => {
    console.log("✅ WebSocket verbunden!");
});

ws.on("message", (message) => {
    console.log("📩 Nachricht vom Server:", message);
    port.write(message + "\n"); // Antwort an Arduino senden
});

parser.on("data", (data) => {
    console.log("📤 Arduino sendet:", data);
    ws.send(data);
});
