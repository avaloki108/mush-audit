import { useState, useEffect } from "react";
import { getModelById, GPT_MODELS } from "./openai-models";
import { getClaudeModelById, CLAUDE_MODELS } from "./claude-models";
import { getGeminiModelById, GEMINI_MODELS } from "./gemini-models";
import { getXAIModelById, XAI_MODELS } from "./xai-models";
import { getGroqModelById, GROQ_MODELS } from "./groq-models";
import { getOllamaModelById, OLLAMA_MODELS } from "./ollama-models";
import Anthropic from "@anthropic-ai/sdk";
import { AIConfig } from "@/types/ai";

export type { AIConfig } from "@/types/ai";

const SYSTEM_PROMPT = `You are a smart contract security auditor with the following responsibilities:
- Identify potential security vulnerabilities and risks
- Analyze code for best practices and standards compliance
- Suggest gas optimizations and efficiency improvements
- Provide detailed explanations of findings
- Recommend specific fixes and improvements
Format your response with clear sections for vulnerabilities, optimizations, and recommendations.
Please include full code snippets and function names in your response.`;

// Get AI config from localStorage
export function getAIConfig(config: AIConfig): AIConfig {
  if (typeof window === 'undefined') {
    return config;
  }
  const savedConfig = localStorage.getItem("ai_config");
  if (savedConfig) {
    return JSON.parse(savedConfig);
  }
  return config;
}

// Get AI model name
export function getModelName(config: AIConfig): string {
  if (config.provider === "claude") {
    const model = getClaudeModelById(config.selectedModel);
    return model?.name.toLowerCase().replace(/\s+/g, "-") || "claude";
  } else if (config.provider === "gemini") {
    const model = getGeminiModelById(config.selectedModel);
    return model?.name.toLowerCase().replace(/\s+/g, "-") || "gemini";
  } else if (config.provider === "gpt") {
    const model = getModelById(config.selectedModel);
    return model?.name.toLowerCase().replace(/\s+/g, "-") || "gpt";
  } else if (config.provider === "xai") {
    const model = getXAIModelById(config.selectedModel);
    return model?.name.toLowerCase().replace(/\s+/g, "-") || "xai";
  } else if (config.provider === "groq") {
    const model = getGroqModelById(config.selectedModel);
    return model?.name.toLowerCase().replace(/\s+/g, "-") || "groq";
  } else if (config.provider === "ollama") {
    const model = getOllamaModelById(config.selectedModel);
    return model?.name.toLowerCase().replace(/\s+/g, "-") || "ollama";
  }
  return "";
}

// AI configuration Hook
export function useAIConfig() {
  const [config, setConfig] = useState<AIConfig>(() => {
    // Read configuration from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ai_config");
      if (saved) {
        const savedConfig = JSON.parse(saved);
        // Validate if saved model is valid
        if (savedConfig.provider === "gpt") {
          const validModel = GPT_MODELS.find(
            (m) => m.id === savedConfig.selectedModel
          );
          if (!validModel) {
            savedConfig.selectedModel = GPT_MODELS[0].id;
          }
        } else if (savedConfig.provider === "claude") {
          const validModel = CLAUDE_MODELS.find(
            (m) => m.id === savedConfig.selectedModel
          );
          if (!validModel) {
            savedConfig.selectedModel = CLAUDE_MODELS[0].id;
          }
        } else if (savedConfig.provider === "gemini") {
          const validModel = GEMINI_MODELS.find(
            (m) => m.id === savedConfig.selectedModel
          );
          if (!validModel) {
            savedConfig.selectedModel = GEMINI_MODELS[0].id;
          }
        } else if (savedConfig.provider === "xai") {
          const validModel = XAI_MODELS.find(
            (m) => m.id === savedConfig.selectedModel
          );
          if (!validModel) {
            savedConfig.selectedModel = XAI_MODELS[0].id;
          }
        } else if (savedConfig.provider === "groq") {
          const validModel = GROQ_MODELS.find(
            (m) => m.id === savedConfig.selectedModel
          );
          if (!validModel) {
            savedConfig.selectedModel = GROQ_MODELS[0].id;
          }
        } else if (savedConfig.provider === "ollama") {
          const validModel = OLLAMA_MODELS.find(
            (m) => m.id === savedConfig.selectedModel
          );
          if (!validModel) {
            savedConfig.selectedModel = OLLAMA_MODELS[0].id;
          }
        }
        return savedConfig;
      }
    }
    return {
      provider: "gpt",
      gptKey: "",
      claudeKey: "",
      geminiKey: "",
      xaiKey: "",
      groqKey: "",
      ollamaUrl: "http://localhost:11434",
      selectedModel: GPT_MODELS[0].id,
      language: "english",
      superPrompt: false,
    };
  });

  // Save configuration to localStorage
  useEffect(() => {
    localStorage.setItem("ai_config", JSON.stringify(config));
  }, [config]);

  return { config, setConfig };
}

