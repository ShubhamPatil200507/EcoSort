import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, StopCircle, FlipHorizontal, AlertCircle, CheckCircle } from 'lucide-react';

interface CameraInputProps {
  onCapture: (blob: Blob, previewUrl: string) => void;
  isProcessing: boolean;
}

export const CameraInput: React.FC<CameraInputProps> = ({ onCapture, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera access is not supported by this browser.');
      return;
    }

    try {
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setCameraActive(true);
      setCapturedImage(null);
      setCapturedBlob(null);
    } catch (err: any) {
      let msg = 'Failed to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera permissions in your browser or use the file upload option.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera device found on this system.';
      }
      setError(msg);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Restart camera when facingMode changes if already active
  useEffect(() => {
    if (cameraActive) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const previewUrl = URL.createObjectURL(blob);
          setCapturedImage(previewUrl);
          setCapturedBlob(blob);
          stopCamera();
        }
      },
      'image/jpeg',
      0.92
    );
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera();
  };

  const handleConfirmClassification = () => {
    if (capturedBlob && capturedImage) {
      onCapture(capturedBlob, capturedImage);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Camera Unavailable</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Viewport Area */}
      <div className="relative aspect-video w-full max-w-xl mx-auto rounded-2xl overflow-hidden bg-stone-900 border-2 border-stone-800 shadow-inner flex items-center justify-center">
        {capturedImage ? (
          // Captured Still Preview
          <div className="relative w-full h-full">
            <img
              src={capturedImage}
              alt="Captured waste frame"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Frame Captured</span>
            </div>
          </div>
        ) : cameraActive ? (
          // Active Live Video
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Target Guidelines */}
            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/40 m-8 rounded-2xl flex items-center justify-center">
              <div className="text-white/60 text-xs px-2 py-1 bg-black/30 rounded backdrop-blur-xs">
                Center the waste item inside the frame
              </div>
            </div>
            {/* Live Camera Tag */}
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-red-600/90 rounded-full text-white text-[11px] font-semibold flex items-center gap-1.5 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-white" />
              <span>LIVE</span>
            </div>
          </div>
        ) : (
          // Inactive Prompt State
          <div className="text-center p-6 text-stone-400">
            <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-300">
              <Camera className="w-8 h-8" />
            </div>
            <p className="text-stone-300 font-medium text-sm">Real-Time Camera Scanner</p>
            <p className="text-stone-500 text-xs mt-1 max-w-xs mx-auto">
              Click Start Camera below to inspect your waste item directly using your webcam or phone camera.
            </p>
          </div>
        )}
      </div>

      {/* Control Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!cameraActive && !capturedImage && (
          <button
            type="button"
            onClick={startCamera}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Camera className="w-5 h-5" />
            <span>Start Camera</span>
          </button>
        )}

        {cameraActive && (
          <>
            <button
              type="button"
              onClick={captureFrame}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <span>Capture Photo</span>
            </button>
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="flex items-center gap-2 px-4 py-3 bg-stone-700 hover:bg-stone-800 text-white rounded-xl text-sm transition-colors cursor-pointer"
              title="Switch camera"
            >
              <FlipHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Flip Camera</span>
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="flex items-center gap-2 px-4 py-3 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-sm transition-colors cursor-pointer"
            >
              <StopCircle className="w-4 h-4" />
              <span>Stop</span>
            </button>
          </>
        )}

        {capturedImage && (
          <>
            <button
              type="button"
              onClick={handleConfirmClassification}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{isProcessing ? 'Analyzing Waste Item...' : 'Classify This Image'}</span>
            </button>
            <button
              type="button"
              onClick={handleRetake}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-3 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
