/**
 * Minimal Server-Sent Events parser for fetch ReadableStream bodies.
 * Layer: Infrastructure (pure stream parsing, no network, no process state).
 */

/**
 * Parse one SSE event block ("event: x\ndata: {...}") into {event, data}.
 * Returns null for blocks with no data (comments, keep-alives).
 * JSON data is parsed; non-JSON stays a raw string.
 */
export function parseEventBlock(block) {
  let event = "message";
  const dataLines = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (dataLines.length === 0) return null;
  const raw = dataLines.join("\n");
  try {
    return { event, data: JSON.parse(raw) };
  } catch {
    return { event, data: raw };
  }
}

/**
 * Async-iterate {event, data} objects from a streaming response body,
 * handling chunk boundaries that split events mid-line.
 */
export async function* parseSSEStream(body) {
  const decoder = new TextDecoder();
  let buffer = "";
  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true });
    let idx = buffer.indexOf("\n\n");
    while (idx !== -1) {
      const parsed = parseEventBlock(buffer.slice(0, idx));
      buffer = buffer.slice(idx + 2);
      if (parsed) yield parsed;
      idx = buffer.indexOf("\n\n");
    }
  }
  const tail = parseEventBlock(buffer);
  if (tail) yield tail;
}
