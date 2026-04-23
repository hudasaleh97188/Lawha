const BASE = '';

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  health: () => j<{ ok: boolean }>('/api/health'),
  styles: () => j<any>('/api/styles'),
  imageModels: () => j<{ models: any[] }>('/api/models/image'),
  videoModels: () => j<{ models: any[] }>('/api/models/video'),
  search: (topic: string, description = '', n = 12) =>
    j('/api/search', { method: 'POST', body: JSON.stringify({ topic, description, n }) }),
  analyze: (image_url: string, dry_run = false) =>
    j('/api/vision/analyze', { method: 'POST', body: JSON.stringify({ image_url, dry_run }) }),
  suggest: (body: {
    change_prompt: string;
    vision_json?: any;
    occasion?: string;
    topic?: string;
    history?: { question: string; answer: string }[];
  }) =>
    j<{
      done: boolean;
      question?: string;
      options?: { id: string; label: string; icon?: string; custom?: boolean }[];
      round_hint?: string;
      summary?: string;
      confirmed_changes?: string[];
    }>('/api/suggestions', { method: 'POST', body: JSON.stringify(body) }),
  buildPrompt: (body: any) =>
    j('/api/prompt/build', { method: 'POST', body: JSON.stringify(body) }),
  generateImages: (body: any) =>
    j('/api/generate/images', { method: 'POST', body: JSON.stringify(body) }),
  improve: (body: any) =>
    j('/api/generate/improve', { method: 'POST', body: JSON.stringify(body) }),
  planAnimations: (vision_json: any, user_description = '') =>
    j('/api/animation/plan', {
      method: 'POST',
      body: JSON.stringify({ vision_json, user_description }),
    }),
  executeAnimation: (body: any) =>
    j('/api/animation/execute', { method: 'POST', body: JSON.stringify(body) }),
  caption: (body: any) =>
    j('/api/caption', { method: 'POST', body: JSON.stringify(body) }),
  sharePayload: (body: any) =>
    j('/api/share/payload', { method: 'POST', body: JSON.stringify(body) }),
};