// AI analysis function
export async function analyzeWithAI(
  prompt: string,
  signal?: AbortSignal
): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("AI analysis must be performed on the client side");
  }
  
  const savedConfig = localStorage.getItem("ai_config");
  if (!savedConfig) {
    throw new Error("AI configuration not found");
  }

  const config: AIConfig = JSON.parse(savedConfig);

  // Resolve provider key from config or environment fallback (client-side only: NEXT_PUBLIC_*).
  const resolveProviderKey = () => {
    switch (config.provider) {
      case "gemini":
        return (
          config.geminiKey ||
          process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY ||
          process.env.GOOGLE_GEMINI_API_KEY
        );
      case "groq":
        return (
          config.groqKey ||
          process.env.NEXT_PUBLIC_GROQ_API_KEY ||
          process.env.GROQ_API_KEY
        );
      case "xai":
        return (
          config.xaiKey ||
          process.env.NEXT_PUBLIC_XAI_API_KEY ||
          process.env.XAI_API_KEY
        );
      case "claude":
        return (
          config.claudeKey ||
          process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
          process.env.ANTHROPIC_API_KEY
        );
      case "gpt":
        return (
          config.gptKey ||
          process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
          process.env.OPENAI_API_KEY ||
          process.env.OPENROUTER_API_KEY
        );
      case "ollama":
        return config.ollamaUrl;
      default:
        return "";
    }
  };
  const providerKey = resolveProviderKey();
  const ensureProviderKey = () => {
    if (!providerKey) {
      throw new Error(
        `Missing API key for provider: ${config.provider}. Set env var or enter in UI.`
      );
    }
  };
  let response: Response;

  try {
    // Prefer unified API route (server-side keys) when available; fall back to client-side calls.
    try {
      const routeResponse = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          provider: config.provider,
          model: config.selectedModel,
          superPrompt: config.superPrompt,
          language: config.language,
        }),
        signal,
      });

      if (routeResponse.ok) {
        const payload = await routeResponse.json();
        const text = payload?.text ?? payload?.response;
        if (text) {
          return text;
        }
      } else {
        const errText = await routeResponse.text();
        console.warn(`AI route error (${routeResponse.status}): ${errText}`);
      }
    } catch (routeError) {
      console.warn(
        "Unified AI route call failed; falling back to direct provider logic.",
        routeError
      );
    }

    if (config.provider === "gemini") {
      // console.log("gemini");
      const geminiModel = getGeminiModelById(config.selectedModel);
      if (!geminiModel) {
        throw new Error(
          `Invalid Gemini model selected: ${config.selectedModel}`
        );
      }
      ensureProviderKey();

      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel.id}:generateContent?key=${providerKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
          signal,
        }
      );

      if (!response?.ok) {
        const errorData = await response.text();
        throw new Error(
          `Gemini API request failed: ${response.statusText}. Details: ${errorData}`
        );
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } else if (config.provider === "claude") {
      // console.log("claude");
      const claudeModel = getClaudeModelById(config.selectedModel);
      if (!claudeModel) {
        throw new Error("Invalid Claude model selected");
      }
      ensureProviderKey();

      const anthropic = new Anthropic({
        apiKey: providerKey,
        dangerouslyAllowBrowser: true,
      });

      const messagePromise = anthropic.messages.create({
        model: config.selectedModel,
        max_tokens: 8192,
        temperature: 0.5,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      });

      const abortPromise = signal
        ? new Promise<never>((_, reject) => {
            signal.addEventListener("abort", () => {
              reject(new Error("Analysis cancelled"));
            });
          })
        : null;

      const msg = (await (abortPromise
        ? Promise.race([messagePromise, abortPromise])
        : messagePromise)) as Awaited<typeof messagePromise>;

      if (!msg.content[0] || !("text" in msg.content[0])) {
        throw new Error("Unexpected response format from Claude");
      }
      return msg.content[0].text;
    } else if (config.provider === "gpt") {
      // console.log("gpt");
      const gptModel = getModelById(config.selectedModel);
      if (!gptModel) {
        throw new Error(`Invalid GPT model selected: ${config.selectedModel}`);
      }
      ensureProviderKey();
      const gptBase =
        providerKey.startsWith("sk-or-") || providerKey.startsWith("sess-")
          ? "https://openrouter.ai/api/v1"
          : "https://api.openai.com/v1";

      response = await fetch(`${gptBase}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${providerKey}`,
        },
        body: JSON.stringify({
          model: gptModel.id,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          ...(gptModel.supportsTemperature !== false
            ? { temperature: 0.5 }
            : { temperature: 1 }),
        }),
        signal,
      });

      if (!response?.ok) {
        const errorData = await response.text();
        throw new Error(
          `API request failed: ${response.statusText}. Details: ${errorData}`
        );
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } else if (config.provider === "xai") {
      const xaiModel = getXAIModelById(config.selectedModel);
      if (!xaiModel) {
        throw new Error(`Invalid xAI model selected: ${config.selectedModel}`);
      }
      ensureProviderKey();

      response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${providerKey}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          model: xaiModel.id,
          stream: false,
          temperature: 0.5,
        }),
        signal,
      });

      if (!response?.ok) {
        const errorData = await response.text();
        throw new Error(
          `xAI API request failed: ${response.statusText}. Details: ${errorData}`
        );
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } else if (config.provider === "groq") {
      const groqModel = getGroqModelById(config.selectedModel);
      if (!groqModel) {
        throw new Error(`Invalid Groq model selected: ${config.selectedModel}`);
      }
      ensureProviderKey();

      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${providerKey}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          model: groqModel.id,
          temperature: 0.5,
          max_tokens: 8000,
        }),
        signal,
      });

      if (!response?.ok) {
        const errorData = await response.text();
        throw new Error(
          `Groq API request failed: ${response.statusText}. Details: ${errorData}`
        );
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } else if (config.provider === "ollama") {
      const ollamaModel = getOllamaModelById(config.selectedModel);
      if (!ollamaModel) {
        throw new Error(
          `Invalid Ollama model selected: ${config.selectedModel}`
        );
      }

      const ollamaUrl = providerKey || "http://localhost:11434";
      response = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: ollamaModel.id,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          stream: false,
        }),
        signal,
      });

      if (!response?.ok) {
        const errorData = await response.text();
        throw new Error(
          `Ollama API request failed: ${response.statusText}. Details: ${errorData}`
        );
      }

      const data = await response.json();
      return data.message.content;
    } else {
      throw new Error("Invalid provider");
    }
  } catch (error) {
    console.error("AI analysis error:", error);
    throw error instanceof Error
      ? error
      : new Error("Unknown error during analysis");
  }
}
