"use client";

import { useEffect, useState, useCallback } from "react";
import { QRCodeSVG as QRCode } from "qrcode.react";
import {
  Copy,
  Moon,
  Sun,
  Share2,
  Twitter,
  Linkedin,
  Mail,
  TrendingUp,
  Clock,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Toast, type ToastType } from "@/components/Toast";
import { CopyButton } from "@/components/CopyButton";
import { UrlHistory, type UrlEntry } from "@/components/UrlHistory";
import { isValidUrl, ensureProtocol, normalizeUrl } from "@/lib/validation";

interface StatsData {
  totalUrls: number;
  totalCharsReduced: number;
  mostUsedUrl: UrlEntry | null;
}

export default function Home() {
  const [longURL, setLongUrl] = useState("");
  const [shortURL, setShortURL] = useState("");
  const [generatedShortURL, setGeneratedShortURL] = useState("");
  const [retrievedLongURL, setRetrievedLongURL] = useState("");
  const [urlHistory, setUrlHistory] = useState<UrlEntry[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [stats, setStats] = useState<StatsData>({
    totalUrls: 0,
    totalCharsReduced: 0,
    mostUsedUrl: null,
  });

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  // Loading states
  const [isGeneratingLoading, setIsGeneratingLoading] = useState(false);
  const [isRetrievingLoading, setIsRetrievingLoading] = useState(false);

  // URL validation state
  const [longUrlError, setLongUrlError] = useState("");
  const [shortUrlError, setShortUrlError] = useState("");

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      setToast({ message, type });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Load URL history and theme preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("urlHistory");
    const savedTheme = localStorage.getItem("theme");
    
    if (saved) {
      try {
        setUrlHistory(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load URL history:", error);
      }
    }
    
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Save URL history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("urlHistory", JSON.stringify(urlHistory));
    
    // Calculate stats
    const totalCharsReduced = urlHistory.reduce(
      (sum, entry) => sum + (entry.originalUrl.length - 30),
      0
    );
    
    setStats({
      totalUrls: urlHistory.length,
      totalCharsReduced: Math.max(totalCharsReduced, 0),
      mostUsedUrl: urlHistory[0] || null,
    });
  }, [urlHistory]);

  // Real-time validation for long URL
  const validateLongUrl = (url: string) => {
    if (!url.trim()) {
      setLongUrlError("");
      return true;
    }

    try {
      const withProtocol = ensureProtocol(url);
      isValidUrl(withProtocol);
      setLongUrlError("");
      return true;
    } catch {
      setLongUrlError("Please enter a valid URL (e.g., https://example.com)");
      return false;
    }
  };

  // Real-time validation for short URL
  const validateShortUrl = (url: string) => {
    if (!url.trim()) {
      setShortUrlError("");
      return true;
    }

    if (url.includes("/") || url.includes("\\")) {
      setShortUrlError("Short URL cannot contain slashes");
      return false;
    }

    setShortUrlError("");
    return true;
  };

  const handleGenerateShortURL = async () => {
    if (!validateLongUrl(longURL)) {
      showToast("Please enter a valid URL", "error");
      return;
    }

    if (!longURL.trim()) {
      showToast("URL cannot be empty", "error");
      return;
    }

    setIsGeneratingLoading(true);
    setShowQRCode(false);

    try {
      const normalizedUrl = normalizeUrl(longURL);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalUrl: normalizedUrl,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status) {
        setGeneratedShortURL(data.data);

        // Add to history
        const newEntry: UrlEntry = {
          id: Date.now().toString(),
          originalUrl: normalizedUrl,
          shortUrl: data.data,
          createdAt: new Date().toISOString(),
        };
        setUrlHistory((prev) => [newEntry, ...prev]);

        showToast("Short URL generated successfully!", "success");
        setLongUrl("");
      } else {
        showToast(
          data.error || "Failed to generate short URL",
          "error"
        );
      }
    } catch (error) {
      console.error("Error generating short URL:", error);
      showToast("Connection error. Please check if the server is running.", "error");
    } finally {
      setIsGeneratingLoading(false);
    }
  };

  const handleRetrieveLongURL = async () => {
    if (!validateShortUrl(shortURL)) {
      showToast("Please enter a valid short URL", "error");
      return;
    }

    if (!shortURL.trim()) {
      showToast("Short URL cannot be empty", "error");
      return;
    }

    setIsRetrievingLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resolve/${shortURL}`, {
        method: "GET",
      });

      const data = await response.json();

      if (response.ok && data.status) {
        setRetrievedLongURL(data.data);
        showToast("Long URL retrieved successfully!", "success");
        setShortURL("");
      } else {
        showToast(
          data.error || "Short URL not found",
          "error"
        );
      }
    } catch (error) {
      console.error("Error retrieving long URL:", error);
      showToast("Connection error. Please check if the server is running.", "error");
    } finally {
      setIsRetrievingLoading(false);
    }
  };

  const handleDeleteHistoryEntry = (id: string) => {
    setUrlHistory((prev) => prev.filter((entry) => entry.id !== id));
    showToast("URL removed from history", "info");
  };

  const handleClearAllHistory = () => {
    if (window.confirm("Are you sure you want to clear all URL history?")) {
      setUrlHistory([]);
      showToast("URL history cleared", "info");
    }
  };

  const handleKeyPress = (
    e: React.KeyboardEvent,
    callback: () => void
  ) => {
    if (e.key === "Enter") {
      callback();
    }
  };

  const shareToSocial = (platform: string) => {
    const text = `Check out this awesome URL shortener! I just shortened my URL to: ${generatedShortURL}`;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(generatedShortURL);

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      email: `mailto:?subject=Check out this URL shortener&body=${encodedText}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank");
      showToast(`Shared on ${platform}!`, "success");
    }
  };

  const bgClass = isDarkMode
    ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
    : "bg-gradient-to-br from-white via-gray-50 to-gray-100";

  const cardClass = isDarkMode
    ? "bg-gray-800/50 border border-gray-700/50"
    : "bg-white border border-gray-200";

  const textClass = isDarkMode ? "text-gray-100" : "text-gray-900";
  const mutedTextClass = isDarkMode ? "text-gray-400" : "text-gray-600";
  const inputClass = isDarkMode
    ? "bg-gray-700/50 border-gray-600 text-gray-100 placeholder-gray-500"
    : "bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500";

  return (
    <div
      className={`min-h-screen ${bgClass} text-gray-100 flex flex-col items-center justify-center p-4 transition-colors duration-300`}
    >
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {/* Header with Theme Toggle */}
      <div className="w-full max-w-5xl mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-5xl md:text-6xl font-bold mb-2 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent`}>
              MicroURL
            </h1>
            <p className={`text-lg ${mutedTextClass}`}>
              Transform long URLs into shareable links instantly
            </p>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-full ${isDarkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"} transition-colors duration-200`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-6 h-6 text-yellow-400" />
            ) : (
              <Moon className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className={`${cardClass} rounded-xl p-6 backdrop-blur-sm transform transition-all hover:scale-105`}>
            <div className="flex items-center gap-3 mb-2">
              <LinkIcon className="w-5 h-5 text-blue-500" />
              <span className={`text-sm font-semibold ${mutedTextClass}`}>Total URLs</span>
            </div>
            <p className={`text-3xl font-bold ${textClass}`}>{stats.totalUrls}</p>
          </div>
          
          <div className={`${cardClass} rounded-xl p-6 backdrop-blur-sm transform transition-all hover:scale-105`}>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className={`text-sm font-semibold ${mutedTextClass}`}>Chars Reduced</span>
            </div>
            <p className={`text-3xl font-bold ${textClass}`}>{stats.totalCharsReduced}</p>
          </div>
          
          <div className={`${cardClass} rounded-xl p-6 backdrop-blur-sm transform transition-all hover:scale-105`}>
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-purple-500" />
              <span className={`text-sm font-semibold ${mutedTextClass}`}>Latest URL</span>
            </div>
            <p className={`text-sm font-mono break-all ${textClass}`}>
              {stats.mostUsedUrl ? stats.mostUsedUrl.shortUrl.split('/').pop() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Generate Short URL Card */}
        <div className={`${cardClass} rounded-2xl p-8 mb-8 backdrop-blur-sm shadow-2xl transform transition-all`}>
          <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${textClass}`}>
            <LinkIcon className="w-6 h-6 text-blue-500" />
            Generate Short URL
          </h2>

          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-2 ${mutedTextClass}`}>
              Long URL
            </label>
            <input
              type="text"
              placeholder="https://example.com/very/long/path/article?id=12345"
              value={longURL}
              onChange={(e) => {
                setLongUrl(e.target.value);
                validateLongUrl(e.target.value);
              }}
              onKeyPress={(e) => handleKeyPress(e, handleGenerateShortURL)}
              className={`w-full p-4 rounded-lg border-2 focus:outline-none focus:border-blue-500 transition-all ${inputClass}`}
            />
            {longUrlError && (
              <p className="text-red-500 text-sm mt-2 animate-pulse">{longUrlError}</p>
            )}
          </div>

          <button
            onClick={handleGenerateShortURL}
            disabled={isGeneratingLoading}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              isGeneratingLoading
                ? "bg-gray-600 cursor-not-allowed opacity-50"
                : "bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transform hover:scale-105"
            }`}
          >
            {isGeneratingLoading ? "Generating..." : "✨ Generate Short URL"}
          </button>

          {generatedShortURL && (
            <div className={`mt-8 p-6 ${isDarkMode ? "bg-green-900/20 border-green-700/50" : "bg-green-50 border-green-300"} border-2 rounded-xl animate-in fade-in slide-in-from-bottom-4`}>
              <p className={`text-sm font-semibold mb-4 ${mutedTextClass}`}>Your Short URL:</p>
              
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <a
                      href={generatedShortURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-mono font-bold text-blue-500 hover:text-blue-400 break-all transition-colors"
                    >
                      {generatedShortURL}
                    </a>
                  </div>
                  <p className={`text-xs ${mutedTextClass}`}>
                    {Math.round((longURL.length / generatedShortURL.length - 1) * 100)}% shorter
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <CopyButton
                    text={generatedShortURL}
                    onCopy={() => showToast("Copied to clipboard!", "success")}
                  />
                  <button
                    onClick={() => setShowQRCode(!showQRCode)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    📱 QR Code
                  </button>
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                        isDarkMode
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white`}
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>

                    {showShareMenu && (
                      <div className={`absolute right-0 mt-2 w-48 ${cardClass} rounded-lg shadow-xl z-10 animate-in fade-in`}>
                        <button
                          onClick={() => shareToSocial("twitter")}
                          className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-500/10 transition-colors rounded-t-lg border-b ${isDarkMode ? "border-gray-700/50" : "border-gray-200"}`}
                        >
                          <Twitter className="w-5 h-5 text-blue-400" />
                          <span>Twitter</span>
                        </button>
                        <button
                          onClick={() => shareToSocial("linkedin")}
                          className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-500/10 transition-colors border-b ${isDarkMode ? "border-gray-700/50" : "border-gray-200"}`}
                        >
                          <Linkedin className="w-5 h-5 text-blue-600" />
                          <span>LinkedIn</span>
                        </button>
                        <button
                          onClick={() => shareToSocial("email")}
                          className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-500/10 transition-colors rounded-b-lg`}
                        >
                          <Mail className="w-5 h-5 text-red-500" />
                          <span>Email</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {showQRCode && (
                <div className="mt-6 flex justify-center p-4 bg-white rounded-lg animate-in fade-in zoom-in">
                  <QRCode 
                    value={generatedShortURL} 
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Retrieve Long URL Card */}
        <div className={`${cardClass} rounded-2xl p-8 mb-8 backdrop-blur-sm shadow-2xl transform transition-all`}>
          <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${textClass}`}>
            <ChevronDown className="w-6 h-6 text-green-500" />
            Retrieve Long URL
          </h2>

          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-2 ${mutedTextClass}`}>
              Short URL Code
            </label>
            <input
              type="text"
              placeholder="Enter short URL code (e.g., abc123)"
              value={shortURL}
              onChange={(e) => {
                setShortURL(e.target.value);
                validateShortUrl(e.target.value);
              }}
              onKeyPress={(e) => handleKeyPress(e, handleRetrieveLongURL)}
              className={`w-full p-4 rounded-lg border-2 focus:outline-none focus:border-green-500 transition-all ${inputClass}`}
            />
            {shortUrlError && (
              <p className="text-red-500 text-sm mt-2 animate-pulse">{shortUrlError}</p>
            )}
          </div>

          <button
            onClick={handleRetrieveLongURL}
            disabled={isRetrievingLoading}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              isRetrievingLoading
                ? "bg-gray-600 cursor-not-allowed opacity-50"
                : "bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transform hover:scale-105"
            }`}
          >
            {isRetrievingLoading ? "Retrieving..." : "🔍 Retrieve Long URL"}
          </button>

          {retrievedLongURL && (
            <div className={`mt-8 p-6 ${isDarkMode ? "bg-blue-900/20 border-blue-700/50" : "bg-blue-50 border-blue-300"} border-2 rounded-xl animate-in fade-in slide-in-from-bottom-4`}>
              <p className={`text-sm font-semibold mb-4 ${mutedTextClass}`}>Original URL:</p>
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={retrievedLongURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-400 underline break-all transition-colors"
                >
                  {retrievedLongURL}
                </a>
                <CopyButton
                  text={retrievedLongURL}
                  onCopy={() => showToast("Copied to clipboard!", "success")}
                />
              </div>
            </div>
          )}
        </div>

        {/* URL History Card */}
        <div className={`${cardClass} rounded-2xl p-8 backdrop-blur-sm shadow-2xl`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold flex items-center gap-2 ${textClass}`}>
              <Clock className="w-6 h-6 text-purple-500" />
              URL History ({urlHistory.length})
            </h2>
            {urlHistory.length > 0 && (
              <button
                onClick={handleClearAllHistory}
                className="text-sm bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                Clear All
              </button>
            )}
          </div>

          <UrlHistory
            entries={urlHistory}
            onDelete={handleDeleteHistoryEntry}
          />
        </div>
      </div>
    </div>
  );
}
