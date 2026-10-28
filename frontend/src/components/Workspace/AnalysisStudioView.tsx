import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, Camera, RefreshCw, CheckCircle2, AlertTriangle, HelpCircle,
  ArrowRight, ArrowLeft, Shield, Zap, Sparkles, Sliders, ChevronDown, ChevronUp,
  MapPin, Check, X, FileText, Layers, Compass, Download, Printer, Eye,
  Info, ExternalLink, RotateCcw, AlertCircle, Bot, Leaf, ShieldAlert, Award, FileSpreadsheet
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
  const [clarificationError, setClarificationError] = useState<string | null>(null);
  const [selectedClarificationOption, setSelectedClarificationOption] = useState<string | null>(null);
  const [assignmentChangeBanner, setAssignmentChangeBanner] = useState<{
    itemId: string;
    fromCategory: string;
    toCategory: string;
    explanation: string;
  } | null>(null);
  const [resolvedClarifications, setResolvedClarifications] = useState<Record<string, string>>({});

  // Optimization & Batch Sorting Plan State
  const [optimizationResult, setOptimizationResult] = useState<BatchOptimizationResponse | null>(null);
  const [selectedSortingGroup, setSelectedSortingGroup] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [showOptimizerExplanation, setShowOptimizerExplanation] = useState<boolean>(false);

  // Image Metadata State (Section B Visual Report)
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; format: string } | null>(null);

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
    const imgEl = new Image();
    imgEl.onload = () => {
      setImageMeta({
        width: imgEl.naturalWidth,
        height: imgEl.naturalHeight,
        format: file.type ? file.type.replace('image/', '').toUpperCase() : 'JPEG',
      });
    };
    imgEl.src = url;

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
    setClarificationError(null);
    try {
      const res = await evaluateClarification(detectedItems, selectedStrategy);
      setClarificationData(res);
      setCompletedSteps((prev) => Array.from(new Set([...prev, 'review'])));
      if (res.question && res.question.options.length > 0) {
        setSelectedClarificationOption(res.question.options[0].target_category || res.question.options[0].id);
      }
    } catch (e: any) {
      setClarificationError(e.message || 'Failed to evaluate clarification questions');
    } finally {
      setIsEvaluatingClarification(false);
    }
  };

  // Auto-fetch clarification when entering step 4
  useEffect(() => {
    if (currentStep === 'clarification' && !clarificationData && !isEvaluatingClarification && detectedItems.length > 0) {
      handleRunClarification();
    }
  }, [currentStep, clarificationData, isEvaluatingClarification, detectedItems]);

  // Resolve Clarification for an Item
  const handleResolveClarificationOption = async (targetCategory?: string) => {
    if (!clarificationData?.question) return;
    const q = clarificationData.question;
    const catToApply = targetCategory || selectedClarificationOption || q.options[0]?.target_category || 'general_residual';
    const itemId = q.item_id;

    const oldItem = detectedItems.find((i) => i.item_id === itemId);
    const oldCat = oldItem?.predicted_category || 'unresolved';

    setResolvedClarifications((prev) => ({ ...prev, [itemId]: catToApply }));

    // Apply category update to items
    const updated = detectedItems.map((it) =>
      it.item_id === itemId
        ? {
            ...it,
            user_corrected_category: catToApply,
            predicted_category: catToApply,
            confidence: 0.98,
            status: 'USER_VERIFIED',
          }
        : it
    );
    setDetectedItems(updated);

    recordAuditLog({
      session_id: sessionId,
      item_id: itemId,
      event: 'clarification_confirmed',
      new_category: catToApply,
    });

    setAssignmentChangeBanner({
      itemId,
      fromCategory: oldCat,
      toCategory: catToApply,
      explanation: `Clarification applied: Item ${itemId} updated from ${oldCat.replace('_', ' ')} to ${catToApply.replace('_', ' ')}. Downstream allocation rules recalculated.`,
    });

    // Re-evaluate clarification on updated batch
    setIsEvaluatingClarification(true);
    try {
      const newClarification = await evaluateClarification(updated, selectedStrategy);
      setClarificationData(newClarification);
      if (newClarification.question?.options?.length) {
        setSelectedClarificationOption(newClarification.question.options[0].target_category || newClarification.question.options[0].id);
      }
    } catch {
      setClarificationData({
        ...clarificationData,
        question: null,
      });
    } finally {
      setIsEvaluatingClarification(false);
    }
  };

  const handleSkipClarification = () => {
    if (!clarificationData?.question) return;
    const itemId = clarificationData.question.item_id;
    setAssignmentChangeBanner({
      itemId,
      fromCategory: 'ambiguous',
      toCategory: 'retained',
      explanation: `Clarification skipped for ${itemId}. Item retains conservative handling under regulatory rules.`,
    });
    setClarificationData({
      ...clarificationData,
      question: null,
    });
  };

  const handleReviewInInspector = (itemId: string) => {
    setSelectedItemId(itemId);
    setCurrentStep('review');
  };

  // Group compatible items into Batch Sorting Plan
  const sortingGroups = React.useMemo(() => {
    if (!optimizationResult?.assignments || optimizationResult.assignments.length === 0) {
      const map: Record<string, DetectedWasteItem[]> = {};
      for (const it of detectedItems) {
        const stream = it.candidate_streams?.[0] || it.predicted_category;
        if (!map[stream]) map[stream] = [];
        map[stream].push(it);
      }
      return Object.entries(map).map(([stream, items]) => ({
        stream,
        name: stream.replace(/_/g, ' ').toUpperCase(),
        items,
        status: 'PENDING_VALIDATION',
        ruleIds: ['CPCB_SWM_2016'],
      }));
    }

    const groupMap: Record<string, {
      stream: string;
      items: DetectedWasteItem[];
      ruleIds: Set<string>;
      isReview: boolean;
    }> = {};

    for (const a of optimizationResult.assignments) {
      const streamKey = a.is_sent_for_review ? 'manual_review_required' : (a.assigned_stream || 'general_residual');
      if (!groupMap[streamKey]) {
        groupMap[streamKey] = {
          stream: streamKey,
          items: [],
          ruleIds: new Set<string>(),
          isReview: a.is_sent_for_review,
        };
      }
      const itemObj = detectedItems.find((it) => it.item_id === a.item_id);
      if (itemObj) {
        groupMap[streamKey].items.push(itemObj);
      }
      if (a.rule_ids) {
        a.rule_ids.forEach((r) => groupMap[streamKey].ruleIds.add(r));
      }
    }

    return Object.values(groupMap).map((g) => ({
      stream: g.stream,
      name: g.isReview ? 'Review Required (Unresolved / Safety Risk)' : g.stream.replace(/_/g, ' ').toUpperCase(),
      items: g.items,
      status: g.isReview ? 'REVIEW_REQUIRED' : 'RULE_VALIDATED',
      ruleIds: Array.from(g.ruleIds),
    }));
  }, [optimizationResult, detectedItems]);

  // Export inventory as structured CSV
  const handleExportCSV = () => {
    const headers = ['Item ID', 'Detected Category', 'User Corrected', 'Confidence', 'Validation Status', 'Assigned Stream', 'Governing Rules'];
    const rows = detectedItems.map((it) => {
      const assignment = optimizationResult?.assignments.find((a) => a.item_id === it.item_id);
      const assignedStream = assignment?.assigned_stream || it.candidate_streams?.[0] || 'general_residual';
      const status = assignment?.is_sent_for_review ? 'REVIEW_REQUIRED' : 'VALIDATED';
      const ruleIds = assignment?.rule_ids?.join('; ') || 'CPCB_SWM_2016';
      return [
        it.item_id,
        it.predicted_category,
        it.user_corrected_category || 'None',
        `${(it.confidence * 100).toFixed(1)}%`,
        status,
        assignedStream,
        `"${ruleIds}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ecosort_inventory_${sessionId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    const lat = location.isLoaded && location.latitude ? location.latitude : 18.5204;
    const lon = location.isLoaded && location.longitude ? location.longitude : 73.8567;

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
                        const isGroupMatch = selectedSortingGroup ? (
                          sortingGroups.find((g) => g.stream === selectedSortingGroup)?.items.some((it) => it.item_id === item.item_id)
                        ) : false;
                        const isHighlighted = isSelected || isGroupMatch;
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
                              fill={isHighlighted ? 'rgba(40, 122, 84, 0.32)' : 'rgba(23, 77, 58, 0.12)'}
                              stroke={isHighlighted ? '#287A54' : '#174D3A'}
                              strokeWidth={isHighlighted ? '2.5' : '1.5'}
                              strokeDasharray={isHighlighted ? 'none' : '3 1'}
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
                                    isHighlighted ? 'bg-[#287A54] ring-1 ring-white' : 'bg-[#174D3A]/90'
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
      {currentStep === 'clarification' && (
        <div className="space-y-6">
          {/* Loading Spinner */}
          {isEvaluatingClarification && (
            <Card padding="lg" className="text-center py-12 space-y-4">
              <RefreshCw className="w-8 h-8 text-[#287A54] animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[#17231D]">
                  Evaluating Clarification Questions (EVOI)
                </h4>
                <p className="text-xs text-[#66736B]">
                  Simulating downstream batch assignments and quantifying decision entropy across {detectedItems.length} objects...
                </p>
              </div>
            </Card>
          )}

          {/* Error State with Retry Button */}
          {!isEvaluatingClarification && clarificationError && (
            <Card padding="lg" className="space-y-4">
              <Alert
                type="error"
                title="Clarification Evaluation Error"
                onDismiss={() => setClarificationError(null)}
              >
                {clarificationError}
              </Alert>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentStep('review')}
                >
                  Back to Review
                </Button>
                <Button
                  variant="forest"
                  size="sm"
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                  onClick={handleRunClarification}
                >
                  Retry Evaluation
                </Button>
              </div>
            </Card>
          )}

          {/* Active Clarification Workspace */}
          {!isEvaluatingClarification && !clarificationError && clarificationData && (
            <Card padding="lg" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E1E7E0]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#287A54]">
                    Strategy: {clarificationData.selected_strategy.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <h3 className="text-lg font-bold text-[#17231D]">
                    Decision-Aware Clarification
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedStrategy}
                    onChange={(e) => {
                      setSelectedStrategy(e.target.value);
                      setIsEvaluatingClarification(true);
                      evaluateClarification(detectedItems, e.target.value)
                        .then((res) => {
                          setClarificationData(res);
                          if (res.question?.options?.length) {
                            setSelectedClarificationOption(res.question.options[0].target_category || res.question.options[0].id);
                          }
                        })
                        .catch((err) => setClarificationError(err.message))
                        .finally(() => setIsEvaluatingClarification(false));
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

              {/* Assignment Changed Banner */}
              {assignmentChangeBanner && (
                <div className="p-3.5 rounded-xl bg-[#EAF4EC] border border-[#287A54]/30 flex items-start gap-2.5 text-xs text-[#174D3A]">
                  <CheckCircle2 className="w-4 h-4 text-[#287A54] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Assignment Recalculated:</span>
                    <span>{assignmentChangeBanner.explanation}</span>
                  </div>
                </div>
              )}

              {/* Active Question or Deliberate Empty State */}
              {clarificationData.question ? (
                <div className="p-5 rounded-2xl bg-[#FEF7EC] border border-[#946200]/25 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {(() => {
                      const qItem = detectedItems.find((i) => i.item_id === clarificationData.question?.item_id);
                      if (qItem?.thumbnail) {
                        return (
                          <img
                            src={getThumbnailSrc(qItem.thumbnail)}
                            alt={`Crop of ${qItem.item_id}`}
                            className="w-20 h-20 rounded-2xl object-cover border-2 border-[#946200]/40 shrink-0 shadow-xs"
                          />
                        );
                      }
                      return (
                        <div className="w-20 h-20 rounded-2xl bg-[#946200] text-white flex items-center justify-center shrink-0">
                          <HelpCircle className="w-8 h-8 text-white" />
                        </div>
                      );
                    })()}

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-[#946200] border border-[#946200]/30">
                          Item ID: {clarificationData.question.item_id}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-[#17231D] border border-[#E1E7E0]">
                          Current: {(() => {
                            const qItem = detectedItems.find((i) => i.item_id === clarificationData.question?.item_id);
                            return qItem?.predicted_category?.replace(/_/g, ' ') || 'Unknown';
                          })()}
                        </span>
                        <span className="text-[11px] text-[#66736B]">
                          Confidence: {(clarificationData.question.confidence * 100).toFixed(1)}%
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-[#17231D]">
                        {clarificationData.question.question}
                      </h4>

                      <p className="text-xs text-[#66736B] leading-relaxed">
                        <strong>Why clarification is needed:</strong> {clarificationData.question.reason}
                      </p>
                    </div>
                  </div>

                  {/* Plausible Answer Choices Grid */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-[#17231D] block">
                      Select Verified Material / Handling Choice:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {clarificationData.question.options.map((opt) => {
                        const optValue = opt.target_category || opt.id;
                        const isSelected = selectedClarificationOption === optValue;
                        return (
                          <button
                            key={opt.id || opt.target_category || opt.label}
                            type="button"
                            onClick={() => setSelectedClarificationOption(optValue)}
                            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                              isSelected
                                ? 'bg-white border-[#287A54] ring-2 ring-[#287A54]/25 shadow-xs'
                                : 'bg-white/80 border-[#E1E7E0] hover:border-stone-400'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[#17231D]">
                                {opt.label}
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-[#287A54]" />}
                            </div>
                            <span className="text-[11px] text-[#66736B] block">
                              Target Stream: <strong className="text-[#174D3A]">{optValue.replace(/_/g, ' ')}</strong>
                              {opt.description && ` · ${opt.description}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions: Confirm, Skip, Review in Inspector */}
                  <div className="pt-3 border-t border-[#946200]/20 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReviewInInspector(clarificationData.question!.item_id)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Review in Inspector
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSkipClarification}
                      >
                        Skip Clarification
                      </Button>
                    </div>

                    <Button
                      variant="forest"
                      size="sm"
                      icon={<Check className="w-3.5 h-3.5" />}
                      onClick={() => handleResolveClarificationOption()}
                      loading={isEvaluatingClarification}
                    >
                      Confirm Selection
                    </Button>
                  </div>
                </div>
              ) : (
                /* Deliberate Empty State */
                <div className="p-8 rounded-2xl bg-[#EAF4EC]/70 border border-[#287A54]/30 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-[#287A54] mx-auto" />
                  <h4 className="text-lg font-bold text-[#174D3A]">
                    No clarification needed
                  </h4>
                  <p className="text-xs text-[#66736B] max-w-lg mx-auto leading-relaxed">
                    All currently evaluated items can proceed to the next validation step. This does not guarantee that every prediction is correct.
                  </p>
                  <div className="pt-2">
                    <Button
                      variant="forest"
                      size="md"
                      icon={<ArrowRight className="w-4 h-4" />}
                      onClick={handleRunOptimization}
                      loading={isOptimizing}
                    >
                      Continue to Validation
                    </Button>
                  </div>
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
          )}
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

          {/* Batch Sorting Plan: Visual Stream Groups */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#17231D]">
                  Batch Sorting Plan
                </h3>
                <p className="text-xs text-[#66736B]">
                  Items grouped by verified handling compatibility and statutory requirements.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EAF4EC] text-[#174D3A] border border-[#287A54]/20">
                {sortingGroups.length} Compatible Streams
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortingGroups.map((group) => {
                const isSelected = selectedSortingGroup === group.stream;
                return (
                  <Card
                    key={group.stream}
                    padding="md"
                    className={`space-y-3 transition-all cursor-pointer border-2 ${
                      isSelected
                        ? 'border-[#287A54] ring-2 ring-[#287A54]/20 shadow-sm bg-white'
                        : 'border-[#E1E7E0] hover:border-stone-400 bg-white'
                    }`}
                    onClick={() => setSelectedSortingGroup(isSelected ? null : group.stream)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#17231D]">
                            {group.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                            {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#66736B] block mt-0.5">
                          Disposal Stream: <strong className="text-[#174D3A]">{group.stream.replace(/_/g, ' ')}</strong>
                        </span>
                      </div>

                      <Badge
                        status={group.status === 'RULE_VALIDATED' ? 'validated' : 'review'}
                        label={group.status}
                        size="sm"
                      />
                    </div>

                    {/* Group Item Crops / Thumbnails */}
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {group.items.map((item) => (
                        <div
                          key={item.item_id}
                          className="relative shrink-0 group/thumb"
                          title={`${item.item_id}: ${item.display_name}`}
                        >
                          {item.thumbnail ? (
                            <img
                              src={getThumbnailSrc(item.thumbnail)}
                              alt={item.display_name}
                              className="w-12 h-12 rounded-xl object-cover border border-[#E1E7E0] shadow-2xs"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-stone-100 border border-[#E1E7E0] flex items-center justify-center font-bold text-[10px] text-stone-600">
                              {item.item_id}
                            </div>
                          )}
                          <span className="absolute bottom-0 right-0 text-[8px] font-mono font-bold bg-stone-900/80 text-white px-1 rounded-tl">
                            {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#E1E7E0] flex items-center justify-between text-[11px] text-[#66736B]">
                      <span>Rules: <strong className="font-mono text-stone-800">{group.ruleIds.join(', ')}</strong></span>
                      <span className="text-[#287A54] font-medium">
                        {isSelected ? 'Selected' : 'Click to highlight in image'}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
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
                    <th className="py-3 px-4">Thumbnail</th>
                    <th className="py-3 px-4">Original Prediction</th>
                    <th className="py-3 px-4">Assigned Stream</th>
                    <th className="py-3 px-4">Validation Status</th>
                    <th className="py-3 px-4">Governing Statute</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E7E0]">
                  {optimizationResult.assignments.map((item) => {
                    const fullItem = detectedItems.find((d) => d.item_id === item.item_id);
                    return (
                      <tr key={item.item_id} className="hover:bg-[#F7F7F2]/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#17231D]">{item.item_id}</td>
                        <td className="py-3 px-4">
                          {fullItem?.thumbnail ? (
                            <img
                              src={getThumbnailSrc(fullItem.thumbnail)}
                              alt={item.item_id}
                              className="w-9 h-9 rounded-lg object-cover border border-[#E1E7E0]"
                            />
                          ) : (
                            <span className="text-[10px] text-stone-400 font-mono">No crop</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#17231D]">{item.original_category.replace(/_/g, ' ')}</td>
                        <td className="py-3 px-4 font-semibold text-[#174D3A]">{(item.assigned_stream || 'general_residual').replace(/_/g, ' ')}</td>
                        <td className="py-3 px-4">
                          <Badge
                            status={item.is_sent_for_review ? 'review' : 'validated'}
                            label={item.is_sent_for_review ? 'REVIEW' : 'VALIDATED'}
                            size="sm"
                          />
                        </td>
                        <td className="py-3 px-4 text-[#66736B] text-[11px]">{item.rule_ids?.join(', ') || 'Rule v1.2'}</td>
                      </tr>
                    );
                  })}
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
      {/* STEP 7: FINAL RESULTS & COMPREHENSIVE VISUAL AUDIT REPORT */}
      {/* ========================================================================= */}
      {currentStep === 'results' && (
        <div className="space-y-6">
          <Card padding="lg" className="space-y-8 bg-white print:p-0 print:border-none print:shadow-none">
            {/* =================================================================== */}
            {/* SECTION A: REPORT HEADER */}
            {/* =================================================================== */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#E1E7E0]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#174D3A] text-white flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xl font-extrabold tracking-tight text-[#17231D]">EcoSort</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EAF4EC] text-[#174D3A] border border-[#287A54]/20">
                    Decision-Aware Waste Report
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#17231D] pt-1">
                  Waste Segregation & Collection Routing Audit
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#66736B] pt-0.5">
                  <span>Analysis ID: <strong className="font-mono text-[#174D3A]">{sessionId}</strong></span>
                  <span>•</span>
                  <span>Date: <strong>{new Date().toLocaleString()}</strong></span>
                  <span>•</span>
                  <span>Status: <strong className="text-[#287A54]">Verified Formulation</strong></span>
                </div>
                <p className="text-[11px] text-[#66736B] pt-1">
                  <strong>Engine Versions:</strong> MobileNetV3-EcoSort v1.28.0 (91.0% accuracy) · VersionedRuleEngine v1.2.0 (CPCB 2022 / SWM 2016) · HiGHS MILP Solver
                </p>
              </div>

              {/* Export Controls (Hidden in Print) */}
              <div className="flex flex-wrap items-center gap-2 no-print shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
                  onClick={handleExportCSV}
                >
                  Export CSV
                </Button>

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
                  Print Report / PDF
                </Button>
              </div>
            </div>

            {/* Metric KPI Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-[#66736B]">Total Objects</span>
                <div className="text-xl font-extrabold text-[#17231D] tabular-nums">
                  {detectedItems.length}
                </div>
                <p className="text-[10px] text-[#66736B]">Separated proposals</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-[#66736B]">Distinct Streams</span>
                <div className="text-xl font-extrabold text-[#174D3A] tabular-nums">
                  {optimizationResult?.active_streams.length || 1}
                </div>
                <p className="text-[10px] text-[#66736B]">Verified allocations</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-[#66736B]">Collection Stops</span>
                <div className="text-xl font-extrabold text-[#285DA8] tabular-nums">
                  {collectionPlan?.total_stops || 1}
                </div>
                <p className="text-[10px] text-[#66736B]">Destination centres</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-[#66736B]">Tour Distance</span>
                <div className="text-xl font-extrabold text-[#285DA8] tabular-nums">
                  {collectionPlan?.total_distance_km ? `${collectionPlan.total_distance_km.toFixed(1)} km` : 'Local'}
                </div>
                <p className="text-[10px] text-[#66736B]">Straight-line haversine</p>
              </div>
            </div>

            {/* =================================================================== */}
            {/* SECTION B: ORIGINAL UPLOADED PHOTO */}
            {/* =================================================================== */}
            <div className="space-y-3 print-avoid-break">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#174D3A]">
                  Section B · Original Input Waste Scene
                </h3>
                <span className="text-xs text-[#66736B]">
                  Resolution: {imageMeta ? `${imageMeta.width} × ${imageMeta.height} px (${imageMeta.format})` : 'Source Dimensions Preserved'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#F7F7F2] border border-[#E1E7E0] text-center">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Analyzed full scene"
                    className="max-h-[360px] max-w-full w-auto h-auto rounded-xl object-contain mx-auto shadow-xs border border-[#E1E7E0]"
                  />
                ) : (
                  <div className="py-12 text-xs text-[#66736B]">Original image preview unavailable</div>
                )}
                <p className="text-[11px] text-[#66736B] italic pt-2">
                  Figure 1: Full uncropped input waste photograph evaluated by neural spatial proposal network.
                </p>
              </div>
            </div>

            {/* =================================================================== */}
            {/* SECTION C: DETECTED OBJECTS INVENTORY */}
            {/* =================================================================== */}
            <div className="space-y-3 print-avoid-break">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#174D3A]">
                  Section C · Detected Objects Inventory ({detectedItems.length} items)
                </h3>
                <span className="text-xs text-[#66736B]">Stable Item IDs & Physical Crops</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#E1E7E0]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F7F2] text-[#66736B] font-bold text-[11px] uppercase tracking-wider border-b border-[#E1E7E0]">
                    <tr>
                      <th className="py-3 px-3">Item ID</th>
                      <th className="py-3 px-3">Object Crop</th>
                      <th className="py-3 px-3">Predicted Category</th>
                      <th className="py-3 px-3">User Correction</th>
                      <th className="py-3 px-3">Confidence</th>
                      <th className="py-3 px-3">Validation Status</th>
                      <th className="py-3 px-3">Assigned Stream</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E7E0]">
                    {detectedItems.map((item) => {
                      const assignment = optimizationResult?.assignments.find((a) => a.item_id === item.item_id);
                      const finalStream = assignment?.is_sent_for_review
                        ? 'MANUAL_REVIEW_REQUIRED'
                        : (assignment?.assigned_stream || item.candidate_streams?.[0] || 'general_residual');
                      const isReview = assignment?.is_sent_for_review || item.status === 'LOW_CONFIDENCE';

                      return (
                        <tr key={item.item_id} className="hover:bg-[#F7F7F2]/50">
                          <td className="py-3 px-3 font-mono font-bold text-[#17231D]">
                            {item.item_id}
                          </td>
                          <td className="py-3 px-3">
                            {item.thumbnail ? (
                              <img
                                src={getThumbnailSrc(item.thumbnail)}
                                alt={`Crop of ${item.item_id}`}
                                className="w-12 h-12 rounded-lg object-cover border border-[#E1E7E0] shadow-2xs"
                              />
                            ) : (
                              <span className="text-[10px] text-stone-400 font-mono">No crop</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-[#17231D] block">
                              {item.display_name || item.predicted_category.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-[#66736B] font-mono">
                              cat: {item.predicted_category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#66736B]">
                            {item.user_corrected_category ? (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium text-[11px] border border-amber-200">
                                {item.user_corrected_category.replace(/_/g, ' ')}
                              </span>
                            ) : (
                              <span className="text-stone-400 italic">None</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[#174D3A]">
                            {(item.confidence * 100).toFixed(1)}%
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              status={isReview ? 'review' : 'validated'}
                              label={isReview ? 'REVIEW REQUIRED' : 'RULE VALIDATED'}
                              size="sm"
                            />
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#174D3A]">
                            {finalStream.replace(/_/g, ' ')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =================================================================== */}
            {/* SECTION D: BATCH SORTING PLAN */}
            {/* =================================================================== */}
            <div className="space-y-3 print-avoid-break">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#174D3A]">
                  Section D · Batch Sorting Plan (Compatible Handling Streams)
                </h3>
                <span className="text-xs text-[#66736B]">
                  {sortingGroups.length} Separate Streams Enforced
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortingGroups.map((group) => (
                  <div
                    key={group.stream}
                    className="p-4 rounded-2xl border border-[#E1E7E0] bg-[#F7F7F2]/40 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#17231D]">
                            {group.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-stone-700 border border-[#E1E7E0]">
                            {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#66736B] block mt-0.5">
                          Assigned Stream: <strong className="text-[#174D3A]">{group.stream.replace(/_/g, ' ')}</strong>
                        </span>
                      </div>

                      <Badge
                        status={group.status === 'RULE_VALIDATED' ? 'validated' : 'review'}
                        label={group.status}
                        size="sm"
                      />
                    </div>

                    {/* Group Thumbnails */}
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {group.items.map((item) => (
                        <div key={item.item_id} className="relative shrink-0">
                          {item.thumbnail ? (
                            <img
                              src={getThumbnailSrc(item.thumbnail)}
                              alt={item.display_name}
                              className="w-12 h-12 rounded-xl object-cover border border-[#E1E7E0]"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-white border border-[#E1E7E0] flex items-center justify-center font-bold text-[10px] text-stone-600">
                              {item.item_id}
                            </div>
                          )}
                          <span className="absolute bottom-0 right-0 text-[8px] font-mono font-bold bg-stone-900/80 text-white px-1 rounded-tl">
                            {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#E1E7E0] flex flex-wrap items-center justify-between text-[11px] text-[#66736B] gap-1">
                      <span>Statutory Rules: <strong className="font-mono text-stone-800">{group.ruleIds.join(', ')}</strong></span>
                      {group.status === 'REVIEW_REQUIRED' && (
                        <span className="text-amber-700 font-medium">Keep isolated from ordinary dry recyclables</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* =================================================================== */}
            {/* SECTION E: COLLECTION DESTINATIONS (GROUP-BY-GROUP) */}
            {/* =================================================================== */}
            <div className="space-y-3 print-avoid-break">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#174D3A]">
                  Section E · Collection Destinations (Group-by-Group Routing)
                </h3>
                <span className="text-xs text-[#66736B]">Verified Maharashtra & Pune Facilities</span>
              </div>

              <div className="space-y-3">
                {collectionPlan?.stops && collectionPlan.stops.length > 0 ? (
                  collectionPlan.stops.map((stop) => (
                    <div
                      key={stop.facility_id}
                      className="p-4 rounded-2xl bg-white border border-[#E1E7E0] shadow-2xs space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[#174D3A] text-white flex items-center justify-center font-bold text-xs">
                              {stop.stop_order}
                            </span>
                            <h4 className="text-sm font-bold text-[#17231D]">{stop.facility_name}</h4>
                            <span className="text-[10px] font-mono text-stone-400">ID: {stop.facility_id}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Verified Centre
                            </span>
                          </div>

                          <p className="text-xs text-[#66736B] flex items-center gap-1.5 pt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-[#287A54] shrink-0" />
                            <span>{stop.address}</span>
                          </p>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-xs font-bold text-[#17231D] block">
                            ~{stop.leg_distance_km.toFixed(1)} km
                          </span>
                          <span className="text-[10px] text-[#66736B]">{stop.distance_type}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E1E7E0] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[11px] text-[#66736B] font-medium mr-1">Accepted Streams:</span>
                          {stop.waste_streams_delivered.map((st) => (
                            <span
                              key={st}
                              className="px-2 py-0.5 rounded-md bg-[#EAF4EC] text-[#174D3A] font-semibold text-[10px]"
                            >
                              {st.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="no-print inline-flex items-center gap-1 text-[11px] font-semibold text-[#287A54] hover:underline"
                        >
                          <span>Directions</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-5 rounded-2xl bg-[#F7F7F2] border border-[#E1E7E0] text-center text-xs text-[#66736B]">
                    No specific collection tour planned. Please deliver separated dry recyclables and electronic waste to municipal drop-off hubs.
                  </div>
                )}
              </div>
            </div>

            {/* =================================================================== */}
            {/* SECTION F: DECISION EXPLANATION & STATUTORY CONSTRAINTS */}
            {/* =================================================================== */}
            <div className="space-y-3 print-avoid-break">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#174D3A]">
                Section F · Decision Explanation & Statutory Constraints
              </h3>

              <div className="p-4 rounded-2xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-2 text-xs leading-relaxed text-[#17231D]">
                <p>
                  <strong>Why assignments were made:</strong> Decomposed multi-object visual scene using hybrid spatial proposals. Each isolated object was evaluated against the statutory requirements of the Central Pollution Control Board (CPCB) E-Waste Management Rules 2022, Solid Waste Management Rules 2016, and Plastic Waste Management Rules 2016.
                </p>
                <p>
                  <strong>Enforced constraints:</strong> Incompatible co-disposal prohibition constraints were strictly enforced by the HiGHS MILP solver. Hazardous electronic waste and battery chemistries were kept completely segregated from ordinary municipal dry recyclables to prevent fire contamination and chemical hazards.
                </p>
                <p className="text-[11px] text-[#66736B]">
                  <strong>Solver objective:</strong> Minimized total active disposal streams while eliminating incompatible co-deposits and applying conservative review penalties on ambiguous proposals.
                </p>
              </div>
            </div>

            {/* =================================================================== */}
            {/* SECTION G: SAFETY AND LIMITATIONS DISCLAIMER */}
            {/* =================================================================== */}
            <div className="space-y-3 print-avoid-break">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#946200]">
                Section G · Safety & Limitations Disclaimer
              </h3>

              <div className="p-4 rounded-2xl bg-[#FEF7EC] border border-[#946200]/25 space-y-2 text-xs leading-relaxed text-[#17231D]">
                <div className="flex items-center gap-1.5 text-[#946200] font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Important Environmental and Safety Precautions</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#66736B]">
                  <li>
                    <strong>Probabilistic Classification:</strong> Neural computer vision inferences represent decision support estimates and do not guarantee 100% material correctness.
                  </li>
                  <li>
                    <strong>Hazardous Waste Isolation:</strong> Never combine swollen lithium-ion cells, lead-acid batteries, or toxic chemicals into standard recycling bins. Handle with insulated gloves and deliver only to authorized hazardous collection centres.
                  </li>
                  <li>
                    <strong>Local Facility Verification:</strong> Operational hours, accepted batch sizes, and commercial gate fees vary. Verify with facilities prior to bulk transit.
                  </li>
                  <li>
                    <strong>Unknown Items:</strong> When in doubt, select "Manual Inspection" rather than risking cross-contamination of clean dry recyclable streams.
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Actions (Hidden in Print) */}
            <div className="pt-4 border-t border-[#E1E7E0] flex flex-wrap items-center justify-between gap-3 no-print">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetStudio}
              >
                Start Another Analysis
              </Button>

              <div className="flex items-center gap-2">
                {onViewHistory && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onViewHistory}
                  >
                    View in History
                  </Button>
                )}
                <Button
                  variant="forest"
                  size="sm"
                  icon={<Printer className="w-3.5 h-3.5" />}
                  onClick={() => window.print()}
                >
                  Print Report / PDF
                </Button>
              </div>
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
