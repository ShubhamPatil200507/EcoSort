import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, Camera, RefreshCw, CheckCircle, AlertTriangle, HelpCircle,
  ArrowRight, Shield, Zap, Sparkles, Sliders, ChevronDown, ChevronUp,
  MapPin, Download, Check, X, FileText, Layers, Compass
} from 'lucide-react';
import {
  DetectedWasteItem,
  BatchOptimizationResponse,
  ClarificationComparisonResult,
  MultiStopCollectionPlan
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

export const BatchAnalysisView: React.FC = () => {
  const { location } = useLocation();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Batch analysis state
  const [detectedItems, setDetectedItems] = useState<DetectedWasteItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Strategy & Clarification
  const [selectedStrategy, setSelectedStrategy] = useState<string>('decision_aware');
  const [clarificationData, setClarificationData] = useState<ClarificationComparisonResult | null>(null);
  const [isEvaluatingClarification, setIsEvaluatingClarification] = useState<boolean>(false);

  // Optimization
  const [optimizationResult, setOptimizationResult] = useState<BatchOptimizationResponse | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Routing
  const [collectionPlan, setCollectionPlan] = useState<MultiStopCollectionPlan | null>(null);
  const [isPlanningRoute, setIsPlanningRoute] = useState<boolean>(false);

  // Explain Drawer
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setErrorMsg(null);
    setIsLoading(true);
    setOptimizationResult(null);
    setClarificationData(null);
    setCollectionPlan(null);

    try {
      const res = await detectBatchObjects(file);
      setDetectedItems(res.items);
      if (res.items.length > 0) {
        setSelectedItemId(res.items[0].item_id);
        // Automatically evaluate clarification and initial optimization
        triggerOptimizationAndClarification(res.items, selectedStrategy);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Detection failed. Please check image.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerOptimizationAndClarification = async (items: DetectedWasteItem[], strategy: string) => {
    setIsOptimizing(true);
    setIsEvaluatingClarification(true);

    try {
      // 1. Run MILP Batch Optimizer
      const optRes = await optimizeBatchAssignments({ items });
      setOptimizationResult(optRes);

      // 2. Evaluate Clarification
      const clarRes = await evaluateClarification(items, strategy);
      setClarificationData(clarRes);

      // 3. If active streams exist, plan collection route
      if (optRes.active_streams.length > 0) {
        const lat = location.latitude || 19.0760;
        const lon = location.longitude || 72.8777;
        setIsPlanningRoute(true);
        planCollectionRoute(optRes.active_streams, lat, lon)
          .then(setCollectionPlan)
          .catch(() => {})
          .finally(() => setIsPlanningRoute(false));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Optimization solver failed.');
    } finally {
      setIsOptimizing(false);
      setIsEvaluatingClarification(false);
    }
  };

  const handleUserCorrection = (itemId: string, newCategory: string) => {
    const updated = detectedItems.map((it) => {
      if (it.item_id === itemId) {
        return {
          ...it,
          user_corrected_category: newCategory,
          status: 'user_corrected',
          confidence: 0.99
        };
      }
      return it;
    });
    setDetectedItems(updated);

    // Record audit log
    recordAuditLog({
      event: 'user_item_correction',
      item_id: itemId,
      new_category: newCategory,
      timestamp: new Date().toISOString()
    }).catch(() => {});

    // Re-run optimization with corrected item
    triggerOptimizationAndClarification(updated, selectedStrategy);
  };

  const handleClarificationOptionSelect = (optionTargetCategory: string | null) => {
    if (!clarificationData?.question) return;
    const targetId = clarificationData.question.item_id;
    if (optionTargetCategory) {
      handleUserCorrection(targetId, optionTargetCategory);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setDetectedItems([]);
    setOptimizationResult(null);
    setClarificationData(null);
    setCollectionPlan(null);
    setErrorMsg(null);
  };

  const handleExportAuditJson = () => {
    const auditData = {
      timestamp: new Date().toISOString(),
      location: location.city || 'Coordinates provided',
      detected_items: detectedItems,
      clarification_evaluation: clarificationData,
      optimization_result: optimizationResult,
      collection_plan: collectionPlan
    };
    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecosort_audit_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Constraint-Validated Batch Waste Sorting</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Batch Analysis & Decision-Aware Optimizer
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
              Upload photographs with multiple waste items. Separate objects are localized,
              statutory rules verified, and a Mixed Integer Linear Program (MILP) optimizes batch allocation.
            </p>
          </div>

          {detectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAuditJson}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold border border-stone-300 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Audit JSON</span>
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Zone if no image */}
      {!imagePreview && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="bg-white rounded-3xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 transition-all p-12 text-center cursor-pointer shadow-xs group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
          />
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">Upload Multi-Object Waste Photograph</h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto">
            Drop an image containing bottles, cardboard, e-waste, cans, or batteries. The system detects each object and computes optimal batch sorting.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs">
            <Camera className="w-4 h-4" />
            <span>Select File or Photo</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
          <h4 className="text-base font-bold text-stone-800">Localizing Objects & Evaluating Dual-Vision Models...</h4>
          <p className="text-xs text-stone-500">Decomposing visual proposals, computing Shannon entropy and material attributes</p>
        </div>
      )}

      {/* Interactive Main Analysis Workspace */}
      {imagePreview && detectedItems.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Visual Image with Bounding Box Overlays */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Visual Spatial Localization ({detectedItems.length} Object{detectedItems.length > 1 ? 's' : ''})
                </span>
                <span className="text-xs text-stone-500">Click a box to focus</span>
              </div>

              {/* Responsive Container with Normalized Bounding Box Overlays */}
              <div className="relative overflow-hidden rounded-2xl border border-stone-300 bg-stone-950">
                <img
                  src={imagePreview}
                  alt="Batch waste capture"
                  className="w-full h-auto object-contain max-h-[460px] mx-auto block"
                />

                {/* Overlaid Normalized Bounding Boxes */}
                {detectedItems.map((item, idx) => {
                  const b = item.bounding_box;
                  const isSelected = selectedItemId === item.item_id;
                  return (
                    <div
                      key={item.item_id}
                      onClick={() => setSelectedItemId(item.item_id)}
                      style={{
                        position: 'absolute',
                        left: `${b.x * 100}%`,
                        top: `${b.y * 100}%`,
                        width: `${b.w * 100}%`,
                        height: `${b.h * 100}%`,
                      }}
                      className={`cursor-pointer transition-all border-2 rounded-lg ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-500/20 ring-4 ring-emerald-400/30 z-20'
                          : 'border-amber-400 bg-amber-400/10 hover:border-white z-10'
                      }`}
                    >
                      <span className="absolute -top-3 left-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-stone-900 text-white shadow">
                        #{idx + 1} {item.predicted_category}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Detected Items Grid Cards */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-stone-700">Detected Items in Current Batch:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {detectedItems.map((item, idx) => {
                    const isSelected = selectedItemId === item.item_id;
                    const activeCat = item.user_corrected_category || item.predicted_category;
                    return (
                      <div
                        key={item.item_id}
                        onClick={() => setSelectedItemId(item.item_id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 items-center ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/20'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.display_name}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-stone-200"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-stone-100 flex items-center justify-center font-bold text-xs text-stone-500">
                            #{idx + 1}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-stone-500">#{item.item_id}</span>
                            <span className="text-[11px] font-extrabold text-emerald-700">
                              {(item.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="font-bold text-xs text-stone-900 truncate">
                            {activeCat.replace('_', ' ').toUpperCase()}
                          </div>
                          {item.predicted_subtype && (
                            <div className="text-[10px] text-stone-500 truncate">
                              {formatSubtype(item.predicted_subtype)}
                            </div>
                          )}

                          {/* Manual Correction Selector */}
                          <div className="mt-1">
                            <select
                              value={activeCat}
                              onChange={(e) => handleUserCorrection(item.item_id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] font-semibold bg-stone-50 border border-stone-300 rounded px-1.5 py-0.5 w-full text-stone-700 cursor-pointer"
                            >
                              {ALL_CATEGORIES.map((c) => (
                                <option key={c.id} value={c.id}>
                                  Override: {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Research Clarification, MILP Optimizer & Route Planner */}
          <div className="lg:col-span-6 space-y-6">
            {/* Strategy Selection Toolbar */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Research Clarification Strategy</span>
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  HiGHS MILP Solver
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'independent', label: 'A: Independent', desc: 'No user queries' },
                  { id: 'confidence', label: 'B: Confidence', desc: 'Lowest conf item' },
                  { id: 'entropy', label: 'C: Shannon Entropy', desc: 'Highest H(P)' },
                  { id: 'decision_aware', label: 'D: Decision-Aware', desc: 'Max EVOI (Ours)' }
                ].map((strat) => (
                  <button
                    key={strat.id}
                    onClick={() => {
                      setSelectedStrategy(strat.id);
                      triggerOptimizationAndClarification(detectedItems, strat.id);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      selectedStrategy === strat.id
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    <div className="font-extrabold text-[11px] leading-tight">{strat.label}</div>
                    <div className={`text-[9px] mt-0.5 truncate ${selectedStrategy === strat.id ? 'text-emerald-200' : 'text-stone-500'}`}>
                      {strat.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Strategic Clarification Prompt (Human-in-the-Loop) */}
            {clarificationData?.question && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>Strategic Human-in-the-Loop Clarification</span>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-amber-200 font-bold">
                    Strategy: {clarificationData.selected_strategy.toUpperCase()}
                  </span>
                </div>

                <div className="flex gap-4 items-center bg-white/80 p-3 rounded-2xl border border-amber-200">
                  {clarificationData.question.thumbnail && (
                    <img
                      src={clarificationData.question.thumbnail}
                      alt="Clarify target"
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200"
                    />
                  )}
                  <div className="text-xs">
                    <p className="font-black text-stone-900">{clarificationData.question.question}</p>
                    <p className="text-stone-600 text-[11px] mt-0.5">{clarificationData.question.reason}</p>
                  </div>
                </div>

                {/* Clarification Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {clarificationData.question.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleClarificationOptionSelect(opt.target_category || null)}
                      className="p-2.5 rounded-xl bg-white hover:bg-amber-100/70 border border-amber-300 text-left text-xs font-semibold text-stone-800 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div>{opt.label}</div>
                        {opt.description && (
                          <div className="text-[10px] text-stone-500 font-normal">{opt.description}</div>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Optimization Results Panel */}
            {optimizationResult && (
              <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                      Batch Optimizer Outcome
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                      optimizationResult.status === 'optimal'
                        ? 'bg-emerald-100 text-emerald-800'
                        : optimizationResult.status === 'degenerate_trivial'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {optimizationResult.status.toUpperCase()}
                  </span>
                </div>

                {/* Metrics ribbon */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                  <div>
                    <div className="text-[10px] text-stone-500 font-bold uppercase">Objective Value</div>
                    <div className="text-base font-black text-emerald-700">
                      {optimizationResult.objective_value.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-500 font-bold uppercase">Solver Latency</div>
                    <div className="text-base font-black text-stone-800">
                      {optimizationResult.solve_time_ms} ms
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-500 font-bold uppercase">Active Streams</div>
                    <div className="text-base font-black text-stone-800">
                      {optimizationResult.active_streams.length}
                    </div>
                  </div>
                </div>

                {/* Assigned Streams Breakdown */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-stone-700">Optimal Stream Assignments:</div>
                  <div className="space-y-2">
                    {optimizationResult.assignments.map((a) => (
                      <div
                        key={a.item_id}
                        className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50/50 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-stone-900">#{a.item_id}</span>
                          <span className="text-stone-500 text-[11px]">({a.original_category})</span>
                          <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                          <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px]">
                            {a.assigned_stream ? a.assigned_stream.replace('_', ' ').toUpperCase() : 'MANUAL REVIEW'}
                          </span>
                        </div>
                        {a.rule_ids.length > 0 && (
                          <span className="text-[10px] text-stone-500 hidden sm:inline-block font-mono">
                            {a.rule_ids[0]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explain this Decision Accordion */}
                <div className="pt-1">
                  <button
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-stone-600" />
                      <span>Explain This Batch Optimization Decision</span>
                    </span>
                    {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showExplanation && (
                    <div className="mt-2 p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2 text-stone-700">
                      <p className="font-semibold text-stone-900">
                        {optimizationResult.decision_explanation?.summary}
                      </p>
                      <div className="text-[11px] text-stone-500">
                        <strong>Solver Backend:</strong> {optimizationResult.decision_explanation?.solver_backend}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        <strong>Active Constraints:</strong> {optimizationResult.active_constraints.join('; ')}
                      </div>
                      {optimizationResult.rejected_assignments.length > 0 && (
                        <div className="text-[11px] text-stone-600 pt-1">
                          <strong>Regulatory Rejections:</strong> {optimizationResult.rejected_assignments.length} ineligible stream assignment(s) strictly zeroed.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Collection Routing Tour */}
            {collectionPlan && collectionPlan.stops.length > 0 && (
              <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Multi-Stop Facility Tour ({collectionPlan.total_stops} Stop{collectionPlan.total_stops > 1 ? 's' : ''})</span>
                  </span>
                  <span className="text-[10px] font-bold text-stone-500">
                    Total: {collectionPlan.total_distance_km} km (Geodesic Estimate)
                  </span>
                </div>

                <div className="space-y-2">
                  {collectionPlan.stops.map((stop) => (
                    <div
                      key={stop.facility_id}
                      className="p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-stone-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-black">
                            {stop.stop_order}
                          </span>
                          <span>{stop.facility_name}</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700">
                          {stop.leg_distance_km} km
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 truncate">{stop.address}</div>
                      <div className="flex items-center gap-1 pt-1">
                        <span className="text-[10px] font-bold text-stone-600">Delivers:</span>
                        {stop.waste_streams_delivered.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold"
                          >
                            {s.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-stone-500 leading-tight">
                  * Note: Distance calculated via spherical Haversine formula as a straight-line geodesic estimate, not driving time or road network distance.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
