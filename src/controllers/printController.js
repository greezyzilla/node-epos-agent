const escpos = require('escpos');
escpos.USB = require('escpos-usb'); // penting: daftarkan USB sebagai adaptor

const { getDefaultPrinter } = require('./deviceController');

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

    const defaultPrinter = getDefaultPrinter();
    if (!defaultPrinter) {
      return res.status(400).json({ success: false, message: 'No printer selected' });
    }

    const device = new escpos.USB(defaultPrinter.vendorId, defaultPrinter.productId);
    const printer = new escpos.Printer(device);

    device.open(async (err) => {
      if (err) {
        console.error('Error opening device:', err);
        return res.status(500).json({ success: false, message: 'Failed to open printer', error: err.message });
      }

      try {
        printer
          .font('a')
          .align('ct')
          .text(text)
          .cut()
          .close();

        return res.json({ success: true, message: 'Text printed successfully' });
      } catch (error) {
        console.error('Printing error:', error);
        return res.status(500).json({ success: false, message: 'Failed to print text', error: error.message });
      }
    });

  } catch (error) {
    console.error('Print text error:', error);
    return res.status(500).json({ success: false, message: 'Failed to print text', error: error.message });
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

    const defaultPrinter = getDefaultPrinter();
    if (!defaultPrinter) {
      return res.status(400).json({ success: false, message: 'No printer selected' });
    }

    const device = new escpos.USB(defaultPrinter.vendorId, defaultPrinter.productId);
    const printer = new escpos.Printer(device);

    device.open((err) => {
      if (err) {
        console.error('Error opening device:', err);
        return res.status(500).json({ success: false, message: 'Failed to open printer', error: err.message });
      }

      try {
        printer
          .font(font.toLowerCase())
          .align('ct')
          .barcode(code, type, {
            width,
            height,
            position,
            font
          })
          .cut()
          .close();

        return res.json({ success: true, message: 'Barcode printed successfully' });
      } catch (error) {
        console.error('Printing error:', error);
        return res.status(500).json({ success: false, message: 'Failed to print barcode', error: error.message });
      }
    });

  } catch (error) {
    console.error('Print barcode error:', error);
    return res.status(500).json({ success: false, message: 'Failed to print barcode', error: error.message });
  }
};

module.exports = {
  printText,
  printBarcode
};
