import PDFDocument from 'pdfkit';
import { sendEmail } from './email-service';

/**
 * Gera um PDF com a documentação das fórmulas do sistema
 */
export async function generateFormulasPDF(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      console.log('🚀 INICIANDO GERAÇÃO DO PDF DAS FÓRMULAS - VERSÃO ATUALIZADA');
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'Fórmulas do Sistema Ecotruck',
          Author: 'Ecotruck',
          Subject: 'Documentação técnica das fórmulas de cálculo',
          Creator: 'Sistema Ecotruck'
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

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
      reject(error);
    }
  });
}

/**
 * Envia o PDF das fórmulas por email
 */
export async function sendFormulasEmail(params: {
  to: string;
  customMessage?: string;
  pdfBuffer: Buffer;
}): Promise<boolean> {
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Documentação das Fórmulas - Sistema Ecotruck</h2>
        
        <p>Olá!</p>
        
        ${params.customMessage ? `<p style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;"><strong>Mensagem personalizada:</strong><br>${params.customMessage}</p>` : ''}
        
        <p>Conforme solicitado, estamos enviando a documentação técnica completa das fórmulas utilizadas no Sistema de Cálculo de Economia Ecotruck.</p>
        
        <p>O documento em PDF anexo contém:</p>
        <ul>
          <li>Fórmula de Economia de Combustível</li>
          <li>Cálculo do Custo Por Quilômetro (CPK)</li>
          <li>Nova Fórmula de Economia na Carcaça</li>
          <li>Economia com Sistema de Rastreamento</li>
          <li>Ganhos Adicionais Personalizados</li>
          <li>Cálculo do Total de Economia</li>
        </ul>
        
        <p>Esta documentação técnica foi gerada em <strong>${new Date().toLocaleDateString('pt-BR')}</strong> e reflete as fórmulas atualmente em uso no sistema.</p>
        
        <p>Se você tiver dúvidas sobre qualquer uma das fórmulas ou precisar de esclarecimentos adicionais, não hesite em entrar em contato conosco.</p>
        
        <p>Atenciosamente,<br>
        <strong>Equipe Ecotruck</strong></p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          Este email foi enviado automaticamente pelo Sistema Ecotruck.<br>
          Para suporte técnico, entre em contato através dos nossos canais oficiais.
        </p>
      </div>
    `;

    // Convertendo o Buffer para base64 para anexar
    const pdfBase64 = params.pdfBuffer.toString('base64');

    // Criar versão texto do email
    const emailText = `
Documentação das Fórmulas - Sistema Ecotruck

Olá!

${params.customMessage ? `Mensagem personalizada: ${params.customMessage}\n\n` : ''}

Conforme solicitado, estamos enviando a documentação técnica completa das fórmulas utilizadas no Sistema de Cálculo de Economia Ecotruck.

O documento em PDF anexo contém:
- Fórmula de Economia de Combustível
- Cálculo do Custo Por Quilômetro (CPK)
- Nova Fórmula de Economia na Carcaça
- Economia com Sistema de Rastreamento
- Ganhos Adicionais Personalizados
- Cálculo do Total de Economia

Esta documentação técnica foi gerada em ${new Date().toLocaleDateString('pt-BR')} e reflete as fórmulas atualmente em uso no sistema.

Se você tiver dúvidas sobre qualquer uma das fórmulas ou precisar de esclarecimentos adicionais, não hesite em entrar em contato conosco.

Atenciosamente,
Equipe Ecotruck
    `;

    const emailSent = await sendEmail({
      to: params.to,
      from: 'caio.zufi@ecotruck.com.br',
      subject: 'Documentação das Fórmulas - Sistema Ecotruck',
      text: emailText,
      html: emailHtml,
      attachments: [{
        filename: `formulas_ecotruck_${new Date().toISOString().slice(0, 10)}.pdf`,
        content: pdfBase64,
        encoding: 'base64',
        type: 'application/pdf'
      }]
    });

    return emailSent;
  } catch (error) {
    console.error('Erro ao enviar email com PDF das fórmulas:', error);
    return false;
  }
}