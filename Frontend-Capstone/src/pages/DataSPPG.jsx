import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getMasterSppgData, uploadMasterSppgCsv } from "../utils/api.js";
import {
  Upload,
  Search,
  Trash2,
  Database,
  BrainCircuit,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import supabase from "../utils/supabase.js";

const DataSPPG = ({ setActiveTab }) => {
  const [masterData, setMasterData] = useState([]);
  const [allDataForSearch, setAllDataForSearch] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [inputPage, setInputPage] = useState("1");
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 100;

  const fetchMasterData = async (page = 1) => {
    try {
      console.log(`📡 Menembak API Master Halaman: ${page}`);
      const result = await getMasterSppgData(page, itemsPerPage, "");

      if (result && result.data && Array.isArray(result.data.data)) {
        setMasterData(result.data.data);
        setTotalItems(result.data.total || 0);
        setTotalPages(result.data.totalPages || 1);
      } else if (result && Array.isArray(result.data)) {
        setMasterData(result.data);
        setTotalItems(result.total || 0);
        setTotalPages(result.totalPages || 1);
      }
    } catch (error) {
      console.error("❌ Gagal mengambil data master SPPG:", error);
    }
  };

  useEffect(() => {
    if (!searchTerm) {
      fetchMasterData(currentPage);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    setInputPage(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    const fetchAllDataOnce = async () => {
      if (
        searchTerm.trim().length > 0 &&
        allDataForSearch.length === 0 &&
        !isLoadingAll
      ) {
        setIsLoadingAll(true);
        try {
          console.log(
            "🐘 Mengunduh semua data ke memori browser untuk pencarian bebas tanpa page...",
          );
          const result = await getMasterSppgData(1, 50000, "");

          let rawData = [];
          if (result && result.data && Array.isArray(result.data.data))
            rawData = result.data.data;
          else if (result && Array.isArray(result.data)) rawData = result.data;

          setAllDataForSearch(rawData);
        } catch (err) {
          console.error("Gagal memuat pencarian global frontend", err);
        } finally {
          setIsLoadingAll(false);
        }
      }
    };

    fetchAllDataOnce();
  }, [searchTerm, allDataForSearch, isLoadingAll]);

  const getFilteredRows = () => {
    if (!searchTerm.trim()) {
      return masterData || [];
    }

    if (isLoadingAll && allDataForSearch.length === 0) return [];

    const search = searchTerm.toLowerCase();
    const sourceData =
      allDataForSearch.length > 0 ? allDataForSearch : masterData;

    return sourceData.filter((item) => {
      return (
        String(item?.no_sppg || "")
          .toLowerCase()
          .includes(search) ||
        String(item?.provinsi || "")
          .toLowerCase()
          .includes(search) ||
        String(item?.kab_kota || "")
          .toLowerCase()
          .includes(search) ||
        String(item?.kecamatan || "")
          .toLowerCase()
          .includes(search) ||
        String(item?.kelurahan || "")
          .toLowerCase()
          .includes(search) ||
        String(item?.alamat || "")
          .toLowerCase()
          .includes(search)
      );
    });
  };

  const currentTableRows = getFilteredRows();
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileName = `master-${Date.now()}.csv`;
      const { error: uploadError } = await supabase.storage
        .from("csv-uploads")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from("csv-uploads")
        .getPublicUrl(fileName);

      await uploadMasterSppgCsv({ fileUrl: urlData.publicUrl });

      alert("Berhasil mengimpor berkas Master SPPG!");
      setAllDataForSearch([]);
      setCurrentPage(1);
      fetchMasterData(1);
    } catch (error) {
      console.log("Backend error detail:", error.response?.data);
      alert(
        error.response?.data?.message ||
          error.message ||
          "Gagal mengunggah file.",
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handlePageJump = (e) => {
    e.preventDefault();
    const pageNum = parseInt(inputPage, 10);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    } else {
      setInputPage(String(currentPage));
    }
  };

  return (
    <div className="space-y-6 text-left pb-10 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Manajemen Master Fisik SPPG
        </h1>
        <p className="text-sm text-slate-500">
          Kelola database dan impor file lokasi sebaran fisik bangunan master
          SPPG secara massal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
              Impor File Master Baru
            </h3>
            <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
              .CSV Only
            </span>
          </div>

          <div className="flex-1 border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-blue-50/40 border-slate-300 hover:border-blue-400 transition-all bg-slate-50/30 relative">
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Upload
                className={isUploading ? "animate-bounce text-blue-500" : ""}
                size={24}
              />
            </div>
            <p className="text-sm font-medium text-slate-800 mb-1">
              {isUploading
                ? "Sedang memproses dan mengimpor data master..."
                : "Drag and drop file Master CSV di sini"}
            </p>
            <p className="text-xs text-slate-500">
              atau{" "}
              <span className="text-blue-600 font-bold hover:underline">
                Browse berkas
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4 border-b border-slate-100 pb-4">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                Status Integrasi Master
              </h3>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-blue-500 text-white rounded-xl shadow-md shadow-blue-500/20">
                <Database size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  Total Terdaftar
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {totalItems.toLocaleString("id-ID")}{" "}
                  <span className="text-xs font-semibold text-slate-500">
                    Data Baris
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => setActiveTab?.("ai")}
              className={`w-full py-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
                totalItems > 0
                  ? "bg-[#0A2647] hover:bg-[#143d6b] text-white active:scale-95 cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              }`}
              disabled={totalItems === 0}
            >
              <BrainCircuit size={16} /> Buka Dashboard Analisis AI
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <MapPin size={16} className="text-[#0A2647]" /> Database Fisik
            Master SPPG (
            {searchTerm.trim()
              ? currentTableRows.length
              : totalItems.toLocaleString("id-ID")}{" "}
            tampil)
          </h3>
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Cari wilayah atau alamat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border-2 border-slate-200 text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                <th className="px-6 py-4">No. SPPG</th>
                <th className="px-6 py-4">Provinsi</th>
                <th className="px-6 py-4">Kabupaten / Kota</th>
                <th className="px-6 py-4">Kecamatan</th>
                <th className="px-6 py-4">Kelurahan / Desa</th>
                <th className="px-6 py-4">Alamat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoadingAll && allDataForSearch.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-blue-600 text-xs font-bold animate-pulse"
                  >
                    ⏳ Sedang menyisir & mengumpulkan seluruh data wilayah dari
                    server, mohon tunggu sebentar...
                  </td>
                </tr>
              ) : currentTableRows.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-slate-400 text-xs italic"
                  >
                    Data tidak ditemukan atau kata kunci pencarian tidak cocok.
                  </td>
                </tr>
              ) : (
                currentTableRows.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-slate-50/50 transition-colors text-xs"
                  >
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {item.no_sppg || "-"}
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-900">
                      {item.provinsi || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.kab_kota || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.kecamatan || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.kelurahan || "-"}
                    </td>
                    <td
                      className="px-6 py-4 text-slate-500 max-w-xs truncate"
                      title={item.alamat || "-"}
                    >
                      {item.alamat || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!searchTerm.trim() && totalItems > itemsPerPage && (
          <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-medium text-slate-500">
              Menampilkan Baris{" "}
              <span className="font-bold text-slate-700">
                {(indexOfFirstItem + 1).toLocaleString("id-ID")}
              </span>{" "}
              -{" "}
              <span className="font-bold text-slate-700">
                {Math.min(
                  indexOfFirstItem + currentTableRows.length,
                  totalItems,
                ).toLocaleString("id-ID")}
              </span>{" "}
              dari{" "}
              <span className="font-bold text-slate-700">
                {totalItems.toLocaleString("id-ID")}
              </span>{" "}
              Data
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <form
                onSubmit={handlePageJump}
                className="flex items-center gap-1.5"
              >
                <span className="text-xs text-slate-500">Lompat ke hal:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={inputPage}
                  onChange={(e) => setInputPage(e.target.value)}
                  className="w-16 text-center py-1 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
                />
              </form>

              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg disabled:opacity-20 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold px-3 text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg disabled:opacity-20 transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSPPG;
