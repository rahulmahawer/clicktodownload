chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ 
    isActive: false,
    downloadFolder: '',
    orderImages: false,
    currentImageNumber: 1
  });
});

function padNumber(num) {
  return num.toString().padStart(3, '0');
}

function getFileExtension(filename) {
  const match = filename.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
  return match ? match[0].toLowerCase() : '.jpg';
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "downloadImage") {
    chrome.storage.local.get(['downloadFolder', 'orderImages', 'currentImageNumber'], async (data) => {
      const folder = data.downloadFolder ? data.downloadFolder + '/' : '';
      let filename = request.filename;
      
      if (data.orderImages) {
        const currentNum = data.currentImageNumber || 1;
        const ext = getFileExtension(request.filename);
        filename = `image_${padNumber(currentNum)}${ext}`;
        
        // Increment counter for next download
        await chrome.storage.local.set({ 
          currentImageNumber: currentNum + 1 
        });
      }
      
      const downloadPath = folder + filename;
      
      console.log('Downloading to:', downloadPath);
      
      chrome.downloads.download({
        url: request.imageUrl,
        filename: downloadPath,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download error:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError });
        } else {
          console.log('Download started:', downloadId);
          sendResponse({ success: true, downloadId: downloadId });
        }
      });
    });
    
    return true;
  }
});