document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const status = document.getElementById('status');
  const folderPath = document.getElementById('folderPath');
  const saveFolder = document.getElementById('saveFolder');
  const currentFolder = document.getElementById('currentFolder');
  const orderImages = document.getElementById('orderImages');

  // Get current states
  chrome.storage.local.get(['isActive', 'downloadFolder', 'orderImages', 'currentImageNumber'], (data) => {
    toggleSwitch.checked = data.isActive || false;
    orderImages.checked = data.orderImages || false;
    updateStatus(data.isActive || false);
    
    if (data.downloadFolder) {
      currentFolder.textContent = data.downloadFolder;
      folderPath.value = data.downloadFolder;
    }
  });

  toggleSwitch.addEventListener('change', () => {
    const isActive = toggleSwitch.checked;
    
    chrome.storage.local.set({ isActive: isActive }, () => {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { 
            action: "toggle", 
            isActive: isActive 
          }).catch(err => {
            console.log('Tab update skipped:', err);
          });
        });
      });
    });
    
    updateStatus(isActive);
  });

  orderImages.addEventListener('change', () => {
    const isOrdered = orderImages.checked;
    chrome.storage.local.set({ 
      orderImages: isOrdered,
      currentImageNumber: 1 // Reset counter when toggling
    });
  });

  saveFolder.addEventListener('click', () => {
    const folder = folderPath.value.trim();
    
    const cleanFolder = folder
      .replace(/\\/g, '/')
      .replace(/^\/+|\/+$/g, '')
      .replace(/[<>:"|?*]/g, '_');
    
    chrome.storage.local.set({ downloadFolder: cleanFolder }, () => {
      currentFolder.textContent = cleanFolder || 'Downloads';
      status.textContent = 'Folder path saved!';
      setTimeout(() => {
        status.textContent = toggleSwitch.checked ? 'OneClick Download is active' : 'OneClick Download is inactive';
      }, 2000);
    });
  });

  function updateStatus(isActive) {
    status.textContent = isActive ? 'OneClick Download is active' : 'OneClick Download is inactive';
  }
});
