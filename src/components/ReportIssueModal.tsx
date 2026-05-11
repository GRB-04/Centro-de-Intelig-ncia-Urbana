import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { ImagePlus, Loader2, MapPin } from 'lucide-react'
import type { Occurrence, OccurrenceSeverity } from '../types/occurrence'
import type { AddressSuggestion } from '../services/geocoding'
import { searchAddresses } from '../services/geocoding'
import './report-issue-modal.css'

interface ReportIssueModalProps {
  onClose: () => void
  onCreate: (occurrence: Occurrence) => void
}

type CategoryOption =
  | 'Vias e Pavimentação'
  | 'Drenagem e Alagamentos'
  | 'Iluminação Pública'
  | 'Resíduos Sólidos'
  | 'Calçadas e Acessibilidade'
  | 'Abastecimento de Água'
  | 'Conservação do Patrimônio'
  | 'Arborização e Meio Ambiente'
  | 'Sinalização de Trânsito'
  | 'Outros'

const CATEGORY_OPTIONS: CategoryOption[] = [
  'Vias e Pavimentação',
  'Drenagem e Alagamentos',
  'Iluminação Pública',
  'Resíduos Sólidos',
  'Calçadas e Acessibilidade',
  'Abastecimento de Água',
  'Conservação do Patrimônio',
  'Arborização e Meio Ambiente',
  'Sinalização de Trânsito',
  'Outros',
]

const DEFAULT_CENTER: [number, number] = [-1.4558, -48.4902]

delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })

  return null
}

function MapViewportUpdater({
  position,
}: {
  position: [number, number] | null
}) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 0.8 })
    }
  }, [map, position])

  return null
}

