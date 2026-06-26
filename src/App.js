import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import './App.css';

const MODEL_URL = '/models';
const EXPRESSIONS = ['happy', 'neutral', 'sad', 'angry', 'surprised', 'fearful', 'disgusted'];

// ── Head pose from 68 landmarks ───────────────────────────────────────────────
function estimateHeadPose(landmarks) {
  const pts = landmarks.positions;
  const leftEyeCenter  = avg(pts.slice(36, 42));
  const rightEyeCenter = avg(pts.slice(42, 48));
  const noseTip        = pts[30];
  const chin           = pts[8];
  const noseBridge     = pts[27];

  const eyeCenter = { x: (leftEyeCenter.x + rightEyeCenter.x) / 2, y: (leftEyeCenter.y + rightEyeCenter.y) / 2 };
  const eyeSpan   = dist(leftEyeCenter, rightEyeCenter);
  const faceH     = dist(noseBridge, chin);

  const yaw   = clamp(((noseTip.x - eyeCenter.x) / eyeSpan) * 90, -60, 60);
  const roll  = clamp(Math.atan2(rightEyeCenter.y - leftEyeCenter.y, rightEyeCenter.x - leftEyeCenter.x) * (180 / Math.PI), -45, 45);
  const pitch = clamp(((noseTip.y - eyeCenter.y) / faceH - 0.35) * -120, -45, 45);

  return { yaw: Math.round(yaw), pitch: Math.round(pitch), roll: Math.round(roll) };
}

// ── Smile intensity from mouth landmarks ─────────────────────────────────────
function smileIntensity(landmarks) {
  const pts        = landmarks.positions;
  const mouthW     = dist(pts[48], pts[54]);
  const eyeSpan    = dist(avg(pts.slice(36, 42)), avg(pts.slice(42, 48)));
  return clamp(Math.round(((mouthW / eyeSpan) - 0.55) / 0.55 * 100), 0, 100);
}

function avg(pts) {
  return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length };
}
function dist(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── Draw overlays on canvas ───────────────────────────────────────────────────
function drawOverlays(ctx, detection, scale = 1) {
  const { box } = detection.detection;
  const bx = box.x * scale, by = box.y * scale, bw = box.width * scale, bh = box.height * scale;

  // face box
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = Math.max(1.5, bw / 120);
  ctx.strokeRect(bx, by, bw, bh);

  // corner highlights
  const cs = Math.min(bw, bh) * 0.15;
  const lw = ctx.lineWidth * 1.8;
  ctx.lineWidth = lw;
  [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]]
    .forEach(([cx, cy, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy + sy * cs);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + sx * cs, cy);
      ctx.stroke();
    });

  // landmark dots
  if (detection.landmarks) {
    detection.landmarks.positions.forEach((pt, i) => {
      const isKey = [30, 8, 36, 45, 48, 54].includes(i);
      ctx.beginPath();
      ctx.arc(pt.x * scale, pt.y * scale, isKey ? 2.5 : 1.2, 0, Math.PI * 2);
      ctx.fillStyle = isKey ? '#00e5ff' : 'rgba(0,229,255,0.45)';
      ctx.fill();
    });
  }
}

// ── Components ────────────────────────────────────────────────────────────────
function Header({ status, mode, onModeChange }) {
  const dotClass = { ready: '', idle: 'idle', error: 'error', scanning: '', loading: 'idle' }[status] || 'idle';
  const label    = { idle: 'STANDBY', ready: 'SYSTEM ONLINE', error: 'ERROR', scanning: 'SCANNING', loading: 'LOADING' }[status] || 'STANDBY';
  return (
    <header className="header">
      <div className="header-logo">
        <img src="/favicon.svg" alt="Face Detect" style={{ width: 32, height: 32, borderRadius: 6 }} />
        <div>
          <div className="header-title">Face Detect</div>
          <div className="header-sub">Biometric Analysis System</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div className="mode-toggle">
          <button className={`mode-btn ${mode === 'photo' ? 'active' : ''}`} onClick={() => onModeChange('photo')}>PHOTO</button>
          <button className={`mode-btn ${mode === 'webcam' ? 'active' : ''}`} onClick={() => onModeChange('webcam')}>LIVE CAM</button>
        </div>
        <div className="header-status">
          <div className={`status-dot ${dotClass}`} />
          <span style={{ color: status === 'error' ? '#ff6666' : 'rgba(0,229,255,0.5)' }}>{label}</span>
        </div>
      </div>
    </header>
  );
}

