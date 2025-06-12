# Barcode Print Agent

A local backend service built with Express.js for printing text and barcodes using ESC/POS thermal printers.

## Features

- Print text to thermal printers
- Print barcodes with customizable options
- Batch printing for multiple items in a single job
- Print queue management system
- Print job logs and history
- Select and manage printer devices
- Simple web UI for interacting with the service
- Real-time server and printer status monitoring
- Mock mode for testing without actual printer hardware

## Requirements

- Node.js 14 or higher
- USB thermal printer compatible with ESC/POS commands (optional when using mock mode)

### System Requirements

#### Linux
- `libudev` to build libusb
- On Ubuntu/Debian: `sudo apt-get install build-essential libudev-dev`

#### Windows
- Use [Zadig](https://zadig.akeo.ie/) to install the WinUSB driver for your USB device

#### macOS
- No additional requirements

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/print-agent.git
   cd print-agent
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

   To run without deprecation warnings:
   ```
   npm run start:no-warnings
   ```

4. Access the web interface at:
   ```
   http://localhost:3310
   ```

## Mock Mode

The application includes a mock mode for testing without actual printer hardware. This is useful for development and testing environments.

Mock mode features:
- Simulates printer operations without actual hardware
- Displays mock printer output in console logs
- Returns mock printer response in API calls
- Uses mock device data when no printers are detected

To enable mock mode, edit `src/controllers/printController.js` and set:
```javascript
const MOCK_MODE = true; // Set to false to use real hardware
```

When using mock mode, the system will:
1. Display simulated printer commands in the console
2. Return success responses for all print operations
3. Include mock output data in API responses

## API Endpoints

The API is documented using Swagger UI. You can access the documentation at:
```
http://localhost:3310/api-docs
```

### Print Operations

- **POST /api/print/text** - Add text print job to queue
  ```json
  {
    "text": "Text to print"
  }
  ```

- **POST /api/print/barcode** - Add barcode print job to queue
  ```json
  {
    "code": "1234567890128",
    "type": "EAN13",
    "width": 2,
    "height": 100,
    "position": "BLW",
    "font": "A"
  }
  ```

- **POST /api/print/batch** - Add batch print job to queue
  ```json
  {
    "items": [
      {
        "type": "text",
        "content": "Header text",
        "quantity": 1
      },
      {
        "type": "barcode",
        "code": "1234567890128",
        "barcodeType": "EAN13",
        "width": 2,
        "height": 100,
        "position": "BLW",
        "font": "A",
        "quantity": 2
      },
      {
        "type": "text",
        "content": "Footer text",
        "quantity": 1
      }
    ]
  }
  ```

### Queue Management

- **GET /api/print/queue** - Get current print queue
- **DELETE /api/print/queue/clear** - Clear the print queue
- **DELETE /api/print/queue/:jobId** - Remove a specific job from the queue
- **GET /api/print/logs** - Get print job logs history

### Device Management

- **GET /api/device** - Get list of available USB printers
- **POST /api/device/default** - Set default printer
  ```json
  {
    "vendorId": 1234,
    "productId": 5678
  }
  ```

### Status

- **GET /api/status** - Get server and printer status

## Supported Barcode Types

- EAN13
- EAN8
- UPC-A
- UPC-E
- CODE39
- ITF
- NW7

## Autostart Setup

The Print Agent can be configured to start automatically when you log into your computer. This feature is supported on Windows, macOS, and Linux.

### Installing Autostart Service

To configure the application to start automatically:

```bash
# Using npm script
npm run autostart:install

# Or directly
node src/setup/cli.js install
```

### Removing Autostart Service

To remove the autostart configuration:

```bash
# Using npm script
npm run autostart:uninstall

# Or directly
node src/setup/cli.js uninstall
```

### How It Works

The autostart feature uses platform-specific methods:

- **Windows**: Creates a batch file in the user's Startup folder
- **macOS**: Creates and loads a LaunchAgent to start the application at login
- **Linux**: Uses systemd user services with a fallback to desktop autostart files

You can also manage autostart through the web interface by navigating to the Status page.

## Using the Queue System

The print agent includes a robust queue system for managing print jobs. This provides several benefits:

1. **Job Persistence**: Print jobs are added to a queue and processed one at a time
2. **Failure Handling**: If a print job fails, subsequent jobs will still be processed
3. **Job Management**: Jobs can be removed from the queue before processing
4. **Logging**: All print operations are logged with timestamps and status

### Queue Dashboard

The web interface includes a queue dashboard that shows:

- Current jobs in the queue with status (pending, processing, completed, failed)
- History of print operations with timestamps
- Controls to manage the queue (remove jobs, clear queue)

### Batch Printing

The batch printing feature allows you to send multiple print items in a single job:

1. Use the "Batch" tab in the print controls
2. Add text and barcode items to the batch using the provided buttons
3. Configure each item's properties in the modal dialog
4. Set the quantity for each item (defaults to 1 if not specified)
5. Submit the batch job with the "Print Batch" button

This is useful for printing receipts or labels that contain a combination of text and barcodes. The quantity feature allows you to print multiple copies of a specific item within the batch without having to add the same item multiple times.

## Troubleshooting

### USB Detection Issues

If you're having issues with USB device detection:

1. Make sure your printer is connected and powered on
2. Check system permissions for USB access
3. On Linux, ensure your user has access to USB devices:
   ```
   sudo usermod -a -G lp $USER
   ```
4. On Windows, make sure you've installed the correct driver using Zadig
5. Try enabling mock mode if you need to test without actual hardware

### Error: usb.on is not a function

This error occurs due to compatibility issues between escpos-usb and the node-usb module. The code in this repository has been updated to handle this issue, but if you encounter it:

1. Make sure you're using the compatible version of escpos-usb (0.0.1-alpha.0)
2. Check that the printer is properly connected
3. Restart the application
4. Enable mock mode if you need to continue testing without resolving USB issues

### Error: Cannot read properties of null (reading 'getDeviceList')

This error occurs when the USB subsystem cannot be initialized properly. Solutions:

1. Enable mock mode for testing without hardware
2. Make sure you have the necessary USB drivers installed
3. Try running the application with elevated privileges (as administrator/sudo)
4. Check that you have the correct version of node-usb installed

## License

MIT

## Acknowledgements

This project uses [escpos](https://www.npmjs.com/package/escpos) for printer communication. 