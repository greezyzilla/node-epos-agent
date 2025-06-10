const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Get application path
const appRoot = path.resolve(__dirname, '../../');
const packageJson = require(path.join(appRoot, 'package.json'));
const appName = packageJson.name;

/**
 * Install autostart service based on platform
 */
function installAutostart() {
  const platform = os.platform();
  
  try {
    switch (platform) {
      case 'win32':
        installWindowsAutostart();
        break;
      case 'darwin':
        installMacAutostart();
        break;
      case 'linux':
        installLinuxAutostart();
        break;
      default:
        console.log(`Unsupported platform: ${platform}`);
        return false;
    }
    console.log(`Autostart service installed successfully for ${platform}`);
    return true;
  } catch (error) {
    console.error(`Failed to install autostart service: ${error.message}`);
    return false;
  }
}

/**
 * Remove autostart service based on platform
 */
function removeAutostart() {
  const platform = os.platform();
  
  try {
    switch (platform) {
      case 'win32':
        removeWindowsAutostart();
        break;
      case 'darwin':
        removeMacAutostart();
        break;
      case 'linux':
        removeLinuxAutostart();
        break;
      default:
        console.log(`Unsupported platform: ${platform}`);
        return false;
    }
    console.log(`Autostart service removed successfully for ${platform}`);
    return true;
  } catch (error) {
    console.error(`Failed to remove autostart service: ${error.message}`);
    return false;
  }
}

/**
 * Windows implementation using Task Scheduler
 */
function installWindowsAutostart() {
  const nodePath = process.execPath;
  const scriptPath = path.join(appRoot, 'src/index.js');
  
  // Create batch file in startup folder
  const startupFolder = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
  const batchFilePath = path.join(startupFolder, `${appName}.bat`);
  
  const batchContent = `@echo off
cd /d "${appRoot}"
"${nodePath}" --no-deprecation "${scriptPath}"
`;

  fs.writeFileSync(batchFilePath, batchContent);
  console.log(`Created startup batch file at: ${batchFilePath}`);
}

function removeWindowsAutostart() {
  const startupFolder = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
  const batchFilePath = path.join(startupFolder, `${appName}.bat`);
  
  if (fs.existsSync(batchFilePath)) {
    fs.unlinkSync(batchFilePath);
    console.log(`Removed startup batch file: ${batchFilePath}`);
  }
}

/**
 * macOS implementation using LaunchAgents
 */
function installMacAutostart() {
  const nodePath = process.execPath;
  const scriptPath = path.join(appRoot, 'src/index.js');
  const launchAgentDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
  const plistPath = path.join(launchAgentDir, `com.${appName}.plist`);
  
  // Create LaunchAgents directory if it doesn't exist
  if (!fs.existsSync(launchAgentDir)) {
    fs.mkdirSync(launchAgentDir, { recursive: true });
  }
  
  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.${appName}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>--no-deprecation</string>
        <string>${scriptPath}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>${appRoot}</string>
    <key>StandardErrorPath</key>
    <string>${os.homedir()}/Library/Logs/${appName}.err.log</string>
    <key>StandardOutPath</key>
    <string>${os.homedir()}/Library/Logs/${appName}.out.log</string>
</dict>
</plist>`;

  fs.writeFileSync(plistPath, plistContent);
  
  // Load the launch agent
  try {
    execSync(`launchctl load ${plistPath}`);
  } catch (error) {
    console.warn(`Warning: Could not load launch agent: ${error.message}`);
  }
  
  console.log(`Created and loaded launch agent at: ${plistPath}`);
}

function removeMacAutostart() {
  const launchAgentDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
  const plistPath = path.join(launchAgentDir, `com.${appName}.plist`);
  
  if (fs.existsSync(plistPath)) {
    try {
      execSync(`launchctl unload ${plistPath}`);
    } catch (error) {
      console.warn(`Warning: Could not unload launch agent: ${error.message}`);
    }
    
    fs.unlinkSync(plistPath);
    console.log(`Removed launch agent: ${plistPath}`);
  }
}

/**
 * Linux implementation using systemd user services
 */
function installLinuxAutostart() {
  const nodePath = process.execPath;
  const scriptPath = path.join(appRoot, 'src/index.js');
  const systemdUserDir = path.join(os.homedir(), '.config', 'systemd', 'user');
  const serviceFilePath = path.join(systemdUserDir, `${appName}.service`);
  
  // Create systemd user directory if it doesn't exist
  if (!fs.existsSync(systemdUserDir)) {
    fs.mkdirSync(systemdUserDir, { recursive: true });
  }
  
  const serviceContent = `[Unit]
Description=${appName} service
After=network.target

[Service]
ExecStart=${nodePath} --no-deprecation ${scriptPath}
WorkingDirectory=${appRoot}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
`;

  fs.writeFileSync(serviceFilePath, serviceContent);
  
  // Enable and start the service
  try {
    execSync(`systemctl --user daemon-reload`);
    execSync(`systemctl --user enable ${appName}.service`);
    execSync(`systemctl --user start ${appName}.service`);
  } catch (error) {
    console.warn(`Warning: Could not enable systemd service: ${error.message}`);
    
    // Fallback to desktop autostart file if systemd fails
    const autostartDir = path.join(os.homedir(), '.config', 'autostart');
    if (!fs.existsSync(autostartDir)) {
      fs.mkdirSync(autostartDir, { recursive: true });
    }
    
    const desktopFilePath = path.join(autostartDir, `${appName}.desktop`);
    const desktopContent = `[Desktop Entry]
Type=Application
Name=${appName}
Exec=${nodePath} --no-deprecation ${scriptPath}
Path=${appRoot}
Terminal=false
X-GNOME-Autostart-enabled=true
`;
    
    fs.writeFileSync(desktopFilePath, desktopContent);
    console.log(`Created desktop autostart file at: ${desktopFilePath}`);
  }
  
  console.log(`Created systemd user service at: ${serviceFilePath}`);
}

function removeLinuxAutostart() {
  const systemdUserDir = path.join(os.homedir(), '.config', 'systemd', 'user');
  const serviceFilePath = path.join(systemdUserDir, `${appName}.service`);
  
  if (fs.existsSync(serviceFilePath)) {
    try {
      execSync(`systemctl --user stop ${appName}.service`);
      execSync(`systemctl --user disable ${appName}.service`);
    } catch (error) {
      console.warn(`Warning: Could not disable systemd service: ${error.message}`);
    }
    
    fs.unlinkSync(serviceFilePath);
    try {
      execSync(`systemctl --user daemon-reload`);
    } catch (error) {
      console.warn(`Warning: Could not reload systemd: ${error.message}`);
    }
    
    console.log(`Removed systemd user service: ${serviceFilePath}`);
  }
  
  // Also check for desktop autostart file
  const autostartDir = path.join(os.homedir(), '.config', 'autostart');
  const desktopFilePath = path.join(autostartDir, `${appName}.desktop`);
  
  if (fs.existsSync(desktopFilePath)) {
    fs.unlinkSync(desktopFilePath);
    console.log(`Removed desktop autostart file: ${desktopFilePath}`);
  }
}

module.exports = {
  installAutostart,
  removeAutostart
}; 