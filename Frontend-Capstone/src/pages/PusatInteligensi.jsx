import React, { useState, useEffect } from "react";
import {
  Cpu,
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Layers,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

export default function PusatInteligensi({ handleFileUpload }) {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [historyResult, setHistoryResult] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const BASE_URL = "https://backend-capstone-naufalms29s-projects.vercel.app";

  const getActiveToken = () => {
    return (
      localStorage.getItem("accessToken") || localStorage.getItem("adminToken")
    );
  };

  const fetchAnalysesHistory = async () => {
    try {
      const token = getActiveToken();

      const response = await fetch(`${BASE_URL}/api/sppg-csv/history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.status === "success") {
          setHistoryResult(resData.data || []);
          setCurrentPage(1);
        } else {
          console.error("Gagal memuat riwayat:", resData.message);
        }
      } else if (response.status === 401) {
        setErrorMessage(
          "Sesi Anda telah berakhir atau token tidak valid. Silakan login kembali.",
        );
      } else {
        setErrorMessage("Gagal memuat riwayat dari server.");
      }
    } catch (error) {
      console.error("Error fetching history dari database:", error);
      setErrorMessage("Terjadi kesalahan jaringan saat memuat riwayat.");
    }
  };

  useEffect(() => {
    fetchAnalysesHistory();
  }, []);

  const filteredHistory = historyResult.filter(
    (item) =>
      String(item?.nama_wilayah || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(item?.status || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(item?.interpretasi || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(item?.rekomendasi_kebijakan || item?.rekomendasi || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith(".csv")) {
        setErrorMessage(
          "Format file tidak didukung. Harap unggah berkas berekstensi .csv saja.",
        );
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setErrorMessage("");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (!droppedFile.name.endsWith(".csv")) {
        setErrorMessage(
          "Format file tidak didukung. Harap unggah berkas berekstensi .csv saja.",
        );
        setFile(null);
        return;
      }
      setFile(droppedFile);
      setErrorMessage("");
    }
  };

  const jalankanAnalisisDarurat = async () => {
    if (!file) return;

    const token = getActiveToken();
    if (!token || token === "undefined" || token === "null") {
      setErrorMessage(
        "Sesi Anda tidak valid atau telah berakhir. Silakan login kembali.",
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStatus("Menghitung Matriks...");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${BASE_URL}/api/sppg-csv/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const resData = await response.json();

      if (response.ok && resData.status === "success") {
        alert(resData.message || "Kalkulasi AI Berhasil Berjalan!");

        if (handleFileUpload) {
          handleFileUpload(file);
        }

        setFile(null);
        fetchAnalysesHistory();
      } else if (response.status === 500) {
        setErrorMessage(
          "Server mengalami internal error (500). Harap periksa apakah berkas CSV Anda memiliki struktur kolom yang sesuai dengan skema database.",
        );
      } else {
        setErrorMessage(
          resData.message || "Gagal mengeksekusi data analisis batch.",
        );
      }
    } catch (error) {
      setErrorMessage(
        "Terjadi kesalahan jaringan atau server cloud bermasalah.",
      );
      console.error("Error post batch CSV:", error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus("");
    }
  };

  const formatListText = (text) => {
    if (!text || text === "-") return "-";

    const items = text.split(/(?=\b\d+[\.)]\s)/g);
    if (items.length <= 1) return text;

    return (
      <div className="space-y-1.5 text-left">
        {items.map((item, idx) => {
          const trimmed = item.trim();
          if (!trimmed) return null;
          return (
            <div key={idx} className="block leading-relaxed">
              {trimmed}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Pusat Inteligensi AI
          </h1>
          <p className="text-sm text-slate-500">
            Jalankan analisis machine learning untuk prediksi kebutuhan SPPG
            secara nasional secara mandiri.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 w-full max-w-full">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm w-full max-w-full overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Analisis Manual</h2>
              <p className="text-xs text-gray-400">
                Lakukan kalkulasi darurat di luar jadwal dengan mengunggah data
                sesi saat ini.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-500" />
              <div>
                <p className="font-bold text-red-800">Gagal Memproses Data</p>
                <p className="text-xs mt-0.5 leading-relaxed opacity-90">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100/50 transition cursor-pointer relative"
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isAnalyzing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
            {file ? (
              <div className="text-center">
                <p className="text-sm font-medium text-blue-600 flex items-center gap-2 justify-center">
                  <FileText className="w-4 h-4" /> {file.name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {(file.size / 1024).toFixed(1)} KB • Siap dianalisis
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Drop file CSV Darurat di sini
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  atau klik untuk memilih file
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-3">
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50/50 p-3 rounded-lg border border-blue-100 justify-center animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{analysisStatus}</span>
              </div>
            )}

            <button
              onClick={jalankanAnalisisDarurat}
              disabled={!file || isAnalyzing}
              className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition shadow-sm cursor-pointer ${
                !file || isAnalyzing
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-slate-200"
                  : "bg-blue-900 text-white hover:bg-blue-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              {isAnalyzing
                ? "Sedang Memproses AI..."
                : "Jalankan Analisis Darurat"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full max-w-full">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-white gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900">
                Hasil Output CSV & Analisis AI
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Menampilkan hasil pemrosesan model AI langsung dari database
                `sppg_analyses`
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Cari Wilayah..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-gray-200 text-gray-700 focus:outline-none focus:border-blue-500 bg-gray-50"
              />
            </div>
            <span className="text-xs bg-green-50 text-green-700 px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 shrink-0 border border-green-100">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
              {filteredHistory.length} Data
            </span>
          </div>
        </div>

        <div className="w-full max-w-full overflow-x-auto block">
          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400 flex flex-col items-center justify-center gap-2">
              <FileText className="w-8 h-8 text-gray-300" />
              <span>
                {historyResult.length === 0
                  ? "Belum ada record hasil prediksi di tabel database `sppg_analyses`."
                  : "Data tidak ditemukan berdasarkan pencarian Anda."}
              </span>
            </div>
          ) : (
            <table className="w-full min-w-[1300px] text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                  <th className="py-3 px-5 w-[14%]">Nama Wilayah</th>
                  <th className="py-3 px-5 text-center w-[9%]">Total Siswa</th>
                  <th className="py-3 px-5 text-center w-[11%]">
                    Hasil Prediksi SPPG
                  </th>
                  <th className="py-3 px-5 text-center w-[11%]">
                    Kebutuhan SPPG
                  </th>
                  <th className="py-3 px-5 text-center w-[9%]">Gap Prediksi</th>
                  <th className="py-3 px-5 text-center w-[12%]">
                    Status Kerawanan
                  </th>
                  <th className="py-3 px-5 text-center w-[17%]">
                    Interpretasi
                  </th>
                  <th className="py-3 px-5 text-center w-[17%]">Rekomendasi</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100 font-medium">
                {currentItems.map((item, index) => {
                  const rowKey = item.id
                    ? `row-${item.id}-${index}`
                    : `row-index-${index}`;
                  const rawGap = parseFloat(
                    item.gap_prediksi !== undefined
                      ? item.gap_prediksi
                      : item.gap || 0,
                  );

                  let statusKritis = "Seimbang";
                  const dbStatus = String(item.status || "")
                    .toUpperCase()
                    .replace(/_/g, " ")
                    .trim();

                  if (dbStatus === "KRITIS" || dbStatus === "SANGAT KURANG") {
                    statusKritis = "Sangat Kurang";
                  } else if (
                    dbStatus === "WASPADA" ||
                    dbStatus === "KURANG" ||
                    dbStatus === "DEFISIT"
                  ) {
                    statusKritis = "Kurang";
                  } else if (dbStatus === "SURPLUS") {
                    statusKritis = "Surplus";
                  } else if (dbStatus === "AMAN" || dbStatus === "SEIMBANG") {
                    statusKritis = "Seimbang";
                  } else {
                    if (rawGap < -50) {
                      statusKritis = "Sangat Kurang";
                    } else if (rawGap < 0) {
                      statusKritis = "Kurang";
                    } else if (rawGap > 0) {
                      statusKritis = "Surplus";
                    } else {
                      statusKritis = "Seimbang";
                    }
                  }

                  const interpretasiVal = item.interpretasi || "-";
                  const rekomendasiVal =
                    item.rekomendasi_kebijakan || item.rekomendasi || "-";

                  return (
                    <tr
                      key={rowKey}
                      className="hover:bg-gray-50/70 transition text-xs"
                    >
                      <td className="py-3.5 px-5 font-semibold text-gray-800 truncate">
                        {item.nama_wilayah || "Tidak Diketahui"}
                      </td>
                      <td className="py-3.5 px-5 text-center text-gray-600 font-semibold">
                        {item.total_siswa?.toLocaleString("id-ID") || 0} Anak
                      </td>
                      <td className="py-3.5 px-5 text-center text-purple-700 font-bold">
                        {item.jumlah_sppg_prediksi || 0} Unit
                      </td>
                      <td className="py-3.5 px-5 text-center text-gray-700 font-semibold">
                        {item.kebutuhan_sppg || 0} Unit
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono text-[12px] font-semibold text-red-600">
                        {item.gap_prediksi || 0}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold border ${
                            statusKritis === "Sangat Kurang"
                              ? "bg-red-50 text-red-600 border-red-100 animate-pulse"
                              : statusKritis === "Kurang"
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : statusKritis === "Surplus"
                                  ? "bg-blue-50 text-blue-600 border-blue-100"
                                  : "bg-green-50 text-green-700 border-green-100"
                          }`}
                        >
                          <CheckCircle className="w-3 h-3" />
                          {statusKritis}
                        </span>
                      </td>
                      <td
                        className="py-3.5 px-5 text-center text-slate-500 font-medium whitespace-normal break-words leading-relaxed"
                        title={interpretasiVal}
                      >
                        {formatListText(interpretasiVal)}
                      </td>
                      <td
                        className="py-3.5 px-5 text-slate-500 font-medium whitespace-normal break-words leading-relaxed"
                        title={rekomendasiVal}
                      >
                        {formatListText(rekomendasiVal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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
  );
}
