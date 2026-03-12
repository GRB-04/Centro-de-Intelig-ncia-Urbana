/// <reference types="vite/client" />

export type Severity = "critical" | "high" | "medium" | "low";

export type IssueDraft = {
  title?: string;
  category?: string;
  otherCategory?: string;
  neighborhood?: string;
  address?: string;
  description?: string;
  severity?: Severity;
  anonymous?: boolean;
};

export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatbotStructuredResponse = {
  mode: "help" | "report";
  reply: string;
  detectedIssue: boolean;
  issueData: IssueDraft;
  missingFields: string[];
  readyToSubmit: boolean;
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function safeJsonParse(text: string): ChatbotStructuredResponse | null {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}$/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function sanitizeSeverity(value: unknown): Severity | undefined {
  if (value === "critical" || value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return undefined;
}

function normalizeIssueDraft(input?: IssueDraft): IssueDraft {
  return {
    title: input?.title?.trim() || undefined,
    category: input?.category?.trim() || undefined,
    otherCategory: input?.otherCategory?.trim() || undefined,
    neighborhood: input?.neighborhood?.trim() || undefined,
    address: input?.address?.trim() || undefined,
    description: input?.description?.trim() || undefined,
    severity: sanitizeSeverity(input?.severity),
    anonymous: typeof input?.anonymous === "boolean" ? input.anonymous : undefined,
  };
}

export async function sendMessageToChatbot(params: {
  userMessage: string;
  history: ChatHistoryMessage[];
  currentDraft?: IssueDraft;
  currentUserName?: string;
}): Promise<ChatbotStructuredResponse> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      "A chave da Groq não foi encontrada. Verifique se o arquivo .env contém VITE_GROQ_API_KEY."
    );
  }

  const normalizedDraft = normalizeIssueDraft(params.currentDraft);

  const systemPrompt = `
Você é o Assistente Urbano do sistema "Belém Urban Intelligence Dashboard".

Seu papel:
1. Responder dúvidas sobre o sistema de forma clara, amigável e objetiva.
2. Detectar quando o usuário está descrevendo um problema urbano real.
3. Quando for um relato urbano, conduzir a conversa naturalmente para coletar os campos necessários de uma ocorrência.

Campos desejados da ocorrência:
- title
- category
- otherCategory
- neighborhood
- address
- description
- severity
- anonymous

Categorias válidas:
- Abastecimento de Água
- Arborização e Meio Ambiente
- Calçadas e Acessibilidade
- Conservação do Patrimônio
- Drenagem e Alagamentos
- Esgoto e Saneamento
- Iluminação Pública
- Resíduos Sólidos
- Segurança Urbana / Espaço Público
- Sinalização de Trânsito
- Vias e Pavimentação
- Outros

Níveis válidos de severity:
- critical
- high
- medium
- low

Comportamento desejado:
- Fale em português do Brasil.
- Seja natural, acolhedor e prático.
- Se o usuário não souber termos como "título da ocorrência", explique com linguagem simples.
- Se perceber um relato urbano, não empurre imediatamente para um formulário.
- Vá perguntando o que falta, como um atendente humano.
- Tente inferir categoria, descrição e urgência quando isso estiver claro.
- Se algo não estiver claro, pergunte de forma simples.
- Se o usuário estiver só tirando dúvida, responda normalmente.
- Se o usuário quiser anonimato, marque anonymous=true.
- Quando já houver informação suficiente para abrir uma ocorrência preenchida, marque readyToSubmit=true.

IMPORTANTE:
Você DEVE responder APENAS em JSON válido.
Sem markdown.
Sem crases.
Sem explicações fora do JSON.

Formato obrigatório:
{
  "mode": "help" | "report",
  "reply": "texto que será mostrado ao usuário",
  "detectedIssue": true | false,
  "issueData": {
    "title": string | undefined,
    "category": string | undefined,
    "otherCategory": string | undefined,
    "neighborhood": string | undefined,
    "address": string | undefined,
    "description": string | undefined,
    "severity": "critical" | "high" | "medium" | "low" | undefined,
    "anonymous": boolean | undefined
  },
  "missingFields": string[],
  "readyToSubmit": boolean
}
`.trim();

  const messages = [
    {
      role: "system" as const,
      content: systemPrompt,
    },
    {
      role: "system" as const,
      content: `Nome do usuário: ${params.currentUserName || "Usuário"}`,
    },
    {
      role: "system" as const,
      content: `Rascunho atual da ocorrência: ${JSON.stringify(normalizedDraft)}`,
    },
    ...params.history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: "user" as const,
      content: params.userMessage,
    },
  ];

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao consultar Groq: ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new Error("A resposta da IA veio vazia.");
  }

  const parsed = safeJsonParse(content);

  if (!parsed) {
    throw new Error("Não foi possível interpretar a resposta estruturada da IA.");
  }

  return {
    mode: parsed.mode === "report" ? "report" : "help",
    reply:
      typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : "Desculpe, não consegui entender totalmente. Pode me explicar de outra forma?",
    detectedIssue: Boolean(parsed.detectedIssue),
    issueData: normalizeIssueDraft(parsed.issueData),
    missingFields: Array.isArray(parsed.missingFields)
      ? parsed.missingFields.filter((item): item is string => typeof item === "string")
      : [],
    readyToSubmit: Boolean(parsed.readyToSubmit),
  };
}