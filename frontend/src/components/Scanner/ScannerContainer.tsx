import React, { useState } from 'react';
import { Upload, Camera, Smartphone, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { CameraInput } from './CameraInput';
import { UploadInput } from './UploadInput';
import { SampleGallery } from './SampleGallery';
import { classifyAndRecommend, classifySample } from '../../services/api';
import { ClassificationAndRecommendation } from '../../types';

interface ScannerContainerProps {
  onClassificationComplete: (result: ClassificationAndRecommendation, previewUrl: string) => void;
}

type InputMode = 'upload' | 'camera' | 'mobile' | 'samples';

const ECO_TIPS = [
  'Recycling 1 aluminum can saves enough energy to run a TV for 3 hours.',
  'Lithium batteries should never be tossed into household bins — they cause severe landfill fires.',
  'Flattening cardboard boxes doubles municipal collection truck capacity.',
  'Rinsing food containers prevents mold contamination across entire recycling batches.',
  'E-waste contains 40-50x richer deposits of precious metals than raw mined ore.',
];

export const ScannerContainer: React.FC<ScannerContainerProps> = ({ onClassificationComplete }) => {
  const [activeMode, setActiveMode] = useState<InputMode>('upload');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTipIndex, setCurrentTipIndex] = useState<number>(0);

  const startAnalysis = async (fileOrBlob: File | Blob, previewUrl: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentTipIndex(Math.floor(Math.random() * ECO_TIPS.length));

    try {
      const result = await classifyAndRecommend(fileOrBlob);
      onClassificationComplete(result, previewUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Classification request failed. Please check your image and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSampleSelected = async (sampleId: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentTipIndex(Math.floor(Math.random() * ECO_TIPS.length));

    try {
      const result = await classifySample(sampleId);
      // Construct sample preview url
      const previewUrl = `/static/samples/${sampleId}.jpg`;
      onClassificationComplete(result, previewUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Sample classification failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMobileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      startAnalysis(file, preview);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Mode Selection Tabs */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1.5 bg-stone-100 rounded-2xl border border-stone-200 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMode === 'upload'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('camera')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMode === 'camera'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('mobile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMode === 'mobile'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile Snap</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('samples')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMode === 'samples'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Test Samples</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm flex items-start gap-3 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-950">Classification Error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold text-red-900 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Panel Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm relative overflow-hidden">
        {isProcessing && (
          // Analysis Loading Overlay
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
              <Loader2 className="w-8 h-8 text-emerald-700 absolute inset-0 m-auto animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              Running Neural Network Inference...
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm">
              MobileNetV3 is evaluating visual features, material textures, and resin traits.
            </p>
            <div className="mt-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl max-w-md text-xs text-emerald-900">
              <span className="font-bold">Eco Tip: </span>
              {ECO_TIPS[currentTipIndex]}
            </div>
          </div>
        )}

        {activeMode === 'upload' && (
          <UploadInput onFileSelect={startAnalysis} isProcessing={isProcessing} />
        )}

        {activeMode === 'camera' && (
          <CameraInput onCapture={startAnalysis} isProcessing={isProcessing} />
        )}

        {activeMode === 'mobile' && (
          <div className="text-center p-8 max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-800">
              <Smartphone className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Device Camera Capture</h3>
            <p className="text-xs text-stone-500">
              On mobile phones and tablets, tap below to launch your native camera app directly.
            </p>
            <label className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md cursor-pointer transition-colors">
              <Camera className="w-5 h-5" />
              <span>Launch Device Camera</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleMobileCapture}
                className="hidden"
              />
            </label>
          </div>
        )}

        {activeMode === 'samples' && (
          <SampleGallery onSelectSample={handleSampleSelected} isProcessing={isProcessing} />
        )}
      </div>
    </div>
  );
};
