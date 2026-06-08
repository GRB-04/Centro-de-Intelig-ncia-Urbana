import { useEffect, useMemo, useState } from 'react'
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
import { supabase, isSupabaseConfigured } from '../lib/supabase'

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

interface DashboardProps {
  session?: any
}

function Dashboard({ session }: DashboardProps) {
  const currentUserId = session?.user?.id ?? null
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [occurrences, setOccurrences] = useState<Occurrence[]>([])
  const [votedByMe, setVotedByMe] = useState<Set<string>>(new Set())
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [prefilledData, setPrefilledData] = useState<any>(null)

  const currentUserName = useMemo(() => {
    if (!session?.user) return 'Convidado'
    const metadata = session.user.user_metadata ?? {}
    const fullName =
      metadata.full_name ||
      metadata.name ||
      metadata.nome ||
      session.user.email?.split('@')[0] ||
      'Gabriel'
    return String(fullName).trim().split(' ')[0]
  }, [session])

  async function handleLogout() {
    if (isSupabaseConfigured) {
      await supabase!.auth.signOut()
    } else {
      window.location.reload()
    }
  }

  async function loadData() {
    if (isSupabaseConfigured) {
      try {
        const { data: dbIssues, error: issuesError } = await supabase!
          .from('issues')
          .select('*')
          .order('created_at', { ascending: false })

        if (issuesError) throw issuesError

        const { data: dbVoteCounts, error: votesError } = await supabase!
          .from('issue_vote_counts')
          .select('issue_id, count')

        const votesMap: Record<string, number> = {}
        if (!votesError && dbVoteCounts) {
          dbVoteCounts.forEach((row) => {
            votesMap[String(row.issue_id)] = Number(row.count ?? 0)
          })
        }

        const votesSet = new Set<string>()
        if (currentUserId) {
          const { data: dbUserVotes } = await supabase!
            .from('issue_votes')
            .select('issue_id')
            .eq('user_id', currentUserId)

          if (dbUserVotes) {
            dbUserVotes.forEach((row) => {
              votesSet.add(String(row.issue_id))
            })
          }
        }

        const mapped: Occurrence[] = (dbIssues ?? []).map((db: any) => {
          let statusStr: 'aberta' | 'em análise' | 'resolvida' = 'aberta'
          const dbStatus = String(db.status ?? '').toLowerCase().trim()
          if (dbStatus === 'resolvido' || dbStatus === 'resolvida') statusStr = 'resolvida'
          else if (dbStatus === 'em_analise' || dbStatus === 'em análise' || dbStatus === 'analise') statusStr = 'em análise'

          let sevStr: 'baixa' | 'média' | 'alta' = 'baixa'
          const dbSev = String(db.severity ?? '').toLowerCase().trim()
          if (dbSev === 'critical' || dbSev === 'high' || dbSev === 'alta') sevStr = 'alta'
          else if (dbSev === 'medium' || dbSev === 'média') sevStr = 'média'

          return {
            id: String(db.id),
            title: db.title,
            description: db.description ?? '',
            category: db.category,
            status: statusStr,
            severity: sevStr,
            neighborhood: db.neighborhood ?? 'Belém',
            address: db.address ?? '',
            latitude: Number(db.lat),
            longitude: Number(db.lng),
            createdAt: db.created_at,
            supportCount: votesMap[String(db.id)] ?? 0,
            anonymous: db.anonymous ?? false,
          }
        })

        setOccurrences(mapped)
        setVotedByMe(votesSet)
      } catch (err) {
        console.error('Erro ao carregar dados do Supabase:', err)
        loadMockData()
      }
    } else {
      loadMockData()
    }
  }

  function loadMockData() {
    const localVotes = localStorage.getItem('zelabelem_votes')
    const votesSet = localVotes ? new Set<string>(JSON.parse(localVotes)) : new Set<string>()

    const localCounts = localStorage.getItem('zelabelem_vote_counts')
    const countsMap = localCounts ? JSON.parse(localCounts) : {}

    const loaded = mockOccurrences.map((item) => {
      const added = votesSet.has(item.id) ? 1 : 0
      const baseCount = countsMap[item.id] !== undefined ? countsMap[item.id] : item.supportCount
      return {
        ...item,
        supportCount: baseCount + added,
      }
    })

    setOccurrences(loaded)
    setVotedByMe(votesSet)
  }

  useEffect(() => {
    loadData()
  }, [currentUserId])

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

  async function handleSupport(id: string) {
    const isSupported = votedByMe.has(id)
    const shouldVote = !isSupported

    setOccurrences((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, supportCount: item.supportCount + (shouldVote ? 1 : -1) } : item,
      ),
    )

    setVotedByMe((prev) => {
      const next = new Set(prev)
      if (shouldVote) next.add(id)
      else next.delete(id)
      return next
    })

    if (isSupabaseConfigured && currentUserId) {
      try {
        if (shouldVote) {
          const { error } = await supabase!
            .from('issue_votes')
            .insert({ issue_id: id, user_id: currentUserId })

          if (error && error.code !== '23505') throw error
        } else {
          const { error } = await supabase!
            .from('issue_votes')
            .delete()
            .eq('issue_id', id)
            .eq('user_id', currentUserId)

          if (error) throw error
        }
      } catch (err) {
        console.error('Erro ao salvar voto no Supabase:', err)
        loadData()
      }
    } else {
      const localVotes = localStorage.getItem('zelabelem_votes')
      const votesSet = localVotes ? new Set<string>(JSON.parse(localVotes)) : new Set<string>()
      if (shouldVote) votesSet.add(id)
      else votesSet.delete(id)
      localStorage.setItem('zelabelem_votes', JSON.stringify(Array.from(votesSet)))

      const localCounts = localStorage.getItem('zelabelem_vote_counts')
      const countsMap = localCounts ? JSON.parse(localCounts) : {}
      const target = occurrences.find((x) => x.id === id)
      if (target) {
        countsMap[id] = target.supportCount + (shouldVote ? 1 : -1) - (shouldVote ? 1 : 0)
        localStorage.setItem('zelabelem_vote_counts', JSON.stringify(countsMap))
      }
    }
  }

  async function handleCreateOccurrence(newOccurrence: Occurrence) {
    setOccurrences((prev) => [newOccurrence, ...prev])

    if (isSupabaseConfigured && currentUserId) {
      try {
        const dbStatus = 'aberto'
        let dbSeverity: 'critical' | 'high' | 'medium' | 'low' = 'medium'
        if (newOccurrence.severity === 'alta') dbSeverity = 'high'
        else if (newOccurrence.severity === 'baixa') dbSeverity = 'low'

        const payload = {
          title: newOccurrence.title,
          description: newOccurrence.description || null,
          address: newOccurrence.address || null,
          neighborhood: newOccurrence.neighborhood || null,
          category: newOccurrence.category,
          status: dbStatus,
          severity: dbSeverity,
          lat: newOccurrence.latitude,
          lng: newOccurrence.longitude,
          user_id: currentUserId,
          photo_url: null,
        }

        const { error } = await supabase!.from('issues').insert(payload)
        if (error) throw error
        await loadData()
      } catch (err) {
        console.error('Erro ao criar ocorrência no Supabase:', err)
        alert('Ocorrência criada localmente, mas houve um erro ao enviar para o banco de dados.')
      }
    }
  }

  function handleStartReport(data: any) {
    setPrefilledData(data)
    setIsChatOpen(false)
    setIsModalOpen(true)
  }

  return (
    <div className={`dashboard ${theme}`}>
      <TopBar
        search={search}
        onSearchChange={setSearch}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        userName={currentUserName}
        onLogout={handleLogout}
      />

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

            <OccurrenceList
              occurrences={filteredOccurrences}
              onSupport={handleSupport}
              votedByMe={votedByMe}
            />
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Mapa urbano</h2>
                <p className="panel-subtitle">Belém em tempo quase real</p>
              </div>
            </div>

            <div className="map-panel-body">
              <OccurrenceMap occurrences={filteredOccurrences} theme={theme} />
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
        <UrbanAssistantChat
          onClose={() => setIsChatOpen(false)}
          onStartReport={handleStartReport}
          currentUserName={session?.user?.email?.split('@')[0] || 'Usuário'}
        />
      ) : null}

      {isModalOpen ? (
        <ReportIssueModal
          onClose={() => {
            setIsModalOpen(false)
            setPrefilledData(null)
          }}
          onCreate={handleCreateOccurrence}
          initialData={prefilledData}
          theme={theme}
        />
      ) : null}
    </div>
  )
}

export default Dashboard