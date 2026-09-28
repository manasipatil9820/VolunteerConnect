import { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, CheckCircle2, Loader2, ScanFace } from 'lucide-react';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function drawCornerBox(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string,
) {
  const cs = Math.min(w, h) * 0.22;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.lineCap = 'round';
  const corners: [number, number][][] = [
    [[x, y + cs], [x, y], [x + cs, y]],
    [[x + w - cs, y], [x + w, y], [x + w, y + cs]],
    [[x, y + h - cs], [x, y + h], [x + cs, y + h]],
    [[x + w - cs, y + h], [x + w, y + h], [x + w, y + h - cs]],
  ];
  corners.forEach(pts => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    pts.slice(1).forEach(([px, py]) => ctx.lineTo(px, py));
    ctx.stroke();
  });
}

export interface FaceCaptureData {
  photo: string;
  descriptor: number[];
}

interface FaceCaptureProps {
  onCapture: (data: FaceCaptureData) => void;
  onSkip: () => void;
}

type Status = 'loading' | 'ready' | 'capturing' | 'captured' | 'error';

export default function FaceCapture({ onCapture, onSkip }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const genRef = useRef(0);

  const [status, setStatus] = useState<Status>('loading');
  const [loadingMsg, setLoadingMsg] = useState('Loading AI models...');
  const [faceDetected, setFaceDetected] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);

  const runLoop = useCallback(async (gen: number) => {
    while (genRef.current === gen) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2) {
        try {
          const det = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
            .withFaceLandmarks(true);
          if (genRef.current !== gen) break;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (det) {
              setFaceDetected(true);
              const { x, y, width, height } = det.detection.box;
              drawCornerBox(ctx, x, y, width, height, '#22c55e');
            } else {
              setFaceDetected(false);
            }
          }
        } catch { /* ignore per-frame errors */ }
      }
      await sleep(150);
    }
  }, []);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 },
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        if (!faceapi.nets.tinyFaceDetector.isLoaded) {
          setLoadingMsg('Loading detection model...');
          await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        }
        if (!faceapi.nets.faceLandmark68TinyNet.isLoaded) {
          setLoadingMsg('Loading landmark model...');
          await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
        }
        if (!faceapi.nets.faceRecognitionNet.isLoaded) {
          setLoadingMsg('Loading recognition model (~6 MB, first time only)...');
          await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        }
        if (!mounted) return;
        setLoadingMsg('Starting camera...');
        await startCamera();
        if (!mounted) return;
        setStatus('ready');
        const gen = ++genRef.current;
        runLoop(gen);
      } catch {
        if (mounted) setStatus('error');
      }
    };
    init();
    return () => {
      mounted = false;
      genRef.current++;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [runLoop]);

  const handleCapture = async () => {
    if (!videoRef.current || !faceDetected) return;
    setStatus('capturing');
    genRef.current++; // stop loop
    try {
      const result = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor();
      if (!result) {
        setStatus('ready');
        const gen = ++genRef.current;
        runLoop(gen);
        return;
      }
      // Snapshot
      const c = document.createElement('canvas');
      c.width = videoRef.current.videoWidth;
      c.height = videoRef.current.videoHeight;
      c.getContext('2d')!.drawImage(videoRef.current, 0, 0);
      const photo = c.toDataURL('image/jpeg', 0.85);
      streamRef.current?.getTracks().forEach(t => t.stop());
      setCapturedPhoto(photo);
      setCapturedDescriptor(Array.from(result.descriptor));
      setStatus('captured');
    } catch {
      setStatus('ready');
      const gen = ++genRef.current;
      runLoop(gen);
    }
  };

  const handleRetake = async () => {
    setCapturedPhoto(null);
    setCapturedDescriptor(null);
    setFaceDetected(false);
    setStatus('loading');
    setLoadingMsg('Restarting camera...');
    try {
      await startCamera();
      setStatus('ready');
      const gen = ++genRef.current;
      runLoop(gen);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Camera preview */}
      <div
        className="relative overflow-hidden rounded-xl bg-black"
        style={{ aspectRatio: '4/3', maxHeight: 300 }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ display: status === 'captured' ? 'none' : 'block' }}
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full"
          style={{ display: status === 'captured' ? 'none' : 'block' }}
        />
        {capturedPhoto && status === 'captured' && (
          <img src={capturedPhoto} alt="Captured face" className="w-full h-full object-cover" />
        )}

        {/* Loading overlay */}
        {(status === 'loading' || status === 'capturing') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 text-white gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-green-400" />
            <p className="text-sm font-medium px-4 text-center">
              {status === 'capturing' ? 'Extracting face data…' : loadingMsg}
            </p>
          </div>
        )}

        {/* Captured badge */}
        {status === 'captured' && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            <CheckCircle2 className="h-3.5 w-3.5" /> Captured
          </div>
        )}

        {/* Face guidance pill */}
        {status === 'ready' && (
          <div
            className={`absolute bottom-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
              faceDetected
                ? 'bg-green-600/90 text-white'
                : 'bg-black/60 text-gray-200'
            }`}
          >
            {faceDetected ? '✓ Face detected — ready to capture' : 'Position your face in the frame'}
          </div>
        )}

        {/* Error overlay */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-3 text-center p-6">
            <ScanFace className="h-10 w-10 text-red-400" />
            <p className="text-sm font-medium">Camera access denied or not available.</p>
            <p className="text-xs text-gray-400">You can skip Face ID and set it up later.</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {status === 'captured' ? (
          <>
            <Button variant="outline" onClick={handleRetake} className="flex-1 gap-2">
              <RefreshCw className="h-4 w-4" /> Retake
            </Button>
            <Button
              onClick={() =>
                capturedPhoto && capturedDescriptor &&
                onCapture({ photo: capturedPhoto, descriptor: capturedDescriptor })
              }
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4" /> Use This Photo
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onSkip} className="flex-1 text-muted-foreground">
              Skip for now
            </Button>
            <Button
              onClick={handleCapture}
              disabled={!faceDetected || status !== 'ready'}
              className="flex-1 gap-2"
            >
              <Camera className="h-4 w-4" /> Capture Face
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
