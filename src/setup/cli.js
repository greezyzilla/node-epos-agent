#!/usr/bin/env node

const { installAutostart, removeAutostart } = require('./autostart');

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  printUsage();
  process.exit(1);
}

switch (command) {
  case 'install':
    console.log('Installing autostart service...');
    if (installAutostart()) {
      console.log('✅ Autostart service installed successfully!');
      console.log('The application will now start automatically when you log in.');
    } else {
      console.error('❌ Failed to install autostart service.');
      process.exit(1);
    }
    break;
    
  case 'uninstall':
  case 'remove':
    console.log('Removing autostart service...');
    if (removeAutostart()) {
      console.log('✅ Autostart service removed successfully!');
    } else {
      console.error('❌ Failed to remove autostart service.');
      process.exit(1);
    }
    break;
    
  case 'help':
    printUsage();
    break;
    
  default:
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}

function printUsage() {
  console.log(`
Print Agent Autostart Setup

Usage:
  node src/setup/cli.js <command>

Commands:
  install    Install autostart service for current platform
  uninstall  Remove autostart service
  help       Show this help message

The autostart service will make the print agent start automatically when you log into your computer.
This works on Windows, macOS, and Linux.
`);
} 