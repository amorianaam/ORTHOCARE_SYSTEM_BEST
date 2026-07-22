import React, { useState, useEffect, useRef } from 'react';
import { History, ArrowLeft, ArrowRight, Calendar, ChevronDown } from 'lucide-react';

const SmartVisitSelector = ({ patientHistory, selectedVisit, onSelectVisit, theme = 'indigo' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const colors = theme === 'teal' 
    ? { icon: 'text-teal-500', borderHover: 'hover:border-teal-300', borderActive: 'border-teal-100', bgActive: 'bg-teal-50', textActive: 'text-teal-700', bgDot: 'bg-teal-600' }
    : { icon: 'text-indigo-500', borderHover: 'hover:border-indigo-300', borderActive: 'border-indigo-100', bgActive: 'bg-indigo-50', textActive: 'text-indigo-700', bgDot: 'bg-indigo-600' };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getLabel = (v) => {
    if (!v) return "كل الزيارات...";
    const d = new Date(v.created_at || Date.now());
    const dateStr = d.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const timeStr = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    return `${v.visit_number || v.id} — ${dateStr} ${timeStr}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 ${colors.borderHover} transition-all outline-none cursor-pointer`}
      >
        <Calendar size={12} className={`${colors.icon} flex-shrink-0`} />
        <span className="text-[10.5px] font-black text-gray-600 whitespace-nowrap" dir="ltr">
          {getLabel(selectedVisit)}
        </span>
        <ChevronDown size={11} className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full right-0 mt-1 bg-white border ${colors.borderActive} rounded-xl shadow-2xl z-[200] min-w-[240px] max-h-52 overflow-y-auto p-1`}>
          {patientHistory.map((v) => {
            const isActive = selectedVisit?.id === v.id || selectedVisit?.visitId === v.visitId;
            return (
              <button
                key={v.id || v.visitId}
                onClick={() => {
                  if (onSelectVisit) onSelectVisit(v);
                  setIsOpen(false);
                }}
                className={`w-full text-right px-3 py-2 rounded-lg text-[10.5px] font-bold transition-colors flex items-center gap-2 ${
                  isActive ? `${colors.bgActive} ${colors.textActive}` : 'text-gray-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? colors.bgDot : 'bg-gray-300'}`} />
                <span dir="ltr">{getLabel(v)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function UnifiedTimelineNavigator({ patientHistory, selectedVisit, onSelectVisit, visit, theme = 'indigo' }) {
  if (!patientHistory || patientHistory.length <= 1) return null;
  const colors = theme === 'teal'
    ? { bgIcon: 'bg-teal-100', textIcon: 'text-teal-600', textLabel: 'text-teal-800', btn: 'border-teal-200 text-teal-700 hover:bg-teal-600 hover:border-teal-600 hover:text-white' }
    : { bgIcon: 'bg-indigo-100', textIcon: 'text-indigo-600', textLabel: 'text-indigo-800', btn: 'border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white' };

  const activeId = selectedVisit?.id || visit?.id || visit?.visitId;
  const currentIndex = patientHistory.findIndex(v => v.id === activeId || v.visitId === activeId);

  if (currentIndex === -1) return null;

  const newerCount = currentIndex;
  const olderCount = patientHistory.length - 1 - currentIndex;
  const hasNewer = newerCount > 0;
  const hasOlder = olderCount > 0;

  const newerVisit = hasNewer ? patientHistory[currentIndex - 1] : null;
  const olderVisit = hasOlder ? patientHistory[currentIndex + 1] : null;

  // Build the smart contextual message
  let badge = "";
  let message = "";
  if (hasNewer && hasOlder) {
    badge = "bi";
    message = `زيارات أحدث (${newerCount}) وسابقة (${olderCount}) لهذا المريض`;
  } else if (hasNewer) {
    badge = "newer";
    message = newerCount === 1 ? "توجد زيارة أحدث مسجلة لهذا المريض" : `توجد زيارات أحدث (${newerCount}) مسجلة لهذا المريض`;
  } else if (hasOlder) {
    badge = "older";
    message = olderCount === 1 ? "توجد زيارة سابقة مسجلة لهذا المريض" : `توجد زيارات سابقة (${olderCount}) مسجلة لهذا المريض`;
  }

  return (
    <div className="flex items-center justify-between gap-2 bg-slate-50 border-b border-slate-200 px-4 py-2 flex-shrink-0">
      {/* LEFT: Icon + contextual message */}
      <div className="flex items-center gap-2 min-w-0">
        <div className={`p-1.5 ${colors.bgIcon} rounded-lg ${colors.textIcon} flex-shrink-0`}>
          <History size={13} />
        </div>
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className={`text-[10px] font-black ${colors.textLabel} whitespace-nowrap`}>تاريخ طبي:</span>
          <span className="text-[10px] font-bold text-gray-500 truncate">{message}</span>
        </div>
      </div>

      {/* RIGHT: Navigation arrows + selector */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {hasNewer && (
          <button
            onClick={() => onSelectVisit && onSelectVisit(newerVisit)}
            className={`flex items-center gap-1 px-2 py-1 bg-white border ${colors.btn} rounded-lg font-black text-[10px] transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap`}
          >
            أحدث <ArrowLeft size={12} />
          </button>
        )}
        {hasOlder && (
          <button
            onClick={() => onSelectVisit && onSelectVisit(olderVisit)}
            className={`flex items-center gap-1 px-2 py-1 bg-white border ${colors.btn} rounded-lg font-black text-[10px] transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap`}
          >
            <ArrowRight size={12} /> سابقة
          </button>
        )}
        <SmartVisitSelector
          patientHistory={patientHistory}
          selectedVisit={selectedVisit}
          onSelectVisit={onSelectVisit}
          theme={theme}
        />
      </div>
    </div>
  );
}
