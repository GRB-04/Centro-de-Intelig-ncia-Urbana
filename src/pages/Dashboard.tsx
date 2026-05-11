import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Clock3,
  MapPinned,
  MessageCircle,
  Plus,
  ShieldAlert,
} from 'lucide-react'
import TopBar from '../components/TopBar'
import MetricCard from '../components/MetricCard'
import OccurrenceList from '../components/OccurrenceList'
import OccurrenceMap from '../components/OccurrenceMap'
import ReportIssueModal from '../components/ReportIssueModal'
import UrbanAssistantChat from '../components/UrbanAssistantChat'
import { mockOccurrences } from '../data/mockOccurrences'
import type { Occurrence } from '../types/occurrence'

function getMostFrequentCategory(occurrences: Occurrence[]) {
  const counter = new Map<string, number>()

  occurrences.forEach((item) => {
    counter.set(item.category, (counter.get(item.category) ?? 0) + 1)
  })

  return [...counter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
}

function getTopNeighborhood(occurrences: Occurrence[]) {
  const counter = new Map<string, number>()

  occurrences.forEach((item) => {
    counter.set(item.neighborhood, (counter.get(item.neighborhood) ?? 0) + 1)
  })

  return [...counter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
}

function getAverageResolutionDays(occurrences: Occurrence[]) {
  const resolved = occurrences.filter((item) => item.status === 'resolvida')
  if (resolved.length === 0) return 0

  const totalDays = resolved.reduce((sum, item) => {
    const created = new Date(item.createdAt)
    const resolvedDate = new Date()
    const diff = Math.max(
      1,
      Math.floor((resolvedDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)),
    )
    return sum + diff
  }, 0)

  return Math.round(totalDays / resolved.length)
}

function Dashboard() {
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [occurrences, setOccurrences] = useState<Occurrence[]>(mockOccurrences)

  const filteredOccurrences = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return occurrences

    return occurrences.filter((item) => {
      const searchable = [
        item.title,
        item.description,
        item.address,
        item.neighborhood,
        item.category,
        item.status,
        item.severity,
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(term)
    })
  }, [occurrences, search])

  const metrics = useMemo(() => {
    const active = occurrences.filter((item) => item.status !== 'resolvida').length
    const resolvedThisMonth = occurrences.filter((item) => item.status === 'resolvida').length
    const avgDays = getAverageResolutionDays(occurrences)
    const topNeighborhood = getTopNeighborhood(occurrences)
    const topCategory = getMostFrequentCategory(occurrences)

    return {
      active,
      resolvedThisMonth,
      avgDays,
      topNeighborhood,
      topCategory,
    }
  }, [occurrences])

  function handleSupport(id: string) {
    setOccurrences((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, supportCount: item.supportCount + 1 } : item,
      ),
    )
  }

  function handleCreateOccurrence(newOccurrence: Occurrence) {
    setOccurrences((prev) => [newOccurrence, ...prev])
  }

  function handleSuggestOccurrence(_text: string) {
    setIsChatOpen(true)
    setIsModalOpen(true)
  }

  return (
    <div className="dashboard">
      <TopBar search={search} onSearchChange={setSearch} />

      <main className="page-shell">
        <div className="metrics-grid">
          <MetricCard
            title="Ocorrências ativas"
            value={metrics.active}
            subtitle="Ainda não resolvidas"
            icon={<Activity size={18} />}
          />
          <MetricCard
            title="Resolvidas no mês"
            value={metrics.resolvedThisMonth}
            subtitle="Acompanhamento mensal"
            icon={<ShieldAlert size={18} />}
          />
          <MetricCard
            title="Tempo médio"
            value={`${metrics.avgDays} dias`}
            subtitle="Estimativa de resolução"
            icon={<Clock3 size={18} />}
          />
          <MetricCard
            title="Bairro com mais ocorrências"
            value={metrics.topNeighborhood}
            subtitle="Maior concentração"
            icon={<MapPinned size={18} />}
          />
          <MetricCard
            title="Categoria mais frequente"
            value={metrics.topCategory}
            subtitle="Problema dominante"
            icon={<AlertTriangle size={18} />}
          />
        </div>

        <div className="main-grid">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Ocorrências</h2>
                <p className="panel-subtitle">
                  {filteredOccurrences.length} resultado(s) exibido(s)
                </p>
              </div>
            </div>

            <OccurrenceList occurrences={filteredOccurrences} onSupport={handleSupport} />
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Mapa urbano</h2>
                <p className="panel-subtitle">Belém em tempo quase real</p>
              </div>
            </div>

            <div className="map-panel-body">
              <OccurrenceMap occurrences={filteredOccurrences} />
            </div>
          </section>
        </div>
      </main>

      <div className="floating-actions">
        <button
          type="button"
          className="chat-fab"
          onClick={() => setIsChatOpen((prev) => !prev)}
          aria-label="Abrir chat"
        >
          <MessageCircle size={18} />
        </button>

        <button
          type="button"
          className="floating-button"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} />
          Reportar ocorrência
        </button>
      </div>

      {isChatOpen ? (
        <UrbanAssistantChat onSuggestOccurrence={handleSuggestOccurrence} />
      ) : null}

      {isModalOpen ? (
        <ReportIssueModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateOccurrence}
        />
      ) : null}
    </div>
  )
}

export default Dashboard