const socket = new WebSocket("wss://websocket-server-1000851228879.europe-west1.run.app");

socket.onopen = () => {
    console.log("✅ WebSocket-Verbindung hergestellt!");
    socket.send("Hallo Server!");
};

socket.onmessage = (event) => {
    console.log("📩 Antwort vom Server:", event.data);
};

socket.onclose = () => {
    console.log("❌ Verbindung geschlossen");
};

socket.onerror = (error) => {
    console.error("⚠️ Fehler:", error);
};
