export interface PadelLevel {
  code: string;
  label: string;
  spanishCategory?: string;
  swedishLevel?: number;
  description: string;
}

export const PADEL_LEVELS: PadelLevel[] = [
  // Beginner levels
  {
    code: "ES1.0",
    label: "ES 1.0 / SE 1",
    swedishLevel: 1,
    description: "Jugadores que acaban de empezar a jugar al pádel y no tienen experiencia en la pista.",
  },
  {
    code: "ES1.5",
    label: "ES 1.5 / SE 2",
    swedishLevel: 2,
    description: "Jugadores que han jugado unas cuantas veces y conocen los golpes básicos pero tienen dificultades para mantener la pelota en juego.",
  },
  {
    code: "ES2.0",
    label: "ES 2.0 / SE 3",
    swedishLevel: 3,
    description: "Puede ejecutar los golpes básicos pero le falta control y potencia. Evita el revés y le cuesta realizar voleas y saques.",
  },
  {
    code: "ES2.5",
    label: "ES 2.5 / SE 3",
    swedishLevel: 3,
    description: "Tiene una derecha decente y está empezando a manejar los reveses, los saques y las voleas de derecha.",
  },
  // Intermediate levels
  {
    code: "ES3.0",
    label: "ES 3.0 / Cat. 5",
    spanishCategory: "5",
    swedishLevel: 4,
    description: "Buena derecha, puede controlar el revés, el saque, el globo de derecha, la volea de derecha y los rebotes lentos desde el cristal.",
  },
  {
    code: "ES3.5",
    label: "ES 3.5 / Cat. 5",
    spanishCategory: "5",
    swedishLevel: 5,
    description: "Fuerte derecha, pocos errores en el revés, saque con slice. Voleas agresivas en la red, domina la bandeja y devoluciones potentes tras el cristal.",
  },
  {
    code: "ES4.0",
    label: "ES 4.0 / Cat. 4",
    spanishCategory: "4",
    swedishLevel: 6,
    description: "Derecha fiable, revés con control y potencia. Saque agresivo, voleas profundas y potentes, bandejas y smashes con buen control.",
  },
  {
    code: "ES4.5",
    label: "ES 4.5 / Cat. 4",
    spanishCategory: "4",
    swedishLevel: 6,
    description: "Derecha agresiva, revés potente, saque preciso. Controla todas las voleas, utiliza el cristal para devoluciones, potencia y efecto en bandejas y bajadas.",
  },
  // Advanced levels
  {
    code: "ES5.0",
    label: "ES 5.0 / Cat. 3",
    spanishCategory: "3",
    swedishLevel: 7,
    description: "Golpes potentes y bien controlados. Coloca la pelota en puntos débiles, ataca con agresividad en voleas. Juego por encima de la cabeza consistente, drop shot integrado.",
  },
  {
    code: "ES5.5",
    label: "ES 5.5 / Cat. 2",
    spanishCategory: "2",
    swedishLevel: 8,
    description: "Máxima precisión y potencia. Juega con consistencia sin errores innecesarios. Excelentes decisiones estratégicas y capacidad de leer el juego.",
  },
];

export function getLevelByCode(code: string): PadelLevel | undefined {
  return PADEL_LEVELS.find((l) => l.code === code);
}

export function getLevelLabel(code: string | null | undefined): string {
  if (!code) return "Sin nivel";
  const level = getLevelByCode(code);
  return level ? level.label : code;
}

/** Convert a level code (e.g. "ES3.0") to a numeric value for comparison. */
export function levelToNumber(code: string | null | undefined): number {
  if (!code) return 0;
  const match = code.match(/(\d+\.\d+)/);
  return match ? parseFloat(match[1]) : 0;
}
