#!/usr/bin/env node

/**
 * Create placeholder assets for RuralConnect AI
 * This script creates simple colored PNG files as placeholders
 * Replace these with proper designs before production release
 */

const fs = require('fs');
const path = require('path');

// Simple PNG creation function (creates a solid color PNG)
function createPlaceholderPNG(width, height, color, outputPath) {
  // PNG header and basic structure for a solid color image
  // This is a minimal PNG file with IHDR, IDAT, and IEND chunks
  
  console.log(`Creating ${width}x${height} placeholder at ${outputPath}...`);
  
  // For simplicity, we'll create an SVG and note that it needs conversion
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${color}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.floor(width / 10)}" 
        fill="white" text-anchor="middle" dominant-baseline="middle">RC</text>
</svg>`;

  const svgPath = outputPath.replace('.png', '.svg');
  fs.writeFileSync(svgPath, svg);
  console.log(`  ✓ Created SVG: ${svgPath}`);
  console.log(`  ⚠️  Note: Convert to PNG using an online tool or image editor`);
}

// Ensure assets directory exists
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('🎨 Creating placeholder assets for RuralConnect AI\n');
console.log('Note: These are SVG placeholders. You should:');
console.log('1. Convert them to PNG using an online converter or image editor');
console.log('2. Or replace them with proper designs\n');

// Create placeholder assets
const assets = [
  { name: 'icon.png', width: 1024, height: 1024, color: '#4CAF50' },
  { name: 'adaptive-icon.png', width: 1024, height: 1024, color: '#4CAF50' },
  { name: 'splash.png', width: 1284, height: 2778, color: '#4CAF50' },
  { name: 'favicon.png', width: 48, height: 48, color: '#4CAF50' },
];

assets.forEach(asset => {
  const outputPath = path.join(assetsDir, asset.name);
  createPlaceholderPNG(asset.width, asset.height, asset.color, outputPath);
});

console.log('\n✅ Placeholder SVG files created!');
console.log('\n📝 Next steps:');
console.log('1. Convert SVG files to PNG:');
console.log('   - Use https://cloudconvert.com/svg-to-png');
console.log('   - Or use any image editor (GIMP, Photoshop, etc.)');
console.log('   - Or use ImageMagick: convert file.svg file.png');
console.log('\n2. Or create proper designs using:');
console.log('   - Figma, Adobe XD, or Sketch');
console.log('   - Online tools like https://www.appicon.co/');
console.log('   - Expo Asset Generator: https://github.com/expo/expo/tree/main/packages/expo-asset');
console.log('\n3. Replace the SVG files with PNG files of the same name');
console.log('\n4. Run: eas build --platform android --profile preview');
