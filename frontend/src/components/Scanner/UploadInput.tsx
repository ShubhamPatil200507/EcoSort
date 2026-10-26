import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Trash2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface UploadInputProps {
  onFileSelect: (file: File, previewUrl: string) => void;
  isProcessing: boolean;
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp'];

export const UploadInput: React.FC<UploadInputProps> = ({ onFileSelect, isProcessing }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateAndProcessFile = (file: File) => {
    setValidationError(null);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTS.includes(ext)) {
      setValidationError(`Unsupported file format (.$${ext}). Supported formats: JPG, JPEG, PNG, WebP.`);
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setValidationError(`File is too large (${mb} MB). Maximum allowed size is 10 MB.`);
      return;
    }

    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClassify = () => {
    if (selectedFile && previewUrl) {
      onFileSelect(selectedFile, previewUrl);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {validationError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Upload Validation Error</p>
            <p className="mt-0.5">{validationError}</p>
          </div>
        </div>
      )}

      {!previewUrl ? (
        // Dropzone Area
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full max-w-xl mx-auto border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
            isDragOver
              ? 'border-emerald-600 bg-emerald-50 scale-[1.01]'
              : 'border-stone-300 hover:border-emerald-500 bg-stone-50/80 hover:bg-stone-50'
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 shadow-sm">
            <Upload className="w-8 h-8" />
          </div>
          <p className="text-stone-800 font-semibold text-base">
            Drag & drop your waste image here
          </p>
          <p className="text-stone-500 text-xs mt-1">
            Or <span className="text-emerald-700 font-semibold underline">browse files</span> from your computer or phone
          </p>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-stone-400 font-medium">
            <span>Supports JPG, PNG, WebP</span>
            <span>•</span>
            <span>Up to 10 MB</span>
          </div>
        </div>
      ) : (
        // Image Preview & Actions Area
        <div className="w-full max-w-xl mx-auto space-y-4">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-900 border border-stone-200 shadow-md flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Selected waste preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-white text-xs flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[200px]">{selectedFile?.name}</span>
              <span className="text-stone-400">
                ({((selectedFile?.size || 0) / 1024).toFixed(0)} KB)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleClassify}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span>{isProcessing ? 'Analyzing Image...' : 'Classify This Waste'}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Replace</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3.5 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm transition-colors cursor-pointer"
              title="Remove image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
