#!/usr/bin/env node

/**
 * Generate PNG assets for RuralConnect AI
 * Creates proper PNG files with a simple design using pngjs
 */

const fs = require('fs');
const path = require('path');

// Try to use pngjs if available, otherwise use canvas
let PNG;
try {
  PNG = require('pngjs').PNG;
} catch (e) {
  console.log('pngjs not found, installing...');
  require('child_process').execSync('npm install pngjs --no-save', { stdio: 'inherit' });
  PNG = require('pngjs').PNG;
}

// Create PNG using pngjs
function createPNG(width, height, color) {
  const { r, g, b } = hexToRgb(color);
  
  const png = new PNG({ width, height });
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255; // Alpha
    }
  }
  
  return PNG.sync.write(png);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 76, g: 175, b: 80 }; // Default green
}

// Ensure assets directory exists
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('🎨 Generating PNG assets for RuralConnect AI\n');

// Asset specifications
const assets = [
  { name: 'icon.png', width: 1024, height: 1024, color: '#4CAF50' },
  { name: 'adaptive-icon.png', width: 1024, height: 1024, color: '#4CAF50' },
  { name: 'splash.png', width: 1284, height: 2778, color: '#4CAF50' },
  { name: 'favicon.png', width: 48, height: 48, color: '#4CAF50' },
];

let success = true;

assets.forEach(asset => {
  try {
    console.log(`Creating ${asset.name} (${asset.width}x${asset.height})...`);
    const outputPath = path.join(assetsDir, asset.name);
    const pngBuffer = createPNG(asset.width, asset.height, asset.color);
    fs.writeFileSync(outputPath, pngBuffer);
    console.log(`  ✓ Created: ${outputPath}`);
  } catch (error) {
    console.error(`  ✗ Failed to create ${asset.name}:`, error.message);
    success = false;
  }
});

if (success) {
  console.log('\n✅ All PNG assets created successfully!');
  console.log('\n📝 Assets created:');
  console.log('  - assets/icon.png (1024x1024)');
  console.log('  - assets/adaptive-icon.png (1024x1024)');
  console.log('  - assets/splash.png (1284x2778)');
  console.log('  - assets/favicon.png (48x48)');
  console.log('\n💡 These are solid green placeholders.');
  console.log('   Replace them with your own designs before production release.');
  console.log('\n🚀 Next step: Run "eas build:configure"');
} else {
  console.log('\n⚠️  Some assets failed to create.');
  console.log('   You may need to create them manually or use an online tool.');
}
