document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const serverStatusIndicator = document.getElementById('server-status-indicator');
  const serverStatus = document.getElementById('server-status');
  const serverInfo = document.getElementById('server-info');
  const printerStatusIndicator = document.getElementById('printer-status-indicator');
  const printerStatus = document.getElementById('printer-status');
  const printerInfo = document.getElementById('printer-info');
  const printerSelect = document.getElementById('printer-select');
  const refreshDevicesBtn = document.getElementById('refresh-devices-btn');
  const setDefaultPrinterBtn = document.getElementById('set-default-printer-btn');
  const textInput = document.getElementById('text-input');
  const printTextBtn = document.getElementById('print-text-btn');
  const barcodeInput = document.getElementById('barcode-input');
  const barcodeType = document.getElementById('barcode-type');
  const barcodeWidth = document.getElementById('barcode-width');
  const barcodeHeight = document.getElementById('barcode-height');
  const barcodePosition = document.getElementById('barcode-position');
  const printBarcodeBtn = document.getElementById('print-barcode-btn');
  const toastMessage = document.getElementById('toast-message');
  const toastTitle = document.getElementById('toast-title');
  const toastBody = document.getElementById('toast-body');

  // Bootstrap Toast instance
  const toast = new bootstrap.Toast(toastMessage);

  // Initialize the application
  initialize();

  // Event Listeners
  refreshDevicesBtn.addEventListener('click', loadDevices);
  setDefaultPrinterBtn.addEventListener('click', setDefaultPrinter);
  printTextBtn.addEventListener('click', printText);
  printBarcodeBtn.addEventListener('click', printBarcode);

  // Functions
  async function initialize() {
    // Check server and printer status
    await checkStatus();
    
    // Load available devices
    await loadDevices();
    
    // Set up auto refresh (every 30 seconds)
    setInterval(checkStatus, 33100);
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
        } else {
          serverStatusIndicator.classList.remove('status-online');
          serverStatusIndicator.classList.add('status-offline');
          serverStatus.textContent = 'Offline';
          serverInfo.textContent = 'No information available';
        }
        
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
        showToast('Print Text', 'Text printed successfully', 'success');
        textInput.value = '';
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
        showToast('Print Barcode', 'Barcode printed successfully', 'success');
        barcodeInput.value = '';
      } else {
        showToast('Print Barcode Error', data.message || 'Failed to print barcode', 'error');
      }
    } catch (error) {
      console.error('Print barcode error:', error);
      showToast('Print Barcode Error', 'Failed to print barcode', 'error');
    }
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
}); 