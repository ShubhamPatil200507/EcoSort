import React from 'react';
import {
  MapPin, Phone, Mail, Globe, Navigation2, ShieldCheck,
  Building2, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { CentreRecord, VerificationStatus } from '../../types';

interface CentreCardProps {
  centre: CentreRecord;
  isSelected?: boolean;
  onSelect?: () => void;
}

const renderDataStatusBadge = (dataStatus?: string) => {
  if (dataStatus === 'stale') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <AlertCircle className="w-3 h-3 text-amber-600" />
        <span>Stale Data</span>
      </span>
    );
  }
  if (dataStatus === 'unverified') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
        <AlertCircle className="w-3 h-3 text-rose-600" />
        <span>Unverified</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
      <span>Verified Record</span>
    </span>
  );
};

const renderVerificationBadge = (status: VerificationStatus) => {
  switch (status) {
    case 'OFFICIALLY_VERIFIED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Officially Verified</span>
        </span>
      );
    case 'THIRD_PARTY_DIRECTORY':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Directory Listed</span>
        </span>
      );
    case 'GENERAL_SCRAP_UNVERIFIED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>General Scrap (Unverified)</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700">
          Sample Facility
        </span>
      );
  }
};

export const CentreCard: React.FC<CentreCardProps> = ({ centre, isSelected, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-emerald-50/50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
          : 'bg-white hover:bg-stone-50 border-stone-200 hover:border-stone-300 shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {renderVerificationBadge(centre.verification_status)}
            {renderDataStatusBadge(centre.data_status)}
            <span className="text-[11px] text-stone-500 font-medium">{centre.facility_type}</span>
            <span className="text-[10px] font-mono text-stone-400">ID: {centre.facility_id || centre.id}</span>
          </div>
          <h3 className="text-base font-bold text-stone-900 leading-snug">
            {centre.name}
          </h3>
          {centre.authorisation_status && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {centre.authorisation_status}
              </span>
              {centre.expiry_date && (
                <span className="text-[10px] font-mono text-stone-500">
                  Auth Expiry: {centre.expiry_date}
                </span>
              )}
            </div>
          )}
        </div>

        {centre.distance_text && (
          <span className="shrink-0 px-2.5 py-1 bg-stone-100 text-stone-800 font-bold text-xs rounded-lg border border-stone-200">
            {centre.distance_text}
          </span>
        )}
      </div>

      <div className="mt-2.5 space-y-1.5 text-xs text-stone-600">
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
          <span className="text-stone-700">{centre.address}</span>
        </div>

        {centre.operating_hours && (
          <div className="flex items-center gap-2 text-stone-500">
            <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>{centre.operating_hours}</span>
          </div>
        )}
      </div>

      {/* Accepted Categories Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {centre.accepted_categories.map((cat, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-stone-100 text-stone-700 rounded-md border border-stone-200"
          >
            {cat.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {/* Verification notes & Last Verified Date */}
      <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-[11px] space-y-1 text-stone-600">
        {centre.verification_notes && (
          <p className="italic">
            <strong>Source note:</strong> {centre.verification_notes}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-stone-500 pt-1 border-t border-stone-200/60">
          <span>Authority: {centre.authorisation_source || centre.source}</span>
          {centre.last_verified_date && (
            <span className="font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
              Audited: {centre.last_verified_date}
            </span>
          )}
        </div>
      </div>

      {/* Contact & Directions Actions */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs">
          {centre.phone && (
            <a
              href={`tel:${centre.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-medium"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>
          )}
          {centre.website && (
            <a
              href={centre.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-stone-600 hover:text-stone-900"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Website</span>
            </a>
          )}
        </div>

        {centre.directions_url && (
          <a
            href={centre.directions_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <Navigation2 className="w-3.5 h-3.5" />
            <span>Get Directions</span>
          </a>
        )}
      </div>
    </div>
  );
};
