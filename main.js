// Detect mobile devices and adjust scene complexity for better performance
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
  // Reduce stars for better mobile performance
  stars.forEach((star, index) => {
    if (index % 3 !== 0) { // Keep only 1/3 of the stars
      scene.remove(star);
    }
  });
  
  // Simplify torus geometry for mobile
  torus.geometry.dispose();
  torus.geometry = new THREE.TorusGeometry(150, 40, 8, 50); // Less complex geometry
  
  // Slower animation on mobile for better performance
  function animate() {
    requestAnimationFrame(animate);
    
    torus.rotation.x += 0.0001;
    torus.rotation.y += 0.00005;
    torus.rotation.z += 0.0001;
    
    moon.rotation.y += 0.002;
    
    // Slow down moon movement
    if (moon.position.x<-moonMax.x||moon.position.x>moonMax.x)ix=-ix
    moon.position.x-=ix*0.5;
    if (moon.position.y<-moonMax.y||moon.position.y>moonMax.y)iy=-iy
    moon.position.y-=iy*0.5;
    if (moon.position.z<-moonMax.z||moon.position.z>moonMax.z)iz=-iz
    moon.position.z-=iz*0.5;
    
    jeff.rotation.y+=0.005;
    
    // Update fewer stars and less often on mobile
    if (Math.random() > 0.7) {
      stars.slice(0, stars.length/3).forEach((x) => {
        x.position.x+=.03*(Math.random()-0.5);
        x.position.y+=.03*(Math.random()-0.5);
        x.position.z+=.03*(Math.random()-0.5);
      });
    }
    
    renderer.render(scene, camera);
  }
} else {
  // Original animation for desktop
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
}

// Handle orientation changes for mobile
window.addEventListener('orientationchange', function() {
  // Wait for orientation change to complete
  setTimeout(() => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }, 200);
});

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