function ReportIssueModal({ onClose, onCreate }: ReportIssueModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [category, setCategory] = useState<CategoryOption>('Vias e Pavimentação')
  const [otherCategory, setOtherCategory] = useState('')
  const [severity, setSeverity] = useState<OccurrenceSeverity>('média')
  const [anonymous, setAnonymous] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [addressError, setAddressError] = useState('')
  const debounceRef = useRef<number | null>(null)
  const suggestionsBoxRef = useRef<HTMLDivElement | null>(null)

  const resolvedCategory = useMemo(() => {
    if (category === 'Outros' && otherCategory.trim()) {
      return otherCategory.trim()
    }

    return category
  }, [category, otherCategory])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!suggestionsBoxRef.current) return
      if (!suggestionsBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    if (address.trim().length < 3) {
      setSuggestions([])
      setIsLoadingSuggestions(false)
      setAddressError('')
      return
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true)
        setAddressError('')
        const results = await searchAddresses(address)
        setSuggestions(results)
      } catch {
        setAddressError('Não foi possível buscar sugestões agora.')
        setSuggestions([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 350)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [address])

  function handlePickOnMap(lat: number, lng: number) {
    setSelectedPosition([lat, lng])
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocalização não disponível neste navegador.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSelectedPosition([
          position.coords.latitude,
          position.coords.longitude,
        ])
      },
      () => {
        alert('Não foi possível obter sua localização.')
      },
    )
  }

  function handleSelectSuggestion(suggestion: AddressSuggestion) {
    setAddress(suggestion.address)
    if (suggestion.neighborhood) {
      setNeighborhood(suggestion.neighborhood)
    }
    setSelectedPosition([suggestion.latitude, suggestion.longitude])
    setSuggestions([])
    setShowSuggestions(false)
    setAddressError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const fallbackLat = DEFAULT_CENTER[0]
    const fallbackLng = DEFAULT_CENTER[1]
    const [latitude, longitude] = selectedPosition ?? [fallbackLat, fallbackLng]

    const newOccurrence: Occurrence = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      address: address.trim(),
      neighborhood: neighborhood.trim(),
      category: resolvedCategory,
      status: 'aberta',
      severity,
      latitude,
      longitude,
      createdAt: new Date().toISOString(),
      supportCount: 0,
      anonymous,
      imageUrl: selectedFileName || undefined,
    }

    onCreate(newOccurrence)
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card--issue">
        <div className="modal-head">
          <div>
            <h2 className="modal-title">Reportar ocorrência</h2>
            <p className="modal-subtitle">
              Preencha as informações abaixo e marque o local no mapa, se quiser.
            </p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-grid issue-form-grid">
          <div className="form-field form-field--full">
            <label className="form-label">Título *</label>
            <input
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Falta de iluminação na rua"
              required
            />
          </div>

          <div className="form-field form-field--full">
            <label className="form-label">Descrição *</label>
            <textarea
              className="form-textarea form-textarea--issue"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique o problema com clareza."
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">Endereço *</label>

            <div className="address-search-box" ref={suggestionsBoxRef}>
              <div className="address-input-wrap">
                <MapPin size={16} />
                <input
                  className="form-input form-input--with-icon"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Ex.: Passagem Elvira, 191"
                  required
                />
                {isLoadingSuggestions ? <Loader2 size={16} className="spin" /> : null}
              </div>

              {showSuggestions && (suggestions.length > 0 || addressError) ? (
                <div className="address-suggestions">
                  {addressError ? (
                    <div className="address-suggestion-item address-suggestion-item--error">
                      {addressError}
                    </div>
                  ) : null}

                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      className="address-suggestion-item"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      <div className="address-suggestion-main">{suggestion.label}</div>
                      {suggestion.neighborhood ? (
                        <div className="address-suggestion-sub">{suggestion.neighborhood}</div>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className="location-link-button"
              onClick={handleUseCurrentLocation}
            >
              Usar minha localização
            </button>
          </div>

          <div className="form-field">
            <label className="form-label">Bairro *</label>
            <input
              className="form-input"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Ex.: Curió-Utinga"
              required
            />
          </div>

          <div className="form-field form-field--full">
            <label className="form-label">Mapa</label>

            <div className="map-picker-card">
              <MapContainer
                center={selectedPosition ?? DEFAULT_CENTER}
                zoom={13}
                scrollWheelZoom
                className="map-picker"
              >
                <TileLayer
                  attribution='&copy; MapTiler &copy; OpenStreetMap contributors'
                  url={`https://api.maptiler.com/maps/topo-v4/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_API_KEY}`}
                />

                <MapViewportUpdater position={selectedPosition} />
                <MapClickHandler onPick={handlePickOnMap} />

                {selectedPosition ? <Marker position={selectedPosition} /> : null}
              </MapContainer>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Categoria</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryOption)}
            >
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Urgência</label>
            <select
              className="form-select"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as OccurrenceSeverity)}
            >
              <option value="baixa">Baixa</option>
              <option value="média">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          {category === 'Outros' ? (
            <div className="form-field form-field--full">
              <label className="form-label">Explique melhor a categoria</label>
              <input
                className="form-input"
                value={otherCategory}
                onChange={(e) => setOtherCategory(e.target.value)}
                placeholder="Ex.: vazamento, risco elétrico, problema não listado..."
                required
              />
            </div>
          ) : null}

          <div className="form-field form-field--full">
            <label className="form-label">Foto (opcional)</label>

            <label className="upload-box">
              <input
                type="file"
                accept="image/*"
                className="upload-input-hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  setSelectedFileName(file?.name ?? '')
                }}
              />

              <div className="upload-box-content">
                <ImagePlus size={22} />
                <span>
                  {selectedFileName ? selectedFileName : 'Clique para selecionar foto'}
                </span>
              </div>
            </label>
          </div>

          <div className="form-field form-field--full">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
              Registrar de forma anônima
            </label>
          </div>

          <div className="modal-actions form-field--full">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancelar
            </button>

            <button type="submit" className="primary-button">
              Criar ocorrência
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReportIssueModal