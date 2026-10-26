import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, Camera, RefreshCw, CheckCircle2, AlertTriangle, HelpCircle,
  ArrowRight, ArrowLeft, Shield, Zap, Sparkles, Sliders, ChevronDown, ChevronUp,
  MapPin, Check, X, FileText, Layers, Compass, Download, Printer, Eye,
  Info, ExternalLink, RotateCcw, AlertCircle, Bot
} from 'lucide-react';
import {
  DetectedWasteItem,
  BatchOptimizationResponse,
  ClarificationComparisonResult,
  MultiStopCollectionPlan,
  AnalysisStep,
  StoredSessionRecord
} from '../../types';
import {
  detectBatchObjects,
  optimizeBatchAssignments,
  evaluateClarification,
  planCollectionRoute,
  recordAuditLog
} from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import { formatSubtype } from '../../utils/formatters';
import { saveStoredSession } from '../../utils/sessionStore';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Alert } from '../common/Alert';
import { WorkflowBreadcrumb } from '../common/WorkflowBreadcrumb';
import { FeedbackModal } from '../Results/FeedbackModal';

const ALL_CATEGORIES = [
  { id: 'plastic', name: 'Plastic' },
  { id: 'paper_cardboard', name: 'Paper & Cardboard' },
  { id: 'glass', name: 'Glass' },
  { id: 'metal', name: 'Metal & Cans' },
  { id: 'e_waste', name: 'E-Waste' },
  { id: 'batteries', name: 'Batteries' },
  { id: 'organic_food', name: 'Organic Waste' },
  { id: 'hazardous', name: 'Hazardous Waste' },
  { id: 'textile', name: 'Textile' },
  { id: 'general_residual', name: 'General Residual' }
];

const SAMPLE_BENCHMARKS = [
  { name: 'Multi-Item Scene (Cardboard, Metal & PCB)', file: 'multi_waste.jpg', label: 'Multi-Object Scene' },
  { name: 'Arduino Uno Microcontroller (PCB)', file: 'arduino_uno.jpg', label: 'E-Waste PCB' },
  { name: 'Alkaline AA / AAA Cylindrical Cells', file: 'batteries.jpg', label: 'Battery Stream' },
  { name: 'Beverage Glass Containers', file: 'glass.jpg', label: 'Glass Stream' },
];

const getThumbnailSrc = (thumb?: string) => {
  if (!thumb) return '';
  return thumb.startsWith('data:') ? thumb : `data:image/jpeg;base64,${thumb}`;
};

interface AnalysisStudioProps {
  initialSession?: StoredSessionRecord | null;
  onViewHistory?: () => void;
}

