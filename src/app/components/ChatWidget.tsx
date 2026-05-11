import { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle,
  Send,
  X,
  Bot,
  Sparkles,
  Loader2,
  Mic,
  MicOff,
} from "lucide-react";
import type { ReportModalInitialData } from "./ReportModal";
import {
  sendMessageToChatbot,
  type ChatHistoryMessage,
  type IssueDraft,
} from "../../services/chatbot";

interface ChatWidgetProps {
  darkMode: boolean;
  currentUserName: string;
  onStartReport: (initialData: ReportModalInitialData) => void;
}

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  onresult: ((event: any) => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function mergeDrafts(currentDraft: IssueDraft | null, nextDraft: IssueDraft): IssueDraft {
  return {
    title: nextDraft.title || currentDraft?.title || "",
    category: nextDraft.category || currentDraft?.category || "",
    otherCategory: nextDraft.otherCategory || currentDraft?.otherCategory || "",
    neighborhood: nextDraft.neighborhood || currentDraft?.neighborhood || "",
    address: nextDraft.address || currentDraft?.address || "",
    description: nextDraft.description || currentDraft?.description || "",
    severity: nextDraft.severity || currentDraft?.severity || "medium",
    anonymous:
      typeof nextDraft.anonymous === "boolean"
        ? nextDraft.anonymous
        : currentDraft?.anonymous ?? false,
  };
}

function buildMissingFieldsLabel(fields: string[]) {
  const labels: Record<string, string> = {
    title: "título",
    category: "categoria",
    otherCategory: "tipo do problema",
    neighborhood: "bairro",
    address: "endereço ou referência",
    description: "descrição",
    severity: "urgência",
    anonymous: "anonimato",
  };

  return fields.map((field) => labels[field] || field);
}

export function ChatWidget({
  darkMode,
  currentUserName,
  onStartReport,
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [issueDraft, setIssueDraft] = useState<IssueDraft | null>(null);
  const [detectedIssue, setDetectedIssue] = useState(false);
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "assistant",
      text: `Olá, ${currentUserName}! Eu sou o Assistente Urbano.\n\nPosso tirar dúvidas sobre o sistema ou ajudar você a registrar uma ocorrência de forma natural, como numa conversa.`,
    },
    {
      id: createId(),
      role: "assistant",
      text: "Você pode me dizer algo como:\n• tem um poste sem luz na Alcindo Cacela\n• há um buraco grande no Marco\n• como funciona o apoio da comunidade?",
    },
  ]);

  const quickActions = useMemo(
    () => [
      "Como registrar uma ocorrência?",
      "Tem um poste sem luz na Alcindo Cacela",
      "Há um buraco grande no Marco",
    ],
    []
  );

  useEffect(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSpeechSupported(false);
      return;
    }

    setSpeechSupported(true);

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "pt-BR";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setMicError(null);
      setIsRecording(true);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);

      if (event?.error === "not-allowed") {
        setMicError("Permissão de microfone negada no navegador.");
        return;
      }

      if (event?.error === "no-speech") {
        setMicError("Não consegui ouvir sua fala. Tente novamente.");
        return;
      }

      setMicError("Não foi possível usar o microfone agora.");
    };

    recognition.onresult = (event: any) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setInput(transcript.trim());
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open, detectedIssue, missingFields, issueDraft]);

  function pushMessage(message: ChatMessage) {
    setMessages((prev) => [...prev, message]);
  }

  function resetIssueState() {
    setIssueDraft(null);
    setDetectedIssue(false);
    setReadyToSubmit(false);
    setMissingFields([]);
  }

  function openPrefilledReport() {
    if (!issueDraft) return;

    onStartReport({
      title: issueDraft.title || "",
      category: issueDraft.category || "",
      otherCategory: issueDraft.otherCategory || "",
      neighborhood: issueDraft.neighborhood || "",
      address: issueDraft.address || "",
      description: issueDraft.description || "",
      severity: issueDraft.severity || "medium",
      anonymous: issueDraft.anonymous ?? false,
    });

    setOpen(false);
  }

  async function handleSend(forcedText?: string) {
    const text = (forcedText ?? input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      text,
    };

    pushMessage(userMessage);
    setInput("");
    setLoading(true);
    setMicError(null);

    try {
      const history: ChatHistoryMessage[] = messages.map((message) => ({
        role: message.role,
        content: message.text,
      }));

      const response = await sendMessageToChatbot({
        userMessage: text,
        history,
        currentDraft: issueDraft ?? undefined,
        currentUserName,
      });

      const mergedDraft = mergeDrafts(issueDraft, response.issueData || {});
      const hasMeaningfulDraft =
        Boolean(mergedDraft.title) ||
        Boolean(mergedDraft.category) ||
        Boolean(mergedDraft.neighborhood) ||
        Boolean(mergedDraft.address) ||
        Boolean(mergedDraft.description);

      if (response.detectedIssue && hasMeaningfulDraft) {
        setIssueDraft(mergedDraft);
        setDetectedIssue(true);
      }

      setReadyToSubmit(Boolean(response.readyToSubmit));
      setMissingFields(response.missingFields || []);

      pushMessage({
        id: createId(),
        role: "assistant",
        text: response.reply,
      });

      if (response.detectedIssue && hasMeaningfulDraft) {
        const fieldsText = buildMissingFieldsLabel(response.missingFields || []);

        const summaryLines = [
          "Resumo do que já entendi:",
          `• Título: ${mergedDraft.title || "Ainda não definido"}`,
          `• Categoria: ${mergedDraft.category || "Ainda não definida"}`,
          `• Bairro: ${mergedDraft.neighborhood || "Ainda não informado"}`,
          `• Endereço: ${mergedDraft.address || "Ainda não informado"}`,
          `• Urgência: ${
            mergedDraft.severity === "critical"
              ? "Crítica"
              : mergedDraft.severity === "high"
              ? "Alta"
              : mergedDraft.severity === "medium"
              ? "Média"
              : mergedDraft.severity === "low"
              ? "Baixa"
              : "Ainda não definida"
          }`,
        ];

        if (fieldsText.length > 0) {
          summaryLines.push("", `Ainda faltam: ${fieldsText.join(", ")}.`);
        } else if (response.readyToSubmit) {
          summaryLines.push(
            "",
            "Já tenho informação suficiente para abrir a ocorrência preenchida."
          );
        }

        pushMessage({
          id: createId(),
          role: "assistant",
          text: summaryLines.join("\n"),
        });
      }
    } catch (error: any) {
      pushMessage({
        id: createId(),
        role: "assistant",
        text:
          error?.message ||
          "Desculpe, tive um problema ao falar com a IA agora. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleQuickAction(value: string) {
    setInput(value);
    setTimeout(() => {
      void handleSend(value);
    }, 40);
  }

  function toggleRecording() {
    if (!speechSupported) {
      setMicError("Seu navegador não suporta transcrição por voz.");
      return;
    }

    if (!recognitionRef.current) {
      setMicError("Não foi possível inicializar o microfone.");
      return;
    }

    setMicError(null);

    if (isRecording) {
      recognitionRef.current.stop();
      return;
    }

    recognitionRef.current.start();
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-6 z-[1500] overflow-hidden flex flex-col"
          style={{
            width: 360,
            height: 560,
            borderRadius: 24,
            backgroundColor: "#F81F39",
            boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
              backgroundColor: "rgba(255,255,255,0.24)",
              borderBottom: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.92)" }}
              >
                <Bot size={18} color="#F81F39" />
              </div>

              <div>
                <div
                  className="text-sm"
                  style={{ color: "#111", fontWeight: 700, lineHeight: 1.1 }}
                >
                  Assistente
                </div>
                <div
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.95)" }}
                >
                  Online • {currentUserName}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                color: "#fff",
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div
            className="px-3 py-3 overflow-y-auto flex-1 min-h-0"
            style={{
              backgroundColor: "#F81F39",
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-3 flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  style={{
                    maxWidth: "84%",
                    borderRadius: 18,
                    padding: "12px 14px",
                    whiteSpace: "pre-line",
                    fontSize: 13,
                    lineHeight: 1.45,
                    backgroundColor:
                      message.role === "user"
                        ? "rgba(255,255,255,0.92)"
                        : "rgba(255,255,255,0.50)",
                    color: message.role === "user" ? "#111" : "#fff",
                    border:
                      message.role === "user"
                        ? "1px solid rgba(255,255,255,0.20)"
                        : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="mb-3 flex justify-start">
                <div
                  className="flex items-center gap-2"
                  style={{
                    borderRadius: 18,
                    padding: "12px 14px",
                    fontSize: 13,
                    backgroundColor: "rgba(255,255,255,0.50)",
                    color: "#fff",
                  }}
                >
                  <Loader2 size={14} className="animate-spin" />
                  Pensando...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div
            className="px-3 pt-2 pb-3 shrink-0"
            style={{
              backgroundColor: "#F81F39",
              borderTop: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div className="flex gap-2 mb-2 overflow-x-auto">
              {quickActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => handleQuickAction(action)}
                  disabled={loading || isRecording}
                  className="shrink-0 px-3 py-2 rounded-full text-xs"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.18)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.10)",
                    opacity: loading || isRecording ? 0.6 : 1,
                  }}
                >
                  {action}
                </button>
              ))}
            </div>

            {detectedIssue && issueDraft && (
              <div
                className="mb-2 rounded-2xl p-3 max-h-40 overflow-y-auto"
                style={{
                  backgroundColor: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div
                  className="text-xs mb-2"
                  style={{ color: "#fff", fontWeight: 700 }}
                >
                  Ocorrência em construção
                </div>

                <div
                  className="text-xs"
                  style={{
                    color: "rgba(255,255,255,0.95)",
                    lineHeight: 1.5,
                  }}
                >
                  <div>• Título: {issueDraft.title || "—"}</div>
                  <div>• Categoria: {issueDraft.category || "—"}</div>
                  <div>• Bairro: {issueDraft.neighborhood || "—"}</div>
                  <div>• Endereço: {issueDraft.address || "—"}</div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={openPrefilledReport}
                    className="flex-1 h-9 rounded-xl text-sm flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: "#fff",
                      color: "#F81F39",
                      fontWeight: 700,
                      opacity: readyToSubmit ? 1 : 0.92,
                    }}
                  >
                    <Sparkles size={14} />
                    {readyToSubmit
                      ? "Abrir ocorrência preenchida"
                      : "Continuar no formulário"}
                  </button>

                  <button
                    type="button"
                    onClick={resetIssueState}
                    className="h-9 px-3 rounded-xl text-sm"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.15)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    Limpar
                  </button>
                </div>

                {missingFields.length > 0 && (
                  <div
                    className="mt-2 text-[11px]"
                    style={{ color: "rgba(255,255,255,0.88)" }}
                  >
                    Ainda faltam: {buildMissingFieldsLabel(missingFields).join(", ")}.
                  </div>
                )}
              </div>
            )}

            {micError && (
              <div
                className="mb-2 text-[11px] rounded-xl px-3 py-2"
                style={{
                  backgroundColor: "rgba(0,0,0,0.15)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {micError}
              </div>
            )}

            <div
              className="flex items-center gap-2 rounded-2xl px-3 py-2"
              style={{
                backgroundColor: "rgba(255,255,255,0.22)",
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder={isRecording ? "Ouvindo..." : "Digite sua mensagem..."}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{
                  color: "#fff",
                }}
                disabled={loading}
              />

              <button
                type="button"
                onClick={toggleRecording}
                title={
                  speechSupported
                    ? isRecording
                      ? "Parar gravação"
                      : "Gravar áudio"
                    : "Seu navegador não suporta áudio"
                }
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: isRecording
                    ? "rgba(255,255,255,0.92)"
                    : "rgba(255,255,255,0.18)",
                  color: isRecording ? "#F81F39" : "#fff",
                  opacity: loading ? 0.6 : 1,
                }}
                disabled={loading}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "rgba(255,255,255,0.92)",
                  color: "#F81F39",
                  opacity: loading || !input.trim() ? 0.6 : 1,
                }}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>

            <div
              className="mt-2 text-[10px]"
              style={{ color: "rgba(255,255,255,0.82)" }}
            >
              {speechSupported
                ? "Você pode digitar ou usar o microfone. Se gravar, a fala será transcrita no campo."
                : "Seu navegador não oferece suporte à transcrição por voz neste chat."}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-[1400] w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: "#F81F39",
          boxShadow: "0 14px 36px rgba(0,0,0,0.28)",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
        aria-label={open ? "Fechar assistente" : "Abrir assistente"}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
