const express = require('express');
const router = express.Router();
const { getDevices, setDefaultDevice } = require('../controllers/deviceController');

/**
 * @swagger
 * /api/device:
 *   get:
 *     summary: Get list of available USB printers
 *     tags: [Device]
 *     responses:
 *       200:
 *         description: List of available printers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 devices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       vendorId:
 *                         type: integer
 *                         example: 1234
 *                       productId:
 *                         type: integer
 *                         example: 5678
 *                       manufacturer:
 *                         type: string
 *                         example: EPSON
 *                       product:
 *                         type: string
 *                         example: TM-T20II
 *                 defaultDevice:
 *                   type: object
 *                   properties:
 *                     vendorId:
 *                       type: integer
 *                       example: 1234
 *                     productId:
 *                       type: integer
 *                       example: 5678
 *       500:
 *         description: Server error
 */
router.get('/', getDevices);

/**
 * @swagger
 * /api/device/default:
 *   post:
 *     summary: Set default printer
 *     tags: [Device]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *               - productId
 *             properties:
 *               vendorId:
 *                 type: integer
 *                 description: USB vendor ID of the printer
 *               productId:
 *                 type: integer
 *                 description: USB product ID of the printer
 *     responses:
 *       200:
 *         description: Default printer set successfully
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
 *                   example: Default printer set successfully
 *                 device:
 *                   type: object
 *                   properties:
 *                     vendorId:
 *                       type: integer
 *                       example: 1234
 *                     productId:
 *                       type: integer
 *                       example: 5678
 *       500:
 *         description: Server error
 */
router.post('/default', setDefaultDevice);

module.exports = router; 