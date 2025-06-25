const escpos = require('escpos');
escpos.USB = require('escpos-usb');

const { getDefaultPrinter } = require('./deviceController');

// In-memory queue for print jobs
let printQueue = [];
let printLogs = [];
let isProcessing = false;
const MAX_LOGS = 100;

// Generate unique ID for print jobs
const generateJobId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Add a job to the print queue
const addToQueue = (jobData) => {
  const job = {
    id: generateJobId(),
    status: 'pending',
    createdAt: new Date(),
    ...jobData
  };
  
  printQueue.push(job);
  
  // Add to logs
  addToLogs({
    jobId: job.id,
    type: 'queued',
    message: `Job added to queue: ${job.type}`,
    timestamp: new Date()
  });
  
  // Start processing if not already
  if (!isProcessing) {
    processQueue();
  }
  
  return job;
};

// Process the next job in the queue
const processQueue = async () => {
  if (printQueue.length === 0 || isProcessing) {
    return;
  }
  
  isProcessing = true;
  const job = printQueue[0];
  
  try {
    job.status = 'processing';
    addToLogs({
      jobId: job.id,
      type: 'processing',
      message: `Processing job: ${job.type}`,
      timestamp: new Date()
    });
    
    const defaultPrinter = getDefaultPrinter();
    if (!defaultPrinter) {
      throw new Error('No printer selected');
    }
    
    const device = new escpos.USB(defaultPrinter.vendorId, defaultPrinter.productId);
    const printer = new escpos.Printer(device);
    
    await new Promise((resolve, reject) => {
      device.open((err) => {
        if (err) {
          reject(new Error(`Failed to open printer: ${err.message}`));
          return;
        }

        try {
          printer.font('a').align('ct');
          
          if (job.type === 'text') {
            printer.text(job.content);
          } else if (job.type === 'barcode') {
            printer.barcode(job.code, job.barcodeType, {
              width: job.width,
              height: job.height,
              position: job.position,
              font: job.font
            });
            
            printer.text('\n\n');
          } else if (job.type === 'batch') {
            // Handle batch job
            job.items.forEach(item => {
              // Get quantity (default to 1 if not specified)
              const quantity = item.quantity || 1;
              
              // Print each item according to its quantity
              for (let i = 0; i < quantity; i++) {
                if (item.type === 'text') {
                  printer.text(item.content);
                } else if (item.type === 'barcode') {
                  printer.barcode(item.code, item.barcodeType, {
                    width: item.width,
                    height: item.height,
                    position: item.position,
                    font: item.font,
                  });

                  printer.text('\n\n');
                }
              }
            });
          }
          
          // printer.cut().close();
          printer.close()
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
    
    // Job completed successfully
    job.status = 'completed';
    job.completedAt = new Date();
    addToLogs({
      jobId: job.id,
      type: 'completed',
      message: `Job completed: ${job.type}`,
      timestamp: new Date()
    });
  } catch (error) {
    // Job failed
    job.status = 'failed';
    job.error = error.message;
    addToLogs({
      jobId: job.id,
      type: 'failed',
      message: `Job failed: ${error.message}`,
      timestamp: new Date(),
      error: error.message
    });
  } finally {
    // Remove job from queue regardless of success/failure
    printQueue.shift();
    isProcessing = false;
    
    // Continue processing if there are more jobs
    if (printQueue.length > 0) {
      processQueue();
    }
  }
};

// Add to logs with limited size
const addToLogs = (logEntry) => {
  printLogs.unshift(logEntry);
  
  // Keep logs at maximum size
  if (printLogs.length > MAX_LOGS) {
    printLogs = printLogs.slice(0, MAX_LOGS);
  }
};

// Get the current queue
const getQueue = () => {
  return [...printQueue];
};

// Get print logs
const getLogs = () => {
  return [...printLogs];
};

// Clear the queue
const clearQueue = () => {
  const jobCount = printQueue.length;
  printQueue = [];
  addToLogs({
    type: 'system',
    message: `Queue cleared (${jobCount} jobs removed)`,
    timestamp: new Date()
  });
  return jobCount;
};

// Remove a specific job from the queue by id
const removeJob = (jobId) => {
  const initialLength = printQueue.length;
  printQueue = printQueue.filter(job => job.id !== jobId);
  
  const removed = initialLength > printQueue.length;
  
  if (removed) {
    addToLogs({
      jobId: jobId,
      type: 'removed',
      message: `Job ${jobId} removed from queue`,
      timestamp: new Date()
    });
  }
  
  return removed;
};

module.exports = {
  addToQueue,
  getQueue,
  getLogs,
  clearQueue,
  removeJob
}; 