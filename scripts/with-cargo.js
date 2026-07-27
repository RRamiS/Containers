const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const cargoBin = path.join(os.homedir(), '.cargo', 'bin');
process.env.PATH = `${cargoBin}${path.delimiter}${process.env.PATH || ''}`;

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error('Uso: node scripts/with-cargo.js <comando> [...args]');
  process.exit(1);
}

const cargoExe = process.platform === 'win32' ? 'cargo.exe' : 'cargo';
const cargoPath = path.join(cargoBin, cargoExe);
if (!fs.existsSync(cargoPath)) {
  console.error(
    `No se encontró Rust/cargo en ${cargoPath}.\nInstalá Rust desde https://rustup.rs/ y volvé a intentar.`,
  );
  process.exit(1);
}

const child = spawn(command, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
  windowsHide: true,
});

child.on('exit', (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});
