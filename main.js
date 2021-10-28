import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, .1, 2000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, camera);

// Torus
const geometry = new THREE.TorusGeometry(150, 40, 16, 100);
const material = new THREE.MeshStandardMaterial({ color: 0x141428 });
const torus = new THREE.Mesh(geometry, material);
torus.position.set(0,0,15)
scene.add(torus);

// Lights
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);

var stars=[]
function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(120));

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
const jeff = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.MeshBasicMaterial({ map: jeffTexture }));
jeff.position.set(0,-60,10)
scene.add(jeff);

// Moon

const moonTexture = new THREE.TextureLoader().load('./img/moon.jpg');
const normalTexture = new THREE.TextureLoader().load('./img/normal.jpg');

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(5, 32, 32),
  new THREE.MeshStandardMaterial({
    map: moonTexture,
    normalMap: normalTexture,
  })
);

scene.add(moon);


window.addEventListener('resize',()=>{location.reload()})
// Animation Loop
var moonMax={
  x:50,y:95,z:30
}
const borderChange =(x,max,i)=>{
    if ((x-max)>=0){x-=i}
    else if ((x-max)<0){x+=i}
}
moon.position.x = -moonMax.x
moon.position.y=-moonMax.y
moon.position.z=moonMax.z
var ix=.0125
var iy=.025
var iz=.0075
function animate() {
  requestAnimationFrame(animate);

  torus.rotation.x += 0.0002;
  torus.rotation.y += 0.0001;
  torus.rotation.z += 0.0002;

  moon.rotation.y += 0.003;
  // borderChange(moon.position.x,moonMax.x,0.05)
  if (moon.position.x<-moonMax.x||moon.position.x>moonMax.x)ix=-ix
  moon.position.x-=ix
  if (moon.position.y<-moonMax.y||moon.position.y>moonMax.y)iy=-iy
  moon.position.y-=iy
  if (moon.position.z<-moonMax.z||moon.position.z>moonMax.z)iz=-iz
  moon.position.z-=iz
  // moon.position.z-=.03
  // console.log(moon.position)

  jeff.rotation.y+=0.01
  // controls.update();
    stars.forEach((x)=>{
        x.position.x+=.05*(Math.random()-0.5);
        x.position.y+=.05*(Math.random()-0.5);
        x.position.z+=.05*(Math.random()-0.5);
    })
  renderer.render(scene, camera);
}

camera.position.x=0
camera.position.y=0
camera.position.z=100

animate();

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


// Helpers

// const lightHelper = new THREE.PointLightHelper(pointLight)
// const gridHelper = new THREE.GridHelper(0, 0);
// scene.add(lightHelper, gridHelper)

// const controls = new OrbitControls(camera, renderer.domElement);


