import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, .1, 2000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(0);
camera.position.setX(-1);

renderer.render(scene, camera);

// Torus

const geometry = new THREE.TorusGeometry(10, 4, 16, 100);
const material = new THREE.MeshStandardMaterial({ color: 0x141428 });
const torus = new THREE.Mesh(geometry, material);

scene.add(torus);

// Lights

const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);

// Helpers

// const lightHelper = new THREE.PointLightHelper(pointLight)
// const gridHelper = new THREE.GridHelper(0, 0);
// scene.add(lightHelper, gridHelper)

// const controls = new OrbitControls(camera, renderer.domElement);

var stars=[]
function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(x, y, z);
  scene.add(star);
  stars.push(star)
}

Array(300).fill().forEach(addStar);

// Background

const spaceTexture = new THREE.TextureLoader().load('./img/space.jpg');
scene.background = spaceTexture;

// Avatar

const jeffTexture = new THREE.TextureLoader().load('./img/sagar.png');
const jeff = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial({ map: jeffTexture }));
scene.add(jeff);

// Moon

const moonTexture = new THREE.TextureLoader().load('./img/moon.jpg');
const normalTexture = new THREE.TextureLoader().load('./img/normal.jpg');

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshStandardMaterial({
    map: moonTexture,
    normalMap: normalTexture,
  })
);

scene.add(moon);

moon.position.z = -5;
moon.position.x=-10
moon.position.y=9

jeff.position.z = -5;
jeff.position.x = 5;
jeff.position.y =-6;

// Scroll Animation

function moveCamera() {
  const t = document.body.getBoundingClientRect().top;
  moon.rotation.x += 0.05;
  moon.rotation.y += 0.075;
  moon.rotation.z += 0.05;

  jeff.rotation.y += 0.01;
  jeff.rotation.z += 0.01;

  camera.position.z = t * -0.01;
  camera.position.x = t * -0.0002;
  camera.rotation.y = t * -0.0002;
}

document.body.onscroll = moveCamera;
// moveCamera();

window.addEventListener('resize',()=>{location.reload()})
// Animation Loop

function animate() {
  requestAnimationFrame(animate);

  torus.rotation.x += 0.002;
  torus.rotation.y += 0.001;
  torus.rotation.z += 0.002;

  moon.rotation.y += 0.005;

  jeff.rotation.y+=0.01
  // controls.update();
    stars.forEach((x)=>{
        x.position.x+=.02*(Math.random()-0.5);
        x.position.y+=.02*(Math.random()-0.5);
        x.position.z+=.02*(Math.random()-0.5);
    })
  renderer.render(scene, camera);
}

camera.position.x=0
camera.position.y=1
camera.position.z=5

animate();