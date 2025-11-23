import type { ContractFile } from "@/types/blockchain";

interface ParsedRepo {
  owner: string;
  repo: string;
  path?: string; // optional subdirectory like contracts
}

export function parseGitHubRepoUrl(url: string): ParsedRepo | null {
  if (!url) return null;
  // Accept forms:
  // https://github.com/owner/repo
  // https://github.com/owner/repo/tree/branch/sub/dir
  // owner/repo
  // github.com/owner/repo
  // Add optional path part after branch
  try {
    if (!url.startsWith("http")) {
      url = url.replace(/^github\.com\//, "https://github.com/");
    }
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");
    // Detect optional path after tree/<branch>/
    let path: string | undefined;
    const treeIndex = parts.indexOf("tree");
    if (treeIndex !== -1 && parts.length > treeIndex + 2) {
      path = parts.slice(treeIndex + 2).join("/");
    }
    return { owner, repo, path };
  } catch {
    // fallback simple pattern owner/repo
    const simple = url.trim();
    if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(simple)) {
      const [owner, repo] = simple.split("/");
      return { owner, repo };
    }
    return null;
  }
}

interface FetchOptions {
  token?: string; // optional PAT
  subdir?: string; // optional subdirectory constraint
  maxFiles?: number; // safety limit
}

async function fetchGitHubJson(url: string, token?: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json"
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function recurseContents(owner: string, repo: string, path: string, acc: any[], token?: string, maxFiles = 500) {
  if (acc.length >= maxFiles) return;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`.replace(/\/$/, "");
  const data = await fetchGitHubJson(apiUrl, token);
  if (!Array.isArray(data)) return; // not a directory
  for (const item of data) {
    if (acc.length >= maxFiles) break;
    if (item.type === "dir") {
      await recurseContents(owner, repo, item.path, acc, token, maxFiles);
    } else if (item.type === "file" && item.name.endsWith(".sol")) {
      acc.push(item);
    }
  }
}

export async function loadGitHubSolidityFiles(repoUrl: string, options: FetchOptions = {}): Promise<ContractFile[]> {
  const parsed = parseGitHubRepoUrl(repoUrl);
  if (!parsed) throw new Error("Invalid GitHub repository URL format");
  const { owner, repo, path } = parsed;
  const subdir = options.subdir || path || "";
  const collected: any[] = [];
  await recurseContents(owner, repo, subdir, collected, options.token, options.maxFiles || 500);
  if (collected.length === 0) return [];

  // Fetch raw file content
  const files: ContractFile[] = [];
  for (const item of collected) {
    try {
      const rawRes = await fetch(item.download_url);
      if (!rawRes.ok) continue;
      const content = await rawRes.text();
      files.push({ name: item.name, path: item.path, content });
    } catch (e) {
      console.warn("Failed to fetch", item.path, e);
    }
  }
  return files;
}

export function sanitizeTokenInput(token: string): string {
  return token.trim();
}
