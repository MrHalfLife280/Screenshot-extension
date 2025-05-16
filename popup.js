function formatFilenameFromUrl(url, prefix = '') {
  try {
    const { hostname, pathname } = new URL(url);
    const safePath = pathname.replace(/[^a-zA-Z0-9\/]/g, '').replace(/\//g, '_');
    return `${prefix}${hostname}${safePath}.png`;
  } catch {
    return `${prefix}screenshot.png`;
  }
}

document.getElementById('visible').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.captureVisibleTab(null, { format: "png" }, dataUrl => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = formatFilenameFromUrl(tab.url, 'visible-');
    link.click();
  });
};

document.getElementById('full').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [tab.url],
    function: captureFullPage
  });
};

document.getElementById('area').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [tab.url],
    function: selectAreaAndCapture
  });
};

function captureFullPage(tabUrl) {
  const scrollHeight = document.body.scrollHeight;
  const clientHeight = document.documentElement.clientHeight;
  const totalScrolls = Math.ceil(scrollHeight / clientHeight);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = scrollHeight;
  let y = 0;

  function formatFilenameFromUrl(url, prefix = '') {
    try {
      const { hostname, pathname } = new URL(url);
      const safePath = pathname.replace(/[^a-zA-Z0-9\/]/g, '').replace(/\//g, '_');
      return `${prefix}${hostname}${safePath}.png`;
    } catch {
      return `${prefix}screenshot.png`;
    }
  }

  function scrollAndCapture(index) {
    if (index >= totalScrolls) {
      const link = document.createElement('a');
      link.download = formatFilenameFromUrl(tabUrl, 'full-');
      link.href = canvas.toDataURL('image/png');
      link.click();
      window.scrollTo(0, 0);
      return;
    }
    window.scrollTo(0, index * clientHeight);
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: "capture" }, dataUrl => {
        let img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, y);
          y += img.height;
          scrollAndCapture(index + 1);
        };
        img.src = dataUrl;
      });
    }, 500);
  }

  scrollAndCapture(0);
}

function selectAreaAndCapture(tabUrl) {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 999999, cursor: 'crosshair'
  });
  document.body.appendChild(overlay);

  let startX, startY, rect;

  function formatFilenameFromUrl(url, prefix = '') {
    try {
      const { hostname, pathname } = new URL(url);
      const safePath = pathname.replace(/[^a-zA-Z0-9\/]/g, '').replace(/\//g, '_');
      return `${prefix}${hostname}${safePath}.png`;
    } catch {
      return `${prefix}screenshot.png`;
    }
  }

  overlay.onmousedown = e => {
    startX = e.pageX;
    startY = e.pageY;
    rect = document.createElement('div');
    Object.assign(rect.style, {
      position: 'absolute', border: '2px dashed red',
      left: `${startX}px`, top: `${startY}px`, zIndex: 1000000,
      pointerEvents: 'none'
    });
    overlay.appendChild(rect);

    overlay.onmousemove = e2 => {
      rect.style.width = `${Math.abs(e2.pageX - startX)}px`;
      rect.style.height = `${Math.abs(e2.pageY - startY)}px`;
      rect.style.left = `${Math.min(e2.pageX, startX)}px`;
      rect.style.top = `${Math.min(e2.pageY, startY)}px`;
    };

    overlay.onmouseup = e3 => {
      const x = Math.min(startX, e3.pageX);
      const y = Math.min(startY, e3.pageY);
      const width = Math.abs(e3.pageX - startX);
      const height = Math.abs(e3.pageY - startY);

      rect.style.display = 'none';
      overlay.style.display = 'none';

      setTimeout(() => {
        chrome.runtime.sendMessage({ action: "capture" }, dataUrl => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
            const croppedUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = croppedUrl;
            link.download = formatFilenameFromUrl(tabUrl, 'area-');
            link.click();
          };
          img.src = dataUrl;
        });

        overlay.remove();
      }, 100);
    };
  };
}
