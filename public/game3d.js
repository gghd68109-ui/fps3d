import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";

const socket = io();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
camera.position.y = 1.6;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5,10,5);
scene.add(light);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100,100),
  new THREE.MeshStandardMaterial({color:0x444444})
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

const players = {};

function makePlayer(color){
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1,2,1),
    new THREE.MeshStandardMaterial({color})
  );
  scene.add(mesh);
  return mesh;
}

socket.on("players", data => {
  for(const id in data){
    players[id] = makePlayer(0xff0000);
    players[id].position.set(data[id].x, data[id].y, data[id].z);
  }
});

socket.on("player", msg => {
  if(!players[msg.id]) players[msg.id] = makePlayer(0x00ff00);
  players[msg.id].position.set(msg.data.x, msg.data.y, msg.data.z);
});

socket.on("remove", id => {
  if(players[id]){
    scene.remove(players[id]);
    delete players[id];
  }
});

const keys = {};
onkeydown = e => keys[e.key] = true;
onkeyup = e => keys[e.key] = false;

let my = {x:0,y:1,z:0};

function animate(){
  requestAnimationFrame(animate);

  if(keys.w) my.z -= 0.1;
  if(keys.s) my.z += 0.1;
  if(keys.a) my.x -= 0.1;
  if(keys.d) my.x += 0.1;

  socket.emit("move", my);

  camera.position.set(my.x, my.y+2, my.z+5);
  camera.lookAt(my.x, my.y, my.z);

  renderer.render(scene, camera);
}
animate();

