import { useState, useEffect } from "react";
import { useAIConfig } from "@/utils/ai";
import { GPT_MODELS } from "@/utils/openai-models";
import { CLAUDE_MODELS } from "@/utils/claude-models";
import { GEMINI_MODELS } from "@/utils/gemini-models";
import { Dialog, Listbox } from "@headlessui/react";
import { toast } from "react-hot-toast";
import { AIConfig } from "@/types/ai";
import { RESPONSE_LANGUAGES } from "@/utils/language";
import { PROVIDERS, getProviderInfo, getApiKey } from "@/utils/provider-config";

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAnalysis: () => void;
  confirmLabel?: string;
}

export default function AIConfigModal({
  isOpen,
  onClose,
  onStartAnalysis,
  confirmLabel,
}: AIConfigModalProps) {
  const [config, setConfig] = useState<AIConfig>(() => {
    const defaultConfig = {
      provider: "gpt",
      gptKey: "",
      claudeKey: "",
      geminiKey: "",
      xaiKey: "",
      groqKey: "",
      ollamaUrl: "http://localhost:11434",
      selectedModel: GPT_MODELS[0].id,
      language: "english",
      superPrompt: true,
    } as AIConfig;

    const savedConfig = localStorage.getItem('ai_config');
    if (savedConfig) {
      try {
        return {
          ...defaultConfig,
          ...JSON.parse(savedConfig),
          superPrompt: true,
        };
      } catch (e) {
        console.error('Failed to parse saved config:', e);
      }
    }
    return defaultConfig;
  });
  const providerInfo = getProviderInfo(config.provider);

  // Handle provider change
  const handleProviderChange = (provider: AIConfig["provider"]) => {
    const info = getProviderInfo(provider);
    setConfig((prev) => ({
      ...prev,
      provider,
      selectedModel: info.defaultModel,
    }));
  };

  // Handle API key change
  const handleKeyChange = (value: string) => {
    const updates: Record<AIConfig["provider"], Partial<AIConfig>> = {
      gpt: { gptKey: value },
      claude: { claudeKey: value },
      gemini: { geminiKey: value },
      xai: { xaiKey: value },
      groq: { groqKey: value },
      ollama: { ollamaUrl: value },
    };

    setConfig((prev) => ({
      ...prev,
      ...updates[prev.provider],
    }));
  };

  const handleStartAnalysis = () => {
    const currentKey = getApiKey(config);
    if (!currentKey?.trim()) {
      toast.error(`Please enter your ${providerInfo.keyName}`);
      return;
    }
    
    // save config to local storage
    localStorage.setItem('ai_config', JSON.stringify(config));
    onStartAnalysis();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-[#1E1E1E] rounded-lg border border-[#333333] p-6 w-[480px] z-50"
      >
        <h3 className="text-xl font-semibold text-white mb-4">
          AI Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              AI Provider
            </label>
            <select
              value={config.provider}
              onChange={(e) =>
                handleProviderChange(e.target.value as AIConfig["provider"])
              }
              className="w-full bg-[#2A2A2A] text-gray-300 border border-[#404040] rounded-md px-3 py-2"
            >
              {Object.entries(PROVIDERS).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Model
              </label>
              <select
                value={config.selectedModel}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    selectedModel: e.target.value,
                  }))
                }
                className="w-full bg-[#2A2A2A] text-gray-300 border border-[#404040] rounded-md px-3 py-2"
              >
                {providerInfo.models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center pb-2">
              <input
                type="checkbox"
                id="superPrompt"
                checked={config.superPrompt}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    superPrompt: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-[#FF8B3E] bg-[#2A2A2A] border-[#404040] 
                         rounded focus:ring-[#FF8B3E] focus:ring-offset-[#1E1E1E]"
              />
              <label
                htmlFor="superPrompt"
                className="ml-2 cursor-pointer text-sm font-medium text-gray-300"
              >
                Super Prompt
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Response Language
            </label>
            <Listbox
              value={config.language || "english"}
              onChange={(value) => setConfig({ ...config, language: value })}
            >
              <div className="relative mt-1">
                <Listbox.Button className="relative w-full bg-[#2A2A2A] text-gray-300 border border-[#404040] rounded-md px-3 py-2 text-left">
                  <span className="block truncate">
                    {
                      RESPONSE_LANGUAGES.find(
                        (l) => l.id === (config.language || "english")
                      )?.name
                    }
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </Listbox.Button>
                <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#2A2A2A] border border-[#404040] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {RESPONSE_LANGUAGES.map((language) => (
                    <Listbox.Option
                      key={language.id}
                      value={language.id}
                      className={({ active }: { active: boolean }) =>
                        `relative cursor-pointer select-none py-2 px-4 ${
                          active ? "bg-[#404040] text-white" : "text-gray-300"
                        }`
                      }
                    >
                      {({ selected }: { selected: boolean }) => (
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {language.name}
                        </span>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {providerInfo.keyName}
            </label>
            <input
              type="password"
              value={getApiKey(config)}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder={providerInfo.keyPlaceholder}
              className="w-full bg-[#2A2A2A] text-gray-300 border border-[#404040] rounded-md px-3 py-2"
            />
            <div className="mt-2 text-sm text-gray-400">
              <p>
                Need a {providerInfo.keyName}?{" "}
                <a
                  href={providerInfo.getKeyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF8B3E] hover:text-[#FF8B3E]/80 transition-colors"
                >
                  {providerInfo.getKeyText}
                </a>{" "}
                (requires registration)
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              localStorage.removeItem("ai_config");
              setConfig({
                provider: "gpt",
                gptKey: "",
                claudeKey: "",
                geminiKey: "",
                xaiKey: "",
                groqKey: "",
                ollamaUrl: "http://localhost:11434",
                selectedModel: GPT_MODELS[0].id,
                language: "english",
                superPrompt: true,
              });
            }}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStartAnalysis}
            className="group relative inline-flex items-center gap-2 px-4 py-2 
                     bg-[#252526] rounded-lg text-[#FF8B3E] font-medium
                     border border-[#FF8B3E]/20
                     transition-all duration-300 ease-out
                     hover:bg-[#FF8B3E]/10"
          >
            <span className="relative z-10">{confirmLabel || "Start Analysis"}</span>
            <svg
              className="w-4 h-4 transform transition-transform duration-300 
                         group-hover:translate-x-1"
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
          </button>
        </div>
      </div>
    </Dialog>
  );
}
