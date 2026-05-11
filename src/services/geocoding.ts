export interface AddressSuggestion {
  id: string
  label: string
  address: string
  neighborhood: string
  latitude: number
  longitude: number
}

interface MapTilerContextItem {
  id?: string
  text?: string
}

interface MapTilerFeature {
  id?: string
  place_name?: string
  text?: string
  center?: [number, number]
  properties?: {
    neighbourhood?: string
    municipality?: string
    county?: string
    region?: string
  }
  context?: MapTilerContextItem[]
}

interface MapTilerResponse {
  features?: MapTilerFeature[]
}

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY

// Oeste, sul, leste, norte
const BELEM_BBOX = [-48.75, -1.60, -48.30, -1.20]
const BELEM_PROXIMITY = '-48.4902,-1.4558'

function extractNeighborhood(feature: MapTilerFeature) {
  const fromProperties =
    feature.properties?.neighbourhood ||
    feature.properties?.municipality ||
    feature.properties?.county ||
    feature.properties?.region

  if (fromProperties) return fromProperties

  const context = feature.context ?? []
  const neighborhoodContext =
    context.find((item) => item.id?.includes('neighbourhood')) ||
    context.find((item) => item.id?.includes('suburb')) ||
    context.find((item) => item.id?.includes('district')) ||
    context.find((item) => item.id?.includes('locality')) ||
    context.find((item) => item.id?.includes('place')) ||
    context.find((item) => item.id?.includes('municipality')) ||
    context.find((item) => item.id?.includes('county'))

  return neighborhoodContext?.text ?? ''
}

function normalizeLabel(feature: MapTilerFeature) {
  return feature.place_name ?? feature.text ?? 'Endereço encontrado'
}

function mapFeatures(features: MapTilerFeature[]): AddressSuggestion[] {
  return features
    .filter((feature) => Array.isArray(feature.center) && feature.center.length === 2)
    .map((feature, index) => {
      const [longitude, latitude] = feature.center as [number, number]

      return {
        id: feature.id ?? `${normalizeLabel(feature)}-${index}`,
        label: normalizeLabel(feature),
        address: normalizeLabel(feature),
        neighborhood: extractNeighborhood(feature),
        latitude,
        longitude,
      }
    })
}

async function fetchSuggestions(url: string): Promise<AddressSuggestion[]> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Falha ao buscar sugestões de endereço.')
  }

  const data = (await response.json()) as MapTilerResponse
  return mapFeatures(data.features ?? [])
}

function buildQueryVariants(rawQuery: string) {
  const trimmed = rawQuery.trim()
  const lower = trimmed.toLowerCase()

  const variants = new Set<string>()

  variants.add(trimmed)

  if (!lower.includes('belém')) {
    variants.add(`${trimmed}, Belém, Pará`)
    variants.add(`${trimmed}, Belém`)
  }

  if (!lower.includes('pará')) {
    variants.add(`${trimmed}, Pará`)
  }

  return [...variants]
}

function buildUrl(
  query: string,
  options?: {
    exact?: boolean
    broad?: boolean
  },
) {
  const params = new URLSearchParams({
    key: MAPTILER_API_KEY,
    language: 'pt',
    country: 'br',
    proximity: BELEM_PROXIMITY,
    bbox: BELEM_BBOX.join(','),
  })

  if (options?.exact) {
    params.set('limit', '10')
    params.set('types', 'address,street')
    params.set('autocomplete', 'false')
    params.set('fuzzyMatch', 'false')
  } else if (options?.broad) {
    params.set('limit', '8')
    params.set('types', 'address,street,place,locality')
    params.set('autocomplete', 'true')
    params.set('fuzzyMatch', 'true')
  } else {
    params.set('limit', '6')
    params.set('types', 'address,street')
    params.set('autocomplete', 'true')
    params.set('fuzzyMatch', 'true')
  }

  return `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?${params.toString()}`
}

function dedupeSuggestions(items: AddressSuggestion[]) {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = `${item.label}|${item.latitude}|${item.longitude}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  const trimmed = query.trim()

  if (!trimmed || trimmed.length < 3) {
    return []
  }

  if (!MAPTILER_API_KEY) {
    console.error('VITE_MAPTILER_API_KEY não foi definida.')
    return []
  }

  const hasNumber = /\d/.test(trimmed)
  const variants = buildQueryVariants(trimmed)

  if (hasNumber) {
    const exactBuckets = await Promise.all(
      variants.map((variant) => fetchSuggestions(buildUrl(variant, { exact: true }))),
    )

    const exactResults = dedupeSuggestions(exactBuckets.flat())

    if (exactResults.length > 0) {
      return exactResults
    }
  }

  const focusedBuckets = await Promise.all(
    variants.map((variant) => fetchSuggestions(buildUrl(variant))),
  )

  const focusedResults = dedupeSuggestions(focusedBuckets.flat())

  if (focusedResults.length > 0) {
    return focusedResults
  }

  const broadBuckets = await Promise.all(
    variants.map((variant) => fetchSuggestions(buildUrl(variant, { broad: true }))),
  )

  return dedupeSuggestions(broadBuckets.flat())
}

export async function geocodeSingleAddress(query: string): Promise<AddressSuggestion | null> {
  const results = await searchAddresses(query)
  return results.length > 0 ? results[0] : null
}