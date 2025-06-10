const express = require('express');
const router = express.Router();
const os = require('os');
const { getStatus } = require('../controllers/statusController');
const { installAutostart, removeAutostart } = require('../setup/autostart');

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Get server and printer status
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Server and printer status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 server:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: online
 *                     uptime:
 *                       type: number
 *                       example: 1234.56
 *                     version:
 *                       type: string
 *                       example: 1.0.0
 *                 printer:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                       example: true
 *                     default:
 *                       type: object
 *                       properties:
 *                         vendorId:
 *                           type: integer
 *                           example: 1234
 *                         productId:
 *                           type: integer
 *                           example: 5678
 *                     status:
 *                       type: string
 *                       example: ready
 *       500:
 *         description: Server error
 */
router.get('/', getStatus);

/**
 * @swagger
 * /api/status/autostart:
 *   get:
 *     summary: Get autostart status
 *     tags: [Status]
 *     description: Returns information about autostart configuration
 *     responses:
 *       200:
 *         description: Autostart status information
 */
router.get('/autostart', (req, res) => {
  const platform = os.platform();
  let isSupported = true;
  
  if (platform !== 'win32' && platform !== 'darwin' && platform !== 'linux') {
    isSupported = false;
  }
  
  res.json({
    success: true,
    data: {
      platform,
      isSupported
    }
  });
});

/**
 * @swagger
 * /api/status/autostart:
 *   post:
 *     summary: Enable autostart
 *     tags: [Status]
 *     description: Configure the application to start automatically at system startup
 *     responses:
 *       200:
 *         description: Autostart configuration result
 */
router.post('/autostart', (req, res) => {
  try {
    const result = installAutostart();
    res.json({
      success: result,
      message: result ? 'Autostart enabled successfully' : 'Failed to enable autostart'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to enable autostart',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/status/autostart:
 *   delete:
 *     summary: Disable autostart
 *     tags: [Status]
 *     description: Remove autostart configuration
 *     responses:
 *       200:
 *         description: Autostart configuration removal result
 */
router.delete('/autostart', (req, res) => {
  try {
    const result = removeAutostart();
    res.json({
      success: result,
      message: result ? 'Autostart disabled successfully' : 'Failed to disable autostart'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to disable autostart',
      error: error.message
    });
  }
});

module.exports = router; 