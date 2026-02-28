import { useState } from "react";
import { X, Upload, MapPin, AlertTriangle, CheckCircle2, ChevronDown } from "lucide-react";

interface ReportModalProps {
  darkMode: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  "Vias e Pavimentação",
  "Drenagem e Alagamentos",
  "Iluminação Pública",
  "Resíduos Sólidos",
  "Calçadas e Acessibilidade",
  "Abastecimento de Água",
  "Conservação do Patrimônio",
  "Arborização e Meio Ambiente",
  "Sinalização de Trânsito",
  "Outros",
];

const NEIGHBORHOODS = [
  "Marco", "Batista Campos", "Guamá", "Sacramenta", "Nazaré",
  "Cidade Velha", "Comércio", "Bengui", "Pedreira", "Umarizal",
  "Jurunas", "Reduto", "Fátima", "Cremação", "Icoaraci",
];

export function ReportModal({ darkMode, onClose }: ReportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    neighborhood: "",
    address: "",
    description: "",
    severity: "high" as "critical" | "high" | "medium" | "low",
    anonymous: false,
  });

  const cardBg = darkMode ? "#1E1E1E" : "#FFFFFF";
  const sectionBg = darkMode ? "#2a2a2a" : "#F5F7FA";
  const borderColor = darkMode ? "#333" : "#E8ECF0";
  const textColor = darkMode ? "#FFFFFF" : "#1D1D1F";
  const mutedColor = darkMode ? "#888" : "#9CA3AF";

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const isStep1Valid = formData.title && formData.category && formData.neighborhood;
  const isStep2Valid = formData.address;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          backgroundColor: cardBg,
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{
            borderBottom: `1px solid ${borderColor}`,
            backgroundColor: darkMode ? "#1a1a1a" : "#FAFBFC",
          }}
        >
          <div>
            <h2 className="text-base" style={{ color: textColor, fontWeight: 700 }}>
              Registrar Ocorrência Urbana
            </h2>
            <p className="text-xs mt-0.5" style={{ color: mutedColor }}>
              {submitted ? "Enviado com sucesso" : `Passo ${step} de 3 — ${step === 1 ? "Identificação" : step === 2 ? "Localização" : "Evidências"}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: sectionBg, border: `1px solid ${borderColor}` }}
          >
            <X size={14} color={mutedColor} />
          </button>
        </div>

        {/* Progress */}
        {!submitted && (
          <div className="px-6 pt-4 shrink-0">
            <div className="flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className="flex-1 h-1.5 rounded-full transition-all"
                  style={{
                    backgroundColor: s <= step ? "#1565C0" : darkMode ? "#2a2a2a" : "#EEF1F5",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Body */}
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
                <h3 className="text-lg" style={{ color: textColor, fontWeight: 700 }}>
                  Ocorrência Registrada!
                </h3>
                <p className="text-sm mt-1" style={{ color: mutedColor }}>
                  Protocolo #{Math.floor(Math.random() * 90000) + 10000}
                </p>
              </div>
              <div
                className="w-full rounded-xl p-4 text-left"
                style={{ backgroundColor: sectionBg, border: `1px solid ${borderColor}` }}
              >
                <p className="text-xs mb-2" style={{ color: mutedColor }}>
                  Sua ocorrência foi registrada e encaminhada para análise. O tempo médio de resposta é de <strong style={{ color: "#FF9800" }}>6.2 dias</strong>.
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FF9800" }} />
                  <span className="text-xs" style={{ color: "#FF9800", fontWeight: 600 }}>
                    Em fila de análise
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full h-10 rounded-xl text-sm"
                style={{ backgroundColor: "#1565C0", color: "#fff", fontWeight: 600 }}
              >
                Fechar
              </button>
            </div>
          ) : step === 1 ? (
            <div className="flex flex-col gap-4">
              {/* Title */}
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

              {/* Category */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: mutedColor }}>
                  Categoria *
                </label>
                <div
                  className="relative"
                  style={{ border: `1px solid ${borderColor}`, borderRadius: "12px" }}
                >
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                    style={{ backgroundColor: sectionBg, color: formData.category ? textColor : mutedColor }}
                  >
                    <option value="">Selecione uma categoria</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} style={{ backgroundColor: cardBg }}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} color={mutedColor} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Severity */}
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
                          formData.severity === val
                            ? color + "22"
                            : sectionBg,
                        border: `1.5px solid ${formData.severity === val ? color : borderColor}`,
                        color: formData.severity === val ? color : mutedColor,
                        fontWeight: formData.severity === val ? 700 : 400,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Neighborhood */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: mutedColor }}>
                  Bairro *
                </label>
                <div
                  className="relative"
                  style={{ border: `1px solid ${borderColor}`, borderRadius: "12px" }}
                >
                  <select
                    value={formData.neighborhood}
                    onChange={(e) => handleChange("neighborhood", e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                    style={{ backgroundColor: sectionBg, color: formData.neighborhood ? textColor : mutedColor }}
                  >
                    <option value="">Selecione um bairro</option>
                    {NEIGHBORHOODS.map((n) => (
                      <option key={n} value={n} style={{ backgroundColor: cardBg }}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} color={mutedColor} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          ) : step === 2 ? (
            <div className="flex flex-col gap-4">
              {/* Address */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: mutedColor }}>
                  Endereço ou Ponto de Referência *
                </label>
                <div className="relative">
                  <MapPin size={14} color={mutedColor} className="absolute left-3 top-1/2 -translate-y-1/2" />
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

              {/* Map placeholder */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: mutedColor }}>
                  Marcar no Mapa
                </label>
                <div
                  className="w-full h-40 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer"
                  style={{
                    backgroundColor: sectionBg,
                    border: `2px dashed ${borderColor}`,
                  }}
                >
                  <MapPin size={20} color={mutedColor} />
                  <p className="text-xs" style={{ color: mutedColor }}>
                    Clique para selecionar no mapa interativo
                  </p>
                  <span
                    className="text-xs px-3 py-1 rounded-lg"
                    style={{ backgroundColor: "#1565C0" + "22", color: "#1565C0" }}
                  >
                    Abrir mapa
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: mutedColor }}>
                  Descrição Detalhada
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
              {/* Upload */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: mutedColor }}>
                  Fotografias / Evidências
                </label>
                <div
                  className="w-full h-40 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: sectionBg,
                    border: `2px dashed ${borderColor}`,
                  }}
                >
                  <Upload size={20} color={mutedColor} />
                  <p className="text-xs" style={{ color: mutedColor }}>
                    Arraste fotos ou clique para enviar
                  </p>
                  <p style={{ fontSize: "10px", color: mutedColor }}>
                    JPG, PNG até 10MB
                  </p>
                </div>
              </div>

              {/* Priority preview */}
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: sectionBg, border: `1px solid ${borderColor}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} color="#E53935" />
                  <span className="text-xs" style={{ color: textColor, fontWeight: 600 }}>
                    Pontuação de Prioridade Estimada
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-2xl"
                    style={{
                      color: formData.severity === "critical" ? "#E53935" : formData.severity === "high" ? "#FF9800" : "#FFC107",
                      fontWeight: 800,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formData.severity === "critical" ? "85–95" : formData.severity === "high" ? "65–80" : "40–60"}
                  </span>
                  <div className="flex-1">
                    <div
                      className="w-full h-2 rounded-full"
                      style={{ backgroundColor: darkMode ? "#2a2a2a" : "#EEF1F5" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: formData.severity === "critical" ? "90%" : formData.severity === "high" ? "72%" : "50%",
                          backgroundColor:
                            formData.severity === "critical" ? "#E53935" : formData.severity === "high" ? "#FF9800" : "#FFC107",
                        }}
                      />
                    </div>
                    <p style={{ fontSize: "9px", color: mutedColor, marginTop: "4px" }}>
                      Baseado em votos, tempo em aberto e categoria
                    </p>
                  </div>
                </div>
              </div>

              {/* Anonymous toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: textColor, fontWeight: 500 }}>
                    Relato Anônimo
                  </p>
                  <p className="text-xs" style={{ color: mutedColor }}>
                    Seus dados não serão exibidos publicamente
                  </p>
                </div>
                <button
                  onClick={() => handleChange("anonymous", !formData.anonymous)}
                  className="w-11 h-6 rounded-full transition-colors relative"
                  style={{
                    backgroundColor: formData.anonymous ? "#1565C0" : darkMode ? "#3a3a3a" : "#D1D5DB",
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full absolute top-1 transition-transform"
                    style={{
                      backgroundColor: "#fff",
                      left: formData.anonymous ? "calc(100% - 20px)" : "4px",
                    }}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
                onClick={() => (step === 1 ? isStep1Valid : isStep2Valid) && setStep((s) => (s + 1) as 1 | 2 | 3)}
                className="h-10 px-6 rounded-xl text-sm transition-all"
                style={{
                  backgroundColor:
                    (step === 1 ? isStep1Valid : isStep2Valid) ? "#1565C0" : darkMode ? "#2a2a2a" : "#E8ECF0",
                  color: (step === 1 ? isStep1Valid : isStep2Valid) ? "#fff" : mutedColor,
                  fontWeight: 600,
                  cursor: (step === 1 ? isStep1Valid : isStep2Valid) ? "pointer" : "not-allowed",
                }}
              >
                Continuar
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="h-10 px-6 rounded-xl text-sm"
                style={{ backgroundColor: "#2E7D32", color: "#fff", fontWeight: 600 }}
              >
                Enviar Ocorrência
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
