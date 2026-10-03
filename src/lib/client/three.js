function setCounter(name, delta) {
  window[name] = Math.max(0, (window[name] ?? 0) + delta);
}

export async function createThreeStage(canvas, buildScene) {
  const THREE = await import('three');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  setCounter('__portfolioWebGLContexts', 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  const stage = buildScene(THREE, renderer);
  const resize = () => {
    const { width, height } = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(width, height, false);
    stage.camera.aspect = width / height;
    stage.camera.updateProjectionMatrix();
    renderer.render(stage.scene, stage.camera);
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  return {
    THREE,
    renderer,
    scene: stage.scene,
    camera: stage.camera,
    object: stage.object,
    render: () => renderer.render(stage.scene, stage.camera),
    start(update) {
      let frame;
      let running = true;
      setCounter('__portfolioAnimationFrames', 1);
      const tick = () => {
        if (!running) return;
        update(stage);
        renderer.render(stage.scene, stage.camera);
        frame = requestAnimationFrame(tick);
      };
      tick();
      return () => {
        if (!running) return;
        running = false;
        cancelAnimationFrame(frame);
        setCounter('__portfolioAnimationFrames', -1);
      };
    },
    dispose() {
      window.removeEventListener('resize', resize);
      stage.dispose?.();
      renderer.dispose();
      renderer.forceContextLoss();
      setCounter('__portfolioWebGLContexts', -1);
    },
  };
}
