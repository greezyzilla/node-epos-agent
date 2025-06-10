const escpos = require('escpos');
const USB = require('escpos-usb');
const fs = require('fs');
const path = require('path');

// Store default printer in memory
let defaultPrinter = null;

// Path to store printer configuration
const configPath = path.join(__dirname, '../../config.json');

// Load saved printer configuration
const loadConfig = () => {
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.defaultPrinter) {
        defaultPrinter = config.defaultPrinter;
      }
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
};

// Save printer configuration
const saveConfig = () => {
  try {
    const config = {
      defaultPrinter
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save config:', error);
  }
};

// Initialize by loading config
loadConfig();

/**
 * Get all available USB devices
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getDevices = (req, res) => {
  try {
    // Get all USB devices
    let devices = [];
    
    try {
      devices = USB.findPrinter();
    } catch (findError) {
      console.error('Error finding printers:', findError);
      devices = [];
    }
    
    // Format device information
    const formattedDevices = Array.isArray(devices) ? devices.map(device => {
      const deviceInfo = {
        vendorId: device.deviceDescriptor.idVendor,
        productId: device.deviceDescriptor.idProduct,
        manufacturer: device.deviceDescriptor.iManufacturer,
        product: device.deviceDescriptor.iProduct,
        serialNumber: device.deviceDescriptor.iSerialNumber
      };
      
      deviceInfo.isDefault = defaultPrinter && 
                defaultPrinter.vendorId === deviceInfo.vendorId && 
                defaultPrinter.productId === deviceInfo.productId;
      
      return deviceInfo;
    }) : [];
    
    return res.json({
      success: true,
      data: {
        devices: formattedDevices,
        defaultPrinter
      }
    });
  } catch (error) {
    console.error('Get devices error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get devices', error: error.message });
  }
};

/**
 * Set default printer device
 * @param {Object} req - Request object with device information
 * @param {Object} res - Response object
 */
const setDefaultDevice = (req, res) => {
  try {
    const { vendorId, productId } = req.body;
    
    if (!vendorId || !productId) {
      return res.status(400).json({ success: false, message: 'Vendor ID and Product ID are required' });
    }
    
    // Set default printer
    defaultPrinter = {
      vendorId,
      productId
    };
    
    // Save configuration
    saveConfig();
    
    return res.json({
      success: true,
      message: 'Default printer set successfully',
      data: { defaultPrinter }
    });
  } catch (error) {
    console.error('Set default device error:', error);
    return res.status(500).json({ success: false, message: 'Failed to set default device', error: error.message });
  }
};

/**
 * Get default printer (for internal use)
 * @returns {Object|null} Default printer object or null
 */
const getDefaultPrinter = () => {
  return defaultPrinter;
};

module.exports = {
  getDevices,
  setDefaultDevice,
  getDefaultPrinter
}; 