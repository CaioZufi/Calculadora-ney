import { pgTable, text, serial, integer, real, date, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Para acesso admin
  password: text("password").notNull(),
  isAdmin: integer("is_admin").notNull().default(0)
});

export const appUsers = pgTable("app_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  password: text("password").notNull(), // Armazenará a senha comum
  observation: text("observation"), // Campo para observações sobre o usuário
  isAdmin: boolean("is_admin").notNull().default(false), // Campo para controlar acesso administrativo
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true
});

export const insertAppUserSchema = createInsertSchema(appUsers).pick({
  email: true,
  firstName: true,
  lastName: true,
  password: true,
  observation: true,
  isAdmin: true,
  createdBy: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAppUser = z.infer<typeof insertAppUserSchema>;
export type AppUser = typeof appUsers.$inferSelect;

// Schema for the tire savings calculator form
export const calculatorFormSchema = z.object({
  // Step 1: Company information
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  fleetSize: z.number().min(1, "Tamanho da frota deve ser pelo menos 1"),
  totalTires: z.number().min(1, "Quantidade total de pneus deve ser pelo menos 1"),

  // Step 2: Fuel information
  fuelConsumption: z.number().min(0.1, "Consumo de combustível deve ser maior que 0"),
  fuelPrice: z.number().min(0.1, "Preço do combustível deve ser maior que 0"),

  // Step 3: Operational information
  monthlyMileage: z.number().min(1, "Quilometragem mensal deve ser maior que 0"),
  tireLifespan: z.number().min(1, "Vida útil dos pneus deve ser maior que 0"),

  // Step 4: Price and maintenance information
  tirePrice: z.number().min(1, "Preço do pneu deve ser maior que 0"),
  tirePressureCheck: z.string().min(1, "Frequência de verificação de pressão é obrigatória"),
  
  // Step 5: Retreading information
  retreadPrice: z.number().min(1, "Preço da recapagem deve ser maior que 0"),
  retreadingCycles: z.enum(["0", "1", "2"], {
    errorMap: () => ({ message: "Selecione uma das opções disponíveis: 0, 1 ou 2 recapagens" })
  }),
  r1TireLifespan: z.number().min(1, "Quilometragem que o pneu R1 roda deve ser maior que 0").optional(),
  r2TireLifespan: z.number().min(1, "Quilometragem que o pneu R2 roda deve ser maior que 0").optional(),
  
  // Step 6: Tracking information
  vehiclesWithTracking: z.number().min(0, "Número de veículos com rastreamento deve ser um valor positivo").optional(),
  trackingCostPerVehicle: z.number().min(0, "Valor mensal do rastreamento deve ser um valor positivo").optional(),
  
  // Variáveis percentuais para os cálculos (opcionais, com valores padrão)
  fuelSavingsPercentage: z.number().min(0).max(100).optional(),
  cpkImprovementPercentage: z.number().min(0).max(100).optional(),
  carcassSavingsPercentage: z.number().min(0).max(100).optional(),
  
  // Fontes das informações de variáveis
  fuelSavingsSource: z.string().optional(),
  cpkImprovementSource: z.string().optional(),
  carcassSavingsSource: z.string().optional(),
});

export type CalculatorFormData = z.infer<typeof calculatorFormSchema>;

// Schema for the savings calculation result
export const savingsResultSchema = z.object({
  savingsPerTirePerMonth: z.number(),
  itemizedSavings: z.object({
    cpkImprovement: z.number(),
    fuelSavings: z.number(),
    carcassSavings: z.number(),
    total: z.number(),
  }),
  tireCycle: z.object({
    new: z.number(),
    r1: z.number(),
    r2: z.number(),
    total: z.number(),
  }),
  tracking: z.object({
    vehiclesWithTracking: z.number().optional(),
    trackingCostPerVehicle: z.number().optional(),
    trackingTotalCost: z.number().optional(),
  }).optional(),
});

export type SavingsResult = z.infer<typeof savingsResultSchema>;

// Schema for storing calculation submissions
export const calculations = pgTable("calculations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id"),  // ID da sessão para rastrear formulários do mesmo usuário
  companyName: text("company_name").notNull(),
  fleetSize: integer("fleet_size").notNull(),
  totalTires: integer("total_tires").notNull(),
  fuelConsumption: real("fuel_consumption").notNull(),
  fuelPrice: real("fuel_price").notNull(),
  monthlyMileage: integer("monthly_mileage").notNull(),
  tireLifespan: integer("tire_lifespan").notNull(),
  tirePrice: real("tire_price").notNull(),
  retreadPrice: real("retread_price").notNull(),
  tirePressureCheck: text("tire_pressure_check").notNull(),
  retreadingCycles: text("retreading_cycles").notNull(),
  // Quilometragem dos pneus retreads
  r1TireLifespan: integer("r1_tire_lifespan"),
  r2TireLifespan: integer("r2_tire_lifespan"),
  // Informações de rastreamento
  vehiclesWithTracking: integer("vehicles_with_tracking"),
  trackingCostPerVehicle: real("tracking_cost_per_vehicle"),
  // Variáveis de porcentagem para os cálculos (opcionais)
  fuelSavingsPercentage: real("fuel_savings_percentage"),
  cpkImprovementPercentage: real("cpk_improvement_percentage"),
  carcassSavingsPercentage: real("carcass_savings_percentage"),
  carcassSavingsFixedValue: real("carcass_savings_fixed_value"),
  // Fontes de informação para as variáveis
  fuelSavingsSource: text("fuel_savings_source"),
  cpkImprovementSource: text("cpk_improvement_source"),
  carcassSavingsSource: text("carcass_savings_source"),
  // Resultados do cálculo
  savingsPerTirePerMonth: real("savings_per_tire_per_month").notNull(),
  cpkImprovement: real("cpk_improvement").notNull(),
  fuelSavings: real("fuel_savings").notNull(),
  carcassSavings: real("carcass_savings").notNull(),
  totalSavings: real("total_savings").notNull(),
  newTireCycle: real("new_tire_cycle").notNull(),
  r1TireCycle: real("r1_tire_cycle").notNull(),
  r2TireCycle: real("r2_tire_cycle").notNull(),
  submittedAt: text("submitted_at").notNull(),
  appUserId: integer("app_user_id").references(() => appUsers.id),
  // Armazenar o nome do usuário diretamente para prevenir N/A quando o usuário for excluído
  userName: text("user_name"),
  // Ganhos adicionais como JSON
  additionalGains: text("additional_gains"),
});

// Definição de esquema para sessões de usuário
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),  // ID único da sessão do navegador
  lastCalculationId: integer("last_calculation_id"),  // Referência ao último cálculo
  lastUpdated: text("last_updated").notNull(),
});

export const insertCalculationSchema = createInsertSchema(calculations);
export type InsertCalculation = z.infer<typeof insertCalculationSchema>;
export type Calculation = typeof calculations.$inferSelect;

export const insertSessionSchema = createInsertSchema(sessions);
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
