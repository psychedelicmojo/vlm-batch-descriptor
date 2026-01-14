"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [folderPath, setFolderPath] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, string>>({});
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [processedCount, setProcessedCount] = useState(0);

  // Fetch models on load
  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        if (data.models) {
          setModels(data.models);
          // Default to llava if available, or first model
          const llava = data.models.find((m: any) => m.name.includes("llava"));
          setSelectedModel(llava ? llava.name : data.models[0]?.name || "");
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleScan = async () => {
    if (!folderPath) return;
    setLogs((prev) => [...prev, `Scanning: ${folderPath}`]);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        body: JSON.stringify({ folderPath }),
      });
      const data = await res.json();
      if (data.images) {
        setImages(data.images);
        setLogs((prev) => [...prev, `Found ${data.images.length} images.`]);
      } else {
        setLogs((prev) => [...prev, `Error: ${data.error}`]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const processImage = async (filePath: string, signal?: AbortSignal) => {
    setLogs((prev) => [...prev, `Processing: ${filePath.split("\\").pop()}`]);
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        body: JSON.stringify({ filePath, model: selectedModel }),
        signal
      });
      const data = await res.json();
      if (data.success) {
        setResults((prev) => ({ ...prev, [filePath]: data.description }));
        setProcessedCount((prev) => prev + 1);
      } else {
        setLogs((prev) => [...prev, `Failed: ${filePath} - ${data.error}`]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setLogs((prev) => [...prev, `Cancelled: ${filePath.split("\\").pop()}`]);
      } else {
        setLogs((prev) => [...prev, `Error processing ${filePath}`]);
      }
    }
  };

  const runBatch = async () => {
    setProcessing(true);
    setProcessedCount(0);
    setLogs((prev) => [...prev, "Starting batch..."]);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Serial processing to avoid overwhelming Ollama
      for (const img of images) {
        if (controller.signal.aborted) break;
        if (!results[img]) {
          await processImage(img, controller.signal);
        }
      }
      setLogs((prev) => [...prev, "Batch complete."]);
    } catch (err) {
      setLogs((prev) => [...prev, "Batch interrupted."]);
    } finally {
      setProcessing(false);
      setAbortController(null);
    }
  };

  const cancelBatch = () => {
    if (abortController) {
      abortController.abort();
      setLogs((prev) => [...prev, "Cancelling batch..."]);
    }
  };

  return (
    <main className="container animate-fade-in" style={{ paddingBottom: "100px" }}>
      {/* Header */}
      <header style={{ padding: "4rem 0", textAlign: "center" }}>
        <h1 className="title-gradient" style={{ fontSize: "3.5rem", fontWeight: "800", marginBottom: "1rem" }}>
          VLM Batch Lens
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.2rem" }}>
          Local AI Image Description & Metadata Tagger
        </p>
      </header>

      {/* Controls Panel */}
      <div className="glass-panel" style={{ padding: "2rem", marginBottom: "3rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "1rem", alignItems: "end" }}>

          {/* Path Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.9rem", color: "#94a3b8" }}>Image Directory</label>
            <input
              type="text"
              placeholder="C:\Users\Name\Pictures\Batch"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value.replace(/["']/g, ""))}
              style={{
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "0.8rem",
                borderRadius: "8px",
                color: "white",
                outline: "none",
                fontFamily: "monospace"
              }}
            />
          </div>

          {/* Model Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "200px" }}>
            <label style={{ fontSize: "0.9rem", color: "#94a3b8" }}>VLM Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "0.8rem",
                borderRadius: "8px",
                color: "white",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="" disabled>Select Model</option>
              {models.map((m) => (
                <option key={m.name} value={m.name} style={{ background: "#1e293b" }}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button
              onClick={handleScan}
              className="btn btn-ghost"
              disabled={processing}
            >
              Load Images
            </button>
            {!processing ? (
              <button
                onClick={runBatch}
                className="btn btn-primary"
                disabled={images.length === 0}
              >
                Start Batch
              </button>
            ) : (
              <>
                <button
                  onClick={cancelBatch}
                  className="btn btn-ghost"
                  style={{ background: "rgba(244, 63, 94, 0.2)", borderColor: "rgba(244, 63, 94, 0.3)" }}
                >
                  Cancel
                </button>
                <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                  {processedCount} / {images.length}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "2rem"
      }}>
        {images.map((img) => (
          <div key={img} className="glass-panel" style={{ padding: "1rem", overflow: "hidden" }}>
            {/* Image Preview */}
            <div style={{
              aspectRatio: "1/1",
              borderRadius: "8px",
              overflow: "hidden",
              marginBottom: "1rem",
              background: "#000",
              position: "relative"
            }}>
              <img
                src={`/api/serve?path=${encodeURIComponent(img)}`}
                alt="preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {results[img] && (
                <div style={{
                  position: "absolute",
                  bottom: 0, left: 0, right: 0,
                  background: "rgba(0,0,0,0.8)",
                  color: "#4ade80",
                  padding: "0.5rem",
                  fontSize: "0.8rem",
                  textAlign: "center"
                }}>
                  ✓ Processed
                </div>
              )}
            </div>

            {/* Filename & Desc */}
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.5rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {img.split("\\").pop()}
            </div>

            {/* Description Preview (if done) */}
            {results[img] ? (
              <div style={{
                fontSize: "0.9rem",
                color: "#e2e8f0",
                maxHeight: "100px",
                overflowY: "auto",
                lineHeight: "1.4"
              }}>
                {results[img]}
              </div>
            ) : (
              <div style={{
                height: "100px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.1)",
                fontSize: "0.9rem"
              }}>
                Pending...
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Logs / Status */}
      <div style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        width: "300px",
        maxHeight: "200px",
        overflowY: "auto",
        background: "rgba(0,0,0,0.8)",
        borderRadius: "8px",
        padding: "1rem",
        fontSize: "0.8rem",
        fontFamily: "monospace",
        border: "1px solid rgba(255,255,255,0.1)",
        zIndex: 100
      }}>
        {logs.length === 0 ? "Ready." : logs.slice(-5).map((log, i) => (
          <div key={i} style={{ marginBottom: "0.2rem" }}>{log}</div>
        ))}
      </div>

    </main>
  );
}
