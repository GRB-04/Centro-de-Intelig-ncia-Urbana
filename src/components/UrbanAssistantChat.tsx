import { useEffect, useRef, useState } from 'react'
import { Send, X, Sparkles, Loader2, Mic, MicOff, CheckCircle2, Pencil, Check } from 'lucide-react'
import { sendMessageToChatbot, type ChatHistoryMessage, type IssueDraft } from '../services/chatbot'

interface UrbanAssistantChatProps {
  onClose: () => void
  onStartReport: (initialData: any) => void
  currentUserName?: string
}

interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  text: string
}

type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: any) => void) | null
  onresult: ((event: any) => void) | null
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
}

function severityLabel(s?: string) {
  if (s === 'critical') return 'Crítica 🔴'
  if (s === 'high') return 'Alta 🟠'
  if (s === 'medium') return 'Média 🟡'
  if (s === 'low') return 'Baixa 🟢'
  return ''
}

// ─────────────────────────────────────────
export default function UrbanAssistantChat({
  onClose,
  onStartReport,
  currentUserName = 'Gabriel',
}: UrbanAssistantChatProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: `Olá! Sou o Zé, o assistente inteligente do ZelaBelém. Conte-me qual problema você está presenciando (ex: buraco na rua, poste apagado, acúmulo de lixo) e em qual local/bairro ele ocorre. Posso te ajudar a relatar essa ocorrência de forma rápida!`,
    },
  ])
  const [loading, setLoading] = useState(false)
  const [currentDraft, setCurrentDraft] = useState<IssueDraft | null>(null)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [readyToSubmit, setReadyToSubmit] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [micError, setMicError] = useState('')
  
  // Interactive Editing State
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const recognitionRef = useRef<any>(null)
  const [speechSupported, setSpeechSupported] = useState(false)

  // Auto-scroll to bottom of chat body
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, currentDraft])

  // Speech recognition initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setSpeechSupported(true)
      const rec = new SpeechRecognition()
      rec.lang = 'pt-BR'
      rec.continuous = false
      rec.interimResults = false

      rec.onstart = () => {
        setIsRecording(true)
        setMicError('')
      }

      rec.onend = () => {
        setIsRecording(false)
      }

      rec.onerror = (e: any) => {
        console.error(e)
        setMicError('Erro ao acessar o microfone.')
        setIsRecording(false)
      }

      rec.onresult = (e: any) => {
        const resultText = e.results[0][0].transcript
        setInput(resultText)
      }

      recognitionRef.current = rec
    }
  }, [])

  const toggleRecording = () => {
    if (!recognitionRef.current) return
    if (isRecording) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  const startEditing = (fieldName: string, currentValue: string) => {
    setEditingField(fieldName)
    setEditValue(currentValue || '')
  }

  const saveField = (fieldName: string) => {
    if (!currentDraft) return
    const updated = { ...currentDraft, [fieldName]: editValue }
    
    // Check missing fields
    const required: (keyof IssueDraft)[] = ['category', 'neighborhood', 'address', 'description']
    const missing = required.filter(f => !updated[f])
    const isReady = missing.length === 0

    setCurrentDraft(updated)
    setMissingFields(missing as string[])
    setReadyToSubmit(isReady)
    setEditingField(null)
  }

  const sendUserMessage = async (trimmedText: string) => {
    const userMsgId = crypto.randomUUID()
    const newMessages = [...messages, { id: userMsgId, role: 'user' as const, text: trimmedText }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const history: ChatHistoryMessage[] = newMessages.map(m => ({
        role: m.role,
        content: m.text
      }))

      const response = await sendMessageToChatbot({
        userMessage: trimmedText,
        history,
        currentDraft: currentDraft || {},
        currentUserName
      })

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: response.reply
        }
      ])

      if (response.detectedIssue && response.issueData) {
        // Merge drafts
        setCurrentDraft(prev => {
          const nextDraft = response.issueData
          const merged = { ...(prev || {}) }
          if (nextDraft.title) merged.title = nextDraft.title
          if (nextDraft.category) merged.category = nextDraft.category
          if (nextDraft.otherCategory) merged.otherCategory = nextDraft.otherCategory
          if (nextDraft.neighborhood) merged.neighborhood = nextDraft.neighborhood
          if (nextDraft.address) merged.address = nextDraft.address
          if (nextDraft.description) merged.description = nextDraft.description
          if (nextDraft.severity) merged.severity = nextDraft.severity
          if (typeof nextDraft.anonymous === 'boolean') merged.anonymous = nextDraft.anonymous
          return merged
        })
        setMissingFields(response.missingFields || [])
        setReadyToSubmit(response.readyToSubmit || false)
      }
    } catch (err: any) {
      console.error(err)
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: `Ops! Tive um problema ao processar sua mensagem: ${err.message || err}.`
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setInput('')
    await sendUserMessage(trimmed)
  }

  const handlePublish = () => {
    if (currentDraft) {
      onStartReport(currentDraft)
    }
  }

  const handleCancel = () => {
    setCurrentDraft(null)
    setReadyToSubmit(false)
    setMissingFields([])
  }

  // Check if draft has any content
  const hasDraftContent = currentDraft && (
    currentDraft.title ||
    currentDraft.category ||
    currentDraft.neighborhood ||
    currentDraft.address ||
    currentDraft.description
  )

  const renderDraftField = (label: string, fieldName: keyof IssueDraft, value: string) => {
    const isEditing = editingField === fieldName
    
    return (
      <div 
        className="chat-draft-field"
        onClick={() => !isEditing && startEditing(fieldName, value)}
      >
        <strong>{label}:</strong>
        {isEditing ? (
          <div className="chat-draft-field-value-row" onClick={(e) => e.stopPropagation()}>
            {fieldName === 'category' ? (
              <select
                className="chat-draft-edit-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => saveField(fieldName)}
                autoFocus
              >
                <option value="Abastecimento de Água">Abastecimento de Água</option>
                <option value="Arborização e Meio Ambiente">Arborização e Meio Ambiente</option>
                <option value="Calçadas e Acessibilidade">Calçadas e Acessibilidade</option>
                <option value="Conservação do Patrimônio">Conservação do Patrimônio</option>
                <option value="Drenagem e Alagamentos">Drenagem e Alagamentos</option>
                <option value="Esgoto e Saneamento">Esgoto e Saneamento</option>
                <option value="Iluminação Pública">Iluminação Pública</option>
                <option value="Resíduos Sólidos">Resíduos Sólidos</option>
                <option value="Segurança Urbana / Espaço Público">Segurança Urbana / Espaço Público</option>
                <option value="Sinalização de Trânsito">Sinalização de Trânsito</option>
                <option value="Vias e Pavimentação">Vias e Pavimentação</option>
                <option value="Outros">Outros</option>
              </select>
            ) : fieldName === 'severity' ? (
              <select
                className="chat-draft-edit-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => saveField(fieldName)}
                autoFocus
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            ) : (
              <input
                className="chat-draft-edit-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => saveField(fieldName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveField(fieldName)
                  if (e.key === 'Escape') setEditingField(null)
                }}
                autoFocus
              />
            )}
            <button 
              type="button" 
              className="chat-draft-save-btn" 
              onClick={() => saveField(fieldName)}
              style={{ background: 'none', border: 'none', color: '#007aff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <div className="chat-draft-field-value-row">
            <span>{fieldName === 'severity' ? severityLabel(value) : (value || 'Clique para definir')}</span>
            <div className="chat-draft-edit-btn">
              <Pencil size={12} />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div>
          <div className="chat-header-title-row">
            <h3 className="chat-title">Assistente Zé</h3>
            <span className="chat-status-dot"></span>
          </div>
          <p className="chat-subtitle">Online • ZelaBelém</p>
        </div>

        <button className="chat-close-button" onClick={onClose} aria-label="Fechar chat">
          <X size={16} />
        </button>
      </div>

      <div className="chat-body">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-bubble chat-bubble--${message.role}`}
          >
            {message.text}
          </div>
        ))}

        {loading && (
          <div className="chat-bubble chat-bubble--assistant chat-bubble--typing">
            <Loader2 size={16} className="spin" />
            <span>Processando com IA...</span>
          </div>
        )}

        {hasDraftContent && currentDraft && (
          <div className="chat-draft-card">
            <div className="chat-draft-header">
              <Sparkles size={14} className="sparkle-icon" />
              <span>Rascunho da Ocorrência</span>
            </div>
            <div className="chat-draft-details">
              {renderDraftField("Título", "title", currentDraft.title || "")}
              {renderDraftField("Categoria", "category", currentDraft.category || "")}
              {renderDraftField("Bairro", "neighborhood", currentDraft.neighborhood || "")}
              {renderDraftField("Endereço", "address", currentDraft.address || "")}
              {renderDraftField("Descrição", "description", currentDraft.description || "")}
              {renderDraftField("Urgência", "severity", currentDraft.severity || "")}
            </div>

            <div className="chat-draft-actions">
              {readyToSubmit ? (
                <button type="button" className="chat-draft-submit-btn" onClick={handlePublish}>
                  <CheckCircle2 size={14} />
                  <span>Relatar agora</span>
                </button>
              ) : (
                <div className="chat-draft-pending-label">
                  Coletando mais detalhes ({missingFields.length} restantes)...
                </div>
              )}
              <button type="button" className="chat-draft-clear-btn" onClick={handleCancel}>
                Descartar
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {micError && <div className="chat-mic-error">{micError}</div>}

      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isRecording ? 'Ouvindo...' : 'Fale sobre o problema...'}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSend()
          }}
          disabled={loading}
        />

        {speechSupported && (
          <button
            type="button"
            className={`chat-mic-button ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            disabled={loading}
            aria-label="Usar microfone"
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}

        <button
          className="chat-send-button"
          onClick={() => void handleSend()}
          aria-label="Enviar"
          disabled={loading || !input.trim()}
        >
          <Send size={16} />
        </button>
      </div>

      <div className="chat-mic-help">
        {speechSupported ? 'Você pode digitar ou usar a voz para relatar a ocorrência.' : 'Entrada por voz desabilitada.'}
      </div>
    </div>
  )
}