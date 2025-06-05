import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { calculatorFormSchema, savingsResultSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAdminRoutes } from "./admin";
import { setupAppAuth } from "./auth-app";
import { sendEmail } from "./email-service";
import { calculateSavings } from "./lib/calculator";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar rotas administrativas
  setupAdminRoutes(app);
  
  // Configurar rotas de autenticação de usuários do app
  setupAppAuth(app);
  
  // Calculate savings endpoint
  app.post("/api/calculate", async (req: Request, res: Response) => {
    try {
      // Extrair sessionId e valores customizados do corpo da requisição
      const { sessionId, customCarcassSavingsPercentage, ...formDataRaw } = req.body;
      
      // Verificar se temos um valor personalizado para economia na carcaça
      // Este é um hack para resolver o problema persistente com essa variável
      if (req.query.carcassSavingsPercentage) {
        console.log(`Valor recebido via query: ${req.query.carcassSavingsPercentage}%`);
        formDataRaw.carcassSavingsPercentage = Number(req.query.carcassSavingsPercentage);
      }
      
      // Verificar se existe customCarcassSavingsPercentage no corpo da requisição
      if (customCarcassSavingsPercentage) {
        formDataRaw.carcassSavingsPercentage = Number(customCarcassSavingsPercentage);
        console.log(`Usando valor personalizado: ${formDataRaw.carcassSavingsPercentage}%`);
      }
      
      // Garantir que campos numéricos sejam realmente números
      const processedData = {
        ...formDataRaw,
        vehiclesWithTracking: formDataRaw.vehiclesWithTracking !== undefined ? Number(formDataRaw.vehiclesWithTracking) : undefined,
        trackingCostPerVehicle: formDataRaw.trackingCostPerVehicle !== undefined ? Number(formDataRaw.trackingCostPerVehicle) : undefined,
        // Forçar o valor personalizado para economia na carcaça se estiver presente
        carcassSavingsPercentage: formDataRaw.carcassSavingsPercentage,
      };
      
      // Validate form data
      const formData = calculatorFormSchema.parse(processedData);
      
      // Calculate savings using the business logic
      const calculationResults = calculateSavings(formData);
      
      // Log para debug
      console.log("Cálculo realizado (POST /api/calculate):", {
        fuelSavings: calculationResults.itemizedSavings.fuelSavings,
        trackingCost: calculationResults.tracking?.trackingTotalCost || 0,
        perTire: calculationResults.savingsPerTirePerMonth,
        total: calculationResults.itemizedSavings.total,
        formData: {
          monthlyMileage: formData.monthlyMileage,
          fuelPrice: formData.fuelPrice,
          fleetSize: formData.fleetSize,
          tireLifespan: formData.tireLifespan,
          r1TireLifespan: formData.r1TireLifespan,
          r2TireLifespan: formData.r2TireLifespan,
          retreadingCycles: formData.retreadingCycles,
          vehiclesWithTracking: formData.vehiclesWithTracking,
          trackingCostPerVehicle: formData.trackingCostPerVehicle
        }
      });

      // Store calculation in the database with session info and user ID (if authenticated)
      const appUserId = req.session.appUserId;
      const additionalGains = req.body.additionalGains; // Capturar Ganhos Adicionais da requisição
      const savedCalculation = await storage.saveCalculation(formData, calculationResults, sessionId, appUserId, additionalGains);
      
      // Return the results
      return res.status(200).json({
        ...calculationResults,
        calculationId: savedCalculation.id
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error calculating savings:", error);
      return res.status(500).json({ message: "Erro ao calcular economia" });
    }
  });

  // Send email endpoint
  app.post("/api/send-email", async (req: Request, res: Response) => {
    try {
      const { email, calculationId } = req.body;
      
      if (!email || !calculationId) {
        return res.status(400).json({ message: "Email e ID do cálculo são obrigatórios" });
      }
      
      // Verificar se o cálculo existe
      const calculation = await storage.getCalculationById(calculationId);
      if (!calculation) {
        return res.status(404).json({ message: "Cálculo não encontrado" });
      }
      
      // Gerar o conteúdo do e-mail com os resultados
      const sender = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #f59e0b;">Resultado da Simulação Ecotruck</h1>
          </div>
          
          <p>Olá,</p>
          
          <p>Segue o resultado da sua simulação de economia com o sistema de gestão de pneus da Ecotruck:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #334155;">Detalhes da Simulação</h3>
            <p><strong>Empresa:</strong> ${calculation.companyName}</p>
            <p><strong>Frota:</strong> ${calculation.fleetSize} veículos</p>
            <p><strong>Total de Pneus:</strong> ${calculation.totalTires}</p>
            <p><strong>Economia Total Mensal:</strong> R$ ${(calculation.totalSavings).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            <p><strong>Economia Total Anual:</strong> R$ ${(calculation.totalSavings * 12).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          
          <p>Para visualizar todos os detalhes da simulação, acesse sua conta na plataforma Ecotruck.</p>
          
          <p>Atenciosamente,<br>Equipe Ecotruck</p>
        </div>
      `;
      
      // Enviar o e-mail usando o serviço de e-mail
      const emailSent = await sendEmail({
        to: email,
        from: sender,
        subject: `Resultado da Simulação - ${calculation.companyName}`,
        html: html,
        text: `Olá, Segue o resultado da sua simulação de economia com o sistema de gestão de pneus da Ecotruck. Economia Total Mensal: R$ ${calculation.totalSavings.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}. Economia Total Anual: R$ ${(calculation.totalSavings * 12).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}.`
      });
      
      if (emailSent) {
        return res.status(200).json({ message: "Email enviado com sucesso" });
      } else {
        return res.status(500).json({ message: "Erro ao enviar o email" });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ message: "Erro ao enviar email" });
    }
  });

  // Get last calculation for a session
  app.get("/api/last-calculation", async (req: Request, res: Response) => {
    try {
      const { sessionId, userId } = req.query;
      
      let lastCalculation;
      
      // Se tivermos um userId, usamos esse como prioridade
      if (userId) {
        // Buscamos o último cálculo pelo ID do usuário
        lastCalculation = await storage.getLastCalculationByUserId(Number(userId));
      } else if (sessionId) {
        // Se não tivermos userId mas tivermos sessionId, buscamos pela sessão
        lastCalculation = await storage.getLastCalculation(sessionId as string);
      } else {
        // Se não tivermos nem userId nem sessionId, retornamos erro
        return res.status(400).json({ message: "ID da sessão ou ID do usuário é obrigatório" });
      }
      
      if (!lastCalculation) {
        return res.status(404).json({ message: "Nenhum cálculo encontrado" });
      }
      
      // Calcular os resultados usando a lógica de negócios
      const calculationResults = calculateSavings(lastCalculation);
      
      // Log para debug
      console.log(`Cálculo realizado (GET /api/last-calculation ${userId ? 'por userId' : 'por sessionId'}):`, {
        fuelSavings: calculationResults.itemizedSavings.fuelSavings,
        total: calculationResults.itemizedSavings.total,
        formData: {
          monthlyMileage: lastCalculation.monthlyMileage,
          fuelPrice: lastCalculation.fuelPrice,
          fleetSize: lastCalculation.fleetSize,
          tireLifespan: lastCalculation.tireLifespan,
          retreadingCycles: lastCalculation.retreadingCycles,
          r1TireLifespan: lastCalculation.r1TireLifespan,
          r2TireLifespan: lastCalculation.r2TireLifespan
        }
      });
      
      // Retornar os resultados
      return res.status(200).json({
        formData: {
          companyName: lastCalculation.companyName,
          fleetSize: lastCalculation.fleetSize,
          totalTires: lastCalculation.totalTires,
          fuelConsumption: lastCalculation.fuelConsumption,
          fuelPrice: lastCalculation.fuelPrice,
          monthlyMileage: lastCalculation.monthlyMileage,
          tireLifespan: lastCalculation.tireLifespan,
          tirePrice: lastCalculation.tirePrice,
          retreadPrice: lastCalculation.retreadPrice,
          tirePressureCheck: lastCalculation.tirePressureCheck,
          retreadingCycles: lastCalculation.retreadingCycles,
          // Incluir quilometragem dos pneus recapados (R1 e R2)
          r1TireLifespan: lastCalculation.r1TireLifespan,
          r2TireLifespan: lastCalculation.r2TireLifespan,
          // Incluir informações de rastreamento se existirem
          vehiclesWithTracking: lastCalculation.vehiclesWithTracking,
          trackingCostPerVehicle: lastCalculation.trackingCostPerVehicle,
          // Incluir também as variáveis de cálculo personalizadas, se existirem
          fuelSavingsPercentage: lastCalculation.fuelSavingsPercentage || 1,
          cpkImprovementPercentage: lastCalculation.cpkImprovementPercentage || 5,
          carcassSavingsPercentage: lastCalculation.carcassSavingsPercentage || 10, // Atualizado para 10%
          carcassSavingsFixedValue: lastCalculation.carcassSavingsFixedValue || 20
        },
        results: {
          ...calculationResults,
          calculationId: lastCalculation.id
        }
      });
    } catch (error) {
      console.error("Error retrieving last calculation:", error);
      return res.status(500).json({ message: "Erro ao recuperar último cálculo" });
    }
  });

  // Download PDF endpoint
  // Rota para PDF das fórmulas (versão funcional)
  app.get("/api/formulas-pdf-final", async (req: Request, res: Response) => {
    try {
      console.log('🎯 GERANDO PDF LIMPO DAS FÓRMULAS');
      
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=formulas_ecotruck.pdf');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      doc.pipe(res);

      // Header com logo da Ecotruck
      doc.circle(100, 70, 15).fill('#f59e0b');
      doc.fontSize(28).fillColor('black').text('ECOTRUCK', 130, 55);
      doc.fontSize(16).fillColor('black').text('FÓRMULAS DO SISTEMA', 50, 100, { align: 'center', width: 500 });
      doc.moveDown(3);

      // 1. Economia de Combustível
      doc.fontSize(18).fillColor('black').text('ECONOMIA DE COMBUSTÍVEL');
      doc.moveDown(1);
      doc.fontSize(12).fillColor('black').font('Courier');
      doc.text('fuelSavings = quilometragemMensal × frotas × (consumoAtual - consumoComSistema) × preçoCombustível');
      doc.text('consumoComSistema = consumoAtual × (1 - percentualEconomia/100)');
      doc.font('Helvetica').moveDown(2);

      // 2. CPK
      doc.fontSize(18).fillColor('black').text('CUSTO POR QUILÔMETRO (CPK)');
      doc.moveDown(1);
      doc.fontSize(12).fillColor('black').font('Courier');
      doc.text('cpkAtual = (preçoPneu + recapagens × preçoRecapagem) / vidaTotalPneu');
      doc.text('cpkComSistema = cpkAtual × (1 - percentualMelhoria/100)');
      doc.text('cpkSavings = (cpkAtual - cpkComSistema) × quilometragemMensal × totalPneus');
      doc.font('Helvetica').moveDown(2);

      // 3. Economia na Carcaça
      doc.fontSize(18).fillColor('black').text('ECONOMIA NA CARCAÇA');
      doc.moveDown(1);
      doc.fontSize(12).fillColor('black').font('Courier');
      doc.text('vidaTotalMeses = vidaTotalPneu / quilometragemMensal');
      doc.text('recapagensPorMês = totalPneus / vidaTotalMeses');
      doc.text('primeiraParte = (percentualEconomia/100) × recapagensPorMês × totalPneus');
      doc.text('custoTotal = preçoPneuNovo + (recapagens × preçoRecapagem)');
      doc.text('custoPorKm = custoTotal / vidaTotalPneu');
      doc.text('fatorReducao = 1 - (percentualEconomia/100)');
      doc.text('diferencaKm = vidaR1 + vidaR2');
      doc.text('segundaParte = custoPorKm × fatorReducao × diferencaKm');
      doc.text('carcassSavings = primeiraParte × segundaParte');
      doc.font('Helvetica').moveDown(2);

      // 4. Rastreamento
      doc.fontSize(18).fillColor('black').text('ECONOMIA COM RASTREAMENTO');
      doc.moveDown(1);
      doc.fontSize(12).fillColor('black').font('Courier');
      doc.text('trackingSavings = veiculosComRastreamento × custoPorVeiculo');
      doc.font('Helvetica').moveDown(3);

      // Rodapé
      doc.fontSize(10).fillColor('#888888').text('© 2025 Ecotruck - Sistema de Gestão de Pneus', 50, 700, { align: 'center', width: 500 });
      
      doc.end();
      
    } catch (error) {
      console.error("Erro ao gerar PDF limpo:", error);
      res.status(500).json({ message: "Erro ao gerar PDF" });
    }
  });

  app.get("/api/download-pdf", async (req: Request, res: Response) => {
    try {
      const { calculationId } = req.query;
      
      if (!calculationId) {
        return res.status(400).json({ message: "ID do cálculo não fornecido" });
      }
      
      // Buscar dados do cálculo (incluindo os Ganhos Adicionais salvos no banco)
      const calculation = await storage.getCalculationById(Number(calculationId));
      
      if (!calculation) {
        return res.status(404).json({ message: "Cálculo não encontrado" });
      }
      
      // Importar gerador de PDF
      const { generatePDF } = await import('./pdf-generator');
      
      // Log para debug
      console.log("📄 Gerando PDF com dados do banco:", {
        calculationId: calculation.id,
        hasAdditionalGains: !!calculation.additionalGains,
        companyName: calculation.companyName
      });
      
      // Gerar o PDF utilizando nosso gerador personalizado
      try {
        generatePDF(calculation, res);
        // Como a resposta é gerenciada dentro do gerador, não precisamos retornar nada aqui
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        return res.status(500).json({ message: "Erro ao gerar PDF" });
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      res.status(500).json({ message: "Erro ao gerar PDF" });
    }
  });

  // NOVA ROTA para cálculo direto que preserva valores personalizados
  app.post("/api/calculate-direct", async (req: Request, res: Response) => {
    try {
      console.log("⚠️ USANDO ROTA DIRETA COM VALORES PERSONALIZADOS");
      
      // Extrair valores diretamente do corpo sem manipulação
      const { sessionId, ...formDataRaw } = req.body;
      
      // Imprimir valores personalizados para debug
      console.log("📊 VALORES PERSONALIZADOS RECEBIDOS:", {
        combustível: `${formDataRaw.fuelSavingsPercentage || 1}%`,
        cpk: `${formDataRaw.cpkImprovementPercentage || 5}%`,
        carcaça: `${formDataRaw.carcassSavingsPercentage || 10}%`
      });
      
      // Validar os dados do formulário sem nenhuma manipulação
      const formData = calculatorFormSchema.parse(formDataRaw);
      
      // Executar cálculo com os valores personalizados exatos
      const calculationResults = calculateSavings(formData);
      
      // Log completo para debug
      console.log("✅ CÁLCULO DIRETO REALIZADO:", {
        fuelSavingsPercentage: formData.fuelSavingsPercentage,
        cpkImprovementPercentage: formData.cpkImprovementPercentage,
        carcassSavingsPercentage: formData.carcassSavingsPercentage,
        resultados: {
          total: calculationResults.itemizedSavings.total,
          fuelSavings: calculationResults.itemizedSavings.fuelSavings,
          cpkSavings: calculationResults.itemizedSavings.cpkImprovement,
          carcassSavings: calculationResults.itemizedSavings.carcassSavings,
          perTire: calculationResults.savingsPerTirePerMonth
        }
      });
      
      // Salvar o cálculo no banco de dados com os valores personalizados
      const savedCalculation = await storage.saveCalculation(
        formData, 
        calculationResults, 
        sessionId,
        req.session.appUserId
      );
      
      // Retornar os resultados do cálculo
      res.status(200).json({
        ...calculationResults,
        calculationId: savedCalculation.id
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          message: "Erro de validação no formulário",
          details: validationError.message
        });
      }
      
      console.error("❌ ERRO NO CÁLCULO DIRETO:", error);
      res.status(500).json({ message: "Erro ao processar cálculo direto" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;}
