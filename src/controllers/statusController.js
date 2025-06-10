const escpos = require('escpos');
const USB = require('escpos-usb');
const { getDefaultPrinter } = require('./deviceController');
const os = require('os');

/**
 * Get server and printer status
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getStatus = (req, res) => {
  try {
    // Get default printer
    const defaultPrinter = getDefaultPrinter();
    
    // Check if printer is connected
    let printerConnected = false;
    let printerInfo = null;
    
    if (defaultPrinter) {
      try {
        // Get all USB devices
        const devices = USB.findPrinter();
        
        if (devices && Array.isArray(devices)) {
          const connectedPrinter = devices.find(device => 
            device.deviceDescriptor.idVendor === defaultPrinter.vendorId && 
            device.deviceDescriptor.idProduct === defaultPrinter.productId
          );
          
          printerConnected = !!connectedPrinter;
          
          if (printerConnected) {
            printerInfo = {
              vendorId: connectedPrinter.deviceDescriptor.idVendor,
              productId: connectedPrinter.deviceDescriptor.idProduct,
              manufacturer: connectedPrinter.deviceDescriptor.iManufacturer,
              product: connectedPrinter.deviceDescriptor.iProduct
            };
          }
        }
      } catch (printerError) {
        console.error('Error checking printer status:', printerError);
      }
    }
    
    // Get server information
    const serverInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      memoryUsage: {
        total: os.totalmem(),
        free: os.freemem()
      }
    };
    
    return res.json({
      success: true,
      data: {
        server: {
          status: 'online',
          info: serverInfo
        },
        printer: {
          connected: printerConnected,
          default: defaultPrinter,
          info: printerInfo
        }
      }
    });
  } catch (error) {
    console.error('Get status error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get status', 
      error: error.message,
      data: {
        server: {
          status: 'online',
          error: error.message
        },
        printer: {
          connected: false,
          error: error.message
        }
      }
    });
  }
};

module.exports = {
  getStatus
}; 