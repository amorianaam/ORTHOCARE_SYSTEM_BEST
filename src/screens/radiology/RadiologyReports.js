import React, { useState, useEffect, useCallback } from "react";
import { BarChart3, Calendar, Search, ChevronDown, CheckSquare, Clock, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import useAuthStore from "../../store/useAuthStore";

const RadiologyReports = () => {
  const { token } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  // Filters
  const [dateFilter, setDateFilter] = useState("all"); // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/radiology/stats?";

      if (dateFilter === "custom" && customRange.start && customRange.end) {
        url += `startDate=${customRange.start}&endDate=${customRange.end}`;
      } else if (dateFilter !== "all") {
        const now = new Date();
        let start = "";
        const pad = (n) => n.toString().padStart(2, "0");
        const format = (d) =>
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

        if (dateFilter === "today") {
          start = format(now);
        } else if (dateFilter === "week") {
          const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          start = format(past);
        } else if (dateFilter === "month") {
          const past = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate(),
          );
          start = format(past);
        }
        url += `startDate=${start}&endDate=${format(now)}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(await res.json());
    } catch {
      toast.error(<div className="flex items-center gap-2"><AlertCircle size={20} /><span>"فشل تحميل الإحصائيات"</span></div>, { className: "!bg-red-50 !border-red-200 !text-red-800 !z-[999999]" });
    } finally {
      setLoading(false);
    }
  }, [token, dateFilter, customRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleResetFilters = () => {
    setDateFilter("all");
    setCustomRange({ start: "", end: "" });
    toast.info("تم إعادة تعيين فلاتر التقارير");
  };

  const groupedData = useMemo(() => {
    if (!stats?.tableData) return [];
    const map = new Map();
    stats.tableData.forEach((row) => {
      if (!map.has(row.visit_number)) {
        map.set(row.visit_number, {
          visit_number: row.visit_number,
          patient_name: row.patient_name,
          date: row.date,
          total_scans: 0,
          large_films: 0,
          small_films: 0,
          without_films: 0,
          details: [],
        });
      }
      const group = map.get(row.visit_number);
      const scansCount = parseInt(row.scans_in_film || 1, 10);
      group.total_scans += scansCount;

      if (row.film_size === "large") group.large_films += 1;
      else if (row.film_size === "small") group.small_films += 1;
      else group.without_films += scansCount;

      if (new Date(row.date) > new Date(group.date)) {
        group.date = row.date;
      }
      group.details.push(row);
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
  }, [stats?.tableData]);

  return (
    <div className="flex-1 overflow-y-auto space-y-6 w-full custom-scrollbar pr-2 pb-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-orange-900 to-slate-900 p-6 rounded-3xl text-white border border-orange-950 shadow-lg relative overflow-hidden flex-shrink-0 mt-2">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-700/80 flex items-center justify-center text-orange-200 shadow-inner">
              <TrendingUp size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black">
                تقارير الأداء والإحصائيات التحليلية
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                تتبع استهلاك أفلام التصوير الطبي وعدد الإشعة المنجزة
              </p>
            </div>
          </div>
          <button
            onClick={fetchStats}
            className="btn-secondary bg-slate-800 hover:bg-slate-700 border-none text-slate-200 flex items-center gap-2 text-xs py-2 shadow-md">
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />{" "}
            تحديث البيانات
          </button>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-2xl text-xs font-bold text-gray-500">
            {[
              { id: "all", label: "الكل" },
              { id: "today", label: "اليوم" },
              { id: "week", label: "آخر 7 أيام" },
              { id: "month", label: "آخر 30 يوماً" },
              { id: "custom", label: "تاريخ مخصص" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id)}
                className={`px-4 py-2 rounded-xl transition-all ${
                  dateFilter === f.id
                    ? "bg-white text-orange-800 shadow-sm"
                    : "hover:bg-white/40"
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {dateFilter !== "all" && (
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors">
              إعادة تعيين
            </button>
          )}
        </div>

        {/* Custom Range Picker */}
                  {dateFilter === "custom" && (
            <div
              className="overflow-hidden">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 flex flex-wrap gap-4 items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-500">من تاريخ:</span>
                  <input
                    type="date"
                    value={customRange.start}
                    onChange={(e) =>
                      setCustomRange({ ...customRange, start: e.target.value })
                    }
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-gray-700"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-500">إلى تاريخ:</span>
                  <input
                    type="date"
                    value={customRange.end}
                    onChange={(e) =>
                      setCustomRange({ ...customRange, end: e.target.value })
                    }
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-gray-700"
                  />
                </div>
              </div>
            </div>
          )}
              </div>

      {loading && !stats ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* KPI Overviews */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 flex-shrink-0">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md hover:border-orange-200 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400">
                  أفلام كبيرة مستخدمة
                </span>
                <h3 className="text-2xl font-black text-gray-800">
                  {stats?.summary?.large_films || 0}
                </h3>
              </div>
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Film size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md hover:border-blue-200 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400">
                  أفلام صغيرة مستخدمة
                </span>
                <h3 className="text-2xl font-black text-gray-800">
                  {stats?.summary?.small_films || 0}
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Film size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md hover:border-gray-300 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400">
                  حفظ رقمي بدون فيلم
                </span>
                <h3 className="text-2xl font-black text-gray-800">
                  {stats?.summary?.without_film || 0}
                </h3>
              </div>
              <div className="w-12 h-12 bg-gray-50 text-gray-500 rounded-2xl flex items-center justify-center shadow-inner">
                <ImageIcon size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md hover:border-emerald-200 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400">
                  إجمالي الأشعة المنجزة
                </span>
                <h3 className="text-2xl font-black text-gray-800">
                  {stats?.summary?.total_operations || 0}
                </h3>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                <BarChart3 size={20} />
              </div>
            </div>
          </div>

          {/* Table Data Render */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-shrink-0">
            <div className="px-5 py-4 border-b bg-gray-50/50 flex items-center gap-2">
              <BookOpen size={18} className="text-gray-400" />
              <h4 className="font-black text-gray-700 text-sm">
                سجل استهلاك أفلام التصوير والأشعة
              </h4>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-right">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-150 text-xs font-bold">
                  <tr>
                    <th className="px-5 py-3">المعرف (الرقم المرجعي)</th>
                    <th className="px-5 py-3">الاسم</th>
                    <th className="px-5 py-3">الأفلام المستهلكة</th>
                    <th className="px-5 py-3">إجمالي الأشعة</th>
                    <th className="px-5 py-3">التاريخ والوقت</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {groupedData.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-10 text-center text-gray-400 font-bold text-xs">
                        لا يوجد سجلات استهلاك في هذه الفترة.
                      </td>
                    </tr>
                  ) : (
                    groupedData.map((group, i) => (
                      <React.Fragment key={group.visit_number}>
                        {/* Main Group Row */}
                        <tr
                          onClick={() =>
                            setExpandedRow(
                              expandedRow === group.visit_number
                                ? null
                                : group.visit_number,
                            )
                          }
                          className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors cursor-pointer group">
                          <td className="px-5 py-4 font-black text-gray-500 text-xs bg-gray-50/50">
                            {group.visit_number}
                          </td>
                          <td className="px-5 py-4 font-extrabold text-gray-800">
                            {group.patient_name}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              {group.large_films > 0 && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-[10px] font-black border border-orange-200">
                                  {group.large_films} فيلم كبير
                                </span>
                              )}
                              {group.small_films > 0 && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-[10px] font-black border border-blue-200">
                                  {group.small_films} فيلم صغير
                                </span>
                              )}
                              {group.without_films > 0 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-black border border-gray-200">
                                  {group.without_films} بدون فيلم
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 font-black text-gray-700">
                            {group.total_scans}{" "}
                            <span className="text-gray-400 font-bold text-[10px]">
                              أشعة
                            </span>
                          </td>
                          <td
                            className="px-5 py-4 font-bold text-gray-500 text-xs"
                            dir="ltr">
                            {new Date(group.date).toLocaleString("ar-EG", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                              <ChevronDown
                                size={16}
                                className={`transition-transform duration-300 ${expandedRow === group.visit_number ? "rotate-180" : ""}`}
                              />
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Details Row */}
                                                  {expandedRow === group.visit_number && (
                            <tr className="bg-gray-50/30">
                              <td
                                colSpan="6"
                                className="p-0 border-b border-gray-100">
                                <div
                                  className="overflow-hidden">
                                  <div className="p-6">
                                    <div className="bg-white rounded-2xl border border-gray-150 p-1 shadow-sm">
                                      <table className="w-full text-xs text-right">
                                        <thead className="bg-gray-50 text-gray-500 rounded-t-xl font-bold">
                                          <tr>
                                            <th className="px-4 py-2 rounded-tr-xl">
                                              النوع (الفيلم)
                                            </th>
                                            <th className="px-4 py-2">
                                              عدد الأشعة
                                            </th>
                                            <th className="px-4 py-2 rounded-tl-xl">
                                              الأشعة المنفذة
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {group.details.map((detail, idx) => (
                                            <tr
                                              key={idx}
                                              className="border-t border-gray-50 hover:bg-gray-50/50">
                                              <td className="px-4 py-3">
                                                <span
                                                  className={`px-2 py-1 rounded text-[10px] font-black inline-flex items-center gap-1 ${
                                                    detail.film_size === "large"
                                                      ? "bg-orange-50 text-orange-600 border border-orange-100"
                                                      : detail.film_size ===
                                                          "small"
                                                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                                                        : "bg-gray-100 text-gray-600 border border-gray-200"
                                                  }`}>
                                                  {detail.film_size !==
                                                    "none" && (
                                                    <Film size={10} />
                                                  )}
                                                  {detail.film_size === "large"
                                                    ? "فيلم كبير"
                                                    : detail.film_size ===
                                                        "small"
                                                      ? "فيلم صغير"
                                                      : "بدون فيلم"}
                                                </span>
                                              </td>
                                              <td className="px-4 py-3 font-bold text-gray-700">
                                                {detail.scans_in_film}
                                              </td>
                                              <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                  {detail.scan_names
                                                    ?.split(" - ")
                                                    .map((name, nIdx) => (
                                                      <span
                                                        key={nIdx}
                                                        className="bg-white border border-gray-200 px-2 py-0.5 rounded text-[10px] font-bold text-gray-600">
                                                        {name.trim()}
                                                      </span>
                                                    ))}
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                                              </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Main Dashboard (Sidebar Navigation replaces Tabs) ─────────────

export default RadiologyReports;
