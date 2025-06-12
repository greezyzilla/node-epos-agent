document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - System Status
  const serverStatusIndicator = document.getElementById('server-status-indicator');
  const serverStatus = document.getElementById('server-status');
  const serverInfo = document.getElementById('server-info');
  const printerStatusIndicator = document.getElementById('printer-status-indicator');
  const printerStatus = document.getElementById('printer-status');
  const printerInfo = document.getElementById('printer-info');
  const serverPid = document.getElementById('server-pid');
  const terminateBtn = document.getElementById('terminate-btn');
  
  // DOM Elements - Printer Selection
  const printerSelect = document.getElementById('printer-select');
  const refreshDevicesBtn = document.getElementById('refresh-devices-btn');
  const setDefaultPrinterBtn = document.getElementById('set-default-printer-btn');
  
  // DOM Elements - Print Controls
  const textInput = document.getElementById('text-input');
  const printTextBtn = document.getElementById('print-text-btn');
  const barcodeInput = document.getElementById('barcode-input');
  const barcodeType = document.getElementById('barcode-type');
  const barcodeWidth = document.getElementById('barcode-width');
  const barcodeHeight = document.getElementById('barcode-height');
  const barcodePosition = document.getElementById('barcode-position');
  const printBarcodeBtn = document.getElementById('print-barcode-btn');
  
  // DOM Elements - Batch Print
  const batchItemsContainer = document.getElementById('batch-items-container');
  const addTextItemBtn = document.getElementById('add-text-item-btn');
  const addBarcodeItemBtn = document.getElementById('add-barcode-item-btn');
  const printBatchBtn = document.getElementById('print-batch-btn');
  const batchItemModal = document.getElementById('batch-item-modal');
  const batchItemModalTitle = document.getElementById('batch-item-modal-title');
  const batchItemModalBody = document.getElementById('batch-item-modal-body');
  const addToBatchBtn = document.getElementById('add-to-batch-btn');
  
  // DOM Elements - Queue & Logs
  const queueContainer = document.getElementById('queue-container');
  const logsContainer = document.getElementById('logs-container');
  const clearQueueBtn = document.getElementById('clear-queue-btn');
  
  // DOM Elements - Notifications
  const toastMessage = document.getElementById('toast-message');
  const toastTitle = document.getElementById('toast-title');
  const toastBody = document.getElementById('toast-body');

  // Bootstrap Toast instance
  const toast = new bootstrap.Toast(toastMessage);
  
  // Bootstrap Modal instance
  const batchModal = new bootstrap.Modal(batchItemModal);
  
  // Batch items array
  let batchItems = [];
  let currentBatchItemType = null;

  // Store the termination key
  let terminationKey = null;

  // Initialize the application
  initialize();

  // Event Listeners - Printer Selection
  refreshDevicesBtn.addEventListener('click', loadDevices);
  setDefaultPrinterBtn.addEventListener('click', setDefaultPrinter);
  
  // Event Listeners - Print Controls
  printTextBtn.addEventListener('click', printText);
  printBarcodeBtn.addEventListener('click', printBarcode);
  addTextItemBtn.addEventListener('click', () => showBatchItemModal('text'));
  addBarcodeItemBtn.addEventListener('click', () => showBatchItemModal('barcode'));
  addToBatchBtn.addEventListener('click', addItemToBatch);
  printBatchBtn.addEventListener('click', printBatch);
  
  // Event Listeners - Queue & Logs
  clearQueueBtn.addEventListener('click', clearQueue);
  
  // Event Listeners - System
  terminateBtn.addEventListener('click', terminateApplication);
  
  // Auto-refresh timers
  let queueRefreshTimer = null;
  let logsRefreshTimer = null;

  // Functions
  async function initialize() {
    // Check server and printer status
    await checkStatus();
    
    // Load available devices
    await loadDevices();
    
    // Load queue and logs
    await loadQueue();
    await loadLogs();
    
    // Set up auto refresh (every 30 seconds)
    setInterval(checkStatus, 33100);
    
    // Refresh queue and logs more frequently
    queueRefreshTimer = setInterval(loadQueue, 5000);
    logsRefreshTimer = setInterval(loadLogs, 7000);
  }

  async function checkStatus() {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      
      if (data.success) {
        // Update server status
        if (data.data.server.status === 'online') {
          serverStatusIndicator.classList.remove('status-offline');
          serverStatusIndicator.classList.add('status-online');
          serverStatus.textContent = 'Online';
          
          // Format server info
          const info = data.data.server.info;
          serverInfo.textContent = `${info.hostname} (${info.platform}/${info.arch})`;
          serverPid.textContent = `PID: ${info.pid}`;
          
          // Store termination key
          terminationKey = data.data.server.terminationKey;
          
          // Enable terminate button
          terminateBtn.disabled = false;
          
          // Update printer status
          if (data.data.printer.connected) {
            printerStatusIndicator.classList.remove('status-offline');
            printerStatusIndicator.classList.add('status-online');
            printerStatus.textContent = 'Connected';
            
            // Format printer info
            const info = data.data.printer.info;
            if (info) {
              printerInfo.textContent = `ID: ${info.vendorId}:${info.productId}`;
            } else {
              printerInfo.textContent = 'Default printer set but not connected';
            }
          } else {
            printerStatusIndicator.classList.remove('status-online');
            printerStatusIndicator.classList.add('status-offline');
            printerStatus.textContent = 'Not Connected';
            
            if (data.data.printer.default) {
              printerInfo.textContent = 'Default printer not connected';
            } else {
              printerInfo.textContent = 'No default printer selected';
            }
          }
        } else {
          serverStatusIndicator.classList.remove('status-online');
          serverStatusIndicator.classList.add('status-offline');
          serverStatus.textContent = 'Offline';
          serverInfo.textContent = 'No information available';
          serverPid.textContent = '';
          terminateBtn.disabled = true;
          
          // Update printer status
          printerStatusIndicator.classList.remove('status-online');
          printerStatusIndicator.classList.add('status-offline');
          printerStatus.textContent = 'Not Connected';
          printerInfo.textContent = 'Cannot check printer status';
        }
      } else {
        showToast('Status Error', data.message || 'Failed to get status', 'error');
      }
    } catch (error) {
      console.error('Status check error:', error);
      showToast('Status Error', 'Failed to connect to server', 'error');
      
      // Update UI to show offline status
      serverStatusIndicator.classList.remove('status-online');
      serverStatusIndicator.classList.add('status-offline');
      serverStatus.textContent = 'Offline';
      serverInfo.textContent = 'Cannot connect to server';
      serverPid.textContent = '';
      terminateBtn.disabled = true;
      
      printerStatusIndicator.classList.remove('status-online');
      printerStatusIndicator.classList.add('status-offline');
      printerStatus.textContent = 'Not Connected';
      printerInfo.textContent = 'Cannot check printer status';
    }
  }

  async function loadDevices() {
    try {
      // Clear device select
      printerSelect.innerHTML = '<option value="">Select a printer</option>';
      
      const response = await fetch('/api/device');
      const data = await response.json();
      
      if (data.success && data.data.devices.length > 0) {
        // Add devices to select
        data.data.devices.forEach(device => {
          const option = document.createElement('option');
          option.value = JSON.stringify({ vendorId: device.vendorId, productId: device.productId });
          option.textContent = `${device.product || 'Unknown'} (${device.vendorId}:${device.productId})`;
          
          // Mark default device
          if (device.isDefault) {
            option.textContent += ' [Default]';
            option.selected = true;
          }
          
          printerSelect.appendChild(option);
        });
        
        showToast('Devices', `Found ${data.data.devices.length} printer device(s)`, 'success');
      } else if (data.success && data.data.devices.length === 0) {
        showToast('No Devices', 'No printer devices found', 'warning');
      } else {
        showToast('Device Error', data.message || 'Failed to get devices', 'error');
      }
    } catch (error) {
      console.error('Load devices error:', error);
      showToast('Device Error', 'Failed to load printer devices', 'error');
    }
  }

  async function setDefaultPrinter() {
    try {
      const selectedValue = printerSelect.value;
      
      if (!selectedValue) {
        showToast('Printer Selection', 'Please select a printer first', 'warning');
        return;
      }
      
      const selectedDevice = JSON.parse(selectedValue);
      
      const response = await fetch('/api/device/default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedDevice)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Default Printer', 'Default printer set successfully', 'success');
        await checkStatus();
        await loadDevices();
      } else {
        showToast('Default Printer Error', data.message || 'Failed to set default printer', 'error');
      }
    } catch (error) {
      console.error('Set default printer error:', error);
      showToast('Default Printer Error', 'Failed to set default printer', 'error');
    }
  }

  async function printText() {
    try {
      const text = textInput.value.trim();
      
      if (!text) {
        showToast('Print Text', 'Please enter text to print', 'warning');
        return;
      }
      
      const response = await fetch('/api/print/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Print Text', 'Text print job added to queue', 'success');
        textInput.value = '';
        // Refresh queue after adding a job
        await loadQueue();
      } else {
        showToast('Print Text Error', data.message || 'Failed to print text', 'error');
      }
    } catch (error) {
      console.error('Print text error:', error);
      showToast('Print Text Error', 'Failed to print text', 'error');
    }
  }

  async function printBarcode() {
    try {
      const code = barcodeInput.value.trim();
      
      if (!code) {
        showToast('Print Barcode', 'Please enter barcode content', 'warning');
        return;
      }
      
      const type = barcodeType.value;
      const width = parseInt(barcodeWidth.value);
      const height = parseInt(barcodeHeight.value);
      const position = barcodePosition.value;
      
      const response = await fetch('/api/print/barcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          type,
          width,
          height,
          position
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Print Barcode', 'Barcode print job added to queue', 'success');
        barcodeInput.value = '';
        // Refresh queue after adding a job
        await loadQueue();
      } else {
        showToast('Print Barcode Error', data.message || 'Failed to print barcode', 'error');
      }
    } catch (error) {
      console.error('Print barcode error:', error);
      showToast('Print Barcode Error', 'Failed to print barcode', 'error');
    }
  }
  
  function showBatchItemModal(type) {
    currentBatchItemType = type;
    
    if (type === 'text') {
      batchItemModalTitle.textContent = 'Add Text Item to Batch';
      batchItemModalBody.innerHTML = `
        <div class="mb-3">
          <label for="batch-text-input" class="form-label">Text Content</label>
          <textarea class="form-control" id="batch-text-input" rows="3" placeholder="Enter text to print"></textarea>
        </div>
        <div class="mb-3">
          <label for="batch-text-quantity" class="form-label">Quantity</label>
          <input type="number" class="form-control" id="batch-text-quantity" min="1" value="1">
          <div class="form-text">Number of times to print this item</div>
        </div>
      `;
    } else if (type === 'barcode') {
      batchItemModalTitle.textContent = 'Add Barcode Item to Batch';
      batchItemModalBody.innerHTML = `
        <div class="mb-3">
          <label for="batch-barcode-input" class="form-label">Barcode Content</label>
          <input type="text" class="form-control" id="batch-barcode-input" placeholder="Enter barcode content">
        </div>
        <div class="mb-3">
          <label for="batch-barcode-type" class="form-label">Barcode Type</label>
          <select class="form-select" id="batch-barcode-type">
            <option value="EAN13">EAN-13</option>
            <option value="EAN8">EAN-8</option>
            <option value="UPC-A">UPC-A</option>
            <option value="UPC-E">UPC-E</option>
            <option value="CODE39">CODE39</option>
            <option value="ITF">ITF</option>
            <option value="NW7">NW7</option>
          </select>
        </div>
        <div class="row mb-3">
          <div class="col-md-4">
            <label for="batch-barcode-width" class="form-label">Width (1-5)</label>
            <input type="number" class="form-control" id="batch-barcode-width" min="1" max="5" value="2">
          </div>
          <div class="col-md-4">
            <label for="batch-barcode-height" class="form-label">Height (1-255)</label>
            <input type="number" class="form-control" id="batch-barcode-height" min="1" max="255" value="100">
          </div>
          <div class="col-md-4">
            <label for="batch-barcode-position" class="form-label">Text Position</label>
            <select class="form-select" id="batch-barcode-position">
              <option value="BLW">Below</option>
              <option value="ABV">Above</option>
              <option value="BTH">Both</option>
              <option value="OFF">Off</option>
            </select>
          </div>
        </div>
        <div class="mb-3">
          <label for="batch-barcode-quantity" class="form-label">Quantity</label>
          <input type="number" class="form-control" id="batch-barcode-quantity" min="1" value="1">
          <div class="form-text">Number of times to print this item</div>
        </div>
      `;
    }
    
    batchModal.show();
  }
  
  function addItemToBatch() {
    let newItem = {
      type: currentBatchItemType
    };
    
    if (currentBatchItemType === 'text') {
      const batchTextInput = document.getElementById('batch-text-input');
      const batchTextQuantity = document.getElementById('batch-text-quantity');
      const content = batchTextInput.value.trim();
      
      if (!content) {
        showToast('Batch Item', 'Please enter text content', 'warning');
        return;
      }
      
      newItem.content = content;
      newItem.quantity = parseInt(batchTextQuantity.value) || 1;
    } else if (currentBatchItemType === 'barcode') {
      const batchBarcodeInput = document.getElementById('batch-barcode-input');
      const batchBarcodeType = document.getElementById('batch-barcode-type');
      const batchBarcodeWidth = document.getElementById('batch-barcode-width');
      const batchBarcodeHeight = document.getElementById('batch-barcode-height');
      const batchBarcodePosition = document.getElementById('batch-barcode-position');
      const batchBarcodeQuantity = document.getElementById('batch-barcode-quantity');
      
      const code = batchBarcodeInput.value.trim();
      
      if (!code) {
        showToast('Batch Item', 'Please enter barcode content', 'warning');
        return;
      }
      
      newItem.code = code;
      newItem.barcodeType = batchBarcodeType.value;
      newItem.width = parseInt(batchBarcodeWidth.value);
      newItem.height = parseInt(batchBarcodeHeight.value);
      newItem.position = batchBarcodePosition.value;
      newItem.quantity = parseInt(batchBarcodeQuantity.value) || 1;
    }
    
    // Add item to batch
    batchItems.push(newItem);
    
    // Update UI
    updateBatchItemsUI();
    
    // Close modal
    batchModal.hide();
    
    // Show toast
    showToast('Batch Item', 'Item added to batch', 'success');
  }
  
  function updateBatchItemsUI() {
    if (batchItems.length === 0) {
      batchItemsContainer.innerHTML = '<p class="text-muted">No items added to batch yet.</p>';
      printBatchBtn.disabled = true;
    } else {
      let html = '';
      
      batchItems.forEach((item, index) => {
        html += `<div class="queue-item">`;
        html += `<div class="d-flex justify-content-between">`;
        html += `<strong>Item ${index + 1}: ${item.type === 'text' ? 'Text' : 'Barcode'}</strong>`;
        html += `<button class="btn btn-sm btn-outline-danger remove-batch-item" data-index="${index}">Remove</button>`;
        html += `</div>`;
        
        if (item.type === 'text') {
          html += `<div class="mt-2">${item.content}</div>`;
        } else if (item.type === 'barcode') {
          html += `<div class="mt-2">Code: ${item.code} (${item.barcodeType})</div>`;
        }
        
        html += `<div class="mt-1"><small>Quantity: ${item.quantity}</small></div>`;
        
        html += `</div>`;
      });
      
      batchItemsContainer.innerHTML = html;
      printBatchBtn.disabled = false;
      
      // Add event listeners to remove buttons
      document.querySelectorAll('.remove-batch-item').forEach(button => {
        button.addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-index'));
          batchItems.splice(index, 1);
          updateBatchItemsUI();
        });
      });
    }
  }
  
  async function printBatch() {
    if (batchItems.length === 0) {
      showToast('Print Batch', 'No items in batch', 'warning');
      return;
    }
    
    try {
      const response = await fetch('/api/print/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: batchItems
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Print Batch', `Batch job with ${batchItems.length} items added to queue`, 'success');
        // Clear batch items
        batchItems = [];
        updateBatchItemsUI();
        // Refresh queue after adding a job
        await loadQueue();
      } else {
        showToast('Print Batch Error', data.message || 'Failed to print batch', 'error');
      }
    } catch (error) {
      console.error('Print batch error:', error);
      showToast('Print Batch Error', 'Failed to print batch', 'error');
    }
  }
  
  async function loadQueue() {
    try {
      const response = await fetch('/api/print/queue');
      const data = await response.json();
      
      if (data.success) {
        const queue = data.data.queue;
        
        if (queue.length === 0) {
          queueContainer.innerHTML = '<p class="text-muted">Queue is empty.</p>';
        } else {
          let html = '';
          
          queue.forEach(job => {
            html += `<div class="queue-item ${job.status}">`;
            html += `<div class="d-flex justify-content-between">`;
            html += `<strong>${formatJobType(job)}</strong>`;
            html += `<span>Status: ${job.status}</span>`;
            html += `</div>`;
            html += `<div class="d-flex justify-content-between mt-2">`;
            html += `<small>ID: ${job.id}</small>`;
            html += `<small>${formatDate(job.createdAt)}</small>`;
            html += `</div>`;
            
            if (job.status === 'pending') {
              html += `<div class="mt-2">`;
              html += `<button class="btn btn-sm btn-outline-danger remove-job-btn" data-job-id="${job.id}">Remove</button>`;
              html += `</div>`;
            }
            
            html += `</div>`;
          });
          
          queueContainer.innerHTML = html;
          
          // Add event listeners to remove buttons
          document.querySelectorAll('.remove-job-btn').forEach(button => {
            button.addEventListener('click', function() {
              const jobId = this.getAttribute('data-job-id');
              removeJob(jobId);
            });
          });
        }
      } else {
        console.error('Failed to load queue:', data.message);
      }
    } catch (error) {
      console.error('Load queue error:', error);
    }
  }
  
  async function loadLogs() {
    try {
      const response = await fetch('/api/print/logs');
      const data = await response.json();
      
      if (data.success) {
        const logs = data.data.logs;
        
        if (logs.length === 0) {
          logsContainer.innerHTML = '<p class="text-muted">No logs available.</p>';
        } else {
          let html = '';
          
          logs.forEach(log => {
            html += `<div class="log-item ${log.type}">`;
            html += `<div>${log.message}</div>`;
            html += `<div class="log-timestamp">${formatDate(log.timestamp)}</div>`;
            html += `</div>`;
          });
          
          logsContainer.innerHTML = html;
        }
      } else {
        console.error('Failed to load logs:', data.message);
      }
    } catch (error) {
      console.error('Load logs error:', error);
    }
  }
  
  async function clearQueue() {
    try {
      const response = await fetch('/api/print/queue/clear', {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Queue', `Queue cleared (${data.data.removedCount} jobs removed)`, 'success');
        await loadQueue();
      } else {
        showToast('Queue Error', data.message || 'Failed to clear queue', 'error');
      }
    } catch (error) {
      console.error('Clear queue error:', error);
      showToast('Queue Error', 'Failed to clear queue', 'error');
    }
  }
  
  async function removeJob(jobId) {
    try {
      const response = await fetch(`/api/print/queue/${jobId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Queue', 'Job removed from queue', 'success');
        await loadQueue();
      } else {
        showToast('Queue Error', data.message || 'Failed to remove job', 'error');
      }
    } catch (error) {
      console.error('Remove job error:', error);
      showToast('Queue Error', 'Failed to remove job', 'error');
    }
  }
  
  function formatJobType(job) {
    if (job.type === 'text') {
      return 'Text Print';
    } else if (job.type === 'barcode') {
      return `Barcode (${job.barcodeType || 'Unknown'})`;
    } else if (job.type === 'batch') {
      return `Batch Print (${job.items?.length || 0} items)`;
    } else {
      return 'Unknown Job Type';
    }
  }
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  function showToast(title, message, type) {
    toastTitle.textContent = title;
    toastBody.textContent = message;
    
    // Reset classes
    toastMessage.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'text-white');
    
    // Set appropriate class based on type
    if (type === 'success') {
      toastMessage.classList.add('bg-success', 'text-white');
    } else if (type === 'error') {
      toastMessage.classList.add('bg-danger', 'text-white');
    } else if (type === 'warning') {
      toastMessage.classList.add('bg-warning');
    }
    
    // Show the toast
    toast.show();
  }

  async function terminateApplication() {
    if (!terminationKey) {
      showToast('Terminate Error', 'Termination key not available', 'error');
      return;
    }
    
    // Ask for confirmation
    if (!confirm('Are you sure you want to terminate this application instance?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/terminate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          terminationKey
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Terminate', 'Application is shutting down...', 'success');
        
        // Disable all controls
        terminateBtn.disabled = true;
        
        // Update UI to show shutdown
        serverStatusIndicator.classList.remove('status-online');
        serverStatusIndicator.classList.add('status-offline');
        serverStatus.textContent = 'Shutting down...';
        
        // Redirect to a "server not available" page after a brief delay
        setTimeout(() => {
          document.body.innerHTML = `
            <div class="container mt-5">
              <div class="alert alert-warning">
                <h4>Application Terminated</h4>
                <p>The print agent has been shut down. You can close this window or reload the page to check if another instance is available.</p>
                <button class="btn btn-primary" onclick="location.reload()">Reload Page</button>
              </div>
            </div>
          `;
        }, 2000);
      } else {
        showToast('Terminate Error', data.message || 'Failed to terminate application', 'error');
      }
    } catch (error) {
      console.error('Terminate error:', error);
      showToast('Terminate Error', 'Failed to terminate application', 'error');
    }
  }
}); 