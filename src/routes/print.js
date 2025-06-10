const express = require('express');
const router = express.Router();
const { printText, printBarcode } = require('../controllers/printController');

/**
 * @swagger
 * /api/print/text:
 *   post:
 *     summary: Print text to the default printer
 *     tags: [Print]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text content to print
 *     responses:
 *       200:
 *         description: Text successfully printed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Text printed successfully
 *       500:
 *         description: Server error
 */
router.post('/text', printText);

/**
 * @swagger
 * /api/print/barcode:
 *   post:
 *     summary: Print barcode to the default printer
 *     tags: [Print]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Barcode content (e.g., '1234567890128')
 *               type:
 *                 type: string
 *                 description: Barcode type
 *                 enum: [EAN13, EAN8, UPC-A, UPC-E, CODE39, ITF, NW7]
 *                 default: EAN13
 *               width:
 *                 type: integer
 *                 description: Barcode width
 *                 default: 2
 *               height:
 *                 type: integer
 *                 description: Barcode height
 *                 default: 100
 *               position:
 *                 type: string
 *                 description: Text position (BLW, ABV, BTH, OFF)
 *                 default: BLW
 *               font:
 *                 type: string
 *                 description: Font for the barcode text (A or B)
 *                 default: A
 *     responses:
 *       200:
 *         description: Barcode successfully printed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Barcode printed successfully
 *       500:
 *         description: Server error
 */
router.post('/barcode', printBarcode);

module.exports = router; 