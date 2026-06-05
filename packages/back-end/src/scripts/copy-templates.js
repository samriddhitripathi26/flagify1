const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'templates');
const dest = path.join(__dirname, '..', '..', 'dist', 'templates');

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

try {
  copyFolderSync(src, dest);
  console.log('Successfully copied templates.');
} catch (err) {
  console.error('Failed to copy templates:', err);
  process.exit(1);
}
