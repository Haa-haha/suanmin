export interface TrigramMapping {
  upper: { trigramNumber: number; name: string; reason: string };
  lower: { trigramNumber: number; name: string; reason: string };
  third: { trigramNumber: number; name: string; reason: string };
  movingLine: number;
  movingLineReason: string;
}

export async function mapObjectsToTrigrams(objects: string[]): Promise<TrigramMapping> {
  const res = await fetch('/api/oracle-object-mapping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objects }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mapping API error: ${err}`);
  }
  return res.json();
}

export interface InterpretPayload {
  method: string;
  signals: string[];
  question: string;
  hexagramTitle: string;
  changedHexagramTitle: string;
  movingLine: number;
  reasons: string[];
}

export interface InterpretCallbacks {
  onThinking?: (text: string) => void;
  onChunk?: (text: string) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

export async function interpretHexagram(
  payload: InterpretPayload,
  callbacks: InterpretCallbacks
): Promise<void> {
  try {
    const res = await fetch('/api/oracle-interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Interpret API error (${res.status}): ${errText}`);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          callbacks.onDone?.();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;
          if (delta.reasoning_content) {
            callbacks.onThinking?.(delta.reasoning_content);
          }
          if (delta.content) {
            callbacks.onChunk?.(delta.content);
          }
        } catch {
        }
      }
    }
    callbacks.onDone?.();
  } catch (err: any) {
    callbacks.onError?.(err);
  }
}
