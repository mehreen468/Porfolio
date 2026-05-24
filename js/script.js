const cube = document.querySelector('.cube');

if (cube) {
  let rotation = 0;
  const updateCube = () => {
    rotation += 0.15;
    cube.style.transform = `rotateX(-20deg) rotateY(${rotation}deg)`;
    requestAnimationFrame(updateCube);
  };
  updateCube();
}
