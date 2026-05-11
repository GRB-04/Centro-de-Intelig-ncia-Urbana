import { Send, X } from 'lucide-react'
import { useMemo, useState } from 'react'

interface UrbanAssistantChatProps {
  onSuggestOccurrence: (text: string) => void
}

interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  text: string
}

function detectIssueIntent(text: string) {
  const normalized = text.toLowerCase()

  const keywords = [
    'buraco',
    'poste',
    'luz',
    'iluminação',
    'lixo',
    'alagamento',
    'água',
    'semáforo',
    'trânsito',
    'esgoto',
  ]

  return keywords.some((keyword) => normalized.includes(keyword))
}

function buildAssistantReply(text: string) {
  if (detectIssueIntent(text)) {
    return 'Percebi um possível problema urbano na sua mensagem. Posso te ajudar a registrar essa ocorrência.'
  }

  return 'Posso te ajudar a entender o sistema, localizar ocorrências ou iniciar um novo registro.'
}

function UrbanAssistantChat({ onSuggestOccurrence }: UrbanAssistantChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: 'Olá. Sou o assistente urbano.',
    },
  ])

  const lastAssistantMessage = useMemo(
    () => messages.filter((item) => item.role === 'assistant').at(-1),
    [messages],
  )

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
    }

    const assistantReply: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: buildAssistantReply(trimmed),
    }

    setMessages((prev) => [...prev, userMessage, assistantReply])

    if (detectIssueIntent(trimmed)) {
      onSuggestOccurrence(trimmed)
    }

    setInput('')
  }

  if (!isOpen) return null

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div>
          <h3 className="chat-title">Assistente urbano</h3>
          <p className="chat-subtitle">
            {lastAssistantMessage?.text ?? 'Pronto para ajudar'}
          </p>
        </div>

        <button className="chat-close-button" onClick={() => setIsOpen(false)} aria-label="Fechar chat">
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
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex.: Tem um poste sem luz aqui"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend()
          }}
        />

        <button className="chat-send-button" onClick={handleSend} aria-label="Enviar">
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

export default UrbanAssistantChat