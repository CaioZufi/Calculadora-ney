# Sistema Ecotruck - Código Completo para Análise

## Estrutura do Projeto
- Frontend: React.js com TypeScript
- Backend: Express.js com TypeScript  
- Banco: PostgreSQL com Drizzle ORM
- UI: shadcn/ui + Tailwind CSS

## Arquivos Principais

### 1. Schema do Banco (shared/schema.ts)
```typescript
import { pgTable, text, serial, integer, real, date, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: integer("is_admin").notNull().default(0)
});

export const appUsers = pgTable("app_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  password: text("password").notNull(),
  observation: text("observation"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const calculations = pgTable("calculations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id"),
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
  r1TireLifespan: integer("r1_tire_lifespan"),
  r2TireLifespan: integer("r2_tire_lifespan"),
  vehiclesWithTracking: integer("vehicles_with_tracking"),
  trackingCostPerVehicle: real("tracking_cost_per_vehicle"),
  fuelSavingsPercentage: real("fuel_savings_percentage"),
  cpkImprovementPercentage: real("cpk_improvement_percentage"),
  carcassSavingsPercentage: real("carcass_savings_percentage"),
  carcassSavingsFixedValue: real("carcass_savings_fixed_value"),
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
  userName: text("user_name"),
  additionalGains: text("additional_gains")
});

export const calculatorFormSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  fleetSize: z.number().min(1, "Tamanho da frota deve ser pelo menos 1"),
  totalTires: z.number().min(1, "Quantidade total de pneus deve ser pelo menos 1"),
  fuelConsumption: z.number().min(0.1, "Consumo de combustível deve ser maior que 0"),
  fuelPrice: z.number().min(0.1, "Preço do combustível deve ser maior que 0"),
  monthlyMileage: z.number().min(1, "Quilometragem mensal deve ser maior que 0"),
  tireLifespan: z.number().min(1, "Vida útil dos pneus deve ser maior que 0"),
  tirePrice: z.number().min(1, "Preço do pneu deve ser maior que 0"),
  tirePressureCheck: z.string().min(1, "Frequência de verificação de pressão é obrigatória"),
  retreadPrice: z.number().min(1, "Preço da recapagem deve ser maior que 0"),
  retreadingCycles: z.enum(["0", "1", "2"]),
  r1TireLifespan: z.number().min(1).optional(),
  r2TireLifespan: z.number().min(1).optional(),
  vehiclesWithTracking: z.number().min(0).optional(),
  trackingCostPerVehicle: z.number().min(0).optional(),
  fuelSavingsPercentage: z.number().min(0).max(100).optional(),
  cpkImprovementPercentage: z.number().min(0).max(100).optional(),
  carcassSavingsPercentage: z.number().min(0).max(100).optional(),
});

export type CalculatorFormData = z.infer<typeof calculatorFormSchema>;
export type Calculation = typeof calculations.$inferSelect;
export type AppUser = typeof appUsers.$inferSelect;
export type User = typeof users.$inferSelect;
```

### 2. Backend Principal (server/index.ts)
```typescript
// Servidor Express principal - será preenchido
```

### 3. Rotas da API (server/routes.ts)
```typescript
// Rotas principais da API - será preenchido
```

### 4. Storage/Database (server/storage.ts)
```typescript
// Interface de acesso ao banco - será preenchido
```

### 5. Frontend Principal (client/src/App.tsx)
```typescript
// Aplicação React principal - será preenchido
```

### 6. Calculadora Principal (client/src/pages/calculator.tsx)
```typescript
// Página principal do calculador - será preenchido
```

### 7. Dashboard Admin (client/src/pages/admin-dashboard.tsx)
```typescript
// Dashboard administrativo - será preenchido
```

### 8. Ganhos Adicionais (client/src/pages/additional-gains.tsx)
```typescript
// Página de ganhos adicionais - será preenchido
```

### 9. Autenticação (server/auth-app.ts)
```typescript
// Sistema de autenticação - será preenchido
```

### 10. Geração de PDF (server/pdf-generator.ts)
```typescript
// Gerador de relatórios PDF - será preenchido
```

---

## Funcionalidades Implementadas
- ✅ Calculadora de economia de pneus com múltiplas fórmulas
- ✅ Sistema de autenticação para usuários
- ✅ Dashboard administrativo completo
- ✅ Geração de relatórios em PDF
- ✅ Sistema de ganhos adicionais (13 categorias)
- ✅ Exportação de dados (CSV/Excel)
- ✅ Comparação entre simulações
- ✅ Sistema de email (Brevo)
- ✅ Layout responsivo para mobile
- ✅ Gestão de usuários

## Pontos de Melhoria Identificados
- Performance em consultas do banco
- Layout mobile em algumas páginas
- Validações de formulário
- Tratamento de erros

---

*Arquivo gerado para análise no Claude 4.0*