export interface MistralModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  releaseDate?: string;
}

export const MISTRAL_MODELS: MistralModel[] = [
  {
    id: "magistral-medium-1.2",
    name: "Magistral Medium 1.2",
    description: "Frontier-class multimodal reasoning model for enterprise applications",
    contextWindow: 128000,
    releaseDate: "Sep 2025",
  },
  {
    id: "mistral-medium-3.1",
    name: "Mistral Medium 3.1",
    description: "Frontier-class multimodal model for complex reasoning and visual understanding",
    contextWindow: 128000,
    releaseDate: "Aug 2025",
  },
  {
    id: "mistral-large-2.1",
    name: "Mistral Large 2.1",
    description: "Top-tier large model for high-complexity tasks",
    contextWindow: 128000,
    releaseDate: "Nov 2024",
  },
  {
    id: "pixtral-large",
    name: "Pixtral Large",
    description: "Multimodal model integrating visual encoder with Mistral Large 2",
    contextWindow: 128000,
    releaseDate: "Nov 2024",
  },
  {
    id: "devstral-medium-1.0",
    name: "Devstral Medium 1.0",
    description: "Enterprise-grade model excelling in software engineering use cases",
    contextWindow: 64000,
    releaseDate: "Jul 2025",
  },
  {
    id: "codestral",
    name: "Codestral",
    description: "Cutting-edge coding model optimized for fill-in-the-middle completion",
    contextWindow: 32000,
    releaseDate: "Jul 2025",
  },
  {
    id: "mistral-small-3.2",
    name: "Mistral Small 3.2",
    description: "Improved efficiency and performance for low-latency applications",
    contextWindow: 32000,
    releaseDate: "Jun 2025",
  },
  {
    id: "devstral-small-1.1",
    name: "Devstral Small 1.1",
    description: "Open-source model for software engineering tasks (Apache 2.0)",
    contextWindow: 32000,
    releaseDate: "Jul 2025",
  },
  {
    id: "magistral-small-1.2",
    name: "Magistral Small 1.2",
    description: "Small multimodal reasoning model with open license",
    contextWindow: 32000,
    releaseDate: "Sep 2025",
  },
  {
    id: "mistral-ocr-25.05",
    name: "Mistral OCR",
    description: "OCR API for complex documents, math expressions, and tables",
    contextWindow: 32000,
    releaseDate: "May 2025",
  },
];

export const getMistralModelById = (modelId: string): MistralModel | undefined => {
  return MISTRAL_MODELS.find((model) => model.id === modelId);
};

export const getDefaultMistralModel = (): MistralModel => {
  return MISTRAL_MODELS[0];
};
