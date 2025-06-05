# Sistema Ecotruck - Análise Técnica

## Visão Geral
Sistema web para cálculo de economia em gestão de pneus para frotas, com dashboard administrativo e geração de relatórios.

**Stack Técnica:**
- Frontend: React + TypeScript + Vite
- Backend: Express.js + TypeScript  
- Database: PostgreSQL + Drizzle ORM
- UI: shadcn/ui + Tailwind CSS
- Deploy: Replit

## Principais Funcionalidades Implementadas

### 1. Calculadora de Economia
- Formulário em 6 etapas para entrada de dados da frota
- Cálculos complexos: economia de combustível, CPK, economia de carcaça
- Fórmula principal: `(% Economy × retread/month × tires) × (cost/km × reduction × km_diff)`
- Sistema de "Ganhos Adicionais" com 13 categorias customizáveis
- Geração de PDF com relatório detalhado

### 2. Sistema de Autenticação
- Dois tipos de usuários: Admin e App Users
- Autenticação com sessões Express
- Controle de acesso por rotas protegidas
- Gestão de usuários pelo admin

### 3. Dashboard Administrativo
- Visualização de todas as simulações
- Estatísticas em tempo real (total, hoje, empresas únicas)
- Filtros por data e busca por empresa
- Comparação entre até 4 simulações
- Exportação para CSV/Excel
- Exclusão individual e em lote

### 4. Principais Componentes

#### Calculadora Principal (`client/src/pages/calculator.tsx`)
```typescript
// Componente principal com 6 etapas:
// 1. Dados da empresa e frota
// 2. Informações de combustível  
// 3. Dados operacionais
// 4. Preços e manutenção
// 5. Informações de recapagem
// 6. Variáveis personalizáveis

const calculateSavings = (data: CalculatorFormData) => {
  // Economia de combustível
  const fuelSavings = (data.monthlyMileage * data.fleetSize * 12) * 
    (data.fuelConsumption / 1000) * data.fuelPrice * 
    (data.fuelSavingsPercentage / 100);

  // Economia de carcaça (nova fórmula)
  const totalLifeInMonths = data.tireLifespan / data.monthlyMileage;
  const retreadingsPerMonth = parseInt(data.retreadingCycles) / totalLifeInMonths;
  const carcassSavings = (data.carcassSavingsPercentage / 100) * 
    retreadingsPerMonth * data.totalTires * 
    ((data.tirePrice + data.retreadPrice) / data.monthlyMileage) * 
    0.95 * (data.r1TireLifespan + data.r2TireLifespan);

  return { fuelSavings, carcassSavings, total: fuelSavings + carcassSavings };
};
```

#### Schema do Banco (`shared/schema.ts`)
```typescript
// Principais tabelas:
export const calculations = pgTable("calculations", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  fleetSize: integer("fleet_size").notNull(),
  totalTires: integer("total_tires").notNull(),
  fuelConsumption: real("fuel_consumption").notNull(),
  fuelPrice: real("fuel_price").notNull(),
  monthlyMileage: integer("monthly_mileage").notNull(),
  tireLifespan: integer("tire_lifespan").notNull(),
  tirePrice: real("tire_price").notNull(),
  retreadPrice: real("retread_price").notNull(),
  retreadingCycles: text("retreading_cycles").notNull(),
  fuelSavingsPercentage: real("fuel_savings_percentage"),
  cpkImprovementPercentage: real("cpk_improvement_percentage"),
  carcassSavingsPercentage: real("carcass_savings_percentage"),
  totalSavings: real("total_savings").notNull(),
  appUserId: integer("app_user_id").references(() => appUsers.id),
  additionalGains: text("additional_gains") // JSON das 13 categorias
});
```

#### Dashboard Admin (`client/src/pages/admin-dashboard.tsx`)
```typescript
// Principais funcionalidades:
- Tabela com redimensionamento de colunas
- Paginação e busca
- Filtros por data
- Comparação entre simulações
- Exportação de dados
- Gestão de usuários
- Estatísticas em tempo real
```

## Problemas Identificados

### 1. Performance
- Consulta `getLastCalculationByUserId` estava lenta (3+ segundos)
- **Solução aplicada:** Otimização da query removendo logs excessivos

### 2. Layout Mobile
- Formulário "Ganhos Adicionais" não responsivo
- **Solução aplicada:** Layout separado para mobile com campos empilhados

### 3. Validação de Dados
- Alguns campos permitem valores inválidos
- Falta validação robusta no frontend

### 4. Tratamento de Erros
- Erros de API não são tratados consistentemente
- Falta feedback visual adequado para falhas

## Melhorias Sugeridas

### Prioridade Alta
1. **Validação Frontend:** Implementar validação em tempo real nos formulários
2. **Error Handling:** Sistema unificado de tratamento de erros
3. **Loading States:** Indicadores de carregamento em todas as operações assíncronas
4. **Mobile UX:** Melhorar experiência mobile em todas as páginas

### Prioridade Média  
1. **Performance:** Implementar cache no React Query
2. **Acessibilidade:** Adicionar ARIA labels e navegação por teclado
3. **SEO:** Meta tags e estrutura semântica
4. **Testes:** Implementar testes unitários e de integração

### Prioridade Baixa
1. **PWA:** Transformar em Progressive Web App
2. **Dark Mode:** Tema escuro opcional
3. **Internacionalização:** Suporte a múltiplos idiomas
4. **Analytics:** Rastreamento de uso e métricas

## Arquitetura Atual

```
Frontend (React)
├── Pages (calculator, dashboard, auth)
├── Components (forms, tables, dialogs)  
├── Hooks (auth, queries)
└── Utils (formatters, validators)

Backend (Express)
├── Routes (API endpoints)
├── Auth (authentication middleware)
├── Storage (database operations)
├── PDF (report generation)
└── Email (notifications)

Database (PostgreSQL)
├── users (admin users)
├── app_users (application users)
├── calculations (simulation data)
└── sessions (user sessions)
```

## Pontos Fortes
- Arquitetura bem estruturada e modular
- Tipagem robusta com TypeScript
- Interface responsiva e moderna
- Funcionalidades completas para o domínio

## Áreas de Melhoria
- Tratamento de erros mais robusto
- Performance em consultas complexas
- Validação de dados mais rigorosa
- Cobertura de testes automatizados