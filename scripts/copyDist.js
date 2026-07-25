const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'frontend', 'dist');
const targetDist = path.join(__dirname, '..', 'dist');
const targetPublic = path.join(__dirname, '..', 'public');

try {
  if (fs.existsSync(src)) {
    fs.mkdirSync(targetDist, { recursive: true });
    fs.mkdirSync(targetPublic, { recursive: true });
    fs.cpSync(src, targetDist, { recursive: true });
    fs.cpSync(src, targetPublic, { recursive: true });
    console.log('✅ Successfully synced frontend/dist to ./dist and ./public for Render/Vercel multi-cloud deployment!');
  } else {
    console.log('⚠️ Source frontend/dist directory not found.');
  }
} catch (err) {
  console.error('Copy notice:', err.message);
}
