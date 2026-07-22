import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  Radiation,
  Search,
  Check,
  RefreshCcw,
  X,
  Upload,
  CheckCircle,
  Film,
  Image as ImageIcon,
  Clock,
  CheckSquare,
  BarChart3,
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  Maximize2,
  Minimize2,
  LayoutGrid,
  List,
  ChevronDown,
  UploadCloud,
  FileText,
  Activity,
} from "lucide-react";
import { toast } from "react-toastify";
import useAuthStore from "../../store/useAuthStore";
import { getSocket } from "../../utils/socket";

// ── Upload Result Modal ───────────────────────────────────────────
const UploadResultModal = ({ requestId, token, onClose, onUploaded }) => {
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const handleSave = async () => {
    if (files.length === 0 && !notes)
      return toast.error("يجب إرفاق ملف أو كتابة تقرير");
    setSaving(true);
    try {
      const fileNames = files.map(f => f.name).join(', ');
      
      const res = await fetch(`/api/radiology/request/${requestId}/result`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          resultNotes: notes,
          resultFile: fileNames || null
        }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(d.message);
        onUploaded();
        onClose();
      } else toast.error(d.message);
    } catch {
      toast.error("فشل الرفع الخادم لا يستجيب");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/50 backdrop-blur-md animate-in fade-in duration-300" dir="rtl">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative z-10 bg-[#f8fafc] flex flex-col overflow-hidden transition-all duration-500 animate-in zoom-in-95 shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-4xl h-[85vh] sm:h-[80vh] rounded-[2.5rem] border border-white/60">
        
        {/* Fixed Header */}
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0 bg-white border-b border-slate-100 z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black shadow-inner border border-emerald-100">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-xl tracking-tight">إرفاق النتيجة والتقرير</h2>
              <p className="text-slate-500 font-medium text-xs mt-1">قم بكتابة التقرير الإشعاعي وإرفاق الصور الرقمية لدراسة الحالة.</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-all border border-slate-200">
            <X size={18}/>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-slate-50/50 flex flex-col lg:flex-row gap-6">
          
          {/* Right Area: Medical Notepad */}
          <div className="w-full lg:w-1/2 flex flex-col gap-3">
            <label className="text-sm font-black text-slate-700 flex items-center gap-2">
              <FileText size={16} className="text-emerald-500" />
              كتابة التقرير الإشعاعي
            </label>
            <div className="relative flex-1 min-h-[250px]">
              <textarea
                className="w-full h-full bg-white shadow-inner rounded-xl p-5 text-slate-700 font-medium leading-relaxed focus:ring-2 focus:ring-emerald-500 border border-slate-200 transition-all resize-none placeholder-slate-300 custom-scrollbar"
                placeholder="اكتب التقرير الطبي والتشخيص هنا..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="absolute bottom-4 left-4 text-[10px] font-bold text-slate-400">
                مساحة كتابة آمنة
              </div>
            </div>
          </div>

          {/* Left Area: Immersive Drop-Zone */}
          <div className="w-full lg:w-1/2 flex flex-col gap-3">
            <label className="text-sm font-black text-slate-700 flex items-center gap-2">
              <UploadCloud size={16} className="text-orange-500" />
              إرفاق الصور والمرفقات الرقمية
            </label>
            
            <input
              type="file"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            <div 
              onClick={() => fileInputRef.current.click()} 
              className="w-full flex-1 min-h-[250px] border-dashed border-2 border-slate-300 bg-slate-50 hover:bg-orange-50 hover:border-orange-300 transition-colors p-8 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-orange-500 group-hover:border-orange-200 transition-all duration-300 group-hover:scale-110">
                <UploadCloud size={32} />
              </div>
              <div className="text-center">
                <p className="font-black text-slate-700 text-sm group-hover:text-orange-600 transition-colors">اسحب وأفلت الملفات هنا أو انقر للاستعراض</p>
                <p className="font-bold text-slate-400 text-xs mt-1">يدعم صيغ الصور (JPG, PNG) وملفات PDF</p>
              </div>
            </div>

            {/* Attached Files List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                <h4 className="text-[11px] font-black text-slate-500 mb-2">الملفات المرفقة ({files.length})</h4>
                {files.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-orange-200 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                        <FileText size={14} />
                      </div>
                      <span className="truncate max-w-[200px] sm:max-w-[250px] font-bold text-xs text-slate-700">{f.name}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setFiles((p) => p.filter((_, i) => i !== idx)); }} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all" title="حذف المرفق">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Fixed Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-between items-center z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
           <div className="text-xs font-bold text-slate-400 hidden sm:block">
             تأكد من مطابقة التقرير مع الفحص قبل الاعتماد
           </div>
           <div className="flex gap-3 w-full sm:w-auto">
             <button onClick={onClose} disabled={saving} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 font-black text-sm transition-colors border border-slate-200 bg-white">
               إلغاء
             </button>
             <button onClick={handleSave} disabled={saving || (files.length === 0 && !notes)} className="flex-1 sm:flex-none px-8 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2">
               {saving ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <CheckCircle size={16} />}
               حفظ واعتماد التقرير
             </button>
           </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Film Grouping Modal ───────────────────────────────────────────
const FilmGroupingModal = ({ visitId, requests, token, onClose, onGrouped }) => {
  const [filmSize, setFilmSize] = useState("large");
  const [selectedReqs, setSelectedReqs] = useState([]);
  const [saving, setSaving] = useState(false);

  const unassigned = requests.filter((r) => r.with_film === 1 && !r.radiology_film_id);
  const maxSlots = filmSize === "large" ? 3 : 2;

  const handleSave = async () => {
    if (selectedReqs.length === 0) return toast.error("حدد دراسة إشعاعية واحدة على الأقل");
    if (selectedReqs.length > maxSlots) return toast.error(`الحد الأقصى لهذا الفيلم هو ${maxSlots}`);

    setSaving(true);
    try {
      const res = await fetch(`/api/radiology/visit/${visitId}/films`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filmSize, requestIds: selectedReqs }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(d.message);
        onGrouped();
        onClose();
      } else toast.error(d.message);
    } catch {
      toast.error("خطأ في الاتصال الخادم");
    } finally {
      setSaving(false);
    }
  };

  const toggleSelection = (id) => {
    if (selectedReqs.includes(id)) {
      setSelectedReqs(selectedReqs.filter((r) => r !== id));
    } else {
      if (selectedReqs.length >= maxSlots) {
         toast.info(`الفيلم ممتلئ! (الحد الأقصى ${maxSlots})`);
         return;
      }
      setSelectedReqs([...selectedReqs, id]);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/50 backdrop-blur-md animate-in fade-in duration-300" dir="rtl">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative z-10 bg-[#f8fafc] flex flex-col overflow-hidden transition-all duration-500 animate-in zoom-in-95 shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-5xl h-[80vh] rounded-[2.5rem] border border-white/60">
        
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0 bg-white border-b border-slate-100 z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black shadow-inner border border-orange-100">
              <LayoutGrid size={24} />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-xl tracking-tight">أستوديو تحضير الأفلام الطبية</h2>
              <p className="text-slate-500 font-medium text-xs mt-1">قم بتحديد حجم الفيلم وتوزيع الدراسات الإشعاعية عليه بدقة.</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-all border border-slate-200">
            <X size={18}/>
          </button>
        </div>

        {/* Dual-Pane Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Pane: Available Scans */}
          <div className="w-full md:w-1/2 flex flex-col bg-white border-l border-slate-100 relative z-10 h-full">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-700 text-sm flex items-center gap-2">
                <List size={16} className="text-slate-400" />
                الدراسات المتاحة للتجميع
              </h3>
              <span className="bg-white border border-slate-200 text-slate-600 font-black text-[10px] px-2 py-0.5 rounded-lg">
                {unassigned.length} متاح
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/50">
              {unassigned.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-emerald-600 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                  <CheckCircle size={32} className="mb-3 opacity-80" />
                  <p className="font-black text-sm">جميع الدراسات مكتملة الإدراج</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unassigned.map((r) => {
                    const isSelected = selectedReqs.includes(r.id);
                    return (
                      <div 
                        key={r.id} 
                        onClick={() => toggleSelection(r.id)} 
                        className={`group cursor-pointer flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 ${isSelected ? "border-orange-500 bg-orange-50/30 shadow-sm" : "border-slate-100 bg-white hover:border-orange-200 hover:shadow-sm"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${isSelected ? "bg-orange-500 border-orange-500 text-white" : "border-slate-200 bg-slate-50 group-hover:border-orange-300"}`}>
                            {isSelected && <Check size={14} strokeWidth={3} />}
                          </div>
                          <span className={`font-bold text-sm ${isSelected ? "text-orange-900" : "text-slate-700"}`}>
                            {r.name}
                          </span>
                        </div>
                        {!isSelected && (
                           <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-orange-50 text-orange-600 p-1.5 rounded-lg">
                             <Plus size={16} />
                           </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Pane: Visual Canvas */}
          <div className="w-full md:w-1/2 flex flex-col bg-slate-100 relative h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 pointer-events-none"></div>
            
            <div className="px-6 py-4 bg-white/60 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between z-10">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <Film size={16} className="text-orange-500" />
                محتوى الفيلم الحالي
              </h3>
              
              <div className="flex bg-slate-200/50 p-1 rounded-xl">
                <button onClick={() => { setFilmSize("small"); setSelectedReqs([]); }} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${filmSize === "small" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  فيلم S
                </button>
                <button onClick={() => { setFilmSize("large"); setSelectedReqs([]); }} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${filmSize === "large" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  فيلم L
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 sm:p-10 flex items-center justify-center relative z-10 overflow-y-auto custom-scrollbar">
              {/* Film Visualizer */}
              <div className={`w-full max-w-sm bg-slate-800 rounded-lg p-2 shadow-2xl flex flex-col gap-2 transition-all duration-300 ${filmSize === "large" ? "h-[450px]" : "h-[320px]"}`}>
                <div className="flex justify-between items-center px-2 py-1 mb-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 rounded-sm bg-white/20"></div>)}
                  </div>
                  <span className="text-white/40 font-black text-[10px] tracking-widest">{filmSize === "large" ? "LARGE FILM" : "SMALL FILM"}</span>
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 rounded-sm bg-white/20"></div>)}
                  </div>
                </div>

                {/* Slots */}
                {Array.from({ length: maxSlots }).map((_, idx) => {
                  const reqId = selectedReqs[idx];
                  const req = reqId ? unassigned.find(r => r.id === reqId) : null;
                  
                  return (
                    <div key={idx} onClick={() => reqId && toggleSelection(reqId)} className={`flex-1 rounded border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-2 ${req ? "border-transparent bg-slate-900/80 cursor-pointer hover:bg-red-500/20 group relative overflow-hidden" : "border-slate-600 bg-slate-800/50"}`}>
                       {req ? (
                         <>
                           <ImageIcon size={24} className="text-slate-400 group-hover:text-red-400 transition-colors" />
                           <span className="font-bold text-white text-xs px-4 text-center">{req.name}</span>
                           <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                             <Trash2 size={24} className="text-red-500" />
                           </div>
                         </>
                       ) : (
                         <>
                           <Plus size={20} className="text-slate-600" />
                           <span className="font-bold text-slate-500 text-[10px]">فتحة فارغة</span>
                         </>
                       )}
                    </div>
                  );
                })}
                
                <div className="flex justify-between items-center px-2 py-1 mt-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 rounded-sm bg-white/20"></div>)}
                  </div>
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 rounded-sm bg-white/20"></div>)}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-between items-center z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
               <div className="text-xs font-bold text-slate-400 hidden sm:block">
                 تم تحديد <span className="text-orange-600 font-black">{selectedReqs.length}</span> من أصل <span className="text-slate-600 font-black">{maxSlots}</span>
               </div>
               <div className="flex gap-3 w-full sm:w-auto">
                 <button onClick={onClose} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 font-black text-sm transition-colors border border-slate-200 bg-white">
                   إلغاء
                 </button>
                 <button onClick={handleSave} disabled={saving || selectedReqs.length === 0} className="flex-1 sm:flex-none px-8 py-2.5 rounded-xl bg-orange-600 text-white font-black text-sm hover:bg-orange-700 transition-all shadow-md shadow-orange-600/20 disabled:opacity-50 disabled:shadow-none">
                   {saving ? "جاري الحفظ..." : "اعتماد الفيلم المطبوع"}
                 </button>
               </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Patient Detail Panel (Centered Modal) ──────────────────────────
const PatientDetailPanel = ({ visitId, token, onClose, onCompleted, onStartAll, isCompletedTab, isPendingTab }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingItem, setUploadingItem] = useState(null);
  const [groupingMode, setGroupingMode] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/radiology/visit/${visitId}`, { headers: { Authorization: `Bearer ${token}` } });
      setData(await res.json());
    } catch {
      toast.error("فشل تحميل التفاصيل");
    } finally {
      setLoading(false);
    }
  }, [visitId, token]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteFilm = async (filmId) => {
    if (!window.confirm("هل أنت متأكد من فك تجميع هذا الفيلم؟ ستفقد النتيجة المشتركة إذا كانت موجودة.")) return;
    try {
      await fetch(`/api/radiology/films/${filmId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      toast.success("تم حذف الفيلم وفك ارتباط الفحوصات");
      load();
    } catch {
      toast.error("فشل الحذف");
    }
  };

  const handleFinishPatient = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/radiology/visit/${visitId}/complete`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (res.ok) {
        toast.success(d.message);
        onCompleted();
        onClose();
      } else toast.error(d.message);
    } catch {
      toast.error("تعذر الاتصال");
    } finally {
      setCompleting(false);
    }
  };

  const handleStartIndividualRequest = async (requestId) => {
    try {
      const res = await fetch(`/api/radiology/request/${requestId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "in_progress" }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success("تم تحويل الفحص لغرفة التصوير بنجاح");
        const socket = getSocket();
        socket.emit("radiology:updated", { visitId });
        load();
      } else toast.error(d.message);
    } catch {
      toast.error("فشل التنفيذ");
    }
  };

  const requests = data?.requests || [];
  const films = data?.films || [];
  const unassignedFilmsCount = requests.filter((r) => r.with_film === 1 && !r.radiology_film_id).length;
  const isAllDone = requests.every((r) => r.status === "completed");
  const hasPending = requests.some((r) => r.status === "paid");

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/50 backdrop-blur-md animate-in fade-in duration-300" dir="rtl">
      <div className="absolute inset-0" onClick={onClose} />

      <div className={`relative z-10 bg-[#f8fafc] flex flex-col overflow-hidden transition-all duration-500 animate-in zoom-in-95 shadow-[0_20px_50px_rgba(0,0,0,0.1)] ${isFullscreen ? 'w-[98vw] h-[98vh] rounded-[2.5rem] border border-white' : 'w-full max-w-6xl h-[88vh] rounded-[2.5rem] border border-white/60'}`}>
        
        {/* Out of the Box Premium Header - Restored Colors */}
        <div className="relative px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ background: "linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)" }}>
          {/* Subtle overlay texture */}
          <div className="absolute inset-0 bg-white/20 mix-blend-overlay"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            {/* Avatar block */}
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-orange-600 font-black text-2xl border border-orange-100">
                {data?.visit?.full_name?.charAt(0) || <Radiation size={24} />}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full"></div>
            </div>

            <div className="flex flex-col">
              <h2 className="font-black text-slate-800 text-xl tracking-tight">
                {data?.visit?.full_name || "جاري تحميل البيانات..."}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="bg-white/60 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-sm border border-white/50">
                  #{data?.visit?.visit_number}
                </span>
                <span className="bg-white/60 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-sm border border-white/50 flex items-center gap-1">
                  <Calendar size={12}/> {data?.visit?.age} سنة
                </span>
                <span className="bg-white/60 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-sm border border-white/50">
                  {data?.visit?.gender === 'male' ? 'ذكر' : 'أنثى'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            {/* Quick Actions in Header */}
            {hasPending && (
              <button onClick={() => { onStartAll(visitId); onClose(); }} className="mr-4 hidden sm:flex text-xs font-black items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all shadow-sm bg-orange-600 hover:bg-orange-700 text-white active:scale-95">
                <Activity size={14} /> تنفيذ كافة الدراسات الإشعاعية
              </button>
            )}
            
            <div className="w-px h-8 bg-orange-900/10 mx-2 hidden sm:block"></div>

            <button onClick={() => setIsFullscreen(!isFullscreen)} className="w-10 h-10 flex items-center justify-center bg-white/40 hover:bg-white/60 text-orange-900 rounded-xl transition-all backdrop-blur-sm shadow-sm" title={isFullscreen ? "تصغير" : "ملء الشاشة"}>
              {isFullscreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
            </button>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/40 hover:bg-red-50 hover:text-red-600 text-orange-900 rounded-xl transition-all backdrop-blur-sm shadow-sm">
              <X size={18}/>
            </button>
          </div>
        </div>

        {/* Super Premium Body */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {loading ? (
            <div className="p-8 w-full h-full flex items-center justify-center">
              <div className="animate-spin w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full"></div>
            </div>
          ) : (
            <div className="flex flex-1 w-full h-full">
              
              {/* Left Column: Requests Workspace */}
              <div className={`flex flex-col h-full bg-white transition-all duration-300 ${isPendingTab ? "w-full" : "w-full lg:w-3/5 xl:w-2/3 border-l border-slate-100"}`}>
                
                {/* Workspace Toolbar */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white z-10">
                  <div className="flex flex-col">
                    <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                      <LayoutGrid size={18} className="text-orange-500" />
                      مساحة عمل الدراسات الإشعاعية
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-black">{requests.length}</span>
                    </h3>
                  </div>
                  <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-orange-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}>
                      <List size={14} />
                    </button>
                    <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-orange-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}>
                      <LayoutGrid size={14} />
                    </button>
                  </div>
                </div>

                {/* Workspace Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
                  <div className={`${viewMode === "grid" ? `grid grid-cols-1 sm:grid-cols-2 ${isPendingTab ? "lg:grid-cols-3 xl:grid-cols-4" : "xl:grid-cols-2"} gap-4` : "flex flex-col gap-3 max-w-4xl mx-auto"}`}>
                    {requests.map((req) => {
                      const isGrouped = req.with_film === 1 && req.radiology_film_id;
                      const isCompleted = req.status === "completed";
                      const isInProgress = req.status === "in_progress";
                      
                      return (
                        <div key={req.id} className={`group relative bg-white rounded-2xl p-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] border ${isCompleted ? "border-emerald-100/80" : isInProgress ? "border-purple-100/80" : "border-slate-100 hover:border-orange-100"} ${viewMode === "list" ? "flex flex-row items-center justify-between" : "flex flex-col h-[160px]"}`}>
                          
                          {/* Accent line for grid */}
                          {viewMode === "grid" && (
                            <div className={`absolute top-0 right-0 w-full h-1 rounded-t-2xl ${isCompleted ? "bg-emerald-400" : isInProgress ? "bg-purple-400" : "bg-gradient-to-r from-orange-400 to-orange-300"}`}></div>
                          )}
                          {/* Accent line for list */}
                          {viewMode === "list" && (
                            <div className={`absolute top-0 right-0 w-1 h-full rounded-r-2xl ${isCompleted ? "bg-emerald-400" : isInProgress ? "bg-purple-400" : "bg-gradient-to-b from-orange-400 to-orange-300"}`}></div>
                          )}

                          <div className={viewMode === "list" ? "flex-1 flex justify-between items-center px-2" : ""}>
                            
                            <div className={`flex ${viewMode === "list" ? "items-center gap-4" : "justify-between items-start mb-4"}`}>
                              <h4 className="font-black text-slate-800 text-sm leading-snug line-clamp-2 max-w-[80%]">
                                {req.name}
                              </h4>
                              <div className="flex-shrink-0">
                                <span className={`text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 border ${isCompleted ? "text-emerald-600 bg-emerald-50 border-emerald-100" : isInProgress ? "text-purple-600 bg-purple-50 border-purple-100" : "text-orange-600 bg-orange-50 border-orange-100"}`}>
                                  {isCompleted ? "مكتمل" : isInProgress ? "قيد الإجراء" : "قيد الانتظار"}
                                </span>
                              </div>
                            </div>
                            
                            <div className={`flex gap-1.5 ${viewMode === "grid" ? "mb-auto" : ""}`}>
                              {req.with_film === 1 ? (
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 ${req.radiology_film_id ? "bg-slate-100 text-slate-600 border border-slate-200" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
                                  <Film size={12} /> {req.radiology_film_id ? "مُدرج بفيلم" : "يحتاج فيلم"}
                                </span>
                              ) : (
                                <span className="text-[10px] bg-slate-50 text-slate-500 px-2 py-1 border border-slate-200 rounded-lg font-bold flex items-center gap-1.5">
                                  <ImageIcon size={12} /> حفظ رقمي
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Beautiful Action Buttons */}
                          <div className={viewMode === "list" ? "flex-shrink-0 mr-4" : "mt-4 pt-3 border-t border-slate-50 flex gap-2"}>
                            {req.status === "paid" && (
                                <button onClick={() => handleStartIndividualRequest(req.id)} className="w-full text-xs font-black text-orange-600 bg-orange-50 hover:bg-orange-500 hover:text-white ring-2 ring-transparent hover:ring-orange-200 py-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm group-hover:shadow-md">
                                  <Activity size={14} /> تنفيذ الدراسة الإشعاعية
                                </button>
                            )}
                            
                            {req.status !== "paid" && !isGrouped && (
                              <button onClick={() => setUploadingItem({ type: "request", item: req })} className={`w-full text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 border-2 ${isCompleted ? "bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50" : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"}`}>
                                {isCompleted ? <><CheckCircle size={14} /> عرض التقرير</> : <><UploadCloud size={14} /> رفع النتيجة</>}
                              </button>
                            )}
                            
                            {req.status !== "paid" && isGrouped && (
                               <div className="w-full text-[10px] font-bold text-slate-400 bg-slate-50 py-2 rounded-xl text-center border border-slate-100 border-dashed flex items-center justify-center gap-1">
                                 <Film size={12}/> مرتبط بفيلم
                               </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Films Studio (Visible if not pending) */}
              {!isPendingTab && (
                <div className="hidden lg:flex w-2/5 xl:w-1/3 flex-col bg-slate-50 relative overflow-hidden">
                  
                  {/* Studio Header */}
                  <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200/60 bg-slate-100/50 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                        <Film size={16} />
                      </div>
                      <span className="font-black text-sm text-slate-800">أستوديو الأفلام</span>
                    </div>
                    {unassignedFilmsCount > 0 && (
                      <button onClick={() => setGroupingMode(true)} className="text-xs font-black bg-orange-500 text-white hover:bg-orange-600 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm shadow-orange-500/20">
                        <Plus size={14} /> فيلم جديد
                      </button>
                    )}
                  </div>

                  {/* Studio Content */}
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4 relative z-10">
                    {films.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <Film size={32} className="text-slate-300" />
                        </div>
                        <p className="font-bold text-sm text-slate-500">لا توجد أفلام مجمعة</p>
                        <p className="text-xs text-slate-400 mt-1 text-center max-w-[200px]">قم بإضافة فيلم لتجميع الفحوصات ذات الصلة وطباعتها معاً.</p>
                      </div>
                    ) : (
                      films.map((f) => (
                        <div key={f.id} className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                          {/* Top accent */}
                          <div className="absolute top-0 right-0 w-full h-1 bg-slate-800"></div>

                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-black text-sm shadow-inner">
                                {f.film_size === "large" ? "L" : "S"}
                              </div>
                              <div>
                                <p className="font-black text-slate-800 text-sm">
                                  فيلم {f.film_size === "large" ? "كبير (Large)" : "صغير (Small)"}
                                </p>
                                <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                                  <CheckSquare size={12} /> {f.requests?.length || 0} دراسات
                                </p>
                              </div>
                            </div>
                            <button onClick={() => handleDeleteFilm(f.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all" title="إلغاء الفيلم">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          
                          <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {f.requests?.map((fr, idx) => (
                              <p key={idx} className="text-xs font-bold text-slate-700 flex items-center gap-2 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-800 flex-shrink-0" /> {fr.name}
                              </p>
                            ))}
                          </div>
                          
                          <button onClick={() => setUploadingItem({ type: "film", item: f })} className="w-full text-xs font-black bg-slate-800 text-white hover:bg-slate-700 py-2.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm">
                            {f.status === "completed" ? (
                              <><FileText size={14} /> عرض التقرير المشترك</>
                            ) : (
                              <><UploadCloud size={14} /> رفع نتيجة الفيلم</>
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Action Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-between items-center z-20">
          <div className="text-xs font-bold text-slate-400 hidden sm:block">
            {isAllDone ? "🎉 جميع الفحوصات مكتملة" : "يرجى استكمال جميع الفحوصات لإنهاء الملف"}
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={onClose} className="flex-1 sm:flex-none bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-black py-2.5 px-6 rounded-xl transition-all">
              إغلاق
            </button>
            
            {!isCompletedTab && !hasPending && (
              <button onClick={handleFinishPatient} disabled={completing || !isAllDone} className={`flex-1 sm:flex-none font-black py-2.5 px-8 rounded-xl transition-all flex items-center justify-center gap-2 ${isAllDone ? "bg-slate-800 hover:bg-slate-900 text-white shadow-lg shadow-slate-800/20" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
                {completing ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" /> : <CheckCircle size={16} />}
                إنهاء وتسليم الملف
              </button>
            )}
          </div>
        </div>

      </div>

      {uploadingItem && (
        <UploadResultModal
          requestId={uploadingItem.type === "request" ? uploadingItem.item.id : uploadingItem.item.id}
          token={token}
          onClose={() => setUploadingItem(null)}
          onUploaded={() => { setUploadingItem(null); load(); }}
        />
      )}
      {groupingMode && (
        <FilmGroupingModal
          visitId={visitId}
          requests={requests}
          token={token}
          onClose={() => setGroupingMode(false)}
          onGrouped={() => { setGroupingMode(false); load(); }}
        />
      )}
    </div>,
    document.body
  );
};

// ── Main Dashboard ─────────────
const RadiologyDashboard = () => {
  const { token } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "pending";
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [dates, setDates] = useState({ start: "", end: "" });
  const [dailyStats, setDailyStats] = useState({ largeFilms: 0, smallFilms: 0, digitalSaves: 0, totalCompleted: 0 });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/radiology/requests?tab=${activeTab}`;
      if (activeTab === "completed") {
        // Force today's date for completed tab
        const today = new Date().toLocaleDateString("en-CA"); // 'YYYY-MM-DD' in local timezone
        url += `&startDate=${today}&endDate=${today}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(await res.json());
    } catch {
      toast.error("فشل تحميل القائمة");
    } finally {
      setLoading(false);
    }
  }, [token, activeTab, dates]);

  useEffect(() => {
    fetchRequests();
    const socket = getSocket();
    socket.on("request:new", fetchRequests);
    socket.on("radiology:updated", fetchRequests);
    return () => {
      socket.off("request:new", fetchRequests);
      socket.off("radiology:updated", fetchRequests);
    };
  }, [fetchRequests]);

  const handleStartAll = async (visitId) => {
    try {
      const res = await fetch(`/api/radiology/visit/${visitId}/start-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(d.message);
        fetchRequests();
      } else toast.error(d.message);
    } catch {
      toast.error("فشل التنفيذ");
    }
  };

  const filtered = requests.filter(
    (r) =>
      !query || r.full_name.includes(query) || r.visit_number.includes(query),
  );

  const TABS = [
    { id: 'pending', label: 'الطلبات الواردة', icon: Clock, color: 'text-sky-600', bg: 'bg-sky-50', activeBg: 'bg-sky-600' },
    { id: 'in_progress', label: 'قيد الإجراء', icon: Radiation, color: 'text-purple-600', bg: 'bg-purple-50', activeBg: 'bg-purple-600' },
    { id: 'completed', label: 'فحوصات منجزة', icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', activeBg: 'bg-emerald-600' },
  ];

  return (
    <div className="p-6 min-h-full flex flex-col space-y-6" dir="rtl">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-lg">
            <Radiation size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800">قسم الأشعة والتصوير الطبي</h1>
            <p className="text-sm font-bold text-gray-500 mt-0.5">إدارة ومتابعة الفحوصات الإشعاعية</p>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
        {[
          { label: 'أفلام كبيرة مستخدمة', value: dailyStats.largeFilms, icon: Film, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
          { label: 'أفلام صغيرة مستخدمة', value: dailyStats.smallFilms, icon: Film, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
          { label: 'حفظ رقمي بدون فيلم', value: dailyStats.digitalSaves, icon: ImageIcon, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
          { label: 'إجمالي الأشعة المنجزة', value: dailyStats.totalCompleted, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${s.border} bg-white shadow-sm relative overflow-hidden flex flex-col justify-between`}>
            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${s.bg} to-transparent opacity-50 rounded-bl-[100px] -z-10`} />
            <div className="flex justify-between items-start mb-2">
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={16} className={s.color} />
              </div>
            </div>
            <div>
              <p className="text-xl font-black text-gray-800">{s.value}</p>
              <p className="text-xs font-bold text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs Menu ── */}
      <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex-shrink-0 overflow-x-auto no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSearchParams({ tab: tab.id })}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? `${tab.activeBg} text-white shadow-md transform scale-[1.02]` 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activeTab === tab.id ? 'bg-white/20 text-white' : tab.bg + ' ' + tab.color}`}>
              <tab.icon size={14} />
            </div>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main Content Area ── */}
      <div className="bg-gray-50 rounded-3xl p-4 flex-1 flex flex-col min-h-0 border border-gray-100 shadow-inner">
        <>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <div className="relative w-full md:w-96">
                <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={query} onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 block pr-12 py-2.5 font-bold transition-all shadow-sm"
                  placeholder="بحث سريع باسم المريض أو رقم الزيارة..."
                />
              </div>
              <button
                onClick={fetchRequests}
                className="h-10 w-10 flex flex-shrink-0 items-center justify-center p-0 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white transition-all border border-orange-100 shadow-sm"
              >
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-gray-100 shadow-sm" />
                ))
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-400 space-y-3">
                  <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-2">
                    <Radiation size={32} className="text-gray-300" />
                  </div>
                  <p className="font-bold text-lg">لا توجد سجلات مطابقة</p>
                  <p className="text-sm">لم يتم العثور على مرضى في هذه القائمة.</p>
                </div>
              ) : (
                filtered.map((v, i) => {
                  const isActive = selected?.visit_id === v.visit_id;
                  return (
                    <div
                      key={v.visit_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelected(v)}
                      className={`rounded-2xl border p-5 cursor-pointer transition-all ${
                        isActive
                          ? "border-orange-500 shadow-md bg-orange-50/40 ring-2 ring-orange-50 scale-[1.01]"
                          : "border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm"
                      }`}>
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl shadow-sm ${
                              activeTab === "completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700"
                            }`}>
                            {v.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-lg">
                              {v.full_name}
                            </p>
                            <p className="text-xs font-semibold text-gray-500 mt-1 flex items-center gap-2">
                              <span className="bg-gray-100 px-2 py-0.5 rounded">
                                العمر: {v.age} سنة
                              </span>
                              <span className="bg-gray-100 px-2 py-0.5 rounded">
                                الرقم المرجعي: {v.visit_number}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-5">
                          <div className="text-left flex flex-col items-end gap-1.5">
                            <span className="text-xs font-bold bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200">
                              {v.total_tests} إجراءات مطلوبة
                            </span>
                            {v.tests_with_film > 0 && (
                              <span className="text-[10px] font-bold text-orange-600 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                                <Film size={12} /> متضمنة أفلام تصوير
                              </span>
                            )}
                          </div>

                          {activeTab === "pending" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartAll(v.visit_id);
                              }}
                              className="text-sm font-bold bg-orange-600 text-white px-5 py-2.5 rounded-xl hover:bg-orange-700 shadow-sm transition-all active:scale-95 flex items-center gap-2">
                              <CheckCircle size={18} /> تحويل لغرفة التصوير
                            </button>
                          )}
                          {activeTab !== "pending" && (
                            <div className="text-orange-400 bg-orange-50 p-2 rounded-xl">
                              <ChevronLeft size={20} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
        </>
      </div>

      {/* Detail Modal Overlay */}
      
        {selected && (
          <PatientDetailPanel
            visitId={selected.visit_id}
            token={token}
            isCompletedTab={activeTab === "completed"}
            isPendingTab={activeTab === "pending"}
            onStartAll={handleStartAll}
            onClose={() => setSelected(null)}
            onCompleted={() => {
              fetchRequests();
              setSelected(null);
            }}
          />
        )}
      
    </div>
  );
};

const ChevronLeft = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export default RadiologyDashboard;
