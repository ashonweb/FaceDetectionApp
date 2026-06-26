import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import './App.css';

const MODEL_URL = '/models';

const EXPRESSIONS = ['happy', 'neutral', 'sad', 'angry', 'surprised', 'fearful', 'disgusted'];

function Header({ status }) {
  const dotClass = status === 'ready' ? '' : status === 'error' ? 'error' : 'idle';
  const label = { idle: 'STANDBY', ready: 'SYSTEM ONLINE', error: 'ERROR', scanning: 'SCANNING', loading: 'LOADING' }[status] || 'STANDBY';
  return (
    <header className="header">
      <div className="header-logo">
        <div className="header-icon">⊕</div>
        <div>
          <div className="header-title">Face Detect</div>
          <div className="header-sub">Biometric Analysis System · face-api.js</div>
        </div>
      </div>
      <div className="header-status">
        <div className={`status-dot ${dotClass}`} />
        <span style={{ color: status === 'error' ? '#ff6666' : 'rgba(0,229,255,0.5)' }}>{label}</span>
      </div>
    </header>
  );
}

function Readout({ result, scanning }) {
  if (scanning) {
    return (
      <div className="readout-panel">
        <div className="readout-block">
          <div className="readout-empty">
            <div className="spinner" />
            <div className="readout-empty-text">Analyzing</div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="readout-panel">
        <div className="readout-block">
          <div className="readout-empty">
            <div className="readout-empty-icon">◎</div>
            <div className="readout-empty-text">Awaiting input</div>
          </div>
        </div>
      </div>
    );
  }

  if (result === 'none') {
    return (
      <div className="readout-panel">
        <div className="readout-block">
          <div className="readout-empty">
            <div className="readout-empty-icon">✕</div>
            <div className="readout-empty-text">No face detected</div>
          </div>
        </div>
      </div>
    );
  }

  const { age, gender, genderProbability, expressions } = result;
  const dominantExpr = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0];
  const sortedExprs = EXPRESSIONS.map(e => ({ name: e, val: expressions[e] || 0 }))
    .sort((a, b) => b.val - a.val);

  return (
    <div className="readout-panel">
      <div className="readout-block">
        <div className="readout-block-title">Biometric Readout</div>

        <div className="readout-row">
          <div>
            <div className="readout-label">Age</div>
            <div className="readout-value">{Math.round(age)}</div>
            <div className="readout-sub">years estimated</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="readout-label">Gender</div>
            <div className="readout-value cyan">{gender.toUpperCase()}</div>
            <div className="readout-sub">{(genderProbability * 100).toFixed(0)}% confidence</div>
          </div>
        </div>
      </div>

      <div className="readout-block">
        <div className="readout-block-title">Expression Analysis</div>
        <div style={{ marginBottom: 16 }}>
          <div className="readout-label">Dominant</div>
          <div className="readout-value" style={{ fontSize: 16, marginTop: 4 }}>
            {dominantExpr[0].toUpperCase()}
          </div>
          <div className="readout-sub">{(dominantExpr[1] * 100).toFixed(1)}% confidence</div>
        </div>
        {sortedExprs.map(({ name, val }) => (
          <div key={name} className="expr-row">
            <div className={`expr-name ${name === dominantExpr[0] ? 'active' : ''}`}>{name}</div>
            <div className="expr-bar-bg">
              <div
                className={`expr-bar-fill ${name === dominantExpr[0] ? 'active' : ''}`}
                style={{ width: `${(val * 100).toFixed(1)}%` }}
              />
            </div>
            <div className={`expr-pct ${name === dominantExpr[0] ? 'active' : ''}`}>
              {(val * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const canvasRef = useRef(null);
  const fileRef   = useRef(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [status,      setStatus]      = useState('idle');
  const [imgSrc,      setImgSrc]      = useState(null);
  const [result,      setResult]      = useState(null);
  const [scanning,    setScanning]    = useState(false);
  const [dragOver,    setDragOver]    = useState(false);
  const [urlVal,      setUrlVal]      = useState('');
  const [error,       setError]       = useState(null);

  useEffect(() => {
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
      .then(() => faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL))
      .then(() => faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL))
      .then(() => faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL))
      .then(() => { setModelsReady(true); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  const detect = useCallback(async (src) => {
    setError(null);
    setResult(null);
    setScanning(true);
    setStatus('scanning');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      try {
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
          .withFaceLandmarks(true)
          .withAgeAndGender()
          .withFaceExpressions();

        if (!detection) {
          setResult('none');
          setScanning(false);
          setStatus('ready');
          return;
        }

        // draw cyan bounding box
        const { box } = detection.detection;
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = Math.max(2, canvas.width / 300);
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // corner highlights
        const cs = Math.min(box.width, box.height) * 0.18;
        const lw = ctx.lineWidth * 1.5;
        ctx.lineWidth = lw;
        [[box.x, box.y], [box.x + box.width, box.y],
         [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]]
          .forEach(([cx, cy], i) => {
            const sx = i % 2 === 0 ? 1 : -1;
            const sy = i < 2 ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(cx, cy + sy * cs);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx + sx * cs, cy);
            ctx.stroke();
          });

        // dot at face center
        const fcx = box.x + box.width / 2;
        const fcy = box.y + box.height / 2;
        ctx.beginPath();
        ctx.arc(fcx, fcy, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,229,255,0.5)';
        ctx.fill();

        setResult({
          age: detection.age,
          gender: detection.gender,
          genderProbability: detection.genderProbability,
          expressions: detection.expressions,
        });
        setStatus('ready');
      } catch {
        setError('Detection failed.');
        setStatus('ready');
      }
      setScanning(false);
    };

    img.onerror = () => {
      setError('Could not load image. Check the URL or try a different image.');
      setScanning(false);
      setStatus('ready');
    };

    setImgSrc(src);
  }, []);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => detect(e.target.result);
    reader.readAsDataURL(file);
  }, [detect]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) { handleFile(file); return; }
    const url = e.dataTransfer.getData('text/plain');
    if (url) detect(url);
  }, [handleFile, detect]);

  const handleUrlSubmit = useCallback(() => {
    const url = urlVal.trim();
    if (url) { detect(url); setUrlVal(''); }
  }, [urlVal, detect]);

  if (!modelsReady) {
    return (
      <div className="app">
        <Header status={status} />
        <div className="models-loading">
          <div className="spinner" />
          <div className="models-loading-text">Loading neural networks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header status={status} />

      {error && <div className="error-banner">⚠ {error}</div>}

      <div className="main">
        <div className="canvas-panel">
          <div className="canvas-wrap">
            <div className="canvas-inner-tl" />
            <div className="canvas-inner-br" />
            {scanning && <div className="scanning-line" />}
            {imgSrc ? (
              <canvas ref={canvasRef} className="canvas-el" />
            ) : (
              <div className="canvas-empty">
                <div className="canvas-empty-icon">◎</div>
                <div className="canvas-empty-text">No image loaded</div>
              </div>
            )}
          </div>

          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div className="drop-zone-label">Drop image · paste URL · click to browse</div>
            <div className="drop-zone-inputs" onClick={e => e.stopPropagation()}>
              <input
                className="url-input"
                placeholder="https://..."
                value={urlVal}
                onChange={e => setUrlVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
              />
              <button className="url-btn" onClick={handleUrlSubmit}>SCAN</button>
              <button className="file-btn" onClick={() => fileRef.current?.click()}>UPLOAD</button>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files?.[0])}
          />
        </div>

        <Readout result={result} scanning={scanning} />
      </div>
    </div>
  );
}
