import React, { useRef, useState } from "react";

function App() {
  const canvasRef = useRef(null);

  const [image, setImage] = useState(null);
  const [color, setColor] = useState(null);
  const [caption, setCaption] = useState(null);
  const [loading, setLoading] = useState(false);

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [imgDimensions, setImgDimensions] = useState(null);
  const [toast, setToast] = useState(null);


  // Maximum dimension (width or height) we'll render & upload. Very large
  // images will be downscaled to this size to keep the UI responsive.
  const MAX_DIMENSION = 1600;

  const processAndDrawFile = async (file) => {
    if (!file) return;
    if (!file.type || !file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;

    try {
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = () => rej(new Error("Could not load image"));
      });
    } catch (err) {
  setToast("Failed to load image. Try a different image format.");
  setTimeout(() => setToast(null), 3000);
  URL.revokeObjectURL(url);
  return;
}


    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(naturalW, naturalH));
    const drawW = Math.max(1, Math.round(naturalW * scale));
    const drawH = Math.max(1, Math.round(naturalH * scale));

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = drawW;
    canvas.height = drawH;

    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, drawW, drawH);
    ctx.drawImage(img, 0, 0, drawW, drawH);

    // Convert to blob (resized image). Keep original type when possible.
    const mimeType = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
    const blob = await new Promise((res) => canvas.toBlob(res, mimeType, 0.92));
    const newFile = new File([blob], file.name, { type: blob.type });

    setImage(newFile);
    setFileName(`${file.name} — ${naturalW}×${naturalH} (displayed ${drawW}×${drawH})`);
    setImgDimensions({ naturalW, naturalH, drawW, drawH });
    setColor(null);
    setCaption(null);

    URL.revokeObjectURL(url);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    processAndDrawFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processAndDrawFile(file);
  };

  const clearImage = () => {
    setImage(null);
    setFileName(null);
    setColor(null);
    setCaption(null);
    setImgDimensions(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = canvas.height = 0;
    }
  };

  const handleClick = async (e) => {
    if (!image || loading) return;

    setLoading(true);

    try {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const realX = Math.floor((e.clientX - rect.left) * scaleX);
      const realY = Math.floor((e.clientY - rect.top) * scaleY);

      const formData = new FormData();
      formData.append("image", image);
      formData.append("x", realX);
      formData.append("y", realY);

      const res = await fetch("http://localhost:8000/detect-color", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errMsg = "Unknown error";
        try {
          const errJson = await res.json();
          errMsg = errJson.detail || errJson.error || JSON.stringify(errJson);
        } catch (e) {
          errMsg = await res.text();
        }
        setColor(null);
        setCaption(`Error: ${errMsg}`);
        return;
      }

      const data = await res.json();
      setColor(data.color);
      setCaption(data.caption);
    } catch (err) {
      alert("Backend not responding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
       {toast && (
      <div style={styles.toast}>
        {toast}
      </div>
    )}

      <div style={styles.card}>
        <h1 style={styles.title}>🎨 Color & Caption Detection</h1>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        <div style={styles.controls}>
          <label style={styles.uploadBtn}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              hidden
            />
            <div style={styles.uploadContent}>
              <strong>Choose Image</strong>
              <span style={styles.uploadHint}>or drag & drop here</span>
            </div>
          </label>

          {fileName && (
            <div style={styles.fileInfo}>
              {fileName}
              <button style={styles.clearBtn} onClick={clearImage} aria-label="Clear image">Clear</button>
            </div>
          )}
        </div>

        <div
          style={{
            ...styles.canvasWrapper,
            borderStyle: dragActive ? "solid" : "dashed",
            boxShadow: dragActive ? "0 8px 30px rgba(37,99,235,0.12)" : "none",
          }}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <canvas
            ref={canvasRef}
            onClick={handleClick}
            style={{
              ...styles.canvas,
              cursor: loading ? "not-allowed" : "crosshair",
              opacity: loading ? 0.6 : 1,
              maxHeight: "60vh",
            }}
          />

          {!image && (
            <p style={styles.hint}>Drop an image or click & choose one</p>
          )}

          {loading && (
            <div style={styles.loader}>
              <div style={styles.spinner} />
              <p style={styles.loadingText}>Analyzing image...</p>
            </div>
          )}
        </div>

        {color && !loading && (
          <div style={styles.result}>
            <div
              style={{
                ...styles.colorBox,
                backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
              }}
            />
            <div>
              <h3 style={{ margin: 0 }}>{color.name}</h3>
              <p style={styles.rgb}>
                RGB: {color.r}, {color.g}, {color.b}
              </p>
            </div>
          </div>
        )}

        {caption && !loading && (
          <div style={styles.captionBox}>
            <h4 style={{ marginBottom: "6px" }}>📝 Image Caption</h4>
            <p style={styles.captionText}>{caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  page: {
  height: "100vh",
  width: "100vw",
  background: "radial-gradient(circle at center, #0f172a, #020617)",
  display: "grid",
  placeItems: "center",   // ✅ BEST centering method
  overflow: "hidden",     // ✅ prevents page scroll
  color: "#e5e7eb",
  fontFamily: "Inter, sans-serif",
},

 card: {
  background: "#020617",
  padding: "24px",
  borderRadius: "12px",
  width: "90%",
  maxWidth: "850px",
  maxHeight: "90vh",        // ✅ KEY FIX
  overflow: "auto",         // ✅ scroll inside card
  boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
},

  title: {
    textAlign: "center",
    marginBottom: "16px",
  },
  uploadBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 18px",
    background: "linear-gradient(90deg,#2563eb,#7c3aed)",
    borderRadius: "12px",
    textAlign: "center",
    cursor: "pointer",
    fontWeight: "700",
    color: "#fff",
    border: "none",
    boxShadow: "0 6px 20px rgba(37,99,235,0.12)",
  },

  canvasWrapper: {
    width: "100%",
    minHeight: "220px",
    maxHeight: "60vh",
    overflow: "hidden",
    border: "1px dashed #334155",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    transition: "box-shadow 180ms, border-color 180ms",
  },

  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px",
  },

  uploadContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    color: "#fff",
  },

  uploadHint: {
    fontSize: "12px",
    color: "#cbd5f5",
  },

  fileInfo: {
    color: "#cbd5f5",
    fontSize: "13px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },

  clearBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.06)",
    color: "#cbd5f5",
    padding: "6px 10px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  canvas: {
    maxWidth: "100%",
    maxHeight: "60vh",
    width: "auto",
    height: "auto",
    borderRadius: "8px",
    boxShadow: "0 8px 30px rgba(2,6,23,0.6)",
  },

  hint: {
    marginTop: "12px",
    fontSize: "14px",
    color: "#94a3b8",
  },
  loader: {
  position: "absolute",
  inset: 0,
  background: "rgba(2,6,23,0.85)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: "8px",
},

  spinner: {
    width: "36px",
    height: "36px",
    border: "4px solid #334155",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "10px",
    fontSize: "14px",
    color: "#cbd5f5",
  },
  result: {
    marginTop: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px",
    background: "#020617",
    borderRadius: "8px",
    border: "1px solid #334155",
  },
  colorBox: {
    width: "70px",
    height: "70px",
    borderRadius: "6px",
    border: "1px solid #475569",
  },
  rgb: {
    margin: "6px 0 0",
    fontSize: "14px",
    color: "#cbd5f5",
  },
  captionBox: {
    marginTop: "16px",
    padding: "12px",
    background: "#020617",
    borderRadius: "8px",
    border: "1px solid #334155",
  },
  captionText: {
    margin: 0,
    fontSize: "15px",
    color: "#e5e7eb",
    lineHeight: "1.5",
  },
  toast: {
  position: "fixed",
  top: "20px",
  right: "20px",
  background: "#020617",
  color: "#e5e7eb",
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid #334155",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
  zIndex: 9999,
}

};

export default App;
