const escpos = require('escpos');
escpos.USB = require('escpos-usb'); // penting: daftarkan USB sebagai adaptor

const { getDefaultPrinter } = require('./deviceController');
const { addToQueue } = require('./queueController');

/**
 * Print text to the selected printer
 * @param {Object} req - Request object with text content
 * @param {Object} res - Response object
 */
const printText = async (req, res) => {
  try {
    const { text, options = {} } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const job = addToQueue({
      type: 'text',
      content: text,
      options
    });

    return res.json({ 
      success: true, 
      message: 'Text print job added to queue',
      data: {
        jobId: job.id,
        status: job.status
      }
    });

  } catch (error) {
    console.error('Print text error:', error);
    return res.status(500).json({ success: false, message: 'Failed to queue text print job', error: error.message });
  }
};

/**
 * Print barcode to the selected printer
 * @param {Object} req - Request object with barcode content and type
 * @param {Object} res - Response object
 */
const printBarcode = async (req, res) => {
  try {
    const {
      code,
      type = 'EAN13',
      width = 2,
      height = 100,
      position = 'BLW',
      font = 'A'
    } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Barcode code is required' });
    }

    const job = addToQueue({
      type: 'barcode',
      code,
      barcodeType: type,
      width,
      height,
      position,
      font
    });

    return res.json({ 
      success: true, 
      message: 'Barcode print job added to queue',
      data: {
        jobId: job.id,
        status: job.status
      }
    });

  } catch (error) {
    console.error('Print barcode error:', error);
    return res.status(500).json({ success: false, message: 'Failed to queue barcode print job', error: error.message });
  }
};

/**
 * Print multiple items in a batch
 * @param {Object} req - Request object with array of print items
 * @param {Object} res - Response object
 */
const printBatch = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array is required and must not be empty' });
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (!item.type) {
        return res.status(400).json({ 
          success: false, 
          message: `Item at index ${i} is missing 'type' field` 
        });
      }
      
      if (item.type === 'text' && !item.content) {
        return res.status(400).json({ 
          success: false, 
          message: `Text item at index ${i} is missing 'content' field` 
        });
      }
      
      if (item.type === 'barcode' && !item.code) {
        return res.status(400).json({ 
          success: false, 
          message: `Barcode item at index ${i} is missing 'code' field` 
        });
      }
      
      // Validate quantity if present
      if (item.quantity !== undefined) {
        const quantity = parseInt(item.quantity);
        if (isNaN(quantity) || quantity < 1) {
          return res.status(400).json({
            success: false,
            message: `Item at index ${i} has invalid 'quantity' value. Must be a positive integer.`
          });
        }
        
        // Ensure quantity is an integer
        item.quantity = quantity;
      } else {
        // Set default quantity if not specified
        item.quantity = 1;
      }
    }

    const job = addToQueue({
      type: 'batch',
      items
    });

    return res.json({ 
      success: true, 
      message: 'Batch print job added to queue',
      data: {
        jobId: job.id,
        status: job.status,
        itemCount: items.length
      }
    });

  } catch (error) {
    console.error('Print batch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to queue batch print job', error: error.message });
  }
};

module.exports = {
  printText,
  printBarcode,
  printBatch
};
