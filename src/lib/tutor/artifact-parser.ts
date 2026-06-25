export interface Artifact {
  id: string;
  type: "html" | "quiz" | "code" | "visualization";
  title: string;
  content: string;
}

export interface ParsedMessage {
  segments: Array<{ kind: "text"; text: string } | { kind: "artifact"; artifact: Artifact }>;
}

const ARTIFACT_REGEX = /:::artifact\{([^}]*)\}\n([\s\S]*?):::/g;

function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /(\w+)="([^"]*)"/g;
  let match;
  while ((match = regex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

export function parseArtifacts(content: string): ParsedMessage {
  const segments: ParsedMessage["segments"] = [];
  let lastIndex = 0;
  let match;
  let artifactIndex = 0;

  ARTIFACT_REGEX.lastIndex = 0;

  while ((match = ARTIFACT_REGEX.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) segments.push({ kind: "text", text });
    }

    const attrs = parseAttributes(match[1]);
    const type = (attrs.type || "html") as Artifact["type"];
    const title = attrs.title || `Interactive ${type}`;

    segments.push({
      kind: "artifact",
      artifact: {
        id: `artifact-${Date.now()}-${artifactIndex++}`,
        type,
        title,
        content: match[2].trim(),
      },
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) segments.push({ kind: "text", text });
  }

  if (segments.length === 0) {
    segments.push({ kind: "text", text: content });
  }

  return { segments };
}
