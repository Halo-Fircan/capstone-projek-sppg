import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  Filter,
  MapPin,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  FileText,
  X,
  Printer,
  Loader2,
  Activity,
  TrendingDown,
  BrainCircuit,
  Search,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import axios from "axios";

let persistentWilayah = "Nasional";

const LaporanTrend = () => {
  const [selectedWilayah, setSelectedWilayah] = useState(persistentWilayah);
  const [summaryData, setSummaryData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tableSearchTerm, setTableSearchTerm] = useState("");

  const [dropdownSearchTerm, setDropdownSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [selectedAnalisisData, setSelectedAnalisisData] = useState(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchLaporanData = async () => {
      try {
        setLoading(true);
        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("adminToken");
        const config = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {};

        let summaryRes;
        try {
          summaryRes = await axios.get(
            "https://backend-capstone-naufalms29s-projects.vercel.app/api/dashboard/summary",
            config,
          );
        } catch (e) {
          if (e.response?.status === 404) {
            summaryRes = await axios.get(
              "https://backend-capstone-naufalms29s-projects.vercel.app/dashboard/summary",
              config,
            );
          } else {
            throw e;
          }
        }

        if (summaryRes?.data?.status === "success") {
          setSummaryData(summaryRes.data.data);
        }

        let historyRes;
        try {
          historyRes = await axios.get(
            "https://backend-capstone-naufalms29s-projects.vercel.app/api/sppg-csv/history",
            config,
          );
        } catch (e) {
          if (e.response?.status === 404) {
            historyRes = await axios.get(
              "https://backend-capstone-naufalms29s-projects.vercel.app/dashboard/history",
              config,
            );
          } else {
            throw e;
          }
        }

        if (historyRes?.data?.status === "success") {
          setHistoryData(historyRes.data.data || []);
        }
      } catch (err) {
        console.error("Gagal memuat data laporan dari backend:", err);
        setError(
          "Gagal terhubung dengan server backend https://backend-capstone-naufalms29s-projects.vercel.app aktif.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLaporanData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearchTerm]);

  const cleanIndeksKerawanan = useMemo(() => {
    if (!summaryData?.indeksKerawanan) return [];
    return [...summaryData.indeksKerawanan]
      .sort((a, b) => Math.abs(b.gap || 0) - Math.abs(a.gap || 0))
      .slice(0, 5);
  }, [summaryData]);

  const uniqueHistoryData = useMemo(() => {
    const map = {};
    historyData.forEach((item) => {
      const nameKey = String(item.nama_wilayah || "")
        .trim()
        .toUpperCase();
      if (!nameKey) return;
      const gapVal = parseFloat(
        item.gap_prediksi !== undefined ? item.gap_prediksi : item.gap || 0,
      );

      if (!map[nameKey]) {
        map[nameKey] = item;
      } else {
        const existingGap = parseFloat(
          map[nameKey].gap_prediksi !== undefined
            ? map[nameKey].gap_prediksi
            : map[nameKey].gap || 0,
        );
        if (gapVal < existingGap) {
          map[nameKey] = item;
        }
      }
    });
    return Object.values(map);
  }, [historyData]);

  const listWilayahTersedia = useMemo(() => {
    return [
      "Nasional",
      ...new Set(
        uniqueHistoryData
          .map((item) => item.nama_wilayah)
          .filter(Boolean)
          .sort(),
      ),
    ];
  }, [uniqueHistoryData]);

  const filteredDropdownWilayah = useMemo(() => {
    if (!dropdownSearchTerm.trim()) return listWilayahTersedia;
    return listWilayahTersedia.filter((prov) =>
      prov.toLowerCase().includes(dropdownSearchTerm.toLowerCase()),
    );
  }, [listWilayahTersedia, dropdownSearchTerm]);

  const isNasional = selectedWilayah === "Nasional";

  const filteredHistory = useMemo(() => {
    const data = isNasional
      ? uniqueHistoryData
      : uniqueHistoryData.filter(
          (item) => item.nama_wilayah === selectedWilayah,
        );

    if (!tableSearchTerm.trim()) return data;
    return data.filter((item) =>
      String(item.nama_wilayah || "")
        .toLowerCase()
        .includes(tableSearchTerm.toLowerCase()),
    );
  }, [isNasional, uniqueHistoryData, selectedWilayah, tableSearchTerm]);

  let totalSiswa = 0;
  let totalSppgPrediksi = 0;
  let totalKebutuhan = 0;
  let rasioTeks = "1 : 0";
  let statusKerawanan = "Seimbang";
  let tingkatSkor = 30;

  if (isNasional) {
    totalSiswa =
      summaryData?.totalPenerimaAnak ||
      uniqueHistoryData.reduce((acc, curr) => acc + (curr.total_siswa || 0), 0);
    totalSppgPrediksi =
      summaryData?.totalSppgTerdaftar ||
      uniqueHistoryData.reduce(
        (acc, curr) => acc + (curr.jumlah_sppg_prediksi || 0),
        0,
      );
    totalKebutuhan = uniqueHistoryData.reduce(
      (acc, curr) => acc + (curr.kebutuhan_sppg || 0),
      0,
    );
    rasioTeks =
      summaryData?.rasioNasional ||
      (totalSppgPrediksi > 0
        ? `1 : ${Math.round(totalSiswa / totalSppgPrediksi).toLocaleString("id-ID")}`
        : "1 : 0");
    statusKerawanan = summaryData?.wilayahPrioritas > 0 ? "Waspada" : "Aman";
    tingkatSkor = summaryData?.wilayahPrioritas > 0 ? 65 : 20;
  } else if (filteredHistory.length > 0) {
    const target = filteredHistory[0];
    totalSiswa = target.total_siswa || 0;
    totalSppgPrediksi = target.jumlah_sppg_prediksi || 1;
    totalKebutuhan = target.kebutuhan_sppg || 1;

    const calculatedRatio = Math.round(totalSiswa / totalSppgPrediksi);
    rasioTeks = `1 : ${calculatedRatio.toLocaleString("id-ID")}`;

    const dbStatus = String(target.status || "")
      .toUpperCase()
      .replace(/_/g, " ")
      .trim();
    if (dbStatus === "KRITIS" || dbStatus === "SANGAT KURANG") {
      statusKerawanan = "Kritis";
      tingkatSkor = 90;
    } else if (
      dbStatus === "WASPADA" ||
      dbStatus === "KURANG" ||
      dbStatus === "DEFISIT"
    ) {
      statusKerawanan = "Kurang";
      tingkatSkor = 65;
    } else if (dbStatus === "SURPLUS") {
      statusKerawanan = "Surplus";
      tingkatSkor = 10;
    } else {
      if (calculatedRatio >= 1000) {
        statusKerawanan = "Kritis";
        tingkatSkor = 90;
      } else if (calculatedRatio >= 700) {
        statusKerawanan = "Kurang";
        tingkatSkor = 65;
      } else if (calculatedRatio < 300 && calculatedRatio > 0) {
        statusKerawanan = "Surplus";
        tingkatSkor = 10;
      } else {
        statusKerawanan = "Seimbang";
        tingkatSkor = 30;
      }
    }
  }

  const rankingPrioritas = useMemo(() => {
    if (isNasional) {
      return cleanIndeksKerawanan.map((item) => ({
        namaWilayah: item.namaWilayah,
        gap: parseFloat(item.gap || 0),
        isTarget: false,
      }));
    } else {
      return filteredHistory.map((item) => ({
        namaWilayah: item.nama_wilayah,
        gap: parseFloat(
          item.gap_prediksi !== undefined ? item.gap_prediksi : item.gap || 0,
        ),
        isTarget: true,
      }));
    }
  }, [isNasional, cleanIndeksKerawanan, filteredHistory]);

  const getMajorIsland = (namaWilayah) => {
    const u = String(namaWilayah || "").toUpperCase();
    if (
      u.includes("ACEH") ||
      u.includes("SUMATERA") ||
      u.includes("RIAU") ||
      u.includes("JAMBI") ||
      u.includes("PALEMBANG") ||
      u.includes("MEDAN") ||
      u.includes("ROKAN") ||
      u.includes("ASAHAN") ||
      u.includes("LANGKAT") ||
      u.includes("DELI") ||
      u.includes("BENGKULU") ||
      u.includes("LAMPUNG")
    )
      return "Sumatera";
    if (
      u.includes("KALIMANTAN") ||
      u.includes("PONTIANAK") ||
      u.includes("BANJARMASIN") ||
      u.includes("SAMARINDA") ||
      u.includes("SANGGAU") ||
      u.includes("SINTANG") ||
      u.includes("BULUNGAN") ||
      u.includes("KETAPANG")
    )
      return "Kalimantan";
    if (
      u.includes("SULAWESI") ||
      u.includes("MAKASSAR") ||
      u.includes("MANADO") ||
      u.includes("PALU") ||
      u.includes("KENDARI") ||
      u.includes("GORONTALO") ||
      u.includes("POSO") ||
      u.includes("BONE")
    )
      return "Sulawesi";
    if (
      u.includes("PAPUA") ||
      u.includes("MALUKU") ||
      u.includes("ASMAT") ||
      u.includes("AMBON") ||
      u.includes("JAYAPURA") ||
      u.includes("SORONG") ||
      u.includes("MERAUKE") ||
      u.includes("MIMIKA")
    )
      return "Maluku & Papua";
    return "Jawa";
  };

  const renderStatusBadge = (status) => {
    let classes = "";
    let label = status;

    if (status === "Sangat Kurang" || status === "Kritis") {
      label = "Sangat Kurang";
      classes = "bg-rose-50 text-rose-600 border-rose-200";
    } else if (status === "Kurang") {
      classes = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (status === "Surplus") {
      classes = "bg-blue-50 text-blue-600 border-blue-200";
    } else {
      label = "Seimbang";
      classes = "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${classes}`}
      >
        <svg
          className="w-3.5 h-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {label}
      </span>
    );
  };

  const chartData = useMemo(() => {
    const calculateHeight = (val) => {
      if (!val || val <= 0) return 0;

      let height = 0;
      if (val <= 300) {
        height = (val / 300) * 20;
      } else if (val <= 600) {
        height = 20 + ((val - 300) / 300) * 20;
      } else if (val <= 1000) {
        height = 40 + ((val - 600) / 400) * 20;
      } else if (val <= 1500) {
        height = 60 + ((val - 1000) / 500) * 20;
      } else {
        const ratioPct = (val - 1500) / 1000;
        height = 80 + Math.min(1, ratioPct) * 18;
      }

      return Math.min(98, Math.max(12, Math.round(height)));
    };

    if (isNasional) {
      const regionAgregasi = {
        Sumatera: {
          totalSiswa: 0,
          totalSppg: 0,
          defaultRatio: 950,
          countKab: 0,
        },
        Jawa: { totalSiswa: 0, totalSppg: 0, defaultRatio: 650, countKab: 0 },
        Kalimantan: {
          totalSiswa: 0,
          totalSppg: 0,
          defaultRatio: 1100,
          countKab: 0,
        },
        Sulawesi: {
          totalSiswa: 0,
          totalSppg: 0,
          defaultRatio: 1350,
          countKab: 0,
        },
        Papua: { totalSiswa: 0, totalSppg: 0, defaultRatio: 1850, countKab: 0 },
      };

      uniqueHistoryData.forEach((item) => {
        const pulau = getMajorIsland(item.nama_wilayah);
        if (regionAgregasi[pulau]) {
          regionAgregasi[pulau].totalSiswa += item.total_siswa || 0;
          regionAgregasi[pulau].totalSppg += item.jumlah_sppg_prediksi || 0;
          regionAgregasi[pulau].countKab += 1;
        }
      });

      return ["Sumatera", "Jawa", "Kalimantan", "Sulawesi", "Papua"].map(
        (pulau) => {
          const data = regionAgregasi[pulau];
          const rValue =
            data.totalSppg > 0
              ? Math.round(data.totalSiswa / data.totalSppg)
              : data.defaultRatio;

          return {
            label: pulau,
            nilai: `1:${rValue.toLocaleString("id-ID")}`,
            tinggi: calculateHeight(rValue),
            tipe: "kritis",
            countKab: data.countKab || 5,
            totalSppg:
              data.totalSppg ||
              Math.round(data.totalSiswa / data.defaultRatio) ||
              12,
          };
        },
      );
    } else {
      const currentRatio = Math.round(totalSiswa / totalSppgPrediksi);
      const avgNasionalRatio = 650;
      const idealRatio = 300;

      const totalSppgNasional = uniqueHistoryData.reduce(
        (acc, curr) => acc + (curr.jumlah_sppg_prediksi || 0),
        0,
      );

      return [
        {
          label: "Wilayah Terpilih",
          nilai: `1:${currentRatio.toLocaleString("id-ID")}`,
          tinggi: calculateHeight(currentRatio),
          tipe: "kini",
          countKab: 1,
          totalSppg: totalSppgPrediksi,
        },
        {
          label: "Rata-Rata Nasional",
          nilai: `1:${avgNasionalRatio.toLocaleString("id-ID")}`,
          tinggi: calculateHeight(avgNasionalRatio),
          tipe: "rata",
          countKab: uniqueHistoryData.length || 34,
          totalSppg: totalSppgNasional || 120,
        },
        {
          label: "Target BGN Ideal",
          nilai: `1:${idealRatio.toLocaleString("id-ID")}`,
          tinggi: calculateHeight(idealRatio),
          tipe: "ideal",
          countKab: "-",
          totalSppg: "-",
        },
      ];
    }
  }, [isNasional, uniqueHistoryData, totalSiswa, totalSppgPrediksi]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentTableRows = useMemo(() => {
    return filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredHistory, indexOfFirstItem, indexOfLastItem]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleStartDownload = () => {
    setIsDownloading(true);
    setDownloadProgress(10);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsDownloadModalOpen(false);
            setIsDownloading(false);
            setDownloadProgress(0);

            setTimeout(() => {
              window.print();
            }, 150);
          }, 500);
          return 100;
        }
        return prev + 30;
      });
    }, 400);
  };

  return (
    <div
      id="top-laporan"
      className="space-y-6 animate-fadeIn pb-10 print:p-0 print-container"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          /* Menyembunyikan seluruh UI Dashboard aslinya ketika mencetak */
          .print-hide, aside, header, footer, button, input, select, form, [role="dialog"], .fixed {
            display: none !important;
          }

          /* Maksimalkan area kertas A4 portrait */
          @page {
            size: A4 portrait;
            margin: 1.2cm !important;
          }
          
          body, html, #root, main, .flex-1, [class*="pl-"] {
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            min-height: 100% !important;
            overflow: visible !important;
            position: static !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-container {
            font-family: "Times New Roman", Times, serif !important;
            color: #0f172a !important;
            background: #ffffff !important;
            width: 100% !important;
          }

          /* Warna hitam pekat untuk cetakan teks formal */
          p, span, td, th, h1, h2, h3, h4, h5, div {
            color: #000000 !important;
          }
          
          /* Force render warna latar belakang grafik */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `,
        }}
      />

      <div className="print:hidden space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-left">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Laporan Tren & Prediksi
            </h1>
            <p className="text-sm text-slate-500">
              Kelola data pemetaan sebaran gizi dan rasio pemenuhan pangan
              spasial.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 w-full lg:w-auto justify-start lg:justify-end shrink-0">
            {/* DROPDOWN CONTAINER DENGAN LEBAR MAKSIMAL PRESISI */}
            <div className="relative w-full max-w-[240px] lg:w-60 shrink-0">
              {/* Tombol Pemicu Dropdown Utama */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/55 flex items-center justify-between shadow-sm cursor-pointer transition-all text-left"
              >
                <span className="truncate">
                  {selectedWilayah === "Nasional"
                    ? "Seluruh Nasional"
                    : selectedWilayah}
                </span>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <Filter
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setDropdownSearchTerm("");
                    }}
                  />

                  <div className="absolute left-0 mt-2 w-full bg-white border border-slate-100 rounded-xl shadow-xl max-h-72 overflow-hidden flex flex-col z-50 animate-fadeIn text-left">
                    <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5 shrink-0">
                      <Search size={12} className="text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ketik cari wilayah..."
                        value={dropdownSearchTerm}
                        onChange={(e) => setDropdownSearchTerm(e.target.value)}
                        className="w-full bg-transparent text-[11px] font-semibold text-slate-700 placeholder-slate-400 outline-none border-none p-0 focus:ring-0"
                        onClick={(e) => e.stopPropagation()} // Mencegah dropdown tertutup saat mengklik input
                      />
                      {dropdownSearchTerm && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDropdownSearchTerm("");
                          }}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto flex-1 divide-y divide-slate-50 py-1">
                      {filteredDropdownWilayah.length === 0 ? (
                        <div className="px-4 py-3 text-center text-[10px] text-slate-400 italic">
                          Wilayah tidak ditemukan
                        </div>
                      ) : (
                        filteredDropdownWilayah.map((prov, idx) => {
                          const isSelected = prov === selectedWilayah;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSelectedWilayah(prov);
                                persistentWilayah = prov;
                                setCurrentPage(1);
                                setIsDropdownOpen(false);
                                setDropdownSearchTerm("");
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? "bg-blue-50 text-blue-600 font-bold"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              <span className="truncate">
                                {prov === "Nasional"
                                  ? "Seluruh Nasional"
                                  : prov}
                              </span>
                              {isSelected && (
                                <svg
                                  className="w-4 h-4 text-blue-600 shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="bg-[#0A2647] hover:bg-[#144272] text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Printer size={14} /> Cetak Laporan PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Activity size={24} />
            </div>
            <div className="text-left">
              <p className="text-sm text-slate-500 mb-1">Rasio Cakupan Gizi</p>
              <p className="text-[18px] font-bold text-slate-900">
                {rasioTeks}
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div className="text-left">
              <p className="text-sm text-slate-500 mb-1">
                Fisik SPPG Terhitung
              </p>
              <p className="text-[18px] font-bold text-slate-900">
                {totalSppgPrediksi.toLocaleString("id-ID")}{" "}
                <span className="text-xs font-semibold text-slate-500">
                  Unit
                </span>
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle size={24} />
            </div>
            <div className="text-left">
              <p className="text-sm text-slate-500 mb-1">Sasaran Siswa</p>
              <p className="text-[18px] font-bold text-slate-900">
                {totalSiswa.toLocaleString("id-ID")}{" "}
                <span className="text-xs font-semibold text-slate-500">
                  Anak
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Card Chart (2/3 Lebar) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-none">
                Estimasi Beban Proyeksi Rasio SPPG
              </h3>
              <p className="text-[12px] text-slate-500 mt-1">
                {isNasional
                  ? "Komparasi estimasi tingkat kepadatan beban rasio gizi pada 5 wilayah region utama di Indonesia."
                  : "Estimasi perbandingan beban rasio wilayah terpilih terhadap rata-rata nasional and standar ideal."}
              </p>
            </div>

            <div className="h-64 bg-slate-50 rounded-xl p-5 flex flex-col justify-end border border-slate-100 relative mt-2 overflow-visible">
              <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-[9px] font-bold text-slate-400 text-right pr-2 py-4">
                <span>Sangat Padat (1:2500)</span>
                <span>Padat (1:1500)</span>
                <span>Tinggi (1:1000)</span>
                <span>Rata (1:600)</span>
                <span>Ideal (1:300)</span>
                <span>0</span>
              </div>

              <div className="ml-12 h-full relative flex items-end">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-1">
                  <div className="border-t border-slate-200/70 w-full h-0"></div>
                  <div className="border-t border-slate-200/70 w-full h-0"></div>
                  <div className="border-t border-slate-200/70 w-full h-0"></div>
                  <div className="border-t border-slate-200/70 w-full h-0"></div>
                  <div className="border-t border-slate-200/70 w-full h-0"></div>
                  <div className="border-t border-slate-200/70 w-full h-0"></div>
                </div>

                <div
                  className={`relative w-full h-full grid ${isNasional ? "grid-cols-5" : "grid-cols-3"} justify-items-center items-end z-10 pt-4 px-2`}
                >
                  {chartData.map((item, idx) => {
                    let barClass = "bg-blue-600";
                    if (item.tipe === "kritis")
                      barClass = "bg-[#0A2647] ring-4 ring-blue-500/10";
                    if (item.tipe === "ideal") barClass = "bg-emerald-500";
                    if (item.tipe === "rata") barClass = "bg-slate-400";
                    if (item.tipe === "kini")
                      barClass = "bg-[#0A2647] ring-4 ring-blue-500/20";

                    return (
                      <div
                        key={idx}
                        className="h-full flex flex-col justify-end items-center group relative w-full max-w-[48px]"
                      >
                        <div className="absolute bottom-full mb-2.5 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none flex flex-col items-center translate-y-1 group-hover:translate-y-0 duration-200 border border-slate-800">
                          <span className="font-extrabold text-xs mb-0.5">
                            {item.nilai}
                          </span>
                          <span className="text-[9px] font-semibold text-slate-400 uppercase truncate max-w-[120px]">
                            {item.label}
                          </span>
                          {item.countKab !== "-" && (
                            <span className="text-[8px] text-blue-400 font-bold mt-0.5">
                              {item.countKab} Kab/Kota • {item.totalSppg} SPPG
                            </span>
                          )}
                          <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 absolute -bottom-1"></div>
                        </div>

                        <div
                          className={`w-full rounded-t-md transition-all duration-[800ms] ease-out group-hover:brightness-105 shadow-sm ${barClass}`}
                          style={{ height: `${item.tinggi}%` }}
                        ></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className={`ml-12 grid ${isNasional ? "grid-cols-5" : "grid-cols-3"} justify-items-center text-[10px] text-slate-500 font-bold mt-4 pt-2 border-t border-slate-200`}
              >
                {chartData.map((item, idx) => (
                  <div
                    key={idx}
                    className="w-full text-center flex flex-col items-center"
                  >
                    <span
                      className="w-full text-center truncate px-1 text-slate-600"
                      title={item.label}
                    >
                      {item.label}
                    </span>
                    {item.countKab !== "-" ? (
                      <span className="text-[8px] font-semibold text-slate-400 block mt-1">
                        {item.countKab} Kab • {item.totalSppg} SPPG
                      </span>
                    ) : (
                      <span className="text-[8px] font-semibold text-emerald-600 block mt-1">
                        Standar Ideal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin size={16} className="text-[#0A2647]" />
                {isNasional
                  ? "Indeks Kerawanan Wilayah"
                  : "Status Target Wilayah"}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {isNasional
                  ? "Top 5 Kabupaten/Kota SANGAT KURANG sebaran fisik SPPG."
                  : "Detail status dan nilai gap wilayah yang sedang Anda pilih."}
              </p>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto mt-4 mb-4 pr-1 justify-center flex flex-col text-left">
              {rankingPrioritas.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <HelpCircle size={32} className="text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-505">
                    Tidak ada data indeks kerawanan yang valid.
                  </p>
                </div>
              ) : (
                rankingPrioritas.map((item, idx) => {
                  const maxGap =
                    Math.max(...rankingPrioritas.map((i) => Math.abs(i.gap))) ||
                    1;
                  const barWidth = Math.min(
                    100,
                    Math.round((Math.abs(item.gap) / maxGap) * 100),
                  );

                  return (
                    <div key={idx} className="animate-fadeIn">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold text-slate-700 truncate max-w-[150px]">
                          {isNasional
                            ? `${idx + 1}. ${item.namaWilayah}`
                            : item.namaWilayah}
                        </span>
                        <span className="font-bold text-red-600">
                          Gap: {item.gap} SPPG
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div
                          className="bg-red-500 h-2.5 rounded-full transition-all duration-1000"
                          style={{ width: `${isNasional ? barWidth : 100}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 text-left">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Target: {selectedWilayah}
              </span>
            </div>
          </div>
        </div>

        <div
          id="tabel-analisis"
          className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col text-left"
        >
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-none">
                Rincian Hasil Analisis Sebaran per Wilayah
              </h3>
              <p className="text-[12px] text-slate-500 mt-1">
                Data rill keluaran model AI sebagai acuan pemantauan spasial
                nasional.
              </p>
            </div>

            <div className="relative w-full sm:w-64 shrink-0">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari nama wilayah..."
                value={tableSearchTerm}
                onChange={(e) => setTableSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white shadow-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                  <th className="px-6 py-4">Nama Wilayah</th>
                  <th className="px-6 py-4">Kapasitas SPPG</th>
                  <th className="px-6 py-4">Defisit/Kesenjangan</th>
                  <th className="px-6 py-4">Status AI</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {currentTableRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-10 text-center text-xs text-slate-400 italic"
                    >
                      Data wilayah tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  currentTableRows.map((item, idx) => {
                    const rawGap = parseFloat(
                      item.gap_prediksi !== undefined
                        ? item.gap_prediksi
                        : item.gap || 0,
                    );
                    const currentRatioVal = Math.round(
                      (item.total_siswa || 0) /
                        (item.jumlah_sppg_prediksi || 1),
                    );
                    const currentRatioFormatted = `1:${currentRatioVal.toLocaleString("id-ID")}`;
                    const formattedGapVal =
                      Math.abs(rawGap).toLocaleString("id-ID");

                    let statusLabel = "Seimbang";
                    const dbStatus = String(item.status || "")
                      .toUpperCase()
                      .replace(/_/g, " ")
                      .trim();

                    if (dbStatus === "KRITIS" || dbStatus === "SANGAT KURANG") {
                      statusLabel = "Kritis";
                    } else if (
                      dbStatus === "WASPADA" ||
                      dbStatus === "KURANG" ||
                      dbStatus === "DEFISIT"
                    ) {
                      statusLabel = "Kurang";
                    } else if (dbStatus === "SURPLUS") {
                      statusLabel = "Surplus";
                    } else {
                      if (currentRatioVal >= 1000) {
                        statusLabel = "Kritis";
                      } else if (currentRatioVal >= 700) {
                        statusLabel = "Kurang";
                      } else if (currentRatioVal < 300 && currentRatioVal > 0) {
                        statusLabel = "Surplus";
                      } else {
                        statusLabel = "Seimbang";
                      }
                    }

                    const simulationItem = {
                      nama: item.nama_wilayah,
                      rasio: currentRatioFormatted,
                      status: statusLabel,
                      penjelasan:
                        item.penjelasan_prediksi ||
                        "Analisis rasiologi otomatis menunjukkan ketidakseimbangan muatan operasional.",
                      analisis: {
                        gap: `Defisit ${formattedGapVal} unit operasional standar kementerian yang terhitung secara spasial.`,
                      },
                    };

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 transition-colors text-xs"
                      >
                        <td className="px-6 py-4 font-bold text-slate-850">
                          {item.nama_wilayah}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {item.jumlah_sppg_prediksi} Unit SPPG
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <span
                            className={
                              rawGap < 0
                                ? "text-red-500 font-bold"
                                : "text-green-600 font-bold"
                            }
                          >
                            {rawGap < 0
                              ? `Defisit ${Math.abs(rawGap)} Unit`
                              : "Aman (0)"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {renderStatusBadge(statusLabel)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              setSelectedAnalisisData(simulationItem)
                            }
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 justify-end w-full cursor-pointer bg-transparent border-none outline-none"
                          >
                            Rincian Analisis <ArrowRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredHistory.length > 0 && (
            <div className="p-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
              <div className="text-xs text-gray-500 text-center sm:text-left w-full sm:w-auto">
                Menampilkan{" "}
                <span className="font-semibold text-gray-700">
                  {indexOfFirstItem + 1}
                </span>{" "}
                -{" "}
                <span className="font-semibold text-gray-700">
                  {Math.min(indexOfLastItem, filteredHistory.length)}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-gray-700">
                  {filteredHistory.length}
                </span>{" "}
                data wilayah
              </div>

              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl mx-auto sm:mx-0">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-20 cursor-pointer transition-colors border-none bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    ) {
                      return (
                        <button
                          key={`page-btn-${page}`}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer border-none ${
                            currentPage === page
                              ? "bg-blue-900 text-white shadow-sm"
                              : "text-gray-600 hover:bg-gray-250 bg-transparent"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }
                    if (page === 2 || page === totalPages - 1) {
                      return (
                        <span
                          key={`dots-${page}`}
                          className="px-1 text-gray-400 text-xs font-bold"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  },
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-20 cursor-pointer transition-colors border-none bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="hidden print:block font-serif text-xs text-[#0f172a] print-container max-w-full leading-normal">
        {/* KOP SURAT FORMAL RESMI */}
        <div className="text-center border-b-4 border-double border-slate-900 pb-2 mb-4 text-left">
          <h1 className="text-sm font-bold uppercase tracking-wider mt-0.5">
            Badan Gizi Nasional (BGN)
          </h1>
          <p className="text-[9px] italic mt-0.5">
            Jl. Kebon Sirih No.1, RT.1/RW.7, Kb. Sirih, Kec. Menteng, Kota
            Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10340
          </p>
        </div>

        <div className="text-center mb-5">
          <h3 className="text-sm font-bold uppercase underline tracking-wide">
            LAPORAN EKSEKUTIF PEMETAAN TREN SPPG
          </h3>
          <p className="text-[10px] font-mono mt-0.5">
            ID Dokumen: BGN/TREN/{new Date().getFullYear()}/
            {Math.floor(1000 + Math.random() * 9000)}
          </p>
        </div>

        <div className="mb-5">
          <h4 className="text-[11px] font-bold uppercase mb-1.5 border-b border-slate-900 pb-0.5">
            I. Ringkasan Data Pokok Gizi Spasial
          </h4>
          <table className="w-full border-collapse border border-slate-900 text-[10px]">
            <tbody>
              <tr className="bg-slate-100/50">
                <td className="border border-slate-900 px-3 py-1.5 font-bold w-1/3">
                  Cakupan Wilayah Analisis
                </td>
                <td className="border border-slate-900 px-3 py-1.5 font-bold w-1/3">
                  Total Penerima Manfaat (Sasaran Siswa)
                </td>
                <td className="border border-slate-900 px-3 py-1.5 font-bold w-1/3">
                  Jumlah SPPG Fisik Terhitung
                </td>
              </tr>
              <tr>
                <td className="border border-slate-900 px-3 py-1.5">
                  {selectedWilayah}
                </td>
                <td className="border border-slate-900 px-3 py-1.5 font-bold">
                  {totalSiswa.toLocaleString("id-ID")} Anak
                </td>
                <td className="border border-slate-900 px-3 py-1.5 font-bold">
                  {totalSppgPrediksi.toLocaleString("id-ID")} Unit
                </td>
              </tr>
              <tr className="bg-slate-100/50">
                <td className="border border-slate-900 px-3 py-1.5 font-bold">
                  Rasio Kepadatan Gizi Spasial
                </td>
                <td className="border border-slate-900 px-3 py-1.5 font-bold">
                  Status Kerawanan Wilayah
                </td>
                <td className="border border-slate-900 px-3 py-1.5 font-bold">
                  Skor Kerawanan (Tingkat Risiko)
                </td>
              </tr>
              <tr>
                <td className="border border-slate-900 px-3 py-1.5 font-mono font-bold text-red-600">
                  {rasioTeks}
                </td>
                <td className="border border-slate-900 px-3 py-1.5 font-bold">
                  {statusKerawanan}
                </td>
                <td className="border border-slate-900 px-3 py-1.5 font-bold">
                  {tingkatSkor}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-5">
          <h4 className="text-[11px] font-bold uppercase mb-2 border-b border-slate-900 pb-0.5">
            II. Estimasi Beban Proyeksi Rasio SPPG Spasial
          </h4>

          <div className="h-32 bg-slate-50/50 border border-slate-300 rounded-lg p-3 flex flex-col justify-end relative">
            <div className="absolute left-1 top-1 bottom-6 w-14 flex flex-col justify-between text-[7px] font-bold text-slate-500 text-right pr-1 pb-1">
              <span>Sangat Padat</span>
              <span>Padat</span>
              <span>Tinggi</span>
              <span>Rata</span>
              <span>Ideal</span>
              <span>0</span>
            </div>

            <div className="ml-14 h-full relative flex items-end">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-1 border-b border-slate-300">
                <div className="border-t border-slate-200 w-full h-0"></div>
                <div className="border-t border-slate-200 w-full h-0"></div>
                <div className="border-t border-slate-200 w-full h-0"></div>
                <div className="border-t border-slate-200 w-full h-0"></div>
                <div className="border-t border-slate-200 w-full h-0"></div>
                <div className="border-t border-slate-200 w-full h-0"></div>
              </div>

              <div
                className={`relative w-full h-full grid ${isNasional ? "grid-cols-5" : "grid-cols-3"} justify-items-center items-end px-4`}
              >
                {chartData.map((item, idx) => (
                  <div
                    key={idx}
                    className="h-full flex flex-col justify-end items-center w-full max-w-[28px] relative"
                  >
                    <span className="text-[8px] font-bold text-slate-800 absolute -top-4">
                      {item.nilai}
                    </span>
                    <div
                      className="w-full bg-[#334155] rounded-t border border-slate-700"
                      style={{ height: `${item.tinggi}%` }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`ml-14 grid ${isNasional ? "grid-cols-5" : "grid-cols-3"} justify-items-center text-[8px] font-bold text-slate-700 mt-1 border-t border-slate-350 pt-1`}
            >
              {chartData.map((item, idx) => (
                <div key={idx} className="w-full text-center truncate px-0.5">
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-5">
          <h4 className="text-[11px] font-bold uppercase mb-1.5 border-b border-slate-900 pb-0.5">
            III. Urutan Indeks Kerawanan (Prioritas Alokasi Pangan)
          </h4>

          <table className="w-full border-collapse border border-slate-900 text-[10px]">
            <thead>
              <tr className="bg-slate-150">
                <th className="border border-slate-900 px-3 py-1.5 text-left w-12">
                  No
                </th>
                <th className="border border-slate-900 px-3 py-1.5 text-left">
                  Nama Wilayah Kabupaten / Kota
                </th>
                <th className="border border-slate-900 px-3 py-1.5 text-right">
                  Nilai Defisit Kesenjangan (Gap)
                </th>
              </tr>
            </thead>
            <tbody>
              {rankingPrioritas.length === 0 ? (
                <tr>
                  <td
                    colSpan="3"
                    className="border border-slate-900 px-3 py-2 text-center text-slate-500 italic"
                  >
                    Tidak ada antrean data prioritas.
                  </td>
                </tr>
              ) : (
                rankingPrioritas.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-slate-900 px-3 py-1.5">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-900 px-3 py-1.5 font-bold">
                      {item.namaWilayah}
                    </td>
                    <td className="border border-slate-900 px-3 py-1.5 text-right font-mono font-bold text-red-600">
                      {item.gap} SPPG
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDownloadModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md px-4 text-left animate-fadeIn print-hide">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-100 animate-fadeIn">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  Parameter Ekspor PDF
                </h2>
                <button
                  onClick={() => {
                    if (!isDownloading) setIsDownloadModalOpen(false);
                  }}
                  className="text-slate-400 hover:text-red-500 transition-colors outline-none cursor-pointer p-1 bg-transparent border-none"
                  disabled={isDownloading}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-455 tracking-wider mb-2">
                    Detail Dokumen
                  </label>
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <p className="text-xs font-bold text-slate-800">
                      Laporan Eksekutif Gizi
                    </p>
                    <p className="text-[10px] font-medium text-slate-505 mt-1">
                      Cakupan Wilayah: {selectedWilayah}
                    </p>
                  </div>
                </div>

                {isDownloading && (
                  <div className="pt-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-505 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Loader2
                          size={12}
                          className="animate-spin text-blue-600"
                        />{" "}
                        Rendering PDF...
                      </span>
                      <span>{downloadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${downloadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/80">
                <button
                  onClick={() => setIsDownloadModalOpen(false)}
                  className="w-full py-2.5 text-xs font-medium text-slate-500 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors border-none bg-transparent"
                  disabled={isDownloading}
                >
                  Batal
                </button>
                <button
                  onClick={handleStartDownload}
                  disabled={isDownloading}
                  className={`w-full py-2.5 text-xs font-medium text-white rounded-xl flex justify-center items-center gap-2 transition-all shadow-md border-none ${
                    isDownloading
                      ? "bg-slate-300 text-slate-100 shadow-none cursor-not-allowed"
                      : "bg-[#0A2647] hover:bg-[#144272] shadow-blue-600/20 cursor-pointer"
                  }`}
                >
                  <Download size={14} />{" "}
                  {isDownloading ? "Memproses..." : "Unduh Sekarang"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {selectedAnalisisData &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/20 backdrop-blur-md px-4 text-left animate-fadeIn print-hide">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200/80 animate-fadeIn relative">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                    <BrainCircuit size={18} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-800 truncate leading-none">
                      Rincian Analisis Spasial AI
                    </h2>
                    <span className="text-[9px] font-semibold text-slate-400 block mt-1 uppercase tracking-wider truncate">
                      Target: {selectedAnalisisData.nama}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAnalisisData(null)}
                  className="text-slate-400 hover:text-red-500 transition-colors outline-none cursor-pointer p-1 hover:bg-slate-100 rounded-lg bg-transparent border-none"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto max-h-[380px] scrollbar-thin">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-200/65 p-3.5 rounded-xl">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Rasio Saat Ini
                    </span>
                    <span className="text-base font-extrabold text-slate-800 mt-1 block font-mono">
                      {selectedAnalisisData.rasio}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/65 p-3.5 rounded-xl flex flex-col justify-between">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Status Kerawanan
                    </span>
                    <div className="mt-1">
                      {renderStatusBadge(selectedAnalisisData.status)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="p-1 bg-amber-50 text-amber-500 rounded-lg shrink-0 h-fit mt-0.5">
                    <Activity size={15} />
                  </div>
                  <div className="space-y-0.5 flex-1 text-left">
                    <h4 className="text-[12px] font-bold text-slate-850 leading-none">
                      Analisis Kesenjangan (Gap)
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      {selectedAnalisisData.analisis.gap}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-slate-100/80 pt-4">
                  <div className="p-1 bg-blue-50 text-blue-500 rounded-lg shrink-0 h-fit mt-0.5">
                    <FileText size={15} />
                  </div>
                  <div className="space-y-0.5 flex-1 text-left">
                    <h4 className="text-[12px] font-bold text-slate-850 leading-none">
                      Penjelasan Prediksi AI
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium whitespace-pre-line">
                      {selectedAnalisisData.penjelasan}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                <button
                  onClick={() => setSelectedAnalisisData(null)}
                  className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors border-none bg-transparent"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div className="fixed bottom-24 right-4 z-[999] md:hidden flex flex-col items-center bg-white/95 backdrop-blur-md border border-slate-200/85 rounded-full shadow-lg px-2.5 py-4 space-y-4 transition-all duration-300 animate-fadeIn print-hide">
        {/* Tombol Panah Atas (Scroll to Top) */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 active:scale-95 cursor-pointer"
          title="Ke Atas"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 4l-9 9h6v7h6v-7h6z" />
          </svg>
        </button>

        <button
          onClick={() => {
            document
              .getElementById("tabel-analisis")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          className="w-3.5 h-8 bg-slate-400 hover:bg-slate-500 rounded-full transition-colors active:scale-95 cursor-pointer shadow-sm"
          title="Ke Tabel Analisis"
        />

        <button
          onClick={() =>
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            })
          }
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 active:scale-95 cursor-pointer"
          title="Ke Bawah"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 20l9-9h-6v-7h-6v7h-6z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default LaporanTrend;
