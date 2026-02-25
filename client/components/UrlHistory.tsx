"use client";

import { CopyButton } from "./CopyButton";
import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

export interface UrlEntry {
  id: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: string;
}

interface UrlHistoryProps {
  entries: UrlEntry[];
  onDelete: (id: string) => void;
}

// 🔹 Normalize URL (handles linkedin.com, etc.)
const normalizeUrl = (url: string) => {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
};

// 🔹 Security label logic
const getSecurityLabel = (rawUrl: string) => {
  const url = normalizeUrl(rawUrl);

  if (url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1"))
    return "Local (Dev)";
  if (url.startsWith("https://")) return "Secure (HTTPS)";
  return "Not Secure";
};

export const UrlHistory: React.FC<UrlHistoryProps> = ({ entries, onDelete }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    newExpanded.has(id) ? newExpanded.delete(id) : newExpanded.add(id);
    setExpandedIds(newExpanded);
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 dark:text-gray-500">
          No URLs shortened yet. Create your first one!
        </p>
      </div>
    );
  }
  const timeAgo = (dateString: string) => {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);

  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateString).toLocaleDateString();
};

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
      {entries.map((entry) => {
        const isExpanded = expandedIds.has(entry.id);
        const createdDate = timeAgo(entry.createdAt);
        const shortCode = entry.shortUrl.split("/").pop();
        const label = getSecurityLabel(entry.originalUrl);

        return (
          <div
            key={entry.id}
            className="dark:bg-gray-700/50 bg-gray-50 dark:border-gray-600/50 border border-gray-300 rounded-xl p-4 hover:dark:bg-gray-700 hover:bg-gray-100 transition-all"
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 break-all">
                    {shortCode}
                  </p>

                  {/* ✅ SECURITY BADGE */}
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      label === "Secure (HTTPS)"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : label === "Local (Dev)"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {label}
                  </span>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t dark:border-gray-600/50 border-gray-300">
                    <p className="text-xs font-semibold dark:text-gray-400 text-gray-700 mb-2">
                      Original URL:
                    </p>
                    <p className="text-xs dark:text-gray-300 text-gray-800 break-all font-mono">
                      {entry.originalUrl}
                    </p>
                  </div>
                )}

                <p className="text-xs dark:bg-gray-700 dark:text-gray-300 bg-gray-700 text-white px-2 py-1 rounded mt-2 w-fit">
                  {createdDate}
                </p>
              </div>

              <div className="flex gap-2 shrink-0 flex-col sm:flex-row">
                <button
                  onClick={() => toggleExpand(entry.id)}
                  className="px-3 py-2 text-xs font-semibold dark:bg-gray-600 bg-gray-300 dark:hover:bg-gray-700 hover:bg-gray-400 rounded-lg flex items-center gap-1"
                >
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {isExpanded ? "Hide" : "Show"}
                </button>

                <button
                  onClick={() => onDelete(entry.id)}
                  className="px-3 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};