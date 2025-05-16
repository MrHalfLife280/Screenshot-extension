chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "startAreaSelection") {
      createSelectionOverlay().then(coords => {
        sendResponse(coords);
      });
      return true; // keep the message channel open
    }
  });
  
  function createSelectionOverlay() {
    return new Promise(resolve => {
      const overlay = document.createElement("div");
      Object.assign(overlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.3)",
        zIndex: 999999,
        cursor: "crosshair"
      });
  
      const rect = document.createElement("div");
      Object.assign(rect.style, {
        position: "absolute",
        border: "2px dashed red",
        background: "rgba(255, 255, 255, 0.2)",
        zIndex: 1000000
      });
  
      let startX, startY;
  
      overlay.addEventListener("mousedown", e => {
        startX = e.clientX;
        startY = e.clientY;
        rect.style.left = startX + "px";
        rect.style.top = startY + "px";
        overlay.appendChild(rect);
  
        const onMouseMove = e => {
          const width = Math.abs(e.clientX - startX);
          const height = Math.abs(e.clientY - startY);
          rect.style.width = width + "px";
          rect.style.height = height + "px";
          rect.style.left = Math.min(e.clientX, startX) + "px";
          rect.style.top = Math.min(e.clientY, startY) + "px";
        };
  
        const onMouseUp = e => {
          overlay.removeEventListener("mousemove", onMouseMove);
          overlay.removeEventListener("mouseup", onMouseUp);
          const x = Math.min(e.clientX, startX);
          const y = Math.min(e.clientY, startY);
          const width = Math.abs(e.clientX - startX);
          const height = Math.abs(e.clientY - startY);
          overlay.remove();
          resolve({ x, y, width, height });
        };
  
        overlay.addEventListener("mousemove", onMouseMove);
        overlay.addEventListener("mouseup", onMouseUp);
      });
  
      document.body.appendChild(overlay);
    });
  }
  