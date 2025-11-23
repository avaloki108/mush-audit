import { NextRequest } from 'next/server';
import { GROQ_MODELS } from '@/utils/groq-models';
import { GEMINI_MODELS } from '@/utils/gemini-models';
import { XAI_MODELS } from '@/utils/xai-models';
import { GPT_MODELS } from '@/utils/openai-models';
import { CLAUDE_MODELS } from '@/utils/claude-models';
import { OLLAMA_MODELS } from '@/utils/ollama-models';

const SYSTEM_PROMPT = `You are a smart contract security auditor with the following responsibilities:\n- Identify potential security vulnerabilities and risks\n- Analyze code for best practices and standards compliance\n- Suggest gas optimizations and efficiency improvements\n- Provide detailed explanations of findings\n- Recommend specific fixes and improvements\nFormat your response with clear sections for vulnerabilities, optimizations, and recommendations.`;

type Provider = 'groq' | 'gemini' | 'xai' | 'gpt' | 'claude' | 'ollama';

export const runtime = 'node';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const { prompt, provider, model, superPrompt, language } = body || {};
  if (!prompt || typeof prompt !== 'string') {
    return new Response('Missing prompt', { status: 400 });
  }
  if (!provider) {
    return new Response('Missing provider', { status: 400 });
  }

  try {
    switch (provider as Provider) {
      case 'gemini': {
        const gemModel = GEMINI_MODELS.find(m => m.id === model) || GEMINI_MODELS[0];
        const key = process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;
        if (!key) return new Response('Gemini key not configured', { status: 500 });
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${gemModel.id}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [ { parts: [ { text: prompt } ] } ]
          })
        });
        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';
        return Response.json({ text, raw: data });
      }
      case 'groq': {
        const groqModel = GROQ_MODELS.find(m => m.id === model) || GROQ_MODELS[0];
        const key = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
        if (!key) return new Response('Groq key not configured', { status: 500 });
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
            model: groqModel.id
          })
        });
        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content || 'No response from Groq';
        return Response.json({ text, raw: data });
      }
      case 'xai': {
        const xaiModel = XAI_MODELS.find(m => m.id === model) || XAI_MODELS[0];
        const key = process.env.XAI_API_KEY || process.env.NEXT_PUBLIC_XAI_API_KEY;
        if (!key) return new Response('xAI key not configured', { status: 500 });
        const url = process.env.XAI_URL || 'https://api.x.ai/v1/chat/completions';
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
            model: xaiModel.id
          })
        });
        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content || 'No response from xAI';
        return Response.json({ text, raw: data });
      }
      case 'gpt': {
        const gptModel = GPT_MODELS.find(m => m.id === model) || GPT_MODELS[0];
        const key = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
        if (!key) return new Response('OpenAI/Router key not configured', { status: 500 });
        const base = key.startsWith('sk-or-') ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';
        const resp = await fetch(`${base}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
            model: gptModel.id
          })
        });
        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content || 'No response from GPT';
        return Response.json({ text, raw: data });
      }
      case 'claude': {
        const claudeModel = CLAUDE_MODELS.find(m => m.id === model) || CLAUDE_MODELS[0];
        const key = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
        if (!key) return new Response('Claude key not configured', { status: 500 });
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: claudeModel.id,
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            messages: [ { role: 'user', content: prompt } ]
          })
        });
        const data = await resp.json();
        const text = data?.content?.[0]?.text || 'No response from Claude';
        return Response.json({ text, raw: data });
      }
      case 'ollama': {
        const ollamaModel = OLLAMA_MODELS.find(m => m.id === model) || OLLAMA_MODELS[0];
        const url = process.env.OLLAMA_URL || 'http://localhost:11434';
        const resp = await fetch(`${url}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel.id,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
            stream: false
          })
        });
        const data = await resp.json();
        const text = data?.message?.content || data?.response || 'No response from Ollama';
        return Response.json({ text, raw: data });
      }
      default:
        return new Response('Unsupported provider', { status: 400 });
    }
  } catch (e: any) {
    console.error('AI route error', e);
    return new Response(e.message || 'Internal error', { status: 500 });
  }
}
