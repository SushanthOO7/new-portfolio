const fs = require('fs');
const path = require('path');

const src = 'node_modules/three/examples/jsm/libs/draco/gltf';
const output = 'public/draco';

// Ensure output directory exists
if (!fs.existsSync(output)) {
  fs.mkdirSync(output, { recursive: true });
}

// Copy draco decoder from three.js into the public directory
const copyFile = (srcFile, destFile) => {
  const srcPath = path.join(src, srcFile);
  const destPath = path.join(output, destFile);

  if (fs.existsSync(srcPath)) {
    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Successfully copied ${srcFile}`);
    } catch (err) {
      console.error(`Error copying ${srcFile}:`, err);
    }
  } else {
    console.warn(`Source file ${srcPath} does not exist, skipping ${srcFile}`);
  }
};

copyFile('draco_decoder.wasm', 'draco_decoder.wasm');
copyFile('draco_wasm_wrapper.js', 'draco_wasm_wrapper.js');
