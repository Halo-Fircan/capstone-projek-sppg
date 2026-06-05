import React, { useState, useEffect, useRef } from "react";
import {
  BrainCircuit,
  Search,
  AlertTriangle,
  CheckCircle,
  Plus,
  Minus,
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Loader2,
  RefreshCw,
  Database,
  Menu,
  ArrowRight,
} from "lucide-react";
import axios from "axios";

const getSafeValue = (obj, key1, key2, fallback = 0) => {
  if (!obj) return fallback;
  if (obj[key1] !== undefined) return obj[key1];
  if (obj[key2] !== undefined) return obj[key2];
  return fallback;
};

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "init",
      sender: "bot",
      text: "Halo! Saya Asisten AI SPPG RI. Ada yang bisa saya bantu mengenai informasi sebaran SPPG?",
      time: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [fastapiSessionId, setFastapiSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const formatBotResponse = (text) => {
    if (!text) return "";
    const lines = text.split("\n");

    const parseInlineMarkdown = (lineText) => {
      if (!lineText) return "";
      const parts = lineText.split(/\*\*([\s\S]*?)\*\*/g);
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <strong key={index} className="font-extrabold text-slate-900">
              {part}
            </strong>
          );
        }
        return part;
      });
    };

    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={index} className="h-1" />;

          const matchNumber = trimmed.match(/^(\d+)[\.)]\s+(.*)/);
          if (matchNumber) {
            const num = matchNumber[1];
            const content = matchNumber[2];

            const colonIndex = content.indexOf(":");
            if (colonIndex !== -1) {
              const prefix = content.substring(0, colonIndex).trim();
              const suffix = content.substring(colonIndex + 1).trim();

              return (
                <div
                  key={index}
                  className="flex gap-2 pl-1.5 items-start leading-relaxed text-slate-800 font-medium"
                >
                  <span className="font-extrabold text-blue-600 shrink-0">
                    {num}.
                  </span>
                  <div className="text-xs">
                    <strong className="font-bold text-slate-900">
                      {parseInlineMarkdown(prefix)}:
                    </strong>
                    <span className="text-slate-700 ml-1">
                      {parseInlineMarkdown(suffix)}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={index}
                className="flex gap-2 pl-1.5 items-start leading-relaxed text-slate-800 text-xs font-medium"
              >
                <span className="font-extrabold text-blue-600 shrink-0">
                  {num}.
                </span>
                <span className="text-slate-700">
                  {parseInlineMarkdown(content)}
                </span>
              </div>
            );
          }

          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            const content = trimmed.substring(2).trim();
            return (
              <div
                key={index}
                className="flex gap-2 pl-1.5 items-start leading-relaxed text-slate-800 text-xs font-medium"
              >
                <span className="text-blue-500 shrink-0 font-bold">•</span>
                <span className="text-slate-700">
                  {parseInlineMarkdown(content)}
                </span>
              </div>
            );
          }

          return (
            <p
              key={index}
              className="text-xs leading-relaxed text-slate-850 font-medium"
            >
              {parseInlineMarkdown(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage.trim();
    setInputMessage("");

    const userMessageId = `user-${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      sender: "user",
      text: userText,
      time: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsLoading(true);

    try {
      const config = { headers: { "Content-Type": "application/json" } };
      const payload = { message: userText, session_id: fastapiSessionId };

      const endpoints = [
        "https://backend-capstone-naufalms29s-projects.vercel.app/api/chat",
      ];

      let response = null;
      let lastError = null;

      for (const url of endpoints) {
        try {
          response = await axios.post(url, payload, config);
          if (response.data) break;
        } catch (err) {
          lastError = err;
          if (err.response?.status === 404) continue;
          throw err;
        }
      }

      if (response && response.data) {
        const responseData = response.data.data || response.data;
        let botReply =
          "Maaf, saya tidak menerima respons yang valid dari server.";
        let newSessionId = null;

        if (responseData) {
          if (Array.isArray(responseData)) {
            if (responseData.length > 0) {
              const lastMsg = responseData[responseData.length - 1];
              botReply =
                lastMsg.content || lastMsg.message || lastMsg.text || botReply;
            }
          } else {
            botReply =
              responseData.reply ||
              responseData.message ||
              responseData.content ||
              responseData.text ||
              botReply;
            newSessionId =
              responseData.session_id || responseData.fastapi_session_id;
          }
        }

        if (newSessionId) setFastapiSessionId(newSessionId);

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: botReply,
            time: new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      } else {
        if (lastError) throw lastError;
      }
    } catch (error) {
      console.error("Error chatbot API call:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: "bot",
          text: "Maaf, terjadi gangguan koneksi ke server AI SPPG. Pastikan server lokal https://backend-capstone-naufalms29s-projects.vercel.app.",
          time: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "init",
        sender: "bot",
        text: "Halo! Riwayat pesan telah dibersihkan. Ada yang bisa saya bantu kembali mengenai data SPPG?",
        time: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-left">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-blue-600/30 transition-all duration-300 hover:scale-110 active:scale-[0.95] cursor-pointer outline-none border-none animate-bounce"
          title="Tanya AI Asisten"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {isOpen && (
        <div className="w-[300px] sm:w-[400px] h-[500px] bg-white rounded-2xl border border-slate-200/80 shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
          <div className="bg-[#0A2647] p-4 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div>
                <h3 className="font-semibold text-sm leading-none">
                  Asisten AI SPPG
                </h3>
                <span className="text-[10px] text-green-400 font-medium flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                  Online • Siap Membantu
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearChat}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer outline-none border-none"
                title="Bersihkan Percakapan"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer outline-none border-none"
                title="Sembunyikan AI Chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
            {messages.map((msg) => {
              const isBot = msg.sender === "bot";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[85%] animate-fadeIn ${
                    isBot
                      ? "mr-auto text-left"
                      : "ml-auto flex-row-reverse text-right"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                      isBot
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {isBot ? <Bot size={14} /> : <User size={14} />}
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed font-medium whitespace-pre-wrap break-words ${
                        isBot
                          ? msg.isError
                            ? "bg-red-50 text-red-700 border border-red-100 rounded-tl-none"
                            : "bg-white text-slate-800 border border-slate-200/80 shadow-sm rounded-tl-none"
                          : "bg-blue-600 text-white rounded-tr-none"
                      }`}
                    >
                      {isBot ? formatBotResponse(msg.text) : msg.text}
                    </div>
                    <span className="text-[9px] text-slate-400 block px-1">
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex gap-2.5 mr-auto max-w-[85%] animate-pulse">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center">
                  <Bot size={14} />
                </div>
                <div className="p-3 bg-white text-slate-555 border border-slate-200/80 shadow-sm rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin text-blue-600" />
                  <span>AI sedang mengetik...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Tanyakan seputar SPPG di daerahmu..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50/50 h-10"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 outline-none border-none cursor-pointer ${
                !inputMessage.trim() || isLoading
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95"
              }`}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const LandingPage = ({ onEnterDashboard }) => {
  const [searchRegion, setSearchRegion] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [isSearchingRealtime, setIsSearchingRealtime] = useState(false);
  const [searchApiError, setSearchApiError] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [statsData, setStatsData] = useState({
    totalSppg: 0,
    totalSiswa: 0,
    rasioNasional: "1 : 0",
    shadowWilayah: 0,
  });

  const [indeksKerawananList, setIndeksKerawananList] = useState([]);
  const [historyAnalyses, setHistoryAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  const faqData = [
    {
      question: "Apa tujuan platform Analisis Persebaran SPPG ini?",
      answer:
        "Platform ini dirancang untuk membantu memantau persebaran Satuan Pelayanan Pemenuhan Gizi (SPPG) di Indonesia melalui visualisasi data, analisis statistik, dan rekomendasi berbasis AI guna mendukung pemerataan layanan gizi nasional.",
    },
    {
      question: "Dari mana sumber data yang digunakan?",
      answer:
        "Data yang ditampilkan berasal dari dataset persebaran SPPG yang telah diolah dan diverifikasi untuk menghasilkan informasi yang lebih mudah dipahami melalui dashboard, indikator statistik, dan analisis wilayah.",
    },
    {
      question: "Apa arti rasio SPPG yang ditampilkan pada dashboard?",
      answer:
        "Rasio SPPG menunjukkan perbandingan antara jumlah unit SPPG yang tersedia dengan kebutuhan layanan gizi pada suatu wilayah. Nilai rasio membantu mengidentifikasi daerah yang sudah tercukupi maupun yang masih membutuhkan penambahan fasilitas.",
    },
    {
      question: "Bagaimana AI menghasilkan rekomendasi wilayah prioritas?",
      answer:
        "AI menganalisis data persebaran SPPG, tingkat cakupan layanan, serta kesenjangan kebutuhan antarwilayah untuk mengidentifikasi daerah yang memerlukan perhatian lebih and memberikan rekomendasi tindakan berbasis data.",
    },
    {
      question: "Apa yang dimaksud dengan indeks kerawanan kekurangan SPPG?",
      answer:
        "Indeks kerawanan menunjukkan tingkat risiko suatu wilayah mengalami kekurangan layanan SPPG. Semakin tinggi nilai kerawanan, semakin besar kebutuhan wilayah tersebut terhadap penambahan unit layanan atau intervensi distribusi.",
    },
    {
      question: "Siapa yang dapat memanfaatkan platform ini?",
      answer:
        "Platform ini dapat digunakan oleh masyarakat, akademisi, peneliti, pemerintah daerah, maupun pemangku kebijakan yang membutuhkan informasi dan analisis mengenai pemerataan layanan gizi melalui persebaran SPPG di Indonesia.",
    },
  ];

  const fetchLandingData = async () => {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("adminToken");
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};
    let loadedIndeks = [];

    try {
      setLoading(true);
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
        const data = summaryRes.data.data;
        setStatsData({
          totalSppg:
            data.totalSppgTerdaftar || data.totalMaster || data.totalSppg || 0,
          totalSiswa: data.totalPenerimaAnak || 0,
          rasioNasional: data.rasioNasional || "1 : 0",
          wilayahPrioritas: data.wilayahPrioritas || 0,
        });

        if (data.indeksKerawanan) {
          loadedIndeks = data.indeksKerawanan;

          const map = {};
          data.indeksKerawanan.forEach((item) => {
            const nameKey = String(item.namaWilayah || item.nama_wilayah || "")
              .trim()
              .toUpperCase();
            if (!nameKey) return;
            const gapVal = Math.abs(parseFloat(item.gap || 0));
            if (
              !map[nameKey] ||
              gapVal > Math.abs(parseFloat(map[nameKey].gap || 0))
            ) {
              map[nameKey] = {
                namaWilayah: item.namaWilayah || item.nama_wilayah || nameKey,
                gap: parseFloat(item.gap || 0),
              };
            }
          });
          const cleanList = Object.values(map)
            .sort((a, b) => Math.abs(b.gap || 0) - Math.abs(a.gap || 0))
            .slice(0, 5);

          setIndeksKerawananList(cleanList);
        }
      }
    } catch (err) {
      console.warn(
        "Metrik rill gagal dimuat akibat kendala otorisasi / backend luring.",
        err.message,
      );
    }

    try {
      let historyRes;
      try {
        historyRes = await axios.get(
          "https://backend-capstone-naufalms29s-projects.vercel.app/api/sppg-analyses",
          config,
        );
      } catch (e) {
        try {
          historyRes = await axios.get(
            "https://backend-capstone-naufalms29s-projects.vercel.app/api/sppg-csv/history",
            config,
          );
        } catch (e2) {
          historyRes = await axios.get(
            "https://backend-capstone-naufalms29s-projects.vercel.app/sppg-csv/history",
            config,
          );
        }
      }

      let dataHistory = [];
      if (historyRes?.data?.status === "success") {
        const wrapperData = historyRes.data.data;
        if (wrapperData) {
          if (Array.isArray(wrapperData)) {
            dataHistory = wrapperData;
          } else if (
            wrapperData.analyses &&
            Array.isArray(wrapperData.analyses)
          ) {
            dataHistory = wrapperData.analyses;
          }
        }
      } else if (Array.isArray(historyRes?.data)) {
        dataHistory = historyRes.data;
      }

      if (dataHistory && dataHistory.length > 0) {
        setHistoryAnalyses(dataHistory);

        if (loadedIndeks.length === 0) {
          const map = {};
          dataHistory.forEach((h) => {
            const r = h.result || h;
            const nameKey = String(h.nama_wilayah || h.namaWilayah || "")
              .trim()
              .toUpperCase();
            if (!nameKey) return;
            const gapVal = Math.abs(
              parseFloat(
                getSafeValue(r, "gap_prediksi", "gapPrediksi", r.gap || 0),
              ),
            );
            if (
              !map[nameKey] ||
              gapVal > Math.abs(parseFloat(map[nameKey].gap || 0))
            ) {
              map[nameKey] = {
                namaWilayah: h.nama_wilayah || h.namaWilayah || nameKey,
                gap: parseFloat(
                  getSafeValue(r, "gap_prediksi", "gapPrediksi", r.gap || 0),
                ),
              };
            }
          });
          const cleanFallbackList = Object.values(map)
            .sort((a, b) => Math.abs(b.gap || 0) - Math.abs(a.gap || 0))
            .slice(0, 5);

          setIndeksKerawananList(cleanFallbackList);
        }
      }
    } catch (err) {
      console.warn(
        "Riwayat database sppg_analyses kosong atau server tidak merespons.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandingData();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchRegion.trim()) {
      setSearchResult(null);
      return;
    }

    const query = searchRegion.trim().toUpperCase();
    setSearchResult(null);
    setSearchApiError("");
    setIsSearchingRealtime(true);

    try {
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("adminToken");
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let rawResult = null;
      let namaResmi = query;

      try {
        const postRes = await axios.post(
          "https://backend-capstone-naufalms29s-projects.vercel.app/api/sppg-analyses",
          {
            nama_wilayah: query,
          },
          { headers },
        );

        if (postRes.data?.status === "success" && postRes.data?.data?.result) {
          rawResult = postRes.data.data.result;
          if (postRes.data.data.result.nama_wilayah) {
            namaResmi = postRes.data.data.result.nama_wilayah;
          }
        }
      } catch (postErr) {
        console.warn(
          "POST /api/sppg-analyses diabaikan atau gagal. Mencoba alur GET langsung...",
          postErr.response?.data?.message || postErr.message,
        );
      }

      if (!rawResult) {
        const getResponse = await axios.get(
          `https://backend-capstone-naufalms29s-projects.vercel.app/api/sppg-analyses?nama_wilayah=${encodeURIComponent(query)}`,
          { headers },
        );

        let foundData = [];
        if (getResponse.data?.status === "success") {
          const wrapperData = getResponse.data.data;
          if (wrapperData) {
            if (Array.isArray(wrapperData)) {
              foundData = wrapperData;
            } else if (
              wrapperData.analyses &&
              Array.isArray(wrapperData.analyses)
            ) {
              foundData = wrapperData.analyses;
            }
          }
        } else if (Array.isArray(getResponse.data)) {
          foundData = getResponse.data;
        }

        if (foundData && foundData.length > 0) {
          const matchRill = foundData[0];
          rawResult = matchRill.result || matchRill;
          namaResmi =
            matchRill.nama_wilayah || matchRill.namaWilayah || namaResmi;
        }
      }

      if (rawResult) {
        const totalSiswa = getSafeValue(
          rawResult,
          "total_siswa",
          "totalSiswa",
          0,
        );
        const predSppg = getSafeValue(
          rawResult,
          "jumlah_sppg_prediksi",
          "jumlahSppgPrediksi",
          1,
        );
        const calculatedRatio = `1 : ${Math.round(totalSiswa / predSppg).toLocaleString("id-ID")}`;

        const rawGap = parseFloat(
          rawResult.gap_prediksi !== undefined ? rawResult.gap_prediksi : 0,
        );

        let statusKritis = "Seimbang";
        const dbStatus = String(rawResult.status || "")
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

        const gapText =
          statusKritis === "Sangat Kurang" || statusKritis === "Kurang"
            ? "Kekurangan"
            : statusKritis === "Surplus"
              ? "Kelebihan"
              : "Seimbang";

        const interpretasi =
          rawResult.interpretasi ||
          "Kondisi gizi and kapasitas distribusi pangan termonitor.";
        const rekomendasi =
          rawResult.rekomendasi_kebijakan ||
          rawResult.rekomendasiKebijakan ||
          "Pertahankan pemantauan berkala.";
        const prediksi =
          rawResult.penjelasan_prediksi || "Pertahankan pemantauan berkala.";

        setSearchResult([
          {
            nama: namaResmi,
            status: statusKritis,
            rasio: calculatedRatio,
            deskripsi: `Wilayah ini memiliki total ${totalSiswa.toLocaleString("id-ID")} anak dengan kapasitas SPPG sebesar ${predSppg} Unit. Status saat ini: ${gapText} ${Math.abs(rawGap)} unit armada SPPG.`,
            interpretasi: interpretasi,
            rekomendasi: rekomendasi,
            prediksi: prediksi,
          },
        ]);

        fetchLandingData();
        return;
      }
    } catch (apiErr) {
      console.error(
        "Gagal melakukan kalkulasi atau penarikan data dari PostgreSQL:",
        apiErr,
      );
      const backendErrorMsg =
        apiErr.response?.data?.message ||
        apiErr.message ||
        "Gagal terhubung dengan server lokal.";
      setSearchApiError(backendErrorMsg);
    } finally {
      setIsSearchingRealtime(false);
    }

    setSearchResult("tidak_ditemukan");
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const topWilayah = indeksKerawananList[0]?.namaWilayah || "Wilayah Utama";
  const topGap = indeksKerawananList[0]?.gap || 0;
  const wilayahPrioritasCount = statsData.wilayahPrioritas || 0;

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* 1. NAVBAR UTAMA */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 py-3.5 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between w-full">
          <div className="flex items-center gap-3 lg:flex-1 justify-start text-left">
            <img
              src="/logo.png"
              alt="Logo SPPG RI"
              className="w-10 h-10 object-contain shrink-0"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div className="text-left">
              <h1 className="text-sm font-bold text-slate-900 leading-none">
                SPPG RI
              </h1>
              <span className="text-[11px] text-slate-400 font-medium block leading-tight tracking-wider mt-1">
                Sistem Analisis Persebaran SPPG
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-8 text-[12px] font-semibold tracking-wider text-slate-500 lg:flex-1 whitespace-nowrap">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="hover:text-blue-600 transition-colors cursor-pointer outline-none animate-fadeIn bg-transparent border-none font-semibold"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("ringkasan-dasbor")}
              className="hover:text-blue-600 transition-colors cursor-pointer outline-none bg-transparent border-none font-semibold"
            >
              Statistik
            </button>
            <button
              onClick={() => scrollToSection("sebaran-wilayah")}
              className="hover:text-blue-600 transition-colors cursor-pointer outline-none bg-transparent border-none font-semibold"
            >
              Cek Wilayah
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="hover:text-blue-600 transition-colors cursor-pointer outline-none bg-transparent border-none font-semibold"
            >
              FAQ
            </button>
          </nav>

          <div className="hidden lg:flex items-center lg:flex-1 justify-end shrink-0">
            <button
              onClick={() => onEnterDashboard("dashboard")}
              className="bg-[#0A2647] hover:bg-[#144272] text-white text-xs font-semibold px-6 py-2.5 rounded-full transition-all shadow-md active:scale-95 cursor-pointer border-none flex items-center justify-center gap-2"
            >
              <span>Login Dashboard</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer bg-transparent border-none"
            title="Buka Menu"
          >
            <Menu size={22} />
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-md py-6 px-6 flex flex-col gap-5 animate-fadeIn z-50 text-center">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-center py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 border-none bg-transparent block"
            >
              Home
            </button>
            <button
              onClick={() => {
                scrollToSection("ringkasan-dasbor");
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-center py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 border-none bg-transparent block"
            >
              Statistik
            </button>
            <button
              onClick={() => {
                scrollToSection("sebaran-wilayah");
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-center py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 border-none bg-transparent block"
            >
              Cek Wilayah
            </button>
            <button
              onClick={() => {
                scrollToSection("faq");
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-center py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 border-none bg-transparent block"
            >
              FAQ
            </button>

            <div className="border-t border-slate-100 pt-4 flex justify-center w-full">
              <button
                onClick={() => {
                  onEnterDashboard("dashboard");
                  setIsMobileMenuOpen(false);
                }}
                className="bg-[#0A2647] hover:bg-[#144272] text-white text-xs font-semibold px-8 py-2.5 rounded-full transition-all shadow-md active:scale-95 cursor-pointer border-none flex items-center justify-center gap-2"
              >
                <span>Login Dashboard</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </header>

      <section className="relative px-6 py-20 lg:py-24 max-w-7xl mx-auto flex flex-col items-center justify-center text-center space-y-6">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-none max-w-4xl animate-fadeIn">
          Analisis Persebaran SPPG Berbasis Data dan AI
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium max-w-3xl">
          Platform digital untuk memantau persebaran SPPG di Indonesia, Analisis
          AI, serta guna mendukung pemerataan persebaran SPPG nasional.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={() => scrollToSection("sebaran-wilayah")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer border-none animate-fadeIn"
          >
            Cek Status Daerah
          </button>
        </div>
      </section>

      <section
        id="ringkasan-dasbor"
        className="bg-[#0A2647] py-16 text-white text-center px-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-xl mx-auto text-center space-y-3 mb-12">
            <h2 className="text-2xl font-bold">
              Statistik Persebaran SPPG di Indonesia
            </h2>
            <p className="text-sm text-slate-200/100 leading-relaxed font-medium">
              Menampilkan distribusi dan cakupan SPPG secara nasional
              berdasarkan data terverifikasi untuk mendukung pemantauan layanan
              gizi yang akurat dan berkelanjutan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#0E3560] rounded-2xl border border-slate-700/50 space-y-2 text-center flex flex-col items-center">
              <h3 className="text-3xl font-bold">
                {statsData.totalSppg.toLocaleString("id-ID")}
              </h3>
              <p className="text-xs font-bold text-slate-200">
                Unit SPPG Aktif Terdaftar
              </p>
              <p className="text-[12px] text-slate-200/100">
                Tersebar di seluruh Nusantara.
              </p>
            </div>
            <div className="p-6 bg-[#0E3560] rounded-2xl border border-slate-700/50 space-y-2 text-center flex flex-col items-center">
              <h3 className="text-3xl font-bold">
                {statsData.totalSiswa.toLocaleString("id-ID")}
              </h3>
              <p className="text-xs font-bold text-slate-200">
                Siswa Terjamin Gizinya
              </p>
              <p className="text-[12px] text-slate-200/100">
                Total anak sekolah yang melangsungkan program gizi makanan
                sehat.
              </p>
            </div>
            <div className="p-6 bg-[#0E3560] rounded-2xl border border-slate-700/50 space-y-2 text-center flex flex-col items-center">
              <h3 className="text-3xl font-bold">{statsData.rasioNasional}</h3>
              <p className="text-xs font-bold text-slate-200">
                Rasio SPPG Ideal Nasional
              </p>
              <p className="text-[12px] text-slate-200/100">
                Rasio kumulatif rill guna mencegah darurat gizi buruk.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 max-w-7xl mx-auto space-y-8 scroll-mt-20 text-left">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 max-w-7xl mx-auto">
          <div className="text-left space-y-2">
            <h2 className="text-2xl font-bold text-slate-950 tracking-tight">
              Ringkasan Dasbor Nasional
            </h2>
            <p className="text-sm text-slate-505 mt-1">
              Pemantauan metrik rill dan ketimpangan rasio pelayanan gizi di
              seluruh Indonesia secara realtime.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Indeks Kerawanan Progress Bar */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[400px]">
            <div className="mb-4 text-left">
              <h3 className="font-bold text-slate-900">
                Indeks Kerawanan Wilayah Kekurangan SPPG
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Top 5 Kabupaten/Kota{" "}
                <span className="text-red-600 font-bold">SANGAT KURANG</span>.
                Sebaran SPPG
              </p>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto justify-center flex flex-col text-left">
              {indeksKerawananList && indeksKerawananList.length > 0 ? (
                indeksKerawananList.map((item, idx) => {
                  const maxGap =
                    Math.max(
                      ...indeksKerawananList.map((i) => Math.abs(i.gap)),
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
            <div className="mb-4 text-left">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <BrainCircuit size={18} className="text-blue-600" />
                Rekomendasi Aksi AI
              </h3>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1 text-left">
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-xs">
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  <AlertTriangle size={14} className="text-red-500" />{" "}
                  Intervensi {topWilayah}
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
                  Terdapat akumulasi di {wilayahPrioritasCount} area merah.
                  Alihkan buffer stock ke komoditas pangan kering.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="sebaran-wilayah"
        className="px-6 py-20 max-w-4xl mx-auto text-center space-y-8 scroll-mt-20"
      >
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Cari Status Persebaran SPPG Daerahmu
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Transparansi data sebaran untuk memastikan keadilan distribusi
            makanan di seluruh Nusantara.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto bg-white p-2 rounded-2xl shadow-md border border-slate-200/80 w-full"
        >
          <div className="relative flex-1 flex items-center w-full">
            <Search className="absolute left-4.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Masukkan Wilayah Spesifik (contoh: Bandung, Garut)..."
              value={searchRegion}
              onChange={(e) => setSearchRegion(e.target.value)}
              className="w-full bg-transparent pl-12 pr-4 py-3 text-xs font-semibold focus:outline-none text-slate-700 leading-none placeholder-slate-450 h-11"
              disabled={isSearchingRealtime}
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingRealtime}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 rounded-xl cursor-pointer transition-colors h-11 whitespace-nowrap w-full sm:w-auto border-none flex items-center justify-center gap-2"
          >
            {isSearchingRealtime ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Periksa Data</span>
            )}
          </button>
        </form>

        {searchApiError && (
          <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-2xl text-left animate-fadeIn">
            <div className="flex items-start gap-2.5 text-red-600">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">
                  Terjadi Kesalahan Server Backend:
                </p>
                <p className="text-[11px] mt-0.5 font-medium leading-relaxed opacity-90">
                  {searchApiError}
                </p>
              </div>
            </div>
          </div>
        )}

        {searchResult && (
          <div className="max-w-2xl mx-auto space-y-4">
            {searchResult === "tidak_ditemukan" ? (
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-left animate-fadeIn">
                <div className="flex items-center gap-2.5 text-amber-600">
                  <AlertTriangle size={18} />
                  <p className="text-[12px] font-medium">
                    Penulisan Wilayah anda salah, Contoh:{" "}
                    <span className="font-bold text-[#FF2C2C]">
                      Kab. Bandung
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              searchResult.map((result, index) => (
                <div
                  key={index}
                  className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-left animate-fadeIn space-y-4"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-[#0A2647] text-base">
                      {result.nama}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                        result.status === "Sangat Kurang"
                          ? "bg-rose-50 text-rose-600 border-rose-200 animate-pulse"
                          : result.status === "Kurang"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : result.status === "Surplus"
                              ? "bg-blue-50 text-blue-600 border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
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
                      {result.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl">
                      <span className="block text-[9px] font-bold text-slate-400 tracking-wider">
                        Rasio Layanan
                      </span>
                      <span className="text-sm font-extrabold text-slate-800 mt-1 block font-mono">
                        {result.rasio}
                      </span>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl">
                      <span className="block text-[9px] font-bold text-slate-400 tracking-wider">
                        Metrik Deskripsi
                      </span>
                      <p className="text-slate-600 mt-1 font-semibold leading-relaxed">
                        {result.deskripsi}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5 border-t border-slate-100 pt-4 text-xs leading-relaxed">
                    <div className="flex gap-2.5">
                      <div className="p-1 bg-amber-50 text-amber-500 rounded-lg shrink-0 h-fit mt-0.5">
                        <Database size={14} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-800">
                          Interpretasi Gizi Spasial
                        </h5>
                        <p className="text-slate-500 font-medium mt-0.5">
                          {result.interpretasi}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2.5 border-t border-slate-50 pt-3">
                      <div className="p-1 bg-blue-50 text-blue-500 rounded-lg shrink-0 h-fit mt-0.5">
                        <BrainCircuit size={14} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-800">
                          Rekomendasi Kebijakan AI
                        </h5>
                        <p className="text-slate-550 font-medium mt-0.5">
                          {result.rekomendasi}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2.5 border-t border-slate-50 pt-3">
                      <div className="p-1 bg-blue-50 text-blue-500 rounded-lg shrink-0 h-fit mt-0.5">
                        <BrainCircuit size={14} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-800">
                          Prediksi AI
                        </h5>
                        <p className="text-slate-505 font-medium mt-0.5">
                          {result.prediksi}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <section
        id="faq"
        className="bg-slate-100/70 border-t border-b border-slate-200/60 py-16 text-left"
      >
        <div className="px-6 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              (FAQ) Platform Analisis Persebaran SPPG
            </h2>
            <p className="text-sm text-slate-505 max-w-xl mx-auto leading-relaxed">
              Temukan jawaban atas pertanyaan umum mengenai data persebaran
              SPPG, analisis statistik, rekomendasi AI, serta pemantauan kondisi
              layanan gizi di berbagai wilayah Indonesia.
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md/5"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-4 flex items-center justify-between gap-4 font-semibold text-sm text-slate-850 text-left cursor-pointer hover:bg-slate-50/50 transition-colors focus:outline-none border-none"
                    type="button"
                  >
                    <span>{faq.question}</span>
                    <span className="p-1 rounded-lg bg-slate-50 border border-slate-200 shrink-0 text-slate-550">
                      {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 border-t border-slate-100 text-[12px] text-slate-600 leading-relaxed animate-fadeIn">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-200 py-8 px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left max-w-2xl">
            <p className="text-xs text-slate-700 font-semibold leading-relaxed">
              Analisis cerdas persebaran SPPG berbasis data dan AI untuk
              mendukung ketahanan pangan nasional.
            </p>
            <p className="md:hidden text-xs text-slate-700 font-semibold mt-1">
              © SPPG RI
            </p>
          </div>
          <p className="hidden md:block text-xs text-slate-700 font-semibold shrink-0">
            © SPPG RI
          </p>
        </div>
      </footer>

      <ChatbotWidget />
    </div>
  );
};

export default LandingPage;
