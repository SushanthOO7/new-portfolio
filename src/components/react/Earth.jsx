import { useEffect, useRef, useState } from 'react';
import { createThreeStage } from '../../lib/client/three.js';
import './graphics.css';

export default function Earth() {
  const canvasRef=useRef(null);const [ready,setReady]=useState(false);const [animated,setAnimated]=useState(false);
  useEffect(()=>{let disposed=false,stage,stop;async function init(){const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;try{stage=await createThreeStage(canvasRef.current,(THREE)=>{const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,100);camera.position.z=3.6;const geometry=new THREE.SphereGeometry(1.25,48,48),material=new THREE.MeshStandardMaterial({color:0x4a8fc7,roughness:.72,wireframe:true}),mesh=new THREE.Mesh(geometry,material);scene.add(mesh);scene.add(new THREE.AmbientLight(0xffffff,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(3,2,4);scene.add(light);return{scene,camera,object:mesh,dispose(){geometry.dispose();material.dispose()}}});if(disposed){stage.dispose();return}if(reduce){stage.render();setAnimated(false)}else{stop=stage.start(({object})=>{object.rotation.y+=.0025});setAnimated(true)}setReady(true)}catch{setReady(true);setAnimated(false)}}init();return()=>{disposed=true;stop?.();stage?.dispose()}},[]);
  return <div className="graphics" data-earth-graphic data-graphics-ready={ready} data-animated={animated}><canvas ref={canvasRef} aria-hidden="true"/><div className="graphics-fallback" data-graphics-fallback role="img" aria-label="Interactive globe representing connected learning"><strong>A connected learning world</strong><span>The interactive globe loads when this section enters view.</span></div></div>;
}
