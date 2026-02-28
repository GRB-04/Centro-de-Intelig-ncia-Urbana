export interface Issue {
  id: number;
  title: string;
  address: string;
  neighborhood: string;
  category: string;
  status: "Open" | "In Analysis" | "Forwarded" | "Resolved";
  severity: "critical" | "high" | "medium" | "low";
  votes: number;
  daysOpen: number;
  priorityScore: number;
  estimatedAffected: number;
  image: string;
  mapCoords: { x: number; y: number };
  isRecurrent: boolean;
}

export const ISSUES: Issue[] = [
  {
    id: 1,
    title: "Cratera de Grande Porte na Av. Almirante Barroso",
    address: "Av. Almirante Barroso, 1250 – Marco",
    neighborhood: "Marco",
    category: "Vias e Pavimentação",
    status: "Open",
    severity: "critical",
    votes: 247,
    daysOpen: 14,
    priorityScore: 89,
    estimatedAffected: 1200,
    image:
      "https://images.unsplash.com/photo-1717882662489-5f4e749b5f2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3Rob2xlJTIwcm9hZCUyMGRhbWFnZSUyMHVyYmFuJTIwQnJhemlsfGVufDF8fHx8MTc3MjIyNDYwN3ww&ixlib=rb-4.1.0&q=80&w=400",
    mapCoords: { x: 318, y: 175 },
    isRecurrent: true,
  },
  {
    id: 2,
    title: "Alagamento Recorrente na Travessa Humaitá",
    address: "Tv. Humaitá, 320 – Batista Campos",
    neighborhood: "Batista Campos",
    category: "Drenagem e Alagamentos",
    status: "In Analysis",
    severity: "critical",
    votes: 198,
    daysOpen: 22,
    priorityScore: 92,
    estimatedAffected: 850,
    image:
      "https://images.unsplash.com/photo-1700680010066-f02c3e31d9e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbG9vZGluZyUyMHN0cmVldCUyMHVyYmFuJTIwQnJhemlsJTIwY2l0eXxlbnwxfHx8fDE3NzIyMjQ2MTB8MA&ixlib=rb-4.1.0&q=80&w=400",
    mapCoords: { x: 360, y: 210 },
    isRecurrent: true,
  },
  {
    id: 3,
    title: "Poste de Iluminação Danificado",
    address: "Rua dos Mundurucus, 890 – Guamá",
    neighborhood: "Guamá",
    category: "Iluminação Pública",
    status: "Forwarded",
    severity: "high",
    votes: 134,
    daysOpen: 8,
    priorityScore: 71,
    estimatedAffected: 420,
    image:
      "https://images.unsplash.com/photo-1770447323553-5cd1b6711134?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm9rZW4lMjBzdHJlZXRsaWdodCUyMHVyYmFuJTIwaW5mcmFzdHJ1Y3R1cmV8ZW58MXx8fHwxNzcyMTU4NjA1fDA&ixlib=rb-4.1.0&q=80&w=400",
    mapCoords: { x: 180, y: 280 },
    isRecurrent: false,
  },
  {
    id: 4,
    title: "Descarte Irregular de Lixo em Área Pública",
    address: "Passagem Maracangalha, 45 – Sacramenta",
    neighborhood: "Sacramenta",
    category: "Resíduos Sólidos",
    status: "Open",
    severity: "high",
    votes: 156,
    daysOpen: 5,
    priorityScore: 67,
    estimatedAffected: 310,
    image:
      "https://images.unsplash.com/photo-1762805544550-f12a8ebceb2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbGxlZ2FsJTIwZHVtcGluZyUyMGdhcmJhZ2UlMjB1cmJhbiUyMHN0cmVldHxlbnwxfHx8fDE3NzIyMjQ2MTF8MA&ixlib=rb-4.1.0&q=80&w=400",
    mapCoords: { x: 475, y: 205 },
    isRecurrent: true,
  },
  {
    id: 5,
    title: "Calçada Danificada com Risco de Queda",
    address: "Av. Nazaré, 432 – Nazaré",
    neighborhood: "Nazaré",
    category: "Calçadas e Acessibilidade",
    status: "Open",
    severity: "medium",
    votes: 89,
    daysOpen: 3,
    priorityScore: 52,
    estimatedAffected: 180,
    image:
      "https://images.unsplash.com/photo-1549041490-e1eb6d44aad9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm9rZW4lMjBzaWRld2FsayUyMHBhdmVtZW50JTIwY2l0eXxlbnwxfHx8fDE3NzIyMjQ2MTJ8MA&ixlib=rb-4.1.0&q=80&w=400",
    mapCoords: { x: 290, y: 240 },
    isRecurrent: false,
  },
  {
    id: 6,
    title: "Pichação em Patrimônio Histórico",
    address: "Rua Siqueira Mendes, 210 – Cidade Velha",
    neighborhood: "Cidade Velha",
    category: "Conservação do Patrimônio",
    status: "Resolved",
    severity: "low",
    votes: 64,
    daysOpen: 0,
    priorityScore: 34,
    estimatedAffected: 95,
    image:
      "https://images.unsplash.com/photo-1767425036415-df1ad5f1fbb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFmZml0aSUyMHZhbmRhbGlzbSUyMHVyYmFuJTIwYnVpbGRpbmclMjB3YWxsfGVufDF8fHx8MTc3MjIyNDYxNHww&ixlib=rb-4.1.0&q=80&w=400",
    mapCoords: { x: 255, y: 385 },
    isRecurrent: false,
  },
  {
    id: 7,
    title: "Vazamento de Água na Rede Pública",
    address: "Tv. 14 de Março, 78 – Comércio",
    neighborhood: "Comércio",
    category: "Abastecimento de Água",
    status: "In Analysis",
    severity: "high",
    votes: 178,
    daysOpen: 11,
    priorityScore: 78,
    estimatedAffected: 540,
    image:
      "https://images.unsplash.com/photo-1709138204640-fd39ae10b7e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlciUyMHBpcGUlMjBidXJzdCUyMGxlYWslMjByb2FkfGVufDF8fHx8MTc3MjIyNDYxNHww&ixlib=rb-4.1.0&q=80&w=400",
    mapCoords: { x: 262, y: 355 },
    isRecurrent: false,
  },
  {
    id: 8,
    title: "Buraco Profundo na Pista do BRT",
    address: "Av. Augusto Montenegro, 2400 – Bengui",
    neighborhood: "Bengui",
    category: "Vias e Pavimentação",
    status: "Forwarded",
    severity: "critical",
    votes: 312,
    daysOpen: 19,
    priorityScore: 95,
    estimatedAffected: 2100,
    image:
      "https://images.unsplash.com/photo-1717882662489-5f4e749b5f2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3Rob2xlJTIwcm9hZCUyMGRhbWFnZSUyMHVyYmFuJTIwQnJhemlsfGVufDF8fHx8MTc3MjIyNDYwN3ww&ixlib=rb-4.1.0&q=80&w=400",
    mapCoords: { x: 125, y: 120 },
    isRecurrent: true,
  },
];

export const NEIGHBORHOODS = [
  "Todos os Bairros",
  "Marco",
  "Batista Campos",
  "Guamá",
  "Sacramenta",
  "Nazaré",
  "Cidade Velha",
  "Comércio",
  "Bengui",
  "Pedreira",
  "Umarizal",
];

export const METRICS = {
  totalActive: 1284,
  resolvedThisMonth: 347,
  avgResponseDays: 6.2,
  mostIssuesNeighborhood: "Marco",
  mostCriticalCategory: "Vias e Pavimentação",
};
