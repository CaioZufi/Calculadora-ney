import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { calculations, appUsers } from "@shared/schema";
import { desc, sql, count, avg } from "drizzle-orm";
import { eq, and, gte } from "drizzle-orm/expressions";
import { SQL } from "drizzle-orm";
import { generateFormulasPDF, sendFormulasEmail } from "./formulas-pdf-generator";

// Credenciais do administrador fornecidas via variáveis de ambiente
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

// Middleware para verificar se o usuário está autenticado
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ message: "Não autorizado" });
}

export function setupAdminRoutes(app: Express) {
  // Login de administrador
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      // Verificar se o usuário já está logado como administrador através da autenticação de app_users
      if (req.session && req.session.isAdmin) {
        return res.status(200).json({ message: "Login bem-sucedido" });
      }
      
      // Caso contrário, retorna não autorizado (o usuário deve fazer login pelo sistema comum primeiro)
      return res.status(401).json({ message: "Acesso negado. Você deve fazer login como usuário administrador primeiro." });
    } catch (error) {
      console.error("Erro ao fazer login de admin:", error);
      return res.status(500).json({ message: "Erro ao processar login" });
    }
  });

  // Logout de administrador
  app.post("/api/admin/logout", (req: Request, res: Response) => {
    if (req.session) {
      // Remover completamente a sessão para garantir logout total
      req.session.appUserId = undefined;
      req.session.isAdmin = false;
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ message: "Erro ao fazer logout" });
        }
        return res.status(200).json({ message: "Logout bem-sucedido" });
      });
    } else {
      return res.status(200).json({ message: "Logout bem-sucedido" });
    }
  });

  // Obter estatísticas
  app.get("/api/admin/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Data de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Total de cálculos
      const totalResult = await db.select({ count: count() }).from(calculations);
      const totalCalculations = totalResult[0]?.count || 0;
      
      // Cálculos hoje
      const todayResult = await db
        .select({ count: count() })
        .from(calculations)
        .where(sql`DATE(submitted_at) = DATE(NOW())`);
      const calculationsToday = todayResult[0]?.count || 0;
      
      // Empresas únicas - consulta todas as empresas distintas
      const companiesResult = await db
        .select({ 
          companyName: calculations.companyName,
          count: count()
        })
        .from(calculations)
        .groupBy(calculations.companyName)
        .orderBy(desc(count()));
      
      const uniqueCompanies = companiesResult.length;
      
      // Lista de empresas para exibir no dashboard
      const companiesList = companiesResult.map(item => ({
        name: item.companyName,
        count: item.count
      }));
      
      return res.status(200).json({
        totalCalculations,
        calculationsToday,
        uniqueCompanies,
        companiesList
      });
    } catch (error) {
      console.error("Erro ao obter estatísticas:", error);
      return res.status(500).json({ message: "Erro ao obter estatísticas" });
    }
  });

  // Obter lista de cálculos
  app.get("/api/admin/calculations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("Query params:", req.query);
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 10;
      const offset = (page - 1) * perPage;
      const searchTerm = req.query.search as string || "";
      const dateFilter = req.query.dateFilter as string || "all";
      
      console.log("Filtros aplicados:", { page, perPage, offset, searchTerm, dateFilter });
      
      // Definir campos que serão retornados
      const baseQuery = {
        id: calculations.id,
        companyName: calculations.companyName,
        fleetSize: calculations.fleetSize,
        totalTires: calculations.totalTires,
        fuelConsumption: calculations.fuelConsumption,
        fuelPrice: calculations.fuelPrice,
        monthlyMileage: calculations.monthlyMileage,
        tireLifespan: calculations.tireLifespan,
        tirePrice: calculations.tirePrice,
        retreadPrice: calculations.retreadPrice,
        tirePressureCheck: calculations.tirePressureCheck,
        retreadingCycles: calculations.retreadingCycles,
        vehiclesWithTracking: calculations.vehiclesWithTracking,
        trackingCostPerVehicle: calculations.trackingCostPerVehicle,
        fuelSavingsPercentage: calculations.fuelSavingsPercentage,
        cpkImprovementPercentage: calculations.cpkImprovementPercentage,
        carcassSavingsPercentage: calculations.carcassSavingsPercentage,
        r1TireLifespan: calculations.r1TireLifespan,
        r2TireLifespan: calculations.r2TireLifespan,
        fuelSavingsSource: calculations.fuelSavingsSource,
        cpkImprovementSource: calculations.cpkImprovementSource,
        carcassSavingsSource: calculations.carcassSavingsSource,
        submittedAt: calculations.submittedAt,
        savingsPerTirePerMonth: calculations.savingsPerTirePerMonth,
        totalSavings: calculations.totalSavings,
        appUserId: calculations.appUserId,
        userName: calculations.userName,
      };
      
      let whereConditions: SQL[] = [];
      
      // Adicionar filtro de busca
      if (searchTerm) {
        whereConditions.push(sql`${calculations.companyName} ILIKE ${'%' + searchTerm + '%'}`);
      }
      
      // Adicionar filtro de data
      if (dateFilter !== "all") {
        if (dateFilter === "today") {
          whereConditions.push(sql`DATE(${calculations.submittedAt}) = DATE(NOW())`);
        } else if (dateFilter === "week") {
          whereConditions.push(sql`${calculations.submittedAt}::timestamp >= NOW() - INTERVAL '7 days'`);
        } else if (dateFilter === "month") {
          whereConditions.push(sql`${calculations.submittedAt}::timestamp >= NOW() - INTERVAL '30 days'`);
        } else if (dateFilter === "year") {
          whereConditions.push(sql`${calculations.submittedAt}::timestamp >= NOW() - INTERVAL '1 year'`);
        }
      }
      
      // Montar consulta usando o query builder evitando SQL injection
      let query = db.select(baseQuery).from(calculations);

      if (whereConditions.length > 0) {
        const whereClause = sql.join(whereConditions, sql` AND `);
        query = (query as any).where(whereClause);
      }

      const results = await query
        .orderBy(desc(calculations.submittedAt))
        .limit(perPage)
        .offset(offset);

      const countResult = await db
        .select({ count: count() })
        .from(calculations)
        .where(whereConditions.length > 0 ? sql.join(whereConditions, sql` AND `) : sql`true`);

      const totalCount = Number(countResult[0]?.count || 0);
      const calculationsData = results as any[];
      
      // Processar os resultados para garantir que os usuários tenham nomes
      const processedResults = calculationsData.map((calc: any) => {
        // Se não tem userName definido, usar um nome baseado no tipo de usuário
        if (!calc.userName || calc.userName.trim() === "") {
          if (calc.appUserId && calc.appUserId > 0) {
            calc.userName = `Usuário ${calc.appUserId}`;
          } else {
            calc.userName = "Visitante";
          }
        }
        
        return calc;
      });
      
      console.log("Resultados processados enviados:", processedResults.length);
      if (processedResults.length > 0) {
        console.log("Exemplo de resultado completo:", JSON.stringify(processedResults[0], null, 2));
        console.log("Campos específicos:");
        console.log("- fuelConsumption:", processedResults[0].fuelConsumption);
        console.log("- fuelPrice:", processedResults[0].fuelPrice);
        console.log("- monthlyMileage:", processedResults[0].monthlyMileage);
        console.log("- tireLifespan:", processedResults[0].tireLifespan);
        console.log("- tirePrice:", processedResults[0].tirePrice);
        console.log("- retreadPrice:", processedResults[0].retreadPrice);
      }
      
      res.json({
        calculations: processedResults,
        pagination: {
          page,
          perPage,
          total: totalCount,
          totalPages: Math.ceil(totalCount / perPage)
        }
      });
    } catch (error) {
      console.error("Erro ao obter cálculos:", error);
      return res.status(500).json({ message: "Erro ao obter cálculos" });
    }
  });

  // Excluir uma simulação pelo ID
  app.delete("/api/admin/calculations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      // Verificar se o cálculo existe
      const calculation = await db.select().from(calculations).where(eq(calculations.id, id)).limit(1);
      if (!calculation || calculation.length === 0) {
        return res.status(404).json({ message: "Simulação não encontrada" });
      }

      // Excluir o cálculo
      await db.delete(calculations).where(eq(calculations.id, id));
      
      // Retornar sucesso
      return res.status(200).json({ message: "Simulação excluída com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir simulação:", error);
      return res.status(500).json({ message: "Erro ao excluir simulação" });
    }
  });

  // Exportar dados (CSV ou Excel)
  app.get("/api/admin/export", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const searchTerm = req.query.search as string || "";
      const dateFilter = req.query.filter as string || "all";
      const format = req.query.format as string || "csv"; // Novo parâmetro para formato
      
      // Definir seleção de campos
      const baseQuery = {
        id: calculations.id,
        companyName: calculations.companyName,
        fleetSize: calculations.fleetSize,
        totalTires: calculations.totalTires,
        submittedAt: calculations.submittedAt,
        savingsPerTirePerMonth: calculations.savingsPerTirePerMonth,
        totalSavings: calculations.totalSavings,
        vehiclesWithTracking: calculations.vehiclesWithTracking,
        trackingCostPerVehicle: calculations.trackingCostPerVehicle,
        userName: sql<string>`COALESCE(${calculations.userName}, CASE WHEN ${appUsers.firstName} IS NOT NULL THEN CONCAT(${appUsers.firstName}, ' ', ${appUsers.lastName}) ELSE 'Usuário não identificado' END)`
      };
      
      // Construir condições WHERE
      let whereConditions: SQL[] = [];
      
      // Adicionar filtro de busca
      if (searchTerm) {
        whereConditions.push(sql`${calculations.companyName} ILIKE ${'%' + searchTerm + '%'}`);
      }
      
      // Adicionar filtro de data
      if (dateFilter !== "all") {
        if (dateFilter === "today") {
          whereConditions.push(sql`DATE(${calculations.submittedAt}) = DATE(NOW())`);
        } else if (dateFilter === "week") {
          whereConditions.push(sql`${calculations.submittedAt}::timestamp >= NOW() - INTERVAL '7 days'`);
        } else if (dateFilter === "month") {
          whereConditions.push(sql`${calculations.submittedAt}::timestamp >= NOW() - INTERVAL '30 days'`);
        } else if (dateFilter === "year") {
          whereConditions.push(sql`${calculations.submittedAt}::timestamp >= NOW() - INTERVAL '1 year'`);
        }
      }
      
      // Preparar consulta base otimizada (sem join desnecessário)
      let query = db
        .select(baseQuery)
        .from(calculations)
        .leftJoin(appUsers, eq(calculations.appUserId, appUsers.id));
      
      // Aplicar condições WHERE
      if (whereConditions.length > 0) {
        const whereClause = sql.join(whereConditions, sql` AND `);
        query = query as any;
        query = query.where(whereClause);
      }
      
      // Executar consulta
      const results = await query.orderBy(desc(calculations.submittedAt));
      
      // Data atual para o nome do arquivo
      const currentDate = new Date().toISOString().slice(0, 10);
      
      // Exportar de acordo com o formato solicitado
      if (format === "excel") {
        // Importar ExcelJS dinamicamente (compatível com ESM)
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.default.Workbook();
        const worksheet = workbook.addWorksheet('Simulações');
        
        // Definir colunas com formatação
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Empresa', key: 'companyName', width: 30 },
          { header: 'Frota', key: 'fleetSize', width: 15 },
          { header: 'Pneus', key: 'totalTires', width: 15 },
          { header: 'Data Submissão', key: 'submittedAt', width: 20 },
          { header: 'Economia por Pneu', key: 'savingsPerTirePerMonth', width: 20 },
          { header: 'Economia Total', key: 'totalSavings', width: 20 },
          { header: 'Veículos com Rastreamento', key: 'vehiclesWithTracking', width: 25 },
          { header: 'Custo de Rastreamento/Veículo', key: 'trackingCostPerVehicle', width: 30 },
          { header: 'Usuário', key: 'userName', width: 25 }
        ];
        
        // Adicionar estilo ao cabeçalho
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
        
        // Adicionar borda nas células do cabeçalho
        worksheet.getRow(1).eachCell({ includeEmpty: true }, function(cell: any) {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        // Adicionar dados
        results.forEach(calc => {
          const row = {
            id: calc.id,
            companyName: calc.companyName,
            fleetSize: calc.fleetSize,
            totalTires: calc.totalTires,
            submittedAt: new Date(calc.submittedAt),
            savingsPerTirePerMonth: calc.savingsPerTirePerMonth,
            totalSavings: calc.totalSavings,
            vehiclesWithTracking: calc.vehiclesWithTracking || 0,
            trackingCostPerVehicle: calc.trackingCostPerVehicle || 0,
            userName: calc.userName || 'Usuário não identificado'
          };
          worksheet.addRow(row);
        });
        
        // Formatar células de data
        worksheet.getColumn('submittedAt').numFmt = 'dd/mm/yyyy hh:mm:ss';
        
        // Formatar células de valores monetários
        worksheet.getColumn('savingsPerTirePerMonth').numFmt = 'R$ #,##0.00';
        worksheet.getColumn('totalSavings').numFmt = 'R$ #,##0.00';
        worksheet.getColumn('trackingCostPerVehicle').numFmt = 'R$ #,##0.00';
        
        // Configurar resposta
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=simulacoes_ecotruck_${currentDate}.xlsx`);
        
        // Enviar o arquivo Excel
        await workbook.xlsx.write(res);
        return res.end();
      } else {
        // Formato padrão: CSV
        let csv = 'ID,Empresa,Frota,Pneus,Data Submissão,Economia por Pneu,Economia Total,Veículos com Rastreamento,Custo de Rastreamento por Veículo,Usuário\n';
        
        results.forEach(calc => {
          const date = new Date(calc.submittedAt).toLocaleString('pt-BR');
          const formattedSavingsPerTire = calc.savingsPerTirePerMonth.toFixed(2).replace('.', ',');
          const formattedTotalSavings = calc.totalSavings.toFixed(2).replace('.', ',');
          const trackingCost = calc.trackingCostPerVehicle ? calc.trackingCostPerVehicle.toFixed(2).replace('.', ',') : '0,00';
          
          const userName = calc.userName ? `"${calc.userName.replace(/"/g, '""')}"` : '""';
          csv += `${calc.id},"${calc.companyName.replace(/"/g, '""')}",${calc.fleetSize},${calc.totalTires},"${date}",R$ ${formattedSavingsPerTire},R$ ${formattedTotalSavings},${calc.vehiclesWithTracking || 0},R$ ${trackingCost},${userName}\n`;
        });
        
        // Configurar headers para download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=simulacoes_ecotruck_${currentDate}.csv`);
        
        return res.status(200).send(csv);
      }
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      return res.status(500).json({ message: "Erro ao exportar dados" });
    }
  });

  // Preview do PDF das fórmulas (nova versão) - REMOVENDO AUTENTICAÇÃO TEMPORARIAMENTE
  app.get("/api/admin/formulas-pdf-preview-v2", async (req: Request, res: Response) => {
    try {
      console.log('🚀 GERANDO PDF DAS FÓRMULAS - VERSÃO 2.0 ATUALIZADA');
      const pdfBuffer = await generateFormulasPDF();
      
      // Headers para evitar cache
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=formulas_ecotruck_v2.pdf');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error("Erro ao gerar preview do PDF das fórmulas:", error);
      return res.status(500).json({ message: "Erro ao gerar preview do PDF" });
    }
  });

  // Enviar PDF das fórmulas por email
  app.post("/api/admin/send-formulas-pdf", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { email, customMessage } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      // Gerar PDF das fórmulas
      const pdfBuffer = await generateFormulasPDF();
      
      // Enviar por email usando o serviço de email existente
      const emailSent = await sendFormulasEmail({
        to: email,
        customMessage: customMessage,
        pdfBuffer: pdfBuffer
      });

      if (emailSent) {
        res.json({ message: "PDF das fórmulas enviado com sucesso!" });
      } else {
        res.status(500).json({ message: "Erro ao enviar email" });
      }
      
    } catch (error) {
      console.error("Erro ao enviar PDF das fórmulas:", error);
      return res.status(500).json({ message: "Erro ao enviar PDF das fórmulas" });
    }
  });

  // API para comparação de simulações
  app.get("/api/admin/comparison", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const ids = req.query.ids;
      
      if (!ids) {
        return res.status(400).json({ message: "IDs das simulações são obrigatórios" });
      }

      // Converter IDs para array de números
      const simulationIds = Array.isArray(ids) ? ids.map(id => parseInt(id as string)) : [parseInt(ids as string)];
      
      if (simulationIds.some(id => isNaN(id))) {
        return res.status(400).json({ message: "IDs inválidos" });
      }

      // Buscar as simulações no banco de dados
      const { pool } = await import('./db');
      
      // Query SQL direta para buscar as simulações
      const placeholders = simulationIds.map((_, index) => `$${index + 1}`).join(',');
      const query = `
        SELECT 
          id,
          company_name as "companyName",
          fleet_size as "fleetSize",
          total_tires as "totalTires",
          fuel_consumption as "fuelConsumption",
          fuel_price as "fuelPrice",
          monthly_mileage as "monthlyMileage",
          tire_lifespan as "tireLifespan",
          tire_price as "tirePrice",
          retread_price as "retreadPrice",
          tire_pressure_check as "tirePressureCheck",
          retreading_cycles as "retreadingCycles",
          vehicles_with_tracking as "vehiclesWithTracking",
          tracking_cost_per_vehicle as "trackingCostPerVehicle",
          fuel_savings_percentage as "fuelSavingsPercentage",
          cpk_improvement_percentage as "cpkImprovementPercentage",
          carcass_savings_percentage as "carcassSavingsPercentage",
          r1_tire_lifespan as "r1TireLifespan",
          r2_tire_lifespan as "r2TireLifespan",
          submitted_at as "submittedAt",
          savings_per_tire_per_month as "savingsPerTirePerMonth",
          total_savings as "totalSavings",
          user_name as "userName"
        FROM calculations
        WHERE id IN (${placeholders})
        ORDER BY submitted_at ASC
      `;

      const result = await pool.query(query, simulationIds);
      const simulations = result.rows;

      // Transformar os dados para o formato esperado pelo frontend
      const formattedSimulations = simulations.map(calc => ({
        id: calc.id,
        companyName: calc.companyName,
        fleetSize: calc.fleetSize,
        totalTires: calc.totalTires,
        fuelConsumption: calc.fuelConsumption,
        fuelPrice: calc.fuelPrice,
        monthlyMileage: calc.monthlyMileage,
        tireLifespan: calc.tireLifespan,
        tirePrice: calc.tirePrice,
        retreadPrice: calc.retreadPrice,
        tirePressureCheck: calc.tirePressureCheck,
        retreadingCycles: calc.retreadingCycles,
        vehiclesWithTracking: calc.vehiclesWithTracking,
        trackingCostPerVehicle: calc.trackingCostPerVehicle,
        fuelSavingsPercentage: calc.fuelSavingsPercentage,
        cpkImprovementPercentage: calc.cpkImprovementPercentage,
        carcassSavingsPercentage: calc.carcassSavingsPercentage,
        r1TireLifespan: calc.r1TireLifespan,
        r2TireLifespan: calc.r2TireLifespan,
        submittedAt: calc.submittedAt,
        savingsPerTirePerMonth: calc.savingsPerTirePerMonth,
        totalSavings: calc.totalSavings,
        userName: calc.userName || 'N/A'
      }));

      res.json(formattedSimulations);
    } catch (error) {
      console.error("Erro ao buscar simulações para comparação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
}