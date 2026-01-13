const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });
console.log("FPS Multiplayer Server started on port 8080");

let players = {};

wss.on("connection", ws => {
    const id = Math.random().toString(36).substr(2,9);
    players[id] = {x:0,y:1,z:0,rot:0};

    ws.send(JSON.stringify({type:"init", id}));

    ws.on("message", msg=>{
        const data = JSON.parse(msg);
        if(data.type==="update"){
            players[id] = data.state;
        }
    });

    ws.on("close", ()=>{
        delete players[id];
    });
});

setInterval(()=>{
    const packet = JSON.stringify({type:"players", players});
    wss.clients.forEach(c=>{
        if(c.readyState===1) c.send(packet);
    });
}, 50);
