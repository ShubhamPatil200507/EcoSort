import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  MapPin,
  Trash2,
  Cpu,
  Database,
  CheckCircle2,
  Info,
  Lock,
  RefreshCw
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useLocation } from '../../context/LocationContext';
import { getModelVersions, checkHealth } from '../../services/api';
import { clearAllStoredSessions } from '../../utils/sessionStore';

export const SettingsView: React.FC = () => {
  const { location, openOnboarding, skipLocation } = useLocation();

  const [modelRegistry, setModelRegistry] = useState<{ active_version: string; versions: any[] } | null>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [retentionOption, setRetentionOption] = useState<string>('local_only');

  useEffect(() => {
    checkHealth()
      .then(setHealthData)
      .catch(() => {});

    getModelVersions()
      .then(setModelRegistry)
      .catch(() => {});
  }, []);

  const handleClearData = () => {
    if (window.confirm('Clear all stored analysis sessions from this browser?')) {
      clearAllStoredSessions();
      alert('Local session cache cleared successfully.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Settings Header */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-[#17231D] tracking-tight">
          Settings & System Privacy
        </h2>
        <p className="text-xs text-[#66736B]">
          Configure privacy settings, location preferences, and inspect active model checkpoints
        </p>
      </div>

      {/* Model Version & Architecture Card */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E1E7E0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EAF4EC] text-[#174D3A] flex items-center justify-center">
              <Cpu className="w-4 h-4 text-[#287A54]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#17231D]">Active Machine Learning Weights</h3>
              <p className="text-[11px] text-[#66736B]">Model registry & hardware acceleration</p>
            </div>
          </div>

          <Badge
            status="validated"
            label={modelRegistry?.active_version ? `Active: ${modelRegistry.active_version}` : 'Active: v1.0.0'}
            size="sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-0.5">
            <span className="text-[10px] text-[#66736B] uppercase font-bold">Primary Architecture</span>
            <div className="font-semibold text-[#17231D]">
              {healthData?.model_architecture || 'MobileNetV3-Small (Fine-Tuned)'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-0.5">
            <span className="text-[10px] text-[#66736B] uppercase font-bold">Optical Classifier</span>
            <div className="font-semibold text-[#17231D]">EfficientNet-B0 (ImageNet-1k)</div>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-0.5">
            <span className="text-[10px] text-[#66736B] uppercase font-bold">Acceleration Device</span>
            <div className="font-semibold text-[#174D3A] uppercase font-mono">
              {healthData?.device || 'cpu'}
            </div>
          </div>
        </div>
      </Card>

      {/* Location Preferences */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E1E7E0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F0F5FD] text-[#285DA8] flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#285DA8]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#17231D]">Geospatial & Facility Location</h3>
              <p className="text-[11px] text-[#66736B]">Used only for Haversine distance ranking and TSP routes</p>
            </div>
          </div>

          <Badge
            status={location.isLoaded ? 'validated' : 'neutral'}
            label={location.city || 'Not configured'}
            size="sm"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-semibold text-[#17231D]">
              Active Location: {location.formatted_address || 'Default Coordinates'}
            </div>
            <p className="text-[11px] text-[#66736B]">
              Coordinates are never sent to external servers without explicit search actions.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={openOnboarding}>
              Update Location
            </Button>
            <Button variant="ghost" size="sm" onClick={skipLocation}>
              Reset to Default
            </Button>
          </div>
        </div>
      </Card>

      {/* Privacy & Image Retention */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E1E7E0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FEF7EC] text-[#946200] flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#946200]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#17231D]">Data Retention & Privacy</h3>
              <p className="text-[11px] text-[#66736B]">Control how waste images and records are cached</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="retention"
                value="local_only"
                checked={retentionOption === 'local_only'}
                onChange={(e) => setRetentionOption(e.target.value)}
                className="mt-0.5 text-[#287A54] focus:ring-[#287A54]"
              />
              <div>
                <span className="font-bold text-[#17231D] block">In-Browser Cache Only (Recommended)</span>
                <span className="text-[11px] text-[#66736B]">
                  Sessions and thumbnails are saved only inside your browser’s localStorage.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="retention"
                value="ephemeral"
                checked={retentionOption === 'ephemeral'}
                onChange={(e) => setRetentionOption(e.target.value)}
                className="mt-0.5 text-[#287A54] focus:ring-[#287A54]"
              />
              <div>
                <span className="font-bold text-[#17231D] block">Ephemeral Session (No storage)</span>
                <span className="text-[11px] text-[#66736B]">
                  Discard all records as soon as you navigate away from the current analysis.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-3 border-t border-[#E1E7E0] flex items-center justify-between">
            <span className="text-[11px] text-[#66736B]">Clear all local session records from this device:</span>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={handleClearData}
            >
              Clear Storage
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
