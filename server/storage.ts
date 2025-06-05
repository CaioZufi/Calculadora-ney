import { users, calculations, sessions, appUsers, type User, type InsertUser, type CalculatorFormData, type SavingsResult, type Calculation, type InsertCalculation, type Session, type InsertSession, type AppUser, type InsertAppUser } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, or, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // Métodos para usuários admin
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Métodos para usuários do app
  getAppUser(id: number): Promise<AppUser | undefined>;
  getAppUserByEmail(email: string): Promise<AppUser | undefined>;
  getAppUsers(searchTerm?: string): Promise<AppUser[]>;
  createAppUser(user: InsertAppUser): Promise<AppUser>;
  updateAppUser(id: number, userData: Partial<AppUser>): Promise<AppUser>;
  deleteAppUser(id: number): Promise<boolean>;
  
  // Métodos para cálculos
  saveCalculation(formData: CalculatorFormData, results: SavingsResult, sessionId?: string, appUserId?: number, additionalGains?: any[]): Promise<{ id: number }>;
  getCalculationById(id: number): Promise<Calculation | undefined>;
  getLastCalculationByUserId(appUserId: number): Promise<Calculation | undefined>;
  
  // Métodos para sessões
  getSession(sessionId: string): Promise<Session | undefined>;
  createSession(sessionId: string): Promise<Session>;
  updateSession(sessionId: string, lastCalculationId: number): Promise<Session>;
  getLastCalculation(sessionId: string): Promise<Calculation | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAppUser(id: number): Promise<AppUser | undefined> {
    const [appUser] = await db.select().from(appUsers).where(eq(appUsers.id, id));
    return appUser || undefined;
  }

  async getAppUserByEmail(email: string): Promise<AppUser | undefined> {
    const [appUser] = await db.select().from(appUsers).where(eq(appUsers.email, email));
    return appUser || undefined;
  }

  async getAppUsers(searchTerm?: string): Promise<AppUser[]> {
    if (searchTerm) {
      return db.select().from(appUsers).where(
        or(
          ilike(appUsers.email, `%${searchTerm}%`),
          ilike(appUsers.firstName, `%${searchTerm}%`),
          ilike(appUsers.lastName, `%${searchTerm}%`)
        )
      );
    }
    return db.select().from(appUsers);
  }

  async createAppUser(insertAppUser: InsertAppUser): Promise<AppUser> {
    try {
      console.log("Iniciando criação do usuário no banco de dados:", {
        email: insertAppUser.email,
        firstName: insertAppUser.firstName,
        lastName: insertAppUser.lastName
      });
      
      // Garantir que temos os campos obrigatórios
      if (!insertAppUser.email || !insertAppUser.password || !insertAppUser.firstName || !insertAppUser.lastName) {
        console.error("Dados insuficientes para criar usuário:", insertAppUser);
        throw new Error("Dados obrigatórios faltando para criar usuário");
      }

      // Criar usuário com tratamento de erro adequado
      const [appUser] = await db
        .insert(appUsers)
        .values({
          ...insertAppUser,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      if (!appUser) {
        throw new Error("Falha ao inserir usuário no banco de dados");
      }
      
      console.log("Usuário criado com sucesso:", { id: appUser.id, email: appUser.email });
      return appUser;
    } catch (error) {
      console.error("Erro detalhado ao criar usuário:", error);
      throw error; // Re-lançar o erro para tratamento no nível superior
    }
  }
  
  async updateAppUser(id: number, userData: Partial<AppUser>): Promise<AppUser> {
    const [updatedUser] = await db
      .update(appUsers)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(appUsers.id, id))
      .returning();
    return updatedUser;
  }

  async deleteAppUser(id: number): Promise<boolean> {
    try {
      // Primeiro, obter o usuário para guardar seu nome
      const [user] = await db
        .select()
        .from(appUsers)
        .where(eq(appUsers.id, id));
      
      if (!user) {
        return false;
      }
      
      // Atualizar os cálculos associados a este usuário para preservar o nome
      const userName = `${user.firstName} ${user.lastName}`;
      await db.execute(sql`
        UPDATE calculations 
        SET user_name = ${userName}
        WHERE app_user_id = ${id} AND (user_name IS NULL OR user_name = '')
      `);
      
      // Agora podemos excluir o usuário com segurança
      const result = await db
        .delete(appUsers)
        .where(eq(appUsers.id, id))
        .returning({ id: appUsers.id });
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      return false;
    }
  }

  async saveCalculation(formData: CalculatorFormData, results: SavingsResult, sessionId?: string, appUserId?: number, additionalGains?: any[]): Promise<{ id: number }> {
    // Log para debug
    console.log("saveCalculation recebeu formData:", {
      r1TireLifespan: formData.r1TireLifespan,
      r2TireLifespan: formData.r2TireLifespan,
      retreadingCycles: formData.retreadingCycles
    });
    
    // Buscar o nome do usuário se appUserId for fornecido
    let userName: string | undefined = undefined;
    if (appUserId) {
      const user = await this.getAppUser(appUserId);
      if (user) {
        userName = `${user.firstName} ${user.lastName}`;
      }
    }
    
    // Preparar objeto para inserção no banco de dados
    const calculationData: any = {
      companyName: formData.companyName,
      fleetSize: formData.fleetSize,
      totalTires: formData.totalTires,
      fuelConsumption: formData.fuelConsumption,
      fuelPrice: formData.fuelPrice,
      monthlyMileage: formData.monthlyMileage,
      tireLifespan: formData.tireLifespan,
      tirePrice: formData.tirePrice,
      retreadPrice: formData.retreadPrice,
      tirePressureCheck: formData.tirePressureCheck,
      retreadingCycles: formData.retreadingCycles,
      // Variáveis personalizadas para as porcentagens de cálculo
      fuelSavingsPercentage: formData.fuelSavingsPercentage !== undefined ? formData.fuelSavingsPercentage : 1,
      cpkImprovementPercentage: formData.cpkImprovementPercentage !== undefined ? formData.cpkImprovementPercentage : 5,
      carcassSavingsPercentage: formData.carcassSavingsPercentage !== undefined ? formData.carcassSavingsPercentage : 33,
      carcassSavingsFixedValue: formData.carcassSavingsFixedValue !== undefined ? formData.carcassSavingsFixedValue : 20,
      // Fontes das informações
      fuelSavingsSource: formData.fuelSavingsSource,
      cpkImprovementSource: formData.cpkImprovementSource,
      carcassSavingsSource: formData.carcassSavingsSource,
      // Quilometragem dos pneus R1 e R2 (opcionais)
      r1TireLifespan: formData.r1TireLifespan,
      r2TireLifespan: formData.r2TireLifespan,
      // Valores de rastreamento
      vehiclesWithTracking: formData.vehiclesWithTracking,
      trackingCostPerVehicle: formData.trackingCostPerVehicle,
      // Resultados do cálculo
      savingsPerTirePerMonth: results.savingsPerTirePerMonth,
      cpkImprovement: results.itemizedSavings.cpkImprovement,
      fuelSavings: results.itemizedSavings.fuelSavings,
      carcassSavings: results.itemizedSavings.carcassSavings,
      trackingTotalCost: results.tracking?.trackingTotalCost || 0,
      totalSavings: results.itemizedSavings.total,
      newTireCycle: results.tireCycle.new,
      r1TireCycle: results.tireCycle.r1,
      r2TireCycle: results.tireCycle.r2,
      submittedAt: new Date().toISOString(),
      sessionId: sessionId, // Adiciona o ID da sessão se fornecido
      appUserId: appUserId, // Adiciona o ID do usuário se fornecido
      userName: userName, // Armazena o nome do usuário para não perder quando ele for excluído
      additionalGains: additionalGains ? JSON.stringify(additionalGains) : null // Salva os Ganhos Adicionais como JSON
    };
    
    // Inserir no banco de dados
    const [calculation] = await db.insert(calculations).values(calculationData).returning();
    
    // Se tiver um sessionId, atualiza a sessão com este cálculo
    if (sessionId) {
      await this.updateSession(sessionId, calculation.id);
    }
    
    return { id: calculation.id };
  }

  async getCalculationById(id: number): Promise<Calculation | undefined> {
    const [calculation] = await db.select().from(calculations).where(eq(calculations.id, id));
    return calculation;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionId, sessionId));
    return session;
  }

  async createSession(sessionId: string): Promise<Session> {
    const now = new Date().toISOString();
    const [session] = await db.insert(sessions).values({
      sessionId,
      lastUpdated: now
    }).returning();
    return session;
  }

  async updateSession(sessionId: string, lastCalculationId: number): Promise<Session> {
    const now = new Date().toISOString();

    // Verificar se a sessão já existe
    const existingSession = await this.getSession(sessionId);
    
    if (existingSession) {
      // Atualiza sessão existente
      const [updatedSession] = await db
        .update(sessions)
        .set({ 
          lastCalculationId, 
          lastUpdated: now 
        })
        .where(eq(sessions.sessionId, sessionId))
        .returning();
      return updatedSession;
    } else {
      // Cria nova sessão
      return this.createSession(sessionId);
    }
  }

  async getLastCalculation(sessionId: string): Promise<Calculation | undefined> {
    // Obter a sessão
    const session = await this.getSession(sessionId);
    if (!session || !session.lastCalculationId) return undefined;
    
    // Obter o cálculo
    return this.getCalculationById(session.lastCalculationId);
  }

  async getLastCalculationByUserId(appUserId: number): Promise<Calculation | undefined> {
    const [calculation] = await db
      .select()
      .from(calculations)
      .where(eq(calculations.appUserId, appUserId))
      .orderBy(desc(calculations.submittedAt))
      .limit(1);
    
    return calculation;
  }
}

export const storage = new DatabaseStorage();
