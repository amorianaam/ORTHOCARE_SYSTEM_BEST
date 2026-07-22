import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, User, Hash } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'react-toastify';

const STATUS_AR = {
  registered:                       'مسجل',
  pending_payment:                  'انتظار دفع',
  waiting:                          'انتظار الطبيب',
  with_doctor:                      'مع الطبيب',
  awaiting_service_payment:         'انتظار دفع خدمات',
  completed_admin_pending_services: 'خدمات معلقة',
  completed:                        'مكتمل',
  cancelled:                        'ملغي',
};

const GlobalSearch = () => {
  const { token, user } = useAuthStore();
  const navigate  = useNavigate();
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const timer    = useRef(null);

  const search = useCallback(async (q) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (query.trim().length >= 2) {
      timer.current = setTimeout(() => search(query), 350);
    } else {
      setResults([]);
    }
  }, [query, search]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (item) => {
    if (user?.role === 'doctor') {
      const today = new Date().toISOString().split('T')[0];
      const isToday = item.visit_date && item.visit_date.startsWith(today);
      if (isToday && item.visitId) {
        navigate('/doctor/queue', { state: { autoOpenVisitId: item.visitId } });
      } else {
        navigate('/doctor/archive', { state: { autoOpenPatientId: item.patient_id } });
      }
    } else if (user?.role === 'secretary' || user?.role === 'receptionist') {
      navigate('/secretary/patients', { state: { openPatientId: item.patient_id } });
    } else {
      toast.info("ميزة البحث غير مفعلة لهذا الحساب حالياً", {
        position: "bottom-center"
      });
    }
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors text-sm min-w-[180px] border border-gray-200"
      >
        <Search size={15}/>
        <span className="flex-1 text-right text-gray-400">بحث سريع...</span>
        <span className="text-xs text-gray-300 font-mono bg-gray-200 px-1.5 py-0.5 rounded">Ctrl K</span>
      </button>

      {/* Search Modal */}
      
        {open && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4" dir="rtl">
            {/* Backdrop */}
            <div 
              className="animate-in fade-in duration-200 absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => { setOpen(false); setQuery(''); }}
            />

            {/* Modal */}
            <div
              className="animate-in fade-in zoom-in-95 duration-200 relative z-10 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200"
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-white/50">
                <Search size={20} className="text-gray-400 flex-shrink-0"/>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="ابحث بالاسم، رقم الهاتف، الملف، رقم الزيارة..."
                  className="flex-1 outline-none bg-transparent text-gray-800 text-base placeholder:text-gray-400 placeholder:font-light"
                  autoComplete="off"
                />
                {query && (
                  <button onClick={() => { setQuery(''); setResults([]); }}
                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                    <X size={16}/>
                  </button>
                )}
                {loading && <span className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin flex-shrink-0"/>}
              </div>

              {/* Results */}
              <div className="max-h-[350px] overflow-y-auto">
                {results.length === 0 && query.trim().length >= 2 && !loading ? (
                  <div className="text-center py-12 text-gray-400 text-sm">لا توجد نتائج</div>
                ) : results.map((r, i) => (
                  <button key={r.id || i}
                    onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 hover:scale-[1.01] transition-all duration-200 text-right border-b border-gray-50 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {r.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm">{r.full_name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Hash size={10}/> {r.visit_number || '—'}
                        </span>
                        {r.phone && <span className="flex items-center gap-1 text-xs text-gray-400">{r.phone}</span>}
                        {r.age && <span className="text-xs text-gray-400">{r.age} سنة</span>}
                      </div>
                    </div>
                    {r.status && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap flex-shrink-0">
                        {STATUS_AR[r.status] || r.status}
                      </span>
                    )}
                  </button>
                ))}

                {!query && (
                  <div className="text-center py-8 text-gray-400">
                    <Search size={28} className="mx-auto mb-2 opacity-20"/>
                    <p className="text-sm">ابدأ الكتابة للبحث</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      
    </>
  );
};

export default GlobalSearch;
