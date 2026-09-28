import { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ShieldX, Loader2, ScanFace } from 'lucide-react';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
const MATCH_THRESHOLD = 0.45;
const UNCERTAIN_THRESHOLD = 0.55;
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

type VerifyStatus = 'loading' | 'no-face' | 'matched' | 'uncertain' | 'no-match' | 'error';

interface FaceVerifyProps {
  storedDescriptor: number[];
  onClose: () => void;
}

export default function FaceVerify({ storedDescriptor, onClose }: FaceVerifyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const genRef = useRef(0);
  const storedFD = useRef(new Float32Array(storedDescriptor));

  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [loadingMsg, setLoadingMsg] = useState('Initializing Face ID...');
  const [similarity, setSimilarity] = useState<number | null>(null);

  const runLoop = useCallback(async (gen: number) => {
    while (genRef.current === gen) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2) {
        try {
          const det = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
            .withFaceLandmarks(true)
            .withFaceDescriptor();
          if (genRef.current !== gen) break;
          const ctx = canvas.getContext('2d');
          if (!ctx) break;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (det) {
            const dist = faceapi.euclideanDistance(
              Array.from(storedFD.current),
              Array.from(det.descriptor),
            );
            const sim = Math.round((1 - Math.min(dist, 1)) * 100);
            setSimilarity(sim);
            let color = '#ef4444';
            let vs: VerifyStatus = 'no-match';
            if (dist < MATCH_THRESHOLD) { color = '#22c55e'; vs = 'matched'; }
            else if (dist < UNCERTAIN_THRESHOLD) { color = '#f59e0b'; vs = 'uncertain'; }
            setStatus(vs);
            const { x, y, width, height } = det.detection.box;
            drawCornerBox(ctx, x, y, width, height, color);
          } else {
            setStatus('no-face');
            setSimilarity(null);
          }
        } catch { /* ignore per-frame errors */ }
      }
      await sleep(200);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        // Models may already be loaded from registration step
        if (!faceapi.nets.tinyFaceDetector.isLoaded) {
          setLoadingMsg('Loading models...');
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          ]);
        }
        if (!mounted) return;
        setLoadingMsg('Starting camera...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('no-face');
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

  const statusConfig = {
    matched: {
      bg: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400',
      icon: <ShieldCheck className="h-8 w-8 shrink-0" />,
      title: 'Identity Verified ✓',
      desc: 'Your face matches the registered profile.',
    },
    uncertain: {
      bg: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400',
      icon: <ShieldX className="h-8 w-8 shrink-0" />,
      title: 'Low Confidence ⚠',
      desc: 'Partial match. Try better lighting or straighten your face.',
    },
    'no-match': {
      bg: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400',
      icon: <ShieldX className="h-8 w-8 shrink-0" />,
      title: 'Identity Not Matched ✗',
      desc: 'Your face does not match the registered volunteer profile.',
    },
  } as const;

  const activeConfig = status === 'matched' || status === 'uncertain' || status === 'no-match'
    ? statusConfig[status]
    : null;

  return (
    <div className="space-y-4">
      {/* Live camera */}
      <div
        className="relative overflow-hidden rounded-xl bg-black"
        style={{ aspectRatio: '4/3', maxHeight: 280 }}
      >
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full"
        />

        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-green-400" />
            <p className="text-sm font-medium">{loadingMsg}</p>
          </div>
        )}

        {status === 'no-face' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap">
            Position your face in the frame
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-3 text-center p-6">
            <ScanFace className="h-10 w-10 text-red-400" />
            <p className="text-sm font-medium">Camera unavailable or access denied.</p>
          </div>
        )}

        {/* Live label */}
        {(status === 'matched' || status === 'uncertain' || status === 'no-match') && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow animate-pulse">
            ● LIVE
          </div>
        )}
      </div>

      {/* Result card */}
      {activeConfig && similarity !== null && (
        <div className={`flex items-center gap-4 p-4 rounded-xl border animate-fade-in ${activeConfig.bg}`}>
          {activeConfig.icon}
          <div>
            <p className="font-bold text-sm">{activeConfig.title}</p>
            <p className="text-xs opacity-80 mt-0.5">{activeConfig.desc}</p>
            <p className="text-xs mt-1.5 font-mono font-semibold opacity-70">
              Match confidence: {similarity}%
            </p>
          </div>
        </div>
      )}

      <Button variant="outline" onClick={onClose} className="w-full">
        Close Verification
      </Button>
    </div>
  );
}
