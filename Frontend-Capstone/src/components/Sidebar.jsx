import React from "react";
import {
  LayoutDashboard,
  Database,
  BrainCircuit,
  LineChart,
  Table2,
  ArrowLeft,
} from "lucide-react";

const Sidebar = ({
  activeTab,
  setActiveTab,
  setIsNotifOpen,
  setIsProfileOpen,
  isCollapsed,
  setIsCollapsed,
  onBackToLanding,
}) => {
  const menuItems = [
    {
      id: "dashboard",
      name: "Dashboard Utama",
      icon: <LayoutDashboard size={20} />,
    },
    { id: "data", name: "Data SPPG (CSV)", icon: <Database size={20} /> },
    {
      id: "ai",
      name: "Pusat Inteligensi AI",
      icon: <BrainCircuit size={20} />,
    },
    {
      id: "laporan",
      name: "Laporan (Time Series)",
      icon: <LineChart size={20} />,
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#0A2647] text-white transition-all duration-300 flex flex-col justify-between z-40 border-r border-slate-800/80 ${
        isCollapsed
          ? "-translate-x-full lg:translate-x-0 lg:w-20"
          : "translate-x-0 w-64"
      }`}
    >
      <div
        className={`border-b border-slate-800 flex items-center transition-all duration-300 ${
          isCollapsed ? "p-4 lg:justify-center" : "p-6 gap-3"
        }`}
      >
        <div
          className={`flex items-center gap-3 min-w-0 ${isCollapsed ? "lg:justify-center lg:w-full" : ""}`}
        >
          <img
            src="/logo.png"
            alt="Logo SPPG RI"
            className="w-10 h-10 object-cover aspect-square shrink-0 rounded-full bg-white/10 p-0.5"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          {(!isCollapsed || window.innerWidth < 1024) && (
            <div className="animate-fadeIn min-w-0 text-left">
              <h1 className="text-base font-bold leading-none tracking-tight text-white">
                SPPG RI
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold block leading-tight tracking-wider mt-2">
                Sistem Analisis Persebaran SPPG
              </span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (setIsNotifOpen) setIsNotifOpen(false);
                if (setIsProfileOpen) setIsProfileOpen(false);
                if (window.innerWidth < 1024) {
                  setIsCollapsed(true);
                }
              }}
              className={`w-full flex items-center rounded-xl transition-all duration-200 group cursor-pointer ${
                isCollapsed
                  ? "px-4 py-3 gap-3.5 text-left lg:justify-center lg:p-3"
                  : "px-4 py-3 gap-3.5 text-left"
              } ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/30 font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
              title={isCollapsed ? item.name : ""}
            >
              <span
                className={`${
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-white shrink-0"
                }`}
              >
                {item.icon}
              </span>
              {(!isCollapsed || window.innerWidth < 1024) && (
                <span className="text-sm truncate animate-fadeIn">
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => {
            if (onBackToLanding) {
              onBackToLanding();
            } else {
              window.location.reload();
            }
          }}
          className={`w-full flex items-center rounded-xl text-xs font-semibold text-blue-400 hover:bg-blue-950/30 hover:text-blue-300 transition-colors cursor-pointer ${
            isCollapsed
              ? "px-4 py-3 gap-3.5 text-left lg:justify-center lg:p-3"
              : "px-4 py-3 gap-3.5 text-left"
          }`}
          title={isCollapsed ? "Kembali ke Landing Page" : ""}
        >
          <ArrowLeft size={20} className="shrink-0 text-blue-400" />
          {(!isCollapsed || window.innerWidth < 1024) && (
            <span className="truncate">Kembali ke Landing Page</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
