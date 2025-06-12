const express = require('express');
const router = express.Router();
const { printText, printBarcode, printBatch } = require('../controllers/printController');
const { getQueue, getLogs, clearQueue, removeJob } = require('../controllers/queueController');

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
 *         description: Text successfully queued for printing
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
 *                   example: Text print job added to queue
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                       example: "lx7ab3c"
 *                     status:
 *                       type: string
 *                       example: "pending"
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
 *         description: Barcode successfully queued for printing
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
 *                   example: Barcode print job added to queue
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                       example: "lx7ab3c"
 *                     status:
 *                       type: string
 *                       example: "pending"
 *       500:
 *         description: Server error
 */
router.post('/barcode', printBarcode);

/**
 * @swagger
 * /api/print/batch:
 *   post:
 *     summary: Print multiple items in a batch
 *     tags: [Print]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 description: Array of print items
 *                 items:
 *                   oneOf:
 *                     - type: object
 *                       required:
 *                         - type
 *                         - content
 *                       properties:
 *                         type:
 *                           type: string
 *                           enum: [text]
 *                           description: Type of print item
 *                         content:
 *                           type: string
 *                           description: Text content to print
 *                         quantity:
 *                           type: integer
 *                           description: Number of times to print this item
 *                           default: 1
 *                           minimum: 1
 *                     - type: object
 *                       required:
 *                         - type
 *                         - code
 *                       properties:
 *                         type:
 *                           type: string
 *                           enum: [barcode]
 *                           description: Type of print item
 *                         code:
 *                           type: string
 *                           description: Barcode content
 *                         barcodeType:
 *                           type: string
 *                           enum: [EAN13, EAN8, UPC-A, UPC-E, CODE39, ITF, NW7]
 *                           default: EAN13
 *                         width:
 *                           type: integer
 *                           default: 2
 *                         height:
 *                           type: integer
 *                           default: 100
 *                         position:
 *                           type: string
 *                           enum: [BLW, ABV, BTH, OFF]
 *                           default: BLW
 *                         font:
 *                           type: string
 *                           enum: [A, B]
 *                           default: A
 *                         quantity:
 *                           type: integer
 *                           description: Number of times to print this item
 *                           default: 1
 *                           minimum: 1
 *     responses:
 *       200:
 *         description: Batch job successfully queued for printing
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
 *                   example: Batch print job added to queue
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                       example: "lx7ab3c"
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     itemCount:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Server error
 */
router.post('/batch', printBatch);

/**
 * @swagger
 * /api/print/queue:
 *   get:
 *     summary: Get the current print queue
 *     tags: [Print]
 *     responses:
 *       200:
 *         description: List of print jobs in the queue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     queue:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 */
router.get('/queue', (req, res) => {
  try {
    const queue = getQueue();
    res.json({
      success: true,
      data: {
        queue
      }
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get print queue',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/print/logs:
 *   get:
 *     summary: Get print job logs
 *     tags: [Print]
 *     responses:
 *       200:
 *         description: List of print job logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           jobId:
 *                             type: string
 *                           type:
 *                             type: string
 *                           message:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 */
router.get('/logs', (req, res) => {
  try {
    const logs = getLogs();
    res.json({
      success: true,
      data: {
        logs
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get print logs',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/print/queue/clear:
 *   delete:
 *     summary: Clear the print queue
 *     tags: [Print]
 *     responses:
 *       200:
 *         description: Queue cleared successfully
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
 *                   example: Queue cleared successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     removedCount:
 *                       type: integer
 *                       example: 3
 */
router.delete('/queue/clear', (req, res) => {
  try {
    const removedCount = clearQueue();
    res.json({
      success: true,
      message: 'Queue cleared successfully',
      data: {
        removedCount
      }
    });
  } catch (error) {
    console.error('Clear queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear print queue',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/print/queue/{jobId}:
 *   delete:
 *     summary: Remove a specific job from the queue
 *     tags: [Print]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the job to remove
 *     responses:
 *       200:
 *         description: Job removed successfully
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
 *                   example: Job removed from queue
 *       404:
 *         description: Job not found
 */
router.delete('/queue/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const removed = removeJob(jobId);
    
    if (removed) {
      res.json({
        success: true,
        message: 'Job removed from queue'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Job not found in queue'
      });
    }
  } catch (error) {
    console.error('Remove job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove job from queue',
      error: error.message
    });
  }
});

module.exports = router; 