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

export const UrlHistory: React.FC<UrlHistoryProps> = ({ entries, onDelete }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 dark:text-gray-500">No URLs shortened yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
      {entries.map((entry) => {
        const isExpanded = expandedIds.has(entry.id);
        const createdDate = new Date(entry.createdAt).toLocaleString();
        const shortCode = entry.shortUrl.split("/").pop();
        const charsReduced = entry.originalUrl.length - entry.shortUrl.length;

        return (
          <div
            key={entry.id}
            className="dark:bg-gray-700/50 bg-gray-50 dark:border-gray-600/50 border border-gray-300 rounded-xl p-4 hover:dark:bg-gray-700 hover:bg-gray-100 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 break-all">
                    {shortCode}
                  </p>
                  <span className="text-xs px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-300 bg-green-100 text-green-700">
                    -{charsReduced} chars
                  </span>
                </div>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t dark:border-gray-600/50 border-gray-300">
                    <p className="text-xs font-semibold dark:text-gray-400 text-gray-700 mb-2">Original URL:</p>
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
                  className="px-3 py-2 text-xs font-semibold dark:bg-gray-600 dark:text-gray-100 bg-gray-300 text-gray-900 dark:hover:bg-gray-700 hover:bg-gray-400 rounded-lg transition-colors flex items-center gap-1 justify-center"
                  title={isExpanded ? "Hide details" : "Show details"}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show
                    </>
                  )}
                </button>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="px-3 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1 justify-center"
                  title="Delete this URL"
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
