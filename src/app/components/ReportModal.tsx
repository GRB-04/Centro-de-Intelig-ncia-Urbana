import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Upload,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  LocateFixed,
  Search,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { geocodeSingleAddress, reverseGeocode } from "../../services/geocoding";

// Custom blue pin marker for selection
const markerIcon = L.divIcon({
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translateY(-15px);">
      <svg width="32" height="38" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 4px rgba(0, 0, 0, 0.35));">
        <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 30 12 30C12 30 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="#1565C0"/>
        <circle cx="12" cy="12" r="5" fill="white" />
      </svg>
    </div>
  `,
  className: "custom-leaflet-marker",
  iconSize: [32, 38],
  iconAnchor: [16, 38]
});

// Component to handle map clicks in Leaflet
interface MapEventsHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

function MapEventsHandler({ onMapClick }: MapEventsHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to fly map to coordinates programmatically
interface MapFlyProps {
  center: [number, number];
  zoom: number;
}

function MapFly({ center, zoom }: MapFlyProps) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

export type ReportModalInitialData = {
  title?: string;
  category?: string;
  otherCategory?: string;
  neighborhood?: string;
  address?: string;
  description?: string;
  severity?: "critical" | "high" | "medium" | "low";
  anonymous?: boolean;
};

interface ReportModalProps {
  darkMode: boolean;
  onClose: () => void;
  onCreated?: () => void;
  initialData?: ReportModalInitialData;
}

const CATEGORIES = [
  "Abastecimento de Água",
  "Arborização e Meio Ambiente",
  "Calçadas e Acessibilidade",
  "Conservação do Patrimônio",
  "Drenagem e Alagamentos",
  "Esgoto e Saneamento",
  "Iluminação Pública",
  "Resíduos Sólidos",
  "Segurança Urbana / Espaço Público",
  "Sinalização de Trânsito",
  "Vias e Pavimentação",
  "Outros",
];

const NEIGHBORHOODS = [
  "Aeroporto",
  "Agulha",
  "Água Boa",
  "Águas Lindas",
  "Águas Negras",
  "Ariramba",
  "Aurá",
  "Baia do Sol",
  "Barreiro",
  "Batista Campos",
  "Benguí",
  "Bonfim",
  "Brasília",
  "Cabanagem",
  "Campina (Comércio)",
  "Campina de Icoaraci",
  "Canudos",
  "Carananduba",
  "Caruara",
  "Castanheira",
  "Chapéu-Virado",
  "Cidade Velha",
  "Condor",
  "Coqueiro",
  "Cremação",
  "Cruzeiro",
  "Curió-Utinga",
  "Fátima (Matinha)",
  "Farol",
  "Guamá",
  "Guanabara",
  "Itaiteua",
  "Jurunas",
  "Mangueirão",
  "Mangueiras",
  "Maracacuera",
  "Maracajá",
  "Maracangalha",
  "Marahú",
  "Marambaia",
  "Marco",
  "Miramar",
  "Montese (Terra Firme)",
  "Murubira",
  "Natal do Murubira",
  "Nazaré",
  "Paracuri",
  "Paraíso",
  "Parque Guajará",
  "Parque Verde",
  "Pedreira",
  "Ponta Grossa",
  "Porto Arthur",
  "Pratinha",
  "Praia Grande",
  "Reduto",
  "Sacramenta",
  "São Brás",
  "São Clemente",
  "São Francisco",
  "São João de Outeiro",
  "Souza",
  "Sucurijuquara",
  "Tapanã",
  "Telégrafo",
  "Tenoné",
  "Umarizal",
  "Una",
  "Universitário",
  "Val-de-Cães",
  "Vila",
];

type Severity = "critical" | "high" | "medium" | "low";

const DEFAULT_CENTER = {
  longitude: -48.4902,
  latitude: -1.4558,
};

export function ReportModal({
  darkMode,
  onClose,
  onCreated,
  initialData,
}: ReportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);

  const [saving, setSaving] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    DEFAULT_CENTER.latitude,
    DEFAULT_CENTER.longitude,
  ]);
  const [mapZoom, setMapZoom] = useState<number>(12);

  const [file, setFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    otherCategory: "",
    neighborhood: "",
    address: "",
    description: "",
    severity: "high" as Severity,
    anonymous: false,
  });

  useEffect(() => {
    if (!initialData) return;

    setFormData((prev) => ({
      ...prev,
      title: initialData.title ?? prev.title,
      category: initialData.category ?? prev.category,
      otherCategory: initialData.otherCategory ?? prev.otherCategory,
      neighborhood: initialData.neighborhood ?? prev.neighborhood,
      address: initialData.address ?? prev.address,
      description: initialData.description ?? prev.description,
      severity: initialData.severity ?? prev.severity,
      anonymous: initialData.anonymous ?? prev.anonymous,
    }));

    if (
      initialData.title ||
      initialData.category ||
      initialData.neighborhood ||
      initialData.address ||
      initialData.description
    ) {
      setStep(1);
    }
  }, [initialData]);

  const cardBg = darkMode ? "#1E1E1E" : "#FFFFFF";
  const sectionBg = darkMode ? "#2a2a2a" : "#F5F7FA";
  const borderColor = darkMode ? "#333" : "#E8ECF0";
  const textColor = darkMode ? "#FFFFFF" : "#1D1D1F";
  const mutedColor = darkMode ? "#888" : "#9CA3AF";

  const tileUrl = darkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isStep1Valid =
    !!formData.title &&
    !!formData.category &&
    !!formData.neighborhood &&
    (formData.category !== "Outros" || !!formData.otherCategory.trim());

  const isStep2Valid = !!formData.address;
  const canSubmit = isStep1Valid && isStep2Valid;

  const priorityText = useMemo(() => {
    if (formData.severity === "critical") return "85–95";
    if (formData.severity === "high") return "65–80";
    if (formData.severity === "medium") return "40–60";
    return "20–35";
  }, [formData.severity]);

  async function fillAddressFromCoords(lat: number, lng: number) {
    const result = await reverseGeocode(lat, lng);
    if (result) {
      handleChange("address", result.address);
      if (result.neighborhood) {
        handleChange("neighborhood", result.neighborhood);
      }
    }
  }

  function handlePickOnMap(lat: number, lng: number) {
    setCoords({ lat, lng });
    fillAddressFromCoords(lat, lng);
  }

  async function handleLocateOnMap() {
    setError(null);

    if (!formData.address.trim() || !formData.neighborhood.trim()) {
      setError("Informe endereço e bairro antes de localizar no mapa.");
      return;
    }

    try {
      setSearchingLocation(true);

      const result = await geocodeSingleAddress(
        `${formData.address.trim()}, ${formData.neighborhood.trim()}`
      );

      if (!result) {
        setError(
          "Não foi possível localizar esse endereço. Você pode continuar e marcar manualmente clicando no mapa."
        );
        return;
      }

      const nextCoords = { lat: result.latitude, lng: result.longitude };
      setCoords(nextCoords);
      setMapCenter([result.latitude, result.longitude]);
      setMapZoom(16);
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível localizar no mapa.");
    } finally {
      setSearchingLocation(false);
    }
  }

  async function getMyLocation() {
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocalização não suportada no navegador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCoords(next);
        setMapCenter([next.lat, next.lng]);
        setMapZoom(16);
      },
      () => {
        setError(
          "Não foi possível obter sua localização. Permita o acesso e tente de novo."
        );
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  async function uploadPhotoIfAny(userId: string) {
    if (!file) return null;

    setUploading(true);
    try {
      const bucket = "issue-photos";
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (upErr) {
        console.warn(upErr);
        return null;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data?.publicUrl ?? null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    setError(null);

    if (!canSubmit) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    try {
      setSaving(true);

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        setError("Você precisa estar logado para registrar.");
        return;
      }

      const photo_url = await uploadPhotoIfAny(user.id);

      const finalDescription =
        formData.category === "Outros" && formData.otherCategory.trim()
          ? `Categoria informada pelo usuário: ${formData.otherCategory.trim()}\n\n${
              formData.description || ""
            }`.trim()
          : formData.description || null;

      const payload = {
        user_id: user.id,
        title: formData.title,
        description: finalDescription,
        category: formData.category,
        neighborhood: formData.neighborhood || null,
        address: formData.address || null,
        severity: formData.severity,
        status: "aberto",
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        photo_url,
        anonymous: formData.anonymous,
      };

      const { error: insErr } = await supabase.from("issues").insert(payload);

      if (insErr) throw insErr;

      setSubmitted(true);
      onCreated?.();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível enviar a ocorrência.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative z-[2001] w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          backgroundColor: cardBg,
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{
            borderBottom: `1px solid ${borderColor}`,
            backgroundColor: darkMode ? "#1a1a1a" : "#FAFBFC",
          }}
        >
          <div>
            <h2
              className="text-base"
              style={{ color: textColor, fontWeight: 700 }}
            >
              Registrar Ocorrência Urbana
            </h2>
            <p className="text-xs mt-0.5" style={{ color: mutedColor }}>
              {submitted
                ? "Enviado com sucesso"
                : `Passo ${step} de 3 — ${
                    step === 1
                      ? "Identificação"
                      : step === 2
                      ? "Localização"
                      : "Evidências"
                  }`}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: sectionBg,
              border: `1px solid ${borderColor}`,
            }}
          >
            <X size={14} color={mutedColor} />
          </button>
        </div>

        {!submitted && (
          <div className="px-6 pt-4 shrink-0">
            <div className="flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className="flex-1 h-1.5 rounded-full transition-all"
                  style={{
                    backgroundColor:
                      s <= step
                        ? "#1565C0"
                        : darkMode
                        ? "#2a2a2a"
                        : "#EEF1F5",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: darkMode ? "#1a2a1a" : "#F0FAF0" }}
              >
                <CheckCircle2 size={32} color="#2E7D32" />
              </div>

              <div>
                <h3
                  className="text-lg"
                  style={{ color: textColor, fontWeight: 700 }}
                >
                  Ocorrência Registrada!
                </h3>
                <p className="text-sm mt-1" style={{ color: mutedColor }}>
                  Agora ela aparece no painel em tempo real.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full h-10 rounded-xl text-sm"
                style={{
                  backgroundColor: "#1565C0",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                Fechar
              </button>
            </div>
          ) : step === 1 ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: mutedColor }}>
                  Título da Ocorrência *
                </label>
                <input
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Ex: Buraco na calçada, poste apagado..."
                  className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                  style={{
                    backgroundColor: sectionBg,
                    border: `1px solid ${borderColor}`,
                    color: textColor,
                  }}
                />
              </div>

              <div>
                <label className="text-xs mb-1.5 block" style={{ color: mutedColor }}>
                  Categoria *
                </label>
                <div
                  className="relative"
                  style={{
                    border: `1px solid ${borderColor}`,
                    borderRadius: "12px",
                  }}
                >
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                    style={{
                      backgroundColor: sectionBg,
                      color: formData.category ? textColor : mutedColor,
                    }}
                  >
                    <option value="">Selecione uma categoria</option>
                    {CATEGORIES.map((c) => (
                      <option
                        key={c}
                        value={c}
                        style={{ backgroundColor: cardBg }}
                      >
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    color={mutedColor}
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                </div>
              </div>

              {formData.category === "Outros" && (
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: mutedColor }}>
                    Qual é o problema? *
                  </label>
                  <input
                    value={formData.otherCategory}
                    onChange={(e) => handleChange("otherCategory", e.target.value)}
                    placeholder="Ex: semáforo quebrado, praça abandonada, risco elétrico..."
                    className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                    style={{
                      backgroundColor: sectionBg,
                      border: `1px solid ${borderColor}`,
                      color: textColor,
                    }}
                  />
                </div>
              )}

              <div>
                <label className="text-xs mb-1.5 block" style={{ color: mutedColor }}>
                  Nível de Urgência
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { val: "critical", label: "Crítico", color: "#E53935" },
                    { val: "high", label: "Alto", color: "#FF9800" },
                    { val: "medium", label: "Médio", color: "#FFC107" },
                    { val: "low", label: "Baixo", color: "#4CAF50" },
                  ] as const).map(({ val, label, color }) => (
                    <button
                      key={val}
                      onClick={() => handleChange("severity", val)}
                      className="h-9 rounded-xl text-xs transition-all"
                      style={{
                        backgroundColor:
                          formData.severity === val ? color + "22" : sectionBg,
                        border: `1.5px solid ${
                          formData.severity === val ? color : borderColor
                        }`,
                        color: formData.severity === val ? color : mutedColor,
                        fontWeight: formData.severity === val ? 700 : 400,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs mb-1.5 block" style={{ color: mutedColor }}>
                  Bairro *
                </label>
                <div
                  className="relative"
                  style={{
                    border: `1px solid ${borderColor}`,
                    borderRadius: "12px",
                  }}
                >
                  <select
                    value={formData.neighborhood}
                    onChange={(e) => handleChange("neighborhood", e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                    style={{
                      backgroundColor: sectionBg,
                      color: formData.neighborhood ? textColor : mutedColor,
                    }}
                  >
                    <option value="">Selecione um bairro</option>
                    {NEIGHBORHOODS.map((n) => (
                      <option
                        key={n}
                        value={n}
                        style={{ backgroundColor: cardBg }}
                      >
                        {n}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    color={mutedColor}
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                </div>
              </div>
            </div>
          ) : step === 2 ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: mutedColor }}>
                  Endereço ou ponto de referência *
                </label>
                <div className="relative">
                  <MapPin
                    size={14}
                    color={mutedColor}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                  />
                  <input
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Rua, número, referência..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none"
                    style={{
                      backgroundColor: sectionBg,
                      border: `1px solid ${borderColor}`,
                      color: textColor,
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleLocateOnMap}
                  className="flex-1 h-10 px-3 rounded-xl text-sm flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "#1565C0",
                    color: "#fff",
                    fontWeight: 600,
                    opacity: searchingLocation ? 0.8 : 1,
                  }}
                  disabled={searchingLocation}
                >
                  <Search size={15} />
                  {searchingLocation ? "Localizando..." : "Localizar no mapa"}
                </button>

                <button
                  onClick={getMyLocation}
                  className="h-10 px-3 rounded-xl text-sm flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: darkMode ? "#2a2a2a" : "#E8ECF0",
                    color: textColor,
                    fontWeight: 600,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <LocateFixed size={15} />
                  GPS atual
                </button>
              </div>

              <div>
                <label className="text-xs mb-1.5 block" style={{ color: mutedColor }}>
                  Localização no mapa (opcional, mas recomendada)
                </label>

                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${borderColor}` }}
                >
                  <div className="h-[280px] w-full relative">
                    <style>{`
                      .leaflet-container {
                        width: 100%;
                        height: 100%;
                        background: ${darkMode ? "#1a1a1e" : "#f5f7fa"};
                      }
                      .leaflet-control-zoom {
                        border: none !important;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                      }
                      .leaflet-control-zoom-in, .leaflet-control-zoom-out {
                        background-color: ${darkMode ? "#2a2a2a !important" : "#ffffff !important"};
                        color: ${darkMode ? "#ffffff !important" : "#007aff !important"};
                        border: 1px solid ${darkMode ? "#3e3e3e" : "#e5e7eb"} !important;
                      }
                    `}</style>
                    <MapContainer
                      center={mapCenter}
                      zoom={mapZoom}
                      zoomControl={true}
                      style={{ width: "100%", height: "100%" }}
                    >
                      <MapFly center={mapCenter} zoom={mapZoom} />
                      <MapEventsHandler onMapClick={handlePickOnMap} />
                      <TileLayer url={tileUrl} attribution={attribution} />
                      {coords && (
                        <Marker position={[coords.lat, coords.lng]} icon={markerIcon} />
                      )}
                    </MapContainer>
                  </div>
                </div>

                <p className="text-[11px] mt-2" style={{ color: mutedColor }}>
                  Clique no mapa para ajustar manualmente o ponto. Se o endereço cair na rua errada, basta clicar no local correto.
                </p>

                <div
                  className="mt-2 rounded-xl p-3"
                  style={{
                    backgroundColor: sectionBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <span className="text-xs" style={{ color: mutedColor }}>
                    Coordenadas selecionadas
                  </span>
                  <div
                    className="text-xs mt-1"
                    style={{ color: textColor, fontWeight: 600 }}
                  >
                    {coords
                      ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                      : "Nenhuma coordenada definida"}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs mb-1.5 block" style={{ color: mutedColor }}>
                  Descrição detalhada
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Descreva o problema com detalhes..."
                  rows={4}
                  className="w-full p-3 rounded-xl text-sm outline-none resize-none"
                  style={{
                    backgroundColor: sectionBg,
                    border: `1px solid ${borderColor}`,
                    color: textColor,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: mutedColor }}>
                  Fotografias / evidências (opcional)
                </label>

                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full object-cover"
                      style={{ maxHeight: 200 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPhotoPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff" }}
                    >
                      <X size={14} />
                    </button>
                    <div
                      className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs"
                      style={{ backgroundColor: "rgba(0,0,0,0.45)", color: "#fff" }}
                    >
                      {file?.name} &bull; {file ? (file.size / 1024).toFixed(0) + " KB" : ""}
                    </div>
                  </div>
                ) : (
                  <label
                    className="w-full h-36 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: sectionBg,
                      border: `2px dashed ${borderColor}`,
                    }}
                  >
                    <Upload size={20} color={mutedColor} />
                    <p className="text-xs" style={{ color: mutedColor }}>
                      Clique para enviar uma foto
                    </p>
                    <p style={{ fontSize: "10px", color: mutedColor }}>
                      JPG/PNG até 10MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const selected = e.target.files?.[0] ?? null;
                        setFile(selected);
                        if (selected) {
                          const url = URL.createObjectURL(selected);
                          setPhotoPreview(url);
                        } else {
                          setPhotoPreview(null);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: sectionBg,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} color="#E53935" />
                  <span className="text-xs" style={{ color: textColor, fontWeight: 600 }}>
                    Pontuação de prioridade estimada
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className="text-2xl"
                    style={{
                      color:
                        formData.severity === "critical"
                          ? "#E53935"
                          : formData.severity === "high"
                          ? "#FF9800"
                          : formData.severity === "medium"
                          ? "#FFC107"
                          : "#4CAF50",
                      fontWeight: 800,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {priorityText}
                  </span>

                  <div className="flex-1">
                    <div
                      className="w-full h-2 rounded-full"
                      style={{
                        backgroundColor: darkMode ? "#2a2a2a" : "#EEF1F5",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width:
                            formData.severity === "critical"
                              ? "90%"
                              : formData.severity === "high"
                              ? "72%"
                              : formData.severity === "medium"
                              ? "50%"
                              : "30%",
                          backgroundColor:
                            formData.severity === "critical"
                              ? "#E53935"
                              : formData.severity === "high"
                              ? "#FF9800"
                              : formData.severity === "medium"
                              ? "#FFC107"
                              : "#4CAF50",
                        }}
                      />
                    </div>

                    <p style={{ fontSize: "9px", color: mutedColor, marginTop: "4px" }}>
                      Baseado em urgência + categoria + localização
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: textColor, fontWeight: 500 }}>
                    Relato anônimo
                  </p>
                  <p className="text-xs" style={{ color: mutedColor }}>
                    Seus dados não serão exibidos publicamente
                  </p>
                </div>

                <button
                  onClick={() => handleChange("anonymous", !formData.anonymous)}
                  className="w-11 h-6 rounded-full transition-colors relative"
                  style={{
                    backgroundColor: formData.anonymous
                      ? "#1565C0"
                      : darkMode
                      ? "#3a3a3a"
                      : "#D1D5DB",
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full absolute top-1 transition-transform"
                    style={{
                      backgroundColor: "#fff",
                      left: formData.anonymous
                        ? "calc(100% - 20px)"
                        : "4px",
                    }}
                  />
                </button>
              </div>

              {error && (
                <div
                  className="text-xs p-3 rounded-xl"
                  style={{
                    backgroundColor: "rgba(239,68,68,.12)",
                    border: "1px solid rgba(239,68,68,.25)",
                    color: "#FECACA",
                  }}
                >
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {!submitted && (
          <div
            className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderTop: `1px solid ${borderColor}` }}
          >
            <button
              onClick={() => step > 1 && setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="h-10 px-4 rounded-xl text-sm"
              style={{
                backgroundColor: step > 1 ? sectionBg : "transparent",
                border: `1px solid ${step > 1 ? borderColor : "transparent"}`,
                color: step > 1 ? textColor : "transparent",
                cursor: step > 1 ? "pointer" : "default",
              }}
              disabled={step === 1}
            >
              Voltar
            </button>

            {step < 3 ? (
              <button
                onClick={() => {
                  setError(null);

                  if (step === 1 && !isStep1Valid) {
                    return setError(
                      formData.category === "Outros"
                        ? "Preencha título, categoria, bairro e explique o tipo do problema em 'Outros'."
                        : "Preencha título, categoria e bairro."
                    );
                  }

                  if (step === 2 && !isStep2Valid) {
                    return setError("Preencha endereço ou ponto de referência.");
                  }

                  setStep((s) => (s + 1) as 1 | 2 | 3);
                }}
                className="h-10 px-6 rounded-xl text-sm transition-all"
                style={{
                  backgroundColor:
                    step === 1
                      ? isStep1Valid
                        ? "#1565C0"
                        : darkMode
                        ? "#2a2a2a"
                        : "#E8ECF0"
                      : "#1565C0",
                  color:
                    step === 1
                      ? isStep1Valid
                        ? "#fff"
                        : mutedColor
                      : "#fff",
                  fontWeight: 600,
                  cursor:
                    step === 1
                      ? isStep1Valid
                        ? "pointer"
                        : "not-allowed"
                      : "pointer",
                }}
              >
                Continuar
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="h-10 px-6 rounded-xl text-sm flex items-center gap-2"
                style={{
                  backgroundColor: saving || uploading
                    ? darkMode
                      ? "#2a2a2a"
                      : "#E8ECF0"
                    : "#2E7D32",
                  color: saving || uploading ? mutedColor : "#fff",
                  fontWeight: 600,
                  cursor: saving || uploading ? "not-allowed" : "pointer",
                }}
                disabled={saving || uploading}
              >
                {uploading ? "Enviando foto…" : saving ? "Registrando…" : "Enviar Ocorrência"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}