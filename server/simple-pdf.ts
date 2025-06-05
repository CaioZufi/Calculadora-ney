import PDFDocument from 'pdfkit';
import { Express, Request, Response } from 'express';

export function setupSimplePDFRoute(app: Express) {
  app.get("/api/formulas-pdf-clean", async (req: Request, res: Response) => {
    try {
      console.log('🎯 GERANDO PDF LIMPO DAS FÓRMULAS');
      
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Set headers before streaming
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=formulas_ecotruck.pdf');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      // Pipe directly to response
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
}