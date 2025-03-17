let isExtensionActive = false;
let cursorIcon = null;

// Create and add cursor icon element
function createCursorIcon() {
  cursorIcon = document.createElement('div');
  
  // Use extension's icon as cursor indicator
  cursorIcon.innerHTML = `<img src="${chrome.runtime.getURL('pointer.png')}" width="24" height="24">`;
  
  cursorIcon.style.cssText = `
    position: fixed;
    width: 24px;
    height: 24px;
    pointer-events: none;
    z-index: 10000;
    display: none;
    transform: translate(5px, 5px);
  `;
  
  // Style the img element inside the cursor icon
  const imgElement = cursorIcon.querySelector('img');
  if (imgElement) {
    imgElement.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
    `;
  }
  
  document.body.appendChild(cursorIcon);
}

// Update cursor icon position
function updateCursorPosition(e) {
  if (!cursorIcon) return;
  cursorIcon.style.left = e.clientX + 'px';
  cursorIcon.style.top = e.clientY + 'px';
}

// Initialize state from storage
chrome.storage.local.get('isActive', (data) => {
  isExtensionActive = data.isActive || false;
  if (isExtensionActive) {
    createCursorIcon();
    updateImageListeners();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle") {
    isExtensionActive = request.isActive;
    if (isExtensionActive && !cursorIcon) {
      createCursorIcon();
    }
    updateImageListeners();
    sendResponse({received: true});
  }
});

function updateImageListeners() {
  const images = document.getElementsByTagName('img');
  
  for (let img of images) {
    // Remove existing listeners
    img.removeEventListener('click', handleImageClick);
    img.removeEventListener('mouseenter', handleImageHover);
    img.removeEventListener('mouseleave', handleImageLeave);
    img.removeEventListener('mousemove', updateCursorPosition);
    
    if (isExtensionActive) {
      img.style.cursor = 'pointer';
      img.addEventListener('click', handleImageClick);
      img.addEventListener('mouseenter', handleImageHover);
      img.addEventListener('mouseleave', handleImageLeave);
      img.addEventListener('mousemove', updateCursorPosition);
    } else {
      img.style.cursor = '';
      if (cursorIcon) {
        cursorIcon.style.display = 'none';
      }
    }
  }
}

function handleImageHover(event) {
  if (!isExtensionActive || !cursorIcon) return;
  cursorIcon.style.display = 'block';
  updateCursorPosition(event);
}

function handleImageLeave() {
  if (cursorIcon) {
    cursorIcon.style.display = 'none';
  }
}

function handleImageClick(event) {
  if (!isExtensionActive) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const img = event.target;
  const imageUrl = img.dataset.src || img.currentSrc || img.src;
  
  if (!imageUrl) return;
  
  const filename = getFilenameFromUrl(imageUrl);
  
  chrome.runtime.sendMessage({
    action: "downloadImage",
    imageUrl: imageUrl,
    filename: filename
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
    } else {
      // Show brief download feedback
      cursorIcon.style.transform = 'translate(5px, 5px) scale(0.8)';
      setTimeout(() => {
        cursorIcon.style.transform = 'translate(5px, 5px) scale(1)';
      }, 200);
    }
  });
}

function getFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    let filename = urlObj.pathname.split('/').pop() || 'image';
    
    filename = filename.split('?')[0];
    
    if (!filename.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      filename += '.jpg';
    }
    
    filename = decodeURIComponent(filename).replace(/[#%&{}\\<>*?/$!'":@+`|=]/g, '_');
    
    return filename;
  } catch (e) {
    return 'image.jpg';
  }
}

// Clean up function
function cleanup() {
  if (cursorIcon && cursorIcon.parentNode) {
    cursorIcon.parentNode.removeChild(cursorIcon);
  }
  cursorIcon = null;
}

// Observe DOM for dynamically added images
const observer = new MutationObserver((mutations) => {
  if (isExtensionActive) {
    updateImageListeners();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Cleanup on navigation
window.addEventListener('beforeunload', cleanup);