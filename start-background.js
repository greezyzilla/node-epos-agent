const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the path to the application
const appPath = path.join(__dirname, 'src/index.js');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create log files
const stdout = fs.openSync(path.join(logsDir, 'app-output.log'), 'a');
const stderr = fs.openSync(path.join(logsDir, 'app-error.log'), 'a');

// Spawn the child process
const child = spawn('node', [appPath, '--background'], {
  detached: true,
  stdio: ['ignore', stdout, stderr]
});

// Detach the child process
child.unref();

console.log(`Print agent started in background mode (PID: ${child.pid})`);
console.log(`Output logs: ${path.join(logsDir, 'app-output.log')}`);
console.log(`Error logs: ${path.join(logsDir, 'app-error.log')}`);
console.log('Open http://localhost:3310 to access the print agent');

// Exit the parent process
process.exit(0); 