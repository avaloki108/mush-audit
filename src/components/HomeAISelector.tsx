"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import AIConfigModal from "@/components/audit/AIConfigModal";
import { getModelName, useAIConfig } from "@/utils/ai";
import { getProviderInfo } from "@/utils/provider-config";

export default function HomeAISelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { config, setConfig } = useAIConfig();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Defer reading provider/model until after mount to avoid hydration mismatch.
  // Server render and initial client render will both show a stable placeholder.
  const providerInfo = isClient ? getProviderInfo(config.provider) : null;
  const modelLabel = isClient ? getModelName(config) : null;

  const refreshConfig = () => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("ai_config") : null;
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to refresh AI config from storage", e);
      }
    }
  };

  const handleSave = () => {
    refreshConfig();
    toast.success("Saved AI provider and model");
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group relative inline-flex items-center gap-2 px-8 py-4 
                   bg-[#252526] rounded-lg text-[#FF8B3E] text-lg font-medium
                   border border-[#FF8B3E]/20
                   transition-all duration-300 ease-out
                   hover:bg-[#FF8B3E]/10"
      >
        <div className="flex flex-col items-start">
          <span className="relative z-10 flex items-center gap-2">
            Choose AI Model
            <svg
              className="w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </span>
          <span className="text-xs text-gray-400" suppressHydrationWarning>
            {isClient && providerInfo && modelLabel
              ? `${providerInfo.name} · ${modelLabel}`
              : 'Loading AI config…'}
          </span>
        </div>
      </button>

      <AIConfigModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onStartAnalysis={handleSave}
        confirmLabel="Save AI Settings"
      />
    </>
  );
}