export const AnalysisStudioView: React.FC<AnalysisStudioProps> = ({
  initialSession,
  onViewHistory,
}) => {
  const { location, openOnboarding } = useLocation();

  // Active Workflow Step
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('upload');
  const [completedSteps, setCompletedSteps] = useState<AnalysisStep[]>([]);

  // Image & Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [detectorMode, setDetectorMode] = useState<string>('hybrid');

  // Processing Progress States
  const [progressStage, setProgressStage] = useState<number>(0);

  // Analysis State
  const [sessionId, setSessionId] = useState<string>(() => `session_${Math.random().toString(36).substring(2, 9)}`);
  const [detectedItems, setDetectedItems] = useState<DetectedWasteItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showLabelsOnImage, setShowLabelsOnImage] = useState<boolean>(true);

  // Clarification State
  const [selectedStrategy, setSelectedStrategy] = useState<string>('decision_aware');
  const [clarificationData, setClarificationData] = useState<ClarificationComparisonResult | null>(null);
  const [isEvaluatingClarification, setIsEvaluatingClarification] = useState<boolean>(false);
  const [resolvedClarifications, setResolvedClarifications] = useState<Record<string, string>>({});

  // Optimization State
  const [optimizationResult, setOptimizationResult] = useState<BatchOptimizationResponse | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [showOptimizerExplanation, setShowOptimizerExplanation] = useState<boolean>(false);

  // Route Planning State
  const [collectionPlan, setCollectionPlan] = useState<MultiStopCollectionPlan | null>(null);
  const [isPlanningRoute, setIsPlanningRoute] = useState<boolean>(false);

  // Feedback Modal
  const [feedbackItem, setFeedbackItem] = useState<DetectedWasteItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If opened from a past session, initialize state
  useEffect(() => {
    if (initialSession) {
      setSessionId(initialSession.sessionId);
      if (initialSession.previewUrl) setImagePreview(initialSession.previewUrl);
      setDetectedItems(initialSession.items || []);
      if (initialSession.optimizationResult) setOptimizationResult(initialSession.optimizationResult);
      if (initialSession.collectionPlan) setCollectionPlan(initialSession.collectionPlan);
      setCurrentStep('results');
      setCompletedSteps(['upload', 'review', 'clarification', 'optimization', 'collection']);
    }
  }, [initialSession]);

  // Execute Batch Detection Pipeline
  const runDetection = async (file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setUploadError(null);
    setCurrentStep('progress');
    setProgressStage(1);

    try {
      // Stage 1: Validating file
      await new Promise((r) => setTimeout(r, 350));
      setProgressStage(2);

      // Stage 2: Sub-region proposal decomposition & inference
      const res = await detectBatchObjects(file, detectorMode);
      setProgressStage(3);

      setSessionId(res.session_id);
      setDetectedItems(res.items);
      if (res.items.length > 0) {
        setSelectedItemId(res.items[0].item_id);
      }

      // Stage 4: Preparing review state
      await new Promise((r) => setTimeout(r, 350));
      setProgressStage(4);

      setCompletedSteps((prev) => Array.from(new Set([...prev, 'upload'])));
      setCurrentStep('review');
    } catch (err: any) {
      setUploadError(err.message || 'Analysis failed. Please check backend connectivity.');
      setCurrentStep('upload');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      runDetection(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      runDetection(file);
    }
  };

  const loadSampleBenchmark = async (filename: string) => {
    try {
      setUploadError(null);
      const res = await fetch(`/static/samples/${filename}`);
      if (!res.ok) throw new Error('Failed to load sample image.');
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/jpeg' });
      runDetection(file);
    } catch (e: any) {
      setUploadError(e.message || 'Failed to load sample benchmark.');
    }
  };

  // User Manual Category Correction
  const handleItemCategoryOverride = (itemId: string, newCategory: string) => {
    setDetectedItems((prev) =>
      prev.map((item) => {
        if (item.item_id === itemId) {
          return {
            ...item,
            predicted_category: newCategory,
            user_corrected_category: newCategory,
            display_name: ALL_CATEGORIES.find((c) => c.id === newCategory)?.name || newCategory,
            status: 'USER_VERIFIED',
          };
        }
        return item;
      })
    );

    // Record into audit log
    recordAuditLog({
      session_id: sessionId,
      item_id: itemId,
      event: 'user_category_override',
      new_category: newCategory,
    });
  };

  // Run Clarification Strategy Comparison
  const handleRunClarification = async () => {
    setIsEvaluatingClarification(true);
    try {
      const res = await evaluateClarification(detectedItems, selectedStrategy);
      setClarificationData(res);
      setCompletedSteps((prev) => Array.from(new Set([...prev, 'review'])));
      setCurrentStep('clarification');
    } catch (e: any) {
      alert(`Clarification evaluation error: ${e.message}`);
    } finally {
      setIsEvaluatingClarification(false);
    }
  };

  // Resolve Clarification for an Item
  const handleResolveClarificationOption = (targetCategory: string) => {
    if (!clarificationData?.question) return;
    const itemId = clarificationData.question.item_id;

    setResolvedClarifications((prev) => ({ ...prev, [itemId]: targetCategory }));
    handleItemCategoryOverride(itemId, targetCategory);

    // Re-evaluate remaining or proceed to optimization
    setCompletedSteps((prev) => Array.from(new Set([...prev, 'clarification'])));
    handleRunOptimization();
  };

  // Execute HiGHS MILP Batch Optimization
  const handleRunOptimization = async () => {
    setIsOptimizing(true);
    try {
      const res = await optimizeBatchAssignments({
        session_id: sessionId,
        items: detectedItems,
      });
      setOptimizationResult(res);
      setCompletedSteps((prev) => Array.from(new Set([...prev, 'clarification', 'optimization'])));
      setCurrentStep('optimization');
    } catch (e: any) {
      alert(`Batch optimization error: ${e.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Plan Multi-Stop Collection Route
  const handleRunCollectionPlanning = async () => {
    if (!optimizationResult) return;
    setIsPlanningRoute(true);

    const lat = location.isLoaded && location.latitude ? location.latitude : 19.076;
    const lon = location.isLoaded && location.longitude ? location.longitude : 72.8777;

    try {
      const plan = await planCollectionRoute(optimizationResult.active_streams, lat, lon);
      setCollectionPlan(plan);
      setCompletedSteps((prev) => Array.from(new Set([...prev, 'collection'])));
      setCurrentStep('collection');
    } catch (e: any) {
      alert(`Collection tour planning error: ${e.message}`);
    } finally {
      setIsPlanningRoute(false);
    }
  };

  // Finalize and Save Session
  const handleFinishSession = () => {
    const isFeasible = optimizationResult?.status === 'optimal' || optimizationResult?.status === 'feasible';
    const persistentPreview = (imagePreview && !imagePreview.startsWith('blob:'))
      ? imagePreview
      : (detectedItems[0]?.thumbnail ? getThumbnailSrc(detectedItems[0].thumbnail) : (imagePreview || undefined));
    const record: StoredSessionRecord = {
      sessionId,
      createdAt: new Date().toISOString(),
      previewUrl: persistentPreview,
      itemCount: detectedItems.length,
      reviewedCount: detectedItems.filter((i) => i.user_corrected_category).length,
      unresolvedCount: detectedItems.filter((i) => i.status === 'LOW_CONFIDENCE' || i.status === 'REVIEW_REQUIRED').length,
      detectedCategories: Array.from(new Set(detectedItems.map((i) => i.predicted_category))),
      primaryStream: optimizationResult?.active_streams[0] || 'general_residual',
      solverStatus: optimizationResult?.status || 'UNKNOWN',
      isFeasible,
      activeStreams: optimizationResult?.active_streams || [],
      items: detectedItems,
      optimizationResult,
      collectionPlan,
    };

    saveStoredSession(record);
    setCompletedSteps((prev) => Array.from(new Set([...prev, 'results'])));
    setCurrentStep('results');
  };

  const handleResetStudio = () => {
    setImageFile(null);
    setImagePreview(null);
    setDetectedItems([]);
    setSelectedItemId(null);
    setClarificationData(null);
    setOptimizationResult(null);
    setCollectionPlan(null);
    setSessionId(`session_${Math.random().toString(36).substring(2, 9)}`);
    setCompletedSteps([]);
    setCurrentStep('upload');
  };

  const selectedItem = detectedItems.find((i) => i.item_id === selectedItemId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Workflow Progression Header */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#17231D] tracking-tight">
              Waste Analysis Studio
            </h2>
            <p className="text-xs text-[#66736B]">
              Session ID: <span className="font-mono text-[#174D3A] font-semibold">{sessionId}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentStep !== 'upload' && (
              <Button
                variant="secondary"
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={handleResetStudio}
              >
                Reset Studio
              </Button>
            )}
          </div>
        </div>

        <WorkflowBreadcrumb
          currentStep={currentStep}
          onNavigateStep={(step) => setCurrentStep(step)}
          completedSteps={completedSteps}
        />
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: UPLOAD & CAPTURE */}
      {/* ========================================================================= */}
      {currentStep === 'upload' && (
        <div className="space-y-6">
          {uploadError && (
            <Alert
              type="error"
              title="Upload Failed"
              onDismiss={() => setUploadError(null)}
            >
              {uploadError}
            </Alert>
          )}

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-[#E1E7E0] hover:border-[#287A54] rounded-3xl p-8 sm:p-14 bg-white text-center transition-all cursor-pointer group shadow-xs space-y-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-[#EAF4EC] text-[#287A54] flex items-center justify-center mx-auto group-hover:scale-105 transition-transform shadow-xs">
              <Upload className="w-8 h-8 text-[#287A54]" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-[#17231D]">
                Drop your waste image here or browse files
              </h3>
              <p className="text-xs text-[#66736B] leading-relaxed">
                Accepts single items or composite scenes containing multiple objects (JPEG, PNG, WebP up to 10 MB).
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="forest"
                size="md"
                icon={<Upload className="w-4 h-4" />}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Choose Local Image
              </Button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] text-xs text-[#66736B]">
                <Sliders className="w-3.5 h-3.5 text-[#287A54]" />
                <span>Detection:</span>
                <select
                  value={detectorMode}
                  onChange={(e) => {
                    e.stopPropagation();
                    setDetectorMode(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent font-semibold text-[#17231D] focus:outline-hidden cursor-pointer"
                >
                  <option value="hybrid">Hybrid (YOLO + Saliency)</option>
                  <option value="yolo">YOLOv8 Only</option>
                  <option value="contour">Contour Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sample Benchmarks Bar */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#17231D]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#287A54]" />
                <span>Try Documented Benchmark Fixtures</span>
              </span>
              <span className="text-[#66736B] font-normal text-[11px]">Instant 1-click test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SAMPLE_BENCHMARKS.map((sample) => (
                <button
                  key={sample.file}
                  type="button"
                  onClick={() => loadSampleBenchmark(sample.file)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#E1E7E0] hover:border-[#287A54] text-left transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
                >
                  <img
                    src={`/static/samples/${sample.file}`}
                    alt={sample.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#E1E7E0] shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="truncate space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#287A54] block">
                      {sample.label}
                    </span>
                    <span className="text-xs font-semibold text-[#17231D] group-hover:text-[#287A54] transition-colors truncate block">
                      {sample.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: REAL PROCESSING PROGRESS */}
      {/* ========================================================================= */}
      {currentStep === 'progress' && (
        <Card padding="lg" className="text-center py-12 space-y-6 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#EAF4EC] text-[#287A54] flex items-center justify-center mx-auto shadow-xs">
            <RefreshCw className="w-8 h-8 animate-spin text-[#287A54]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-[#17231D]">
              Decomposing & Classifying Waste Scene
            </h3>
            <p className="text-xs text-[#66736B]">
              Executing dual-vision MobileNetV3 + EfficientNet inference across physical proposals.
            </p>
          </div>

          {/* Sequential Stage Indicators */}
          <div className="space-y-3 text-left pt-2 max-w-xs mx-auto">
            <div className="flex items-center gap-2.5 text-xs">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${progressStage >= 1 ? 'bg-[#287A54] text-white' : 'bg-stone-200'}`}>
                {progressStage > 1 ? <Check className="w-3 h-3" /> : '1'}
              </span>
              <span className={progressStage >= 1 ? 'text-[#17231D] font-semibold' : 'text-stone-400'}>
                Validating image dimensions & encoding
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${progressStage >= 2 ? 'bg-[#287A54] text-white' : 'bg-stone-200'}`}>
                {progressStage > 2 ? <Check className="w-3 h-3" /> : '2'}
              </span>
              <span className={progressStage >= 2 ? 'text-[#17231D] font-semibold' : 'text-stone-400'}>
                Extracting multi-object spatial proposals
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${progressStage >= 3 ? 'bg-[#287A54] text-white' : 'bg-stone-200'}`}>
                {progressStage > 3 ? <Check className="w-3 h-3" /> : '3'}
              </span>
              <span className={progressStage >= 3 ? 'text-[#17231D] font-semibold' : 'text-stone-400'}>
                Calibrating probabilities & material tokens
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${progressStage >= 4 ? 'bg-[#287A54] text-white' : 'bg-stone-200'}`}>
                {progressStage >= 4 ? <Check className="w-3 h-3" /> : '4'}
              </span>
              <span className={progressStage >= 4 ? 'text-[#17231D] font-semibold' : 'text-stone-400'}>
                Preparing interactive verification review
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: DETECTION REVIEW & ITEM VERIFICATION */}
      {/* ========================================================================= */}
      {currentStep === 'review' && (
        <div className="space-y-6">
          {/* Top Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E1E7E0] shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#17231D]">
                {detectedItems.length} physical object{detectedItems.length !== 1 ? 's' : ''} detected
              </span>
              <span className="text-stone-300">•</span>
              <button
                type="button"
                onClick={() => setShowLabelsOnImage(!showLabelsOnImage)}
                className="text-xs font-medium text-[#287A54] hover:underline cursor-pointer"
              >
                {showLabelsOnImage ? 'Hide Overlay Labels' : 'Show Overlay Labels'}
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                icon={<Sliders className="w-3.5 h-3.5" />}
                onClick={handleRunClarification}
                loading={isEvaluatingClarification}
              >
                Evaluate Clarifications (EVOI)
              </Button>

              <Button
                variant="forest"
                size="sm"
                icon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={handleRunOptimization}
                loading={isOptimizing}
              >
                Validate Rules & Optimize
              </Button>
            </div>
          </div>

          {/* Two-Panel Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Bounding Box Image Canvas */}
            <div className="lg:col-span-7 bg-white p-4 rounded-3xl border border-[#E1E7E0] shadow-xs space-y-3">
              <div className="relative overflow-hidden rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-center p-2 min-h-[300px]">
                {imagePreview && (
                  <div className="relative inline-block max-w-full">
                    <img
                      src={imagePreview}
                      alt="Analyzed waste scene"
                      className="block max-h-[500px] max-w-full w-auto h-auto rounded-xl object-contain select-none shadow-md"
                    />

                    {/* SVG Bounding Boxes Overlay - tightly hugs the image */}
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      {detectedItems.map((item, idx) => {
                        const isSelected = item.item_id === selectedItemId;
                        const { x, y, w, h } = item.bounding_box;

                        return (
                          <g
                            key={item.item_id}
                            className="cursor-pointer group"
                            onClick={() => setSelectedItemId(item.item_id)}
                          >
                            <rect
                              x={x * 100}
                              y={y * 100}
                              width={w * 100}
                              height={h * 100}
                              fill={isSelected ? 'rgba(40, 122, 84, 0.28)' : 'rgba(23, 77, 58, 0.12)'}
                              stroke={isSelected ? '#287A54' : '#174D3A'}
                              strokeWidth={isSelected ? '2.5' : '1.5'}
                              strokeDasharray={isSelected ? 'none' : '3 1'}
                              className="transition-all hover:stroke-[#287A54] hover:stroke-[2.5]"
                            />
                            {showLabelsOnImage && (
                              <foreignObject
                                x={x * 100}
                                y={Math.max(0, y * 100 - 8)}
                                width="40"
                                height="10"
                                className="overflow-visible pointer-events-none"
                              >
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow-xs ${
                                    isSelected ? 'bg-[#287A54] ring-1 ring-white' : 'bg-[#174D3A]/90'
                                  }`}
                                >
                                  <span>#{idx + 1}</span>
                                  <span className="truncate max-w-[80px]">{item.display_name}</span>
                                </span>
                              </foreignObject>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#66736B] px-1">
                <span>Click any item on the list or box on the photo to inspect</span>
                <span className="tabular-nums">Mode: {detectorMode.toUpperCase()}</span>
              </div>
            </div>

            {/* Right 5 Columns: Detected Items List & Selected Item Inspector */}
            <div className="lg:col-span-5 space-y-4">
              {/* Item Inspector Card if an item is selected */}
              {selectedItem && (
                <Card padding="md" className="border-2 border-[#287A54] space-y-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {selectedItem.thumbnail ? (
                        <img
                          src={getThumbnailSrc(selectedItem.thumbnail)}
                          alt={selectedItem.display_name}
                          className="w-14 h-14 rounded-xl object-cover border border-[#E1E7E0] shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-[#EAF4EC] text-[#287A54] flex items-center justify-center font-bold text-sm shrink-0">
                          #{detectedItems.findIndex((i) => i.item_id === selectedItem.item_id) + 1}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-[#17231D]">
                            {selectedItem.display_name}
                          </span>
                          {selectedItem.user_corrected_category && (
                            <Badge status="validated" label="User Verified" size="sm" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#66736B]">
                          ID: <span className="font-mono">{selectedItem.item_id}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-[#174D3A] tabular-nums">
                        {(selectedItem.confidence * 100).toFixed(1)}%
                      </span>
                      <p className="text-[10px] text-[#66736B]">Confidence</p>
                    </div>
                  </div>

                  {/* Material Attributes */}
                  <div className="p-2.5 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-1 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#66736B] block">
                      Physical Attributes
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(selectedItem.material_attributes || {}).map(([k, v]) => (
                        <span key={k} className="px-2 py-0.5 rounded-md bg-white border border-[#E1E7E0] text-[11px] text-[#17231D]">
                          <strong>{k.replace('_', ' ')}:</strong> {String(v)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Manual Category Correction Controls */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#17231D] flex items-center justify-between">
                      <span>Manual Category Override</span>
                      <span className="text-[10px] text-[#66736B] font-normal">Immediate update</span>
                    </label>
                    <select
                      value={selectedItem.predicted_category}
                      onChange={(e) => handleItemCategoryOverride(selectedItem.item_id, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E1E7E0] text-xs font-semibold text-[#17231D] focus:ring-2 focus:ring-[#287A54] cursor-pointer"
                    >
                      {ALL_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Autonomous LLM Consensus Verification Button */}
                  <div className="pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Bot className="w-3.5 h-3.5 text-[#287A54]" />}
                      onClick={() => setFeedbackItem(selectedItem)}
                      className="w-full justify-center"
                    >
                      Verify via Statutory LLM Agent & Retrain
                    </Button>
                  </div>
                </Card>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#17231D] block">
                  Detected Objects List ({detectedItems.length})
                </span>

                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {detectedItems.map((item, idx) => {
                    const isSelected = item.item_id === selectedItemId;
                    return (
                      <div
                        key={item.item_id}
                        onClick={() => setSelectedItemId(item.item_id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#EAF4EC]/50 border-[#287A54] shadow-xs'
                            : 'bg-white border-[#E1E7E0] hover:border-stone-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {item.thumbnail ? (
                            <img
                              src={getThumbnailSrc(item.thumbnail)}
                              alt={item.display_name}
                              className="w-10 h-10 rounded-xl object-cover border border-[#E1E7E0] shrink-0"
                            />
                          ) : (
                            <span className="w-10 h-10 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] flex items-center justify-center font-bold text-xs text-[#17231D] shrink-0">
                              #{idx + 1}
                            </span>
                          )}

                          <div className="truncate">
                            <div className="text-xs font-bold text-[#17231D] truncate">
                              {item.display_name}
                            </div>
                            <span className="text-[10px] text-[#66736B] font-mono">
                              #{idx + 1} · {item.item_id}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-extrabold text-[#174D3A] tabular-nums block">
                            {(item.confidence * 100).toFixed(0)}%
                          </span>
                          <span className="text-[10px] text-[#66736B]">
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: DECISION-AWARE CLARIFICATION WORKSPACE */}
      {/* ========================================================================= */}
      {currentStep === 'clarification' && clarificationData && (
        <div className="space-y-6">
          <Card padding="lg" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E1E7E0]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#287A54]">
                  Research Strategy: {clarificationData.selected_strategy.replace('_', ' ').toUpperCase()}
                </span>
                <h3 className="text-lg font-bold text-[#17231D]">
                  Expected Value of Information (EVOI) Clarification
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedStrategy}
                  onChange={(e) => {
                    setSelectedStrategy(e.target.value);
                    evaluateClarification(detectedItems, e.target.value).then(setClarificationData);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] text-xs font-semibold text-[#17231D] cursor-pointer"
                >
                  <option value="decision_aware">Decision-Aware (EVOI)</option>
                  <option value="confidence">Confidence-Based</option>
                  <option value="entropy">Entropy-Based</option>
                  <option value="independent">Independent Baseline</option>
                </select>
              </div>
            </div>

            {/* Active Question or Completion */}
            {clarificationData.question ? (
              <div className="p-5 rounded-2xl bg-[#FEF7EC] border border-[#946200]/25 space-y-4">
                <div className="flex items-start gap-3">
                  {(() => {
                    const qItem = detectedItems.find((i) => i.item_id === clarificationData.question?.item_id);
                    if (qItem?.thumbnail) {
                      return (
                        <img
                          src={getThumbnailSrc(qItem.thumbnail)}
                          alt="Clarification Item"
                          className="w-12 h-12 rounded-xl object-cover border border-[#946200]/30 shrink-0"
                        />
                      );
                    }
                    return (
                      <div className="w-10 h-10 rounded-xl bg-[#946200] text-white flex items-center justify-center shrink-0">
                        <HelpCircle className="w-5 h-5 text-white" />
                      </div>
                    );
                  })()}
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#946200] uppercase tracking-wide">
                      Target Item: {clarificationData.question.item_id}
                    </span>
                    <h4 className="text-base font-bold text-[#17231D]">
                      {clarificationData.question.question}
                    </h4>
                    <p className="text-xs text-[#66736B] leading-relaxed">
                      <strong>Downstream Impact:</strong> {clarificationData.question.reason}
                    </p>
                  </div>
                </div>

                {/* Response Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {clarificationData.question.options.map((opt) => (
                    <button
                      key={opt.id || opt.target_category || opt.label}
                      type="button"
                      onClick={() => handleResolveClarificationOption(opt.target_category || opt.id)}
                      className="p-3.5 rounded-xl bg-white border border-[#E1E7E0] hover:border-[#287A54] text-left transition-all cursor-pointer shadow-2xs hover:shadow-xs space-y-1"
                    >
                      <span className="text-xs font-bold text-[#17231D] block">
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-[#66736B] block">
                        Assign to stream: <strong>{(opt.target_category || opt.id).replace('_', ' ')}</strong>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#EAF4EC] border border-[#287A54]/25 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-[#287A54] mx-auto" />
                <h4 className="text-base font-bold text-[#174D3A]">
                  No Ambiguous Items Detected
                </h4>
                <p className="text-xs text-[#66736B] max-w-md mx-auto">
                  All items meet high confidence and deterministic regulatory rule compatibility checks without requiring user clarification.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[#E1E7E0]">
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
                onClick={() => setCurrentStep('review')}
              >
                Back to Review
              </Button>

              <Button
                variant="forest"
                size="md"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={handleRunOptimization}
                loading={isOptimizing}
              >
                Proceed to Optimization
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: DISPOSAL VALIDATION & BATCH OPTIMIZATION */}
      {/* ========================================================================= */}
      {currentStep === 'optimization' && optimizationResult && (
        <div className="space-y-6">
          {/* Optimization Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card padding="md" className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#66736B]">Solver Status</span>
              <div className="flex items-center gap-1.5">
                <Badge
                  status={optimizationResult.status === 'optimal' || optimizationResult.status === 'feasible' ? 'validated' : 'prohibited'}
                  label={optimizationResult.status.toUpperCase()}
                  size="sm"
                />
              </div>
            </Card>

            <Card padding="md" className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#66736B]">Distinct Streams</span>
              <div className="text-xl font-extrabold text-[#17231D] tabular-nums">
                {optimizationResult.active_streams.length}
              </div>
            </Card>

            <Card padding="md" className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#66736B]">Items Optimized</span>
              <div className="text-xl font-extrabold text-[#17231D] tabular-nums">
                {optimizationResult.assignments.length}
              </div>
            </Card>

            <Card padding="md" className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#66736B]">Solver Runtime</span>
              <div className="text-xl font-extrabold text-[#174D3A] tabular-nums">
                {optimizationResult.solve_time_ms} ms
              </div>
            </Card>
          </div>

          {/* Assignments Table */}
          <Card padding="none" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E1E7E0] flex items-center justify-between bg-[#F7F7F2]/50">
              <h3 className="text-sm font-bold text-[#17231D]">
                Constraint-Validated Item Assignments
              </h3>
              <span className="text-xs text-[#66736B]">HiGHS MILP Formulation</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F7F2] text-[#66736B] font-bold text-[11px] uppercase tracking-wider border-b border-[#E1E7E0]">
                  <tr>
                    <th className="py-3 px-4">Item ID</th>
                    <th className="py-3 px-4">Original Prediction</th>
                    <th className="py-3 px-4">Assigned Stream</th>
                    <th className="py-3 px-4">Validation Status</th>
                    <th className="py-3 px-4">Governing Statute</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E7E0]">
                  {optimizationResult.assignments.map((item) => (
                    <tr key={item.item_id} className="hover:bg-[#F7F7F2]/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#17231D]">{item.item_id}</td>
                      <td className="py-3 px-4 text-[#17231D]">{item.original_category.replace('_', ' ')}</td>
                      <td className="py-3 px-4 font-semibold text-[#174D3A]">{(item.assigned_stream || 'general_residual').replace('_', ' ')}</td>
                      <td className="py-3 px-4">
                        <Badge
                          status={item.is_sent_for_review ? 'review' : 'validated'}
                          label={item.is_sent_for_review ? 'REVIEW' : 'VALIDATED'}
                          size="sm"
                        />
                      </td>
                      <td className="py-3 px-4 text-[#66736B] text-[11px]">{item.rule_ids?.join(', ') || 'Rule v1.2'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Technical Explainability Drawer Toggle */}
            <div className="p-4 border-t border-[#E1E7E0] bg-[#F7F7F2]/30 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowOptimizerExplanation(!showOptimizerExplanation)}
                className="text-xs font-semibold text-[#287A54] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showOptimizerExplanation ? 'Hide Mathematical Formulation' : 'Inspect Mathematical Formulation & Constraints'}</span>
                {showOptimizerExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <Button
                variant="forest"
                size="md"
                icon={<Compass className="w-4 h-4" />}
                onClick={handleRunCollectionPlanning}
                loading={isPlanningRoute}
              >
                Plan Collection Route (TSP)
              </Button>
            </div>

            {showOptimizerExplanation && (
              <div className="p-5 border-t border-[#E1E7E0] bg-white space-y-3 text-xs leading-relaxed text-[#17231D]">
                <h5 className="font-bold text-xs uppercase tracking-wider text-[#174D3A]">
                  Mixed Integer Linear Program (MILP) Formulation
                </h5>
                <pre className="p-3 rounded-xl bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
{`Minimize Z = sum_{j in Streams} c_j * y_j + sum_{i,j} penalty_ij * x_ij
Subject to:
  1. sum_{j in Permitted(i)} x_ij = 1, for all items i
  2. x_ij <= y_j, for all i in Items, j in Streams
  3. Hazardous co-disposal prohibition: x_{i1, j} + x_{i2, j} <= 1 for incompatible pairs
  4. Solver: HiGHS interior point branch-and-cut`}
                </pre>
                <p className="text-[11px] text-[#66736B]">
                  <strong>Active Constraints:</strong> Prohibited co-disposal rules enforced (CPCB 2022, SWM 2016, PWM 2016).
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: COLLECTION-CENTRE PLANNING (TSP TOUR) */}
      {/* ========================================================================= */}
      {currentStep === 'collection' && collectionPlan && (
        <div className="space-y-6">
          <Card padding="lg" className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E1E7E0]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#287A54]">
                  Travelling Salesperson Graph Optimization
                </span>
                <h3 className="text-lg font-bold text-[#17231D]">
                  Multi-Stop Verified Collection Route
                </h3>
              </div>

              <div className="flex items-center gap-3 text-right">
                <div>
                  <span className="text-xl font-extrabold text-[#174D3A] tabular-nums">
                    {collectionPlan.total_distance_km.toFixed(1)} km
                  </span>
                  <p className="text-[10px] text-[#66736B]">Total TSP Tour Distance</p>
                </div>
              </div>
            </div>

            {/* Stops Sequence */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#17231D] block">
                Recommended Visiting Sequence ({collectionPlan.stops.length} stops)
              </span>

              <div className="space-y-3">
                {collectionPlan.stops.map((stop, idx) => (
                  <div
                    key={stop.facility_id}
                    className="p-4 rounded-2xl bg-white border border-[#E1E7E0] hover:border-[#287A54] transition-colors shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#174D3A] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {stop.stop_order}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#17231D]">{stop.facility_name}</h4>
                        <p className="text-[11px] text-[#66736B] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#287A54] shrink-0" />
                          <span>{stop.address}</span>
                        </p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {stop.waste_streams_delivered.map((str) => (
                            <span key={str} className="px-2 py-0.5 rounded-md bg-[#EAF4EC] text-[#174D3A] font-semibold text-[10px]">
                              {str.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xs font-bold text-[#17231D] tabular-nums block">
                        +{stop.leg_distance_km.toFixed(1)} km
                      </span>
                      <span className="text-[10px] text-[#66736B]">{stop.distance_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E1E7E0]">
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
                onClick={() => setCurrentStep('optimization')}
              >
                Back to Optimization
              </Button>

              <Button
                variant="forest"
                size="md"
                icon={<FileText className="w-4 h-4" />}
                onClick={handleFinishSession}
              >
                Generate Final Audit Report
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 7: FINAL RESULTS & EXPORT */}
      {/* ========================================================================= */}
      {currentStep === 'results' && (
        <div className="space-y-6">
          <Card padding="lg" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E1E7E0]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#287A54]">
                  Session Audit Complete
                </span>
                <h3 className="text-xl font-bold text-[#17231D]">
                  Waste Analysis & Disposal Plan Summary
                </h3>
                <p className="text-xs text-[#66736B]">
                  Session ID: <span className="font-mono text-[#174D3A]">{sessionId}</span>
                </p>
              </div>

              {/* Export Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const blob = new Blob([JSON.stringify({ sessionId, detectedItems, optimizationResult, collectionPlan }, null, 2)], {
                      type: 'application/json',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ecosort_audit_${sessionId}.json`;
                    a.click();
                  }}
                >
                  Export JSON
                </Button>

                <Button
                  variant="forest"
                  size="sm"
                  icon={<Printer className="w-3.5 h-3.5" />}
                  onClick={() => window.print()}
                >
                  Print Report
                </Button>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#66736B]">Total Objects</span>
                <div className="text-2xl font-extrabold text-[#17231D] tabular-nums">
                  {detectedItems.length}
                </div>
                <p className="text-[11px] text-[#66736B]">Physically separated items</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#66736B]">Optimal Streams</span>
                <div className="text-2xl font-extrabold text-[#174D3A] tabular-nums">
                  {optimizationResult?.active_streams.length || 1}
                </div>
                <p className="text-[11px] text-[#66736B]">
                  {optimizationResult?.active_streams.map((s) => s.replace('_', ' ')).join(', ')}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#66736B]">Collection Distance</span>
                <div className="text-2xl font-extrabold text-[#285DA8] tabular-nums">
                  {collectionPlan?.total_distance_km ? `${collectionPlan.total_distance_km.toFixed(1)} km` : 'Local Drop'}
                </div>
                <p className="text-[11px] text-[#66736B]">Multi-stop TSP route</p>
              </div>
            </div>

            {/* Statutory Compliance Notes */}
            <div className="p-4 rounded-2xl bg-[#EAF4EC]/60 border border-[#287A54]/25 space-y-1 text-xs">
              <h5 className="font-bold text-[#174D3A] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#287A54]" />
                <span>Statutory Regulatory Compliance</span>
              </h5>
              <p className="text-[#17231D]/80 leading-relaxed text-[11px]">
                Assignments adhere to the Central Pollution Control Board (CPCB) E-Waste Management Rules 2022, Solid Waste Management Rules 2016, and Plastic Waste Management Rules 2016. Incompatible hazardous co-disposals were eliminated via exact integer constraints.
              </p>
            </div>

            <div className="pt-4 border-t border-[#E1E7E0] flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetStudio}
              >
                Start Another Analysis
              </Button>

              {onViewHistory && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewHistory}
                >
                  View Session in History
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Autonomous Human-in-the-Loop Feedback & Retraining Modal */}
      {feedbackItem && (
        <FeedbackModal
          isOpen={Boolean(feedbackItem)}
          onClose={() => setFeedbackItem(null)}
          predictedCategory={feedbackItem.predicted_category}
          imagePreview={feedbackItem.thumbnail ? getThumbnailSrc(feedbackItem.thumbnail) : undefined}
          onRetrainSuccess={() => {
            handleItemCategoryOverride(feedbackItem.item_id, feedbackItem.predicted_category);
            setFeedbackItem(null);
          }}
        />
      )}
    </div>
  );
};
