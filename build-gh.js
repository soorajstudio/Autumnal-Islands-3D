import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('1. Preparing source template...');
fs.copyFileSync('index.dev.html', 'index.html');

console.log('2. Running Vite build...');
execSync('npx vite build', { stdio: 'inherit' });

console.log('3. Updating root and docs for GitHub Pages...');
// Copy dist/index.html to root
fs.copyFileSync(path.join('dist', 'index.html'), 'index.html');

// Copy dist/assets to root assets/
fs.cpSync(path.join('dist', 'assets'), 'assets', { recursive: true, force: true });

// Copy dist to docs/
fs.cpSync('dist', 'docs', { recursive: true, force: true });

console.log('Build and deployment preparation complete!');
