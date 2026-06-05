import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import DataSPPG from "./pages/DataSPPG";
import PusatInteligensi from "./pages/PusatInteligensi";
import LaporanTrend from "./pages/LaporanTrend";
import {
  User,
  Settings,
  Menu,
  X,
  Sliders,
  RefreshCw,
  Lock,
  ArrowLeft,
  LogOut,
} from "lucide-react";

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem("currentPage") || "landing";
  });

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "dashboard";
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [adminName, setAdminName] = useState(
    () => localStorage.getItem("adminName") || "Admin Capstone",
  );
  const [adminEmail, setAdminEmail] = useState(
    () => localStorage.getItem("adminEmail") || "admin@sppg.go.id",
  );
  const [tempName, setTempName] = useState(
    () => localStorage.getItem("adminName") || "Admin Capstone",
  );
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [isBackToLandingModalOpen, setIsBackToLandingModalOpen] =
    useState(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [criticalRatio, setCriticalRatio] = useState(1000);
  const [tempCriticalRatio, setTempCriticalRatio] = useState(1000);
  const [aiSyncInterval, setAiSyncInterval] = useState("Harian");
  const [tempAiSyncInterval, setTempSyncInterval] = useState("Harian");
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [tempMaintenanceMode, setTempMaintenanceMode] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisHistory, setAnalysisHistory] = useState([
    {
      id: 1,
      date: "25 Mei 2026 10:30",
      type: "Otomatis",
      status: "Selesai",
      records: 1204,
    },
  ]);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(10);

    let currentProgress = 10;

    const interval = setInterval(() => {
      currentProgress += 25;

      if (currentProgress >= 100) {
        setAnalysisProgress(100);
        clearInterval(interval);

        setTimeout(() => {
          setIsAnalyzing(false);

          setAnalysisHistory((prevHist) => [
            {
              id: Date.now(),
              date: new Date().toLocaleString("id-ID", { hour12: false }),
              type: "Manual",
              status: "Selesai",
              records: 1204,
            },
            ...prevHist,
          ]);
        }, 500);
      } else {
        setAnalysisProgress(currentProgress);
      }
    }, 500);
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target && e.target.files ? e.target.files[0] : e;
    if (selectedFile) {
      const newFile = {
        name: selectedFile.name,
        size: (selectedFile.size / 1024).toFixed(1) + " KB",
        date: new Date().toLocaleDateString("id-ID"),
      };
      setUploadedFiles((prevFiles) => [newFile, ...prevFiles]);
    }
  };

  const handleSaveProfile = () => {
    setAdminName(tempName);
    localStorage.setItem("adminName", tempName);
    setIsProfileModalOpen(false);
  };

  const handleSaveSettings = () => {
    setCriticalRatio(tempCriticalRatio);
    setAiSyncInterval(tempAiSyncInterval);
    setIsMaintenanceMode(tempMaintenanceMode);
    setIsSettingsModalOpen(false);
  };

  if (currentPage === "landing") {
    return <LandingPage onEnterDashboard={() => setCurrentPage("login")} />;
  }

  if (currentPage === "login") {
    return (
      <LoginPage
        onLogin={(loggedInEmail, loggedInName) => {
          const userEmail = loggedInEmail || "admin@sppg.go.id";
          const defaultName =
            userEmail.split("@")[0].charAt(0).toUpperCase() +
            userEmail.split("@")[0].slice(1);
          const userName = loggedInName || defaultName;

          setUploadedFiles([]);
          setIsAnalyzing(false);
          setAnalysisProgress(0);
          setAnalysisHistory([
            {
              id: 1,
              date: "25 Mei 2026 10:30",
              type: "Otomatis",
              status: "Selesai",
              records: 1204,
            },
          ]);
          setActiveTab("dashboard");

          setAdminEmail(userEmail);
          setAdminName(userName);
          setTempName(userName);

          localStorage.setItem("adminEmail", userEmail);
          localStorage.setItem("adminName", userName);

          setCurrentPage("dashboard");
        }}
        onBack={() => setCurrentPage("landing")}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 antialiased overflow-hidden text-left relative">
      {/* RESPONSIVE BACKDROP */}
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden transition-all duration-300"
          onClick={() => setIsSidebarCollapsed(true)}
          title="Tutup Menu"
        />
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsProfileOpen={setIsProfileOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onBackToLanding={() => setIsBackToLandingModalOpen(true)}
      />

      <main
        className={`flex-1 flex flex-col min-w-0 h-screen overflow-y-auto transition-all duration-300 ${
          isSidebarCollapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-64"
        }`}
      >
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer outline-none border-none bg-transparent"
            title={isSidebarCollapsed ? "Buka Menu" : "Sembunyikan Menu"}
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                }}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-all cursor-pointer text-left outline-none border-none bg-transparent"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                  {adminName ? adminName.substring(0, 2).toUpperCase() : "AD"}
                </div>
                <div className="hidden sm:block leading-none">
                  <p className="text-xs font-bold text-slate-700 leading-tight">
                    {adminName}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                    Admin Nasional
                  </span>
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs text-slate-400 leading-none">
                      Masuk sebagai
                    </p>
                    <p className="text-sm font-bold text-slate-800 mt-1 truncate">
                      {adminName}
                    </p>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                      {adminEmail}
                    </span>
                  </div>
                  <div className="p-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setTempName(adminName);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors text-left cursor-pointer outline-none border-none bg-transparent"
                    >
                      <User size={14} className="text-slate-400" />
                      <span>Manajemen Profil</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        localStorage.removeItem("currentPage");
                        localStorage.removeItem("activeTab");
                        localStorage.removeItem("adminName");
                        localStorage.removeItem("adminEmail");

                        setCurrentPage("landing");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-left cursor-pointer outline-none border-none bg-transparent font-medium"
                    >
                      <LogOut size={14} className="text-red-400" />
                      <span>Keluar Sesi (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1 pb-20 text-left">
          {activeTab === "dashboard" && (
            <Dashboard setActiveTab={setActiveTab} />
          )}
          {activeTab === "data" && (
            <div className="space-y-6">
              <DataSPPG
                uploadedFiles={uploadedFiles}
                handleFileUpload={handleFileUpload}
                setActiveTab={setActiveTab}
              />
              {isMaintenanceMode && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold animate-fadeIn">
                  ⚠️ Fitur Impor data CSV dikunci sementara karena Mode
                  Pemeliharaan aktif.
                </div>
              )}
            </div>
          )}
          {activeTab === "ai" && (
            <PusatInteligensi
              handleStartAnalysis={handleStartAnalysis}
              isAnalyzing={isAnalyzing}
              analysisProgress={analysisProgress}
              analysisHistory={analysisHistory}
              handleFileUpload={handleFileUpload}
            />
          )}
          {activeTab === "laporan" && <LaporanTrend />}
        </div>
      </main>

      {/* POPUP / MODAL MANAJEMEN PROFIL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md animate-fadeIn px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200/80">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                Manajemen Profil
              </h2>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors outline-none cursor-pointer border-none bg-transparent"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Nama Pengguna (Username)
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors outline-none cursor-pointer border-none bg-transparent"
              >
                Tutup
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 shadow-sm rounded-xl transition-colors outline-none cursor-pointer border-none"
              >
                Simpan Profil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP / MODAL PENGATURAN SISTEM */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md animate-fadeIn px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200/80">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Settings size={20} className="text-blue-600" />
                <span>Pengaturan Sistem</span>
              </h2>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors outline-none cursor-pointer border-none bg-transparent"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl">
                <label className="block text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                  <Sliders size={14} className="text-blue-500" />
                  <span>Ambang Batas Rasio Kritis</span>
                </label>
                <div className="relative flex items-center w-full border-2 border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all bg-white">
                  <div className="px-4 py-2.5 bg-slate-100/80 border-r border-slate-200 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-500">1</span>
                  </div>
                  <input
                    type="number"
                    value={tempCriticalRatio}
                    onChange={(e) =>
                      setTempCriticalRatio(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-4 py-2.5 text-sm font-bold text-slate-700 bg-transparent focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                  Mengatur batas pemicu status kritis warna pada dasbor utama
                  berdasarkan rasio SPPG per Siswa.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                  <RefreshCw size={15} className="text-blue-500" />
                  <span>Kalkulasi Otomatis AI Gizi</span>
                </label>

                <div className="relative">
                  <select
                    value={tempAiSyncInterval}
                    onChange={(e) => setTempSyncInterval(e.target.value)}
                    className="w-full appearance-none px-4 py-3 border border-slate-300 rounded-2xl text-sm font-semibold text-slate-700 bg-white shadow-sm cursor-pointer transition-all duration-200 focus:outline-none"
                  >
                    <option className="py-2">Harian</option>
                    <option className="py-2">Mingguan</option>
                    <option className="py-2">Bulanan</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <Lock size={16} className="text-slate-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Kunci Impor Data (CSV)
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Kunci akses upload CSV selama AI bekerja.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempMaintenanceMode}
                    onChange={(e) => setTempMaintenanceMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors outline-none cursor-pointer border-none bg-transparent"
              >
                Tutup
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 shadow-sm rounded-xl transition-colors outline-none cursor-pointer border-none"
              >
                Simpan Pengaturan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP / MODAL KEMBALI KE LANDING PAGE */}
      {isBackToLandingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md animate-fadeIn px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 pt-8 space-y-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4 shadow-sm border border-blue-100">
                  <ArrowLeft size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Kembali ke Landing Page?
                </h3>
                <p className="text-xs font-medium text-slate-505 leading-relaxed px-2">
                  Anda akan keluar dari sesi Dashboard Admin dan kembali ke
                  Landing Page utama.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-center gap-3 bg-slate-50/80">
              <button
                onClick={() => setIsBackToLandingModalOpen(false)}
                className="w-full py-3 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer outline-none border-none bg-transparent"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("currentPage");
                  localStorage.removeItem("activeTab");
                  setIsBackToLandingModalOpen(false);
                  setCurrentPage("landing");
                }}
                className="w-full py-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 rounded-xl transition-colors cursor-pointer outline-none border-none"
              >
                Ya, Kembali
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
