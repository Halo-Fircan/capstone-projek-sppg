import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Building2,
  Activity,
  MapPin,
  CheckCircle,
  BrainCircuit,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import axios from "axios";

const StatCard = ({ title, value, icon, trendLabel, isPositive }) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-all duration-200 text-left">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500 mt-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            {value}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 border border-blue-100 shrink-0">
          {icon}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1 text-xs">
        <span
          className={`text-[12px] font-semibold px-2 py-1 rounded-full border ${isPositive ? "bg-green-50 text-green-700 border-green-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}
        >
          {isPositive ? "✓" : "⚠"} {trendLabel}
        </span>
      </div>
    </div>
  );
};

const Dashboard = ({ setActiveTab }) => {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cleanIndeksKerawanan = useMemo(() => {
    if (!apiData?.indeksKerawanan) return [];

    const map = {};
    apiData.indeksKerawanan.forEach((item) => {
      const nameKey = String(item.namaWilayah || item.nama_wilayah || "")
        .trim()
        .toUpperCase();
      if (!nameKey) return;

      const gapVal = Math.abs(parseFloat(item.gap || 0));

      if (!map[nameKey] || gapVal > Math.abs(map[nameKey].gap)) {
        map[nameKey] = {
          namaWilayah: item.namaWilayah || item.nama_wilayah,
          gap: parseFloat(item.gap) || 0,
          status: item.status,
        };
      }
    });

    return Object.values(map)
      .sort((a, b) => Math.abs(b.gap || 0) - Math.abs(a.gap || 0))
      .slice(0, 5);
  }, [apiData]);

  useEffect(() => {
    const getDashboardSummary = async () => {
      try {
        setLoading(true);

        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("adminToken");

        let response;
        let successLoad = false;

        try {
          response = await axios.get(
            "https://backend-capstone-naufalms29s-projects.vercel.app/api/dashboard/summary",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (response.data?.status === "success") {
            successLoad = true;
          }
        } catch (apiErr) {
          if (apiErr.response && apiErr.response.status === 404) {
            console.log(
              "Rute /api/dashboard/summary tidak ditemukan (404). Mencoba rute alternatif...",
            );
          } else {
            throw apiErr;
          }
        }

        if (!successLoad) {
          response = await axios.get(
            "https://backend-capstone-naufalms29s-projects.vercel.app/dashboard/summary",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
        }

        if (response && response.data?.status === "success") {
          setApiData(response.data.data);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          setError(
            "Sesi Anda telah berakhir atau token tidak valid. Silakan login kembali.",
          );
        } else {
          setError(
            "Gagal memuat ringkasan data. Koneksi database terputus atau rute server salah.",
          );
        }
        console.error(
          "Detail Error Dashboard Fetching:",
          err.response?.data || err,
        );
      } finally {
        setLoading(false);
      }
    };

    getDashboardSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">
          Memuat data analisis nasional...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center max-w-md mx-auto my-12">
        <AlertTriangle className="text-red-500 mx-auto mb-2" size={32} />
        <p className="text-sm font-semibold text-red-750">{error}</p>
      </div>
    );
  }

  const totalMaster = apiData?.totalSppgTerdaftar || 0;
  const totalAnak = apiData?.totalPenerimaAnak || 0;
  const wilayahPrioritas = apiData?.wilayahPrioritas || 0;

  const cards = [
    {
      title: "SPPG Aktif",
      value: `${totalMaster.toLocaleString("id-ID")} Unit`,
      icon: <Building2 size={20} />,
      trendLabel: "Fisik Terdaftar",
      isPositive: true,
    },
    {
      title: "Penerima Manfaat",
      value: `${totalAnak.toLocaleString("id-ID")} Anak`,
      icon: <Users size={20} />,
      trendLabel: "Siswa Terhitung",
      isPositive: true,
    },
    {
      title: "Rasio Cakupan Gizi",
      value: apiData?.rasioNasional || "1 : 0",
      icon: <Activity size={20} />,
      trendLabel: "Rasio Nasional",
      isPositive: true,
    },
    {
      title: "Wilayah Darurat",
      value: `${wilayahPrioritas} Daerah`,
      icon: <MapPin size={20} />,
      trendLabel: "Sangat Kurang",
      isPositive: false,
    },
    {
      title: "Akurasi Data",
      value: apiData?.kualitasData || "92.4%",
      icon: <CheckCircle size={20} />,
      trendLabel: "Valid",
      isPositive: true,
    },
  ];

  const topWilayah = cleanIndeksKerawanan?.[0]?.namaWilayah || "Wilayah Utama";
  const topGap = cleanIndeksKerawanan?.[0]?.gap || 0;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Analisis
          </h1>
          <p className="text-sm text-slate-500">
            Hasil kalkulasi data riil master SPPG dan prediksi spasial AI
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, idx) => (
          <StatCard key={idx} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[400px]">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900">
              Indeks Kerawanan Wilayah Kekurangan SPPG
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Top 5 Kabupaten/Kota{" "}
              <span className="text-red-600 font-bold">SANGAT KURANG</span>.
              sebaran fisik SPPG.
            </p>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto justify-center flex flex-col">
            {cleanIndeksKerawanan && cleanIndeksKerawanan.length > 0 ? (
              cleanIndeksKerawanan.map((item, idx) => {
                const maxGap =
                  Math.max(
                    ...cleanIndeksKerawanan.map((i) => Math.abs(i.gap)),
                  ) || 1;
                const barWidth = Math.min(
                  100,
                  Math.round((Math.abs(item.gap) / maxGap) * 100),
                );

                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-slate-700">
                        {idx + 1}. {item.namaWilayah}
                      </span>
                      <span className="font-bold text-red-600">
                        Gap: {item.gap} SPPG
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div
                        className="bg-red-500 h-2.5 rounded-full transition-all duration-1000"
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400 text-center">
                Tidak ada data kerawanan wilayah.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[400px]">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <BrainCircuit size={18} className="text-blue-600" />
              Rekomendasi Aksi AI
            </h3>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-xs">
              <p className="font-bold text-slate-800 flex items-center gap-1">
                <AlertTriangle size={14} className="text-red-500" /> Intervensi{" "}
                {topWilayah}
              </p>
              <p className="text-slate-600 mt-1">
                Defisit kritis {Math.abs(topGap)} unit armada. Jalankan rute
                rantai pasok logistik darurat secepatnya.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 text-xs">
              <p className="font-bold text-slate-800 flex items-center gap-1">
                <CheckCircle size={14} className="text-amber-500" /> Manajemen
                Penyangga Spasial
              </p>
              <p className="text-slate-600 mt-1">
                Terdapat akumulasi di {wilayahPrioritas} area merah. Alihkan
                buffer stock ke komoditas pangan kering.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab?.("ai")}
            className="w-full py-2.5 mt-2 bg-[#0A2647] hover:bg-[#144272] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
          >
            Tinjau Rencana Aksi <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
