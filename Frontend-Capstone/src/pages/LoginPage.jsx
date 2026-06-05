import React, { useState } from "react";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";

import api from "../utils/api";

const testUsersMap = {
  admin: "Administrator Utama",
  superadmin: "Super Admin",
};

const LoginPage = ({ onLogin, onBack }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const extractNameFromToken = (token) => {
    try {
      if (!token) return "";
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      const payload = JSON.parse(jsonPayload);
      return payload.fullname || payload.username || payload.name || "";
    } catch (e) {
      console.error("Gagal mengekstrak nama dari JWT payload:", e);
      return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier || !password) {
      setError("Harap masukkan Username/Email dan Password Anda.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/authentications", {
        email: identifier.trim(),
        password: password,
      });

      if (response.data?.status === "success" || response.status === 200) {
        const { accessToken, refreshToken } = response.data.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        const nameUser = extractNameFromToken(accessToken) || identifier;

        onLogin(identifier, nameUser);
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        "Terjadi kesalahan CORS atau server tidak merespons preflight.";
      setError(errMsg);
      console.error("Detail Error Backend:", err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased relative overflow-hidden text-left">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[60%] bg-blue-100/50 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[60%] bg-blue-100/50 rounded-full blur-3xl"></div>
      </div>

      <div className="absolute top-6 left-6 z-10">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-sm cursor-pointer outline-none"
        >
          <ArrowLeft size={14} /> Kembali ke Home
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 p-1.5 mb-5">
          <img
            src="/logo.png"
            alt="Logo SPPG RI"
            className="w-full h-full object-contain"
          />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Login Dashboard Admin
        </h2>
        <p className="text-sm text-slate-500 font-semibold mt-1.5 tracking-wider">
          Sistem Analisis Persebaran SPPG
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-100">
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
              <AlertTriangle
                className="text-red-500 shrink-0 mt-0.5"
                size={16}
              />
              <p className="text-xs font-semibold text-red-700 leading-relaxed">
                {error}
              </p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold text-slate-700 tracking-wider mb-2"
              >
                Username atau Email Admin
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-4 text-slate-400" size={16} />
                <input
                  id="identifier"
                  type="text"
                  placeholder="admin@gmail.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-50/50 border-2 border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white text-slate-800 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 tracking-wider mb-2"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-slate-400" size={16} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/50 border-2 border-slate-200 rounded-xl pl-11 pr-12 py-3 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white text-slate-800 transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-[#0A2647] hover:bg-[#144272] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-[0.98] cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Masuk ke Dashboard"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
