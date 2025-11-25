"use client";

import { useEffect, useRef } from "react";

export type LogLevel = "info" | "success" | "warning" | "error";

export interface ProgressLog {
  id: string;
  message: string;
  level: LogLevel;
  timestamp: Date;
}

interface ProgressTerminalProps {
  logs: ProgressLog[];
  isActive: boolean;
}

const getLevelColor = (level: LogLevel): string => {
  switch (level) {
    case "info":
      return "text-blue-400";
    case "success":
      return "text-green-400";
    case "warning":
      return "text-yellow-400";
    case "error":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
};

const getLevelPrefix = (level: LogLevel): string => {
  switch (level) {
    case "info":
      return "[INFO]";
    case "success":
      return "[SUCCESS]";
    case "warning":
      return "[WARNING]";
    case "error":
      return "[ERROR]";
    default:
      return "[LOG]";
  }
};

const formatTimestamp = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export default function ProgressTerminal({
  logs,
  isActive,
}: ProgressTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0 && !isActive) {
    return null;
  }

  return (
    <div className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-[#333333] shadow-xl">
      {/* macOS-style window header */}
      <div className="bg-[#2D2D2D] px-4 py-3 flex items-center gap-2 border-b border-[#333333]">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-gray-400 text-sm font-medium">
            Security Analysis Terminal
          </span>
        </div>
        <div className="w-[52px]" /> {/* Spacer for symmetry */}
      </div>

      {/* Terminal content */}
      <div
        ref={scrollRef}
        className="p-4 max-h-64 overflow-y-auto font-mono text-sm"
        style={{ scrollBehavior: "smooth" }}
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 mb-1 leading-relaxed">
            <span className="text-gray-500 flex-shrink-0">
              {formatTimestamp(log.timestamp)}
            </span>
            <span className={`flex-shrink-0 ${getLevelColor(log.level)}`}>
              {getLevelPrefix(log.level)}
            </span>
            <span className="text-gray-300">{log.message}</span>
          </div>
        ))}

        {/* Animated "Processing..." indicator */}
        {isActive && (
          <div className="flex gap-2 mt-2 items-center">
            <span className="text-gray-500 flex-shrink-0">
              {formatTimestamp(new Date())}
            </span>
            <span className="text-blue-400 flex-shrink-0">[INFO]</span>
            <span className="text-gray-300">Processing</span>
            <span className="inline-flex">
              <span className="animate-pulse text-[#FF8B3E]">.</span>
              <span
                className="animate-pulse text-[#FF8B3E]"
                style={{ animationDelay: "0.2s" }}
              >
                .
              </span>
              <span
                className="animate-pulse text-[#FF8B3E]"
                style={{ animationDelay: "0.4s" }}
              >
                .
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