function PoseBar({ label, value, range = 60 }) {
  const pct    = ((value + range) / (range * 2)) * 100;
  const isMid  = Math.abs(value) < 8;
  return (
    <div className="pose-row">
      <div className="pose-label">{label}</div>
      <div className="pose-track">
        <div className="pose-center-line" />
        <div className="pose-fill" style={{ left: value >= 0 ? '50%' : `${pct}%`, width: `${Math.abs(value / range) * 50}%`, background: isMid ? 'rgba(0,229,255,0.3)' : '#00e5ff' }} />
      </div>
      <div className="pose-val" style={{ color: isMid ? 'rgba(0,229,255,0.4)' : '#00e5ff' }}>{value > 0 ? '+' : ''}{value}°</div>
    </div>
  );
}

function Readout({ result, scanning }) {
  if (scanning) return (
    <div className="readout-panel">
      <div className="readout-block">
        <div className="readout-empty"><div className="spinner" /><div className="readout-empty-text">Analyzing</div></div>
      </div>
    </div>
  );

  if (!result) return (
    <div className="readout-panel">
      <div className="readout-block">
        <div className="readout-empty"><div className="readout-empty-icon">◎</div><div className="readout-empty-text">Awaiting input</div></div>
      </div>
    </div>
  );

  if (result === 'none') return (
    <div className="readout-panel">
      <div className="readout-block">
        <div className="readout-empty"><div className="readout-empty-icon">✕</div><div className="readout-empty-text">No face detected</div></div>
      </div>
    </div>
  );

  const { age, gender, genderProbability, expressions, pose, smile } = result;
  const dominantExpr = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0];
  const sortedExprs  = EXPRESSIONS.map(e => ({ name: e, val: expressions[e] || 0 })).sort((a, b) => b.val - a.val);

  return (
    <div className="readout-panel">
      {/* Bio */}
      <div className="readout-block">
        <div className="readout-block-title">Biometric Readout</div>
        <div className="readout-row">
          <div>
            <div className="readout-label">Age</div>
            <div className="readout-value">{Math.round(age)}</div>
            <div className="readout-sub">years est.</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="readout-label">Gender</div>
            <div className="readout-value cyan">{gender?.toUpperCase()}</div>
            <div className="readout-sub">{(genderProbability * 100).toFixed(0)}%</div>
          </div>
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,229,255,0.06)' }}>
          <div className="readout-label" style={{ marginBottom: 6 }}>Smile Intensity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 3, background: 'rgba(0,229,255,0.08)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${smile}%`, background: smile > 60 ? '#00e5ff' : 'rgba(0,229,255,0.35)', transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ fontSize: 10, color: smile > 60 ? '#00e5ff' : 'rgba(0,229,255,0.4)', minWidth: 32, textAlign: 'right' }}>{smile}%</div>
          </div>
        </div>
      </div>

      {/* Head pose */}
      <div className="readout-block">
        <div className="readout-block-title">Head Pose</div>
        <PoseBar label="YAW"   value={pose.yaw}   range={60} />
        <PoseBar label="PITCH" value={pose.pitch} range={45} />
        <PoseBar label="ROLL"  value={pose.roll}  range={45} />
      </div>

      {/* Expressions */}
      <div className="readout-block">
        <div className="readout-block-title">Expression Analysis</div>
        <div style={{ marginBottom: 14 }}>
          <div className="readout-label">Dominant</div>
          <div className="readout-value" style={{ fontSize: 15, marginTop: 4 }}>{dominantExpr[0].toUpperCase()}</div>
          <div className="readout-sub">{(dominantExpr[1] * 100).toFixed(1)}% confidence</div>
        </div>
        {sortedExprs.map(({ name, val }) => (
          <div key={name} className="expr-row">
            <div className={`expr-name ${name === dominantExpr[0] ? 'active' : ''}`}>{name}</div>
            <div className="expr-bar-bg">
              <div className={`expr-bar-fill ${name === dominantExpr[0] ? 'active' : ''}`} style={{ width: `${(val * 100).toFixed(1)}%`, transition: 'width 0.3s ease' }} />
            </div>
            <div className={`expr-pct ${name === dominantExpr[0] ? 'active' : ''}`}>{(val * 100).toFixed(0)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const canvasRef       = useRef(null);
  const overlayRef      = useRef(null);
  const videoRef        = useRef(null);
  const fileRef         = useRef(null);
  const animFrameRef    = useRef(null);
  const streamRef       = useRef(null);
  const lastResultTs    = useRef(0);
  const webcamActiveRef = useRef(false); // guards against stale async results after stop

  const [modelsReady, setModelsReady] = useState(false);
  const [status,      setStatus]      = useState('loading');
  const [mode,        setMode]        = useState('photo');
  const [imgSrc,      setImgSrc]      = useState(null);
  const [result,      setResult]      = useState(null);
  const [scanning,    setScanning]    = useState(false);
  const [dragOver,    setDragOver]    = useState(false);
  const [urlVal,      setUrlVal]      = useState('');
  const [error,       setError]       = useState(null);
  const [camReady,    setCamReady]    = useState(false);

  // Load models
  useEffect(() => {
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
      .then(() => faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL))
      .then(() => faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL))
      .then(() => faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL))
      .then(() => { setModelsReady(true); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  // ── Webcam loop ─────────────────────────────────────────────────────────────
  const detectWebcam = useCallback(async () => {
    const video   = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || video.readyState < 2 || !overlay) {
      animFrameRef.current = requestAnimationFrame(detectWebcam);
      return;
    }

    overlay.width  = video.videoWidth;
    overlay.height = video.videoHeight;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    try {
      const det = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
        .withFaceLandmarks(true)
        .withAgeAndGender()
        .withFaceExpressions();

      if (!webcamActiveRef.current) return; // switched away mid-await

      if (det) {
        drawOverlays(ctx, det);
        const now = Date.now();
        if (now - lastResultTs.current > 250) {
          lastResultTs.current = now;
          setResult({
            age: det.age,
            gender: det.gender,
            genderProbability: det.genderProbability,
            expressions: det.expressions,
            pose: estimateHeadPose(det.landmarks),
            smile: smileIntensity(det.landmarks),
          });
        }
        setStatus('scanning');
      } else {
        if (Date.now() - lastResultTs.current > 800) {
          setResult('none');
          setStatus('ready');
        }
      }
    } catch { /* ignore frame errors */ }

    if (webcamActiveRef.current) {
      animFrameRef.current = requestAnimationFrame(detectWebcam);
    }
  }, []);

  const startWebcam = useCallback(async () => {
    setError(null);
    setResult(null);
    webcamActiveRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCamReady(true);
          animFrameRef.current = requestAnimationFrame(detectWebcam);
        };
      }
    } catch {
      webcamActiveRef.current = false;
      setError('Camera access denied. Allow camera permissions and try again.');
      setMode('photo');
    }
  }, [detectWebcam]);

  const stopWebcam = useCallback(() => {
    webcamActiveRef.current = false;
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCamReady(false);
    setResult(null);
    setStatus('ready');
  }, []);


  const handleModeChange = useCallback((next) => {
    if (next === mode) return;
    if (mode === 'webcam') stopWebcam();
    setMode(next);
    setResult(null);
    setError(null);
    setImgSrc(null);
    if (next === 'webcam') startWebcam();
  }, [mode, stopWebcam, startWebcam]);

  useEffect(() => () => stopWebcam(), [stopWebcam]);

  // ── Photo detection ──────────────────────────────────────────────────────────
  const detect = useCallback(async (src) => {
    setError(null);
    setResult(null);
    setScanning(true);
    setStatus('scanning');
    setImgSrc(src);

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
        const det = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
          .withFaceLandmarks(true)
          .withAgeAndGender()
          .withFaceExpressions();

        if (!det) { setResult('none'); } else {
          drawOverlays(ctx, det);
          setResult({
            age: det.age,
            gender: det.gender,
            genderProbability: det.genderProbability,
            expressions: det.expressions,
            pose: estimateHeadPose(det.landmarks),
            smile: smileIntensity(det.landmarks),
          });
        }
      } catch { setError('Detection failed.'); }

      setScanning(false);
      setStatus('ready');
    };

    img.onerror = () => {
      setError('Could not load image. Check the URL or try a different image.');
      setScanning(false);
      setStatus('ready');
    };
  }, []);

  const captureFromWebcam = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const snap = document.createElement('canvas');
    snap.width  = video.videoWidth;
    snap.height = video.videoHeight;
    const ctx = snap.getContext('2d');
    ctx.translate(snap.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = snap.toDataURL('image/png');
    stopWebcam();
    setMode('photo');
    setResult(null);
    setImgSrc(null);
    setTimeout(() => detect(dataUrl), 50);
  }, [detect, stopWebcam]);

  const handleFile = useCallback((file) => {
    if (!file?.type.startsWith('image/')) return;
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
        <Header status={status} mode={mode} onModeChange={() => {}} />
        <div className="models-loading">
          <div className="spinner" />
          <div className="models-loading-text">Loading neural networks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header status={status} mode={mode} onModeChange={handleModeChange} />
      {error && <div className="error-banner">⚠ {error}</div>}

      <div className="main">
        <div className="canvas-panel">

          {/* ── WEBCAM MODE ── */}
          {mode === 'webcam' && (
            <>
              <div className="canvas-wrap">
                <div className="canvas-inner-tl" />
                <div className="canvas-inner-br" />
                {status === 'scanning' && <div className="scanning-line" />}
                <div className="webcam-wrap">
                  <video ref={videoRef} className="webcam-video" autoPlay muted playsInline />
                  <canvas ref={overlayRef} className="webcam-overlay" />
                  {!camReady && (
                    <div className="canvas-empty">
                      <div className="spinner" />
                      <div className="canvas-empty-text">Starting camera...</div>
                    </div>
                  )}
                </div>
                {camReady && (
                  <button className="capture-btn" onClick={captureFromWebcam} title="Capture frame and analyse">
                    ◉ CAPTURE
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── PHOTO MODE ── */}
          {mode === 'photo' && (
            <>
              <div className="canvas-wrap">
                <div className="canvas-inner-tl" />
                <div className="canvas-inner-br" />
                {scanning && <div className="scanning-line" />}
                {imgSrc
                  ? (
                    <>
                      <canvas ref={canvasRef} className="canvas-el" />
                      <button className="clear-btn" onClick={() => { setImgSrc(null); setResult(null); setError(null); }} title="Clear image">✕</button>
                    </>
                  )
                  : (
                    <div className="canvas-empty">
                      <div className="canvas-empty-icon">◎</div>
                      <div className="canvas-empty-text">No image loaded</div>
                    </div>
                  )
                }
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

              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files?.[0])} />
            </>
          )}
        </div>

        <Readout result={result} scanning={scanning && mode === 'photo'} />
      </div>
    </div>
  );
}
