import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/GLTFLoader.js";

/* ========= MULTIPLAYER ========= */
const socket = new WebSocket("wss://YOUR_SERVER_IP:8080");
let myId = null;
let netPlayers = {};

/* ========= SCENE ========= */
let scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

let camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", ()=>{
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

scene.add(new THREE.AmbientLight(0xffffff,0.6));
let sun = new THREE.DirectionalLight(0xffffff,0.6);
sun.position.set(10,20,10);
scene.add(sun);

/* ========= MAP ========= */
let floor = new THREE.Mesh(
    new THREE.BoxGeometry(100,1,100),
    new THREE.MeshStandardMaterial({color:0x222222})
);
floor.position.y=-0.5;
scene.add(floor);

let walls=[];
for(let i=0;i<40;i++){
    let w = new THREE.Mesh(
        new THREE.BoxGeometry(2,3,2),
        new THREE.MeshStandardMaterial({color:0xffffff})
    );
    w.position.set(Math.random()*40-20,1.5,Math.random()*40-20);
    scene.add(w);
    walls.push(w);
}

/* ========= PLAYER HITBOX ========= */
const player = new THREE.Object3D();
player.position.set(0,1,0);
scene.add(player);
player.add(camera);
camera.position.set(0,1.6,0);

/* ========= LOAD CHARACTER ========= */
const loader = new GLTFLoader();
let myModel = null;

loader.load("/player.glb", gltf=>{
    myModel = gltf.scene;
    myModel.scale.set(1,1,1);
    player.add(myModel);
});

/* ========= CONTROLS ========= */
let yaw=0, pitch=0;
const keys={};

document.body.onclick=()=>document.body.requestPointerLock();
document.addEventListener("mousemove",e=>{
    if(document.pointerLockElement){
        yaw-=e.movementX*0.002;
        pitch-=e.movementY*0.002;
        pitch=Math.max(-1.5,Math.min(1.5,pitch));
        player.rotation.y=yaw;
        camera.rotation.x=pitch;
    }
});
document.addEventListener("keydown",e=>keys[e.code]=true);
document.addEventListener("keyup",e=>keys[e.code]=false);

/* ========= PHYSICS ========= */
let velocityY=0,onGround=false;
const speed=0.12, gravity=-0.01;

function movePlayer(){
    let d=new THREE.Vector3();
    if(keys["KeyW"]) d.z-=1;
    if(keys["KeyS"]) d.z+=1;
    if(keys["KeyA"]) d.x-=1;
    if(keys["KeyD"]) d.x+=1;
    d.normalize();
    d.applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
    player.position.add(d.multiplyScalar(speed));
}

document.addEventListener("keydown",e=>{
    if(e.code==="Space" && onGround){
        velocityY=0.2;
        onGround=false;
    }
});

function physics(){
    velocityY+=gravity;
    player.position.y+=velocityY;
    if(player.position.y<1){
        player.position.y=1;
        velocityY=0;
        onGround=true;
    }
}

function wallCollision(){
    for(let w of walls){
        let d=player.position.distanceTo(w.position);
        if(d<1.5){
            let p=player.position.clone().sub(w.position).normalize();
            player.position.add(p.multiplyScalar(0.1));
        }
    }
}

/* ========= SHOOT ========= */
const raycaster = new THREE.Raycaster();
document.addEventListener("mousedown",()=>shoot());

function shoot(){
    raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
    let hits = raycaster.intersectObjects(walls);
}

/* ========= MULTIPLAYER MODELS ========= */
socket.onmessage = e=>{
    let data = JSON.parse(e.data);

    if(data.type==="init") myId=data.id;

    if(data.type==="players"){
        for(let id in data.players){
            if(id===myId) continue;

            if(!netPlayers[id]){
                loader.load("/player.glb", gltf=>{
                    let m = gltf.scene;
                    m.scale.set(1,1,1);
                    scene.add(m);
                    netPlayers[id]=m;
                });
            }

            if(netPlayers[id]){
                let p=data.players[id];
                netPlayers[id].position.set(p.x,p.y,p.z);
                netPlayers[id].rotation.y=p.rot;
            }
        }
    }
};

/* ========= LOOP ========= */
function loop(){
    requestAnimationFrame(loop);
    movePlayer();
    physics();
    wallCollision();

    if(myId){
        socket.send(JSON.stringify({
            type:"update",
            state:{
                x:player.position.x,
                y:player.position.y,
                z:player.position.z,
                rot:yaw
            }
        }));
    }

    renderer.render(scene,camera);
}
loop();

