import { z } from "zod";

// ============================================================
// Auth Validations
// ============================================================

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  surname: z.string().min(2, "Los apellidos deben tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  phone: z.string().optional(),
});

// ============================================================
// Club Validations
// ============================================================

export const clubSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  city: z.string().min(2, "La ciudad es obligatoria"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  description: z.string().optional(),
});

// ============================================================
// Team Validations
// ============================================================

export const teamSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  category: z.enum(["MALE", "FEMALE", "MIXED"]),
  level: z.string().optional(),
  captainId: z.string().optional(),
  coachId: z.string().optional(),
});

// ============================================================
// Player Validations
// ============================================================

export const playerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  surname: z.string().min(2, "Los apellidos deben tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  phone: z.string().optional(),
  level: z.number().min(1).max(10).optional(),
  dominantHand: z.enum(["LEFT", "RIGHT"]).default("RIGHT"),
  preferredPosition: z.string().optional(),
  teamId: z.string().optional(),
});

export const playerUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  surname: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  level: z.number().min(1).max(10).optional(),
  dominantHand: z.enum(["LEFT", "RIGHT"]).optional(),
  preferredPosition: z.string().optional(),
  teamId: z.string().optional(),
  ranking: z.number().optional(),
});

// ============================================================
// Training Validations
// ============================================================

export const trainingSchema = z.object({
  title: z.string().min(2, "El título es obligatorio"),
  description: z.string().optional(),
  date: z.string().min(1, "La fecha es obligatoria"),
  startTime: z.string().min(1, "La hora de inicio es obligatoria"),
  endTime: z.string().optional(),
  duration: z.number().min(15).max(300).optional(),
  facility: z.string().optional(),
  objectives: z.string().optional(),
  notes: z.string().optional(),
  teamId: z.string().min(1, "El equipo es obligatorio"),
  coachId: z.string().optional(),
  playerIds: z.array(z.string()).optional(),
});

// ============================================================
// Convocation Validations
// ============================================================

export const convocationSchema = z.object({
  matchId: z.string().min(1, "El partido es obligatorio"),
  teamId: z.string().min(1, "El equipo es obligatorio"),
  notes: z.string().optional(),
  deadline: z.string().optional(),
  playerIds: z.array(z.string()).min(1, "Selecciona al menos un jugador"),
});

// ============================================================
// Season & League Validations
// ============================================================

export const seasonSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  year: z.number().min(2020).max(2030),
  startDate: z.string().min(1, "La fecha de inicio es obligatoria"),
  endDate: z.string().min(1, "La fecha de fin es obligatoria"),
});

export const leagueSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  description: z.string().optional(),
  category: z.enum(["MALE", "FEMALE", "MIXED"]),
  level: z.string().optional(),
  maxTeams: z.number().min(2).max(32).default(16),
  seasonId: z.string().min(1, "La temporada es obligatoria"),
});

// ============================================================
// Match & Result Validations
// ============================================================

export const matchSchema = z.object({
  matchDate: z.string().min(1, "La fecha es obligatoria"),
  matchTime: z.string().optional(),
  court: z.string().optional(),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  matchdayId: z.string().min(1),
  notes: z.string().optional(),
});

export const setScoreSchema = z.object({
  home: z.number().min(0).max(7),
  away: z.number().min(0).max(7),
  tiebreakHome: z.number().min(0).max(20).optional(),
  tiebreakAway: z.number().min(0).max(20).optional(),
});

export const matchResultSchema = z.object({
  matchId: z.string().min(1),
  pair1: setScoreSchema,
  pair2: setScoreSchema,
  pair3: setScoreSchema,
});

// ============================================================
// Attendance Validations
// ============================================================

export const attendanceSchema = z.object({
  trainingId: z.string().min(1),
  playerId: z.string().min(1),
  status: z.enum(["CONFIRMED", "PENDING", "ABSENT", "JUSTIFIED"]),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  observation: z.string().optional(),
});

// ============================================================
// Types
// ============================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ClubInput = z.infer<typeof clubSchema>;
export type TeamInput = z.infer<typeof teamSchema>;
export type PlayerInput = z.infer<typeof playerSchema>;
export type PlayerUpdateInput = z.infer<typeof playerUpdateSchema>;
export type TrainingInput = z.infer<typeof trainingSchema>;
export type ConvocationInput = z.infer<typeof convocationSchema>;
export type SeasonInput = z.infer<typeof seasonSchema>;
export type LeagueInput = z.infer<typeof leagueSchema>;
export type MatchInput = z.infer<typeof matchSchema>;
export type MatchResultInput = z.infer<typeof matchResultSchema>;
export type AttendanceInput = z.infer<typeof attendanceSchema>;