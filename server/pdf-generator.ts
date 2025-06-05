import { Response } from "express";
import PDFDocument from "pdfkit";
import { Calculation } from "@shared/schema";

// Função para formatar valores monetários no padrão brasileiro
const formatCurrency = (value: number): string => {
  return `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
};

// Função para formatar números no padrão brasileiro (com separador de milhar)
const formatNumber = (value: number): string => {
  return value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Função para formatar datas no padrão brasileiro
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

/**
 * Gera um PDF com o relatório de economia
 * Implementação otimizada para garantir alinhamento perfeito e uma única página
 */
export function generatePDF(calculation: Calculation, res: Response) {
  try {
    // Configuração da página
    const margin = 30;
    const pageWidth = 595.28; // A4 width
    const contentWidth = pageWidth - (margin * 2);
    
    // Criar documento PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: margin,
      compress: true,
      info: {
        Title: `Relatório de Economia - ${calculation.companyName}`,
        Author: 'Ecotruck',
        Subject: 'Simulação de Economia'
      }
    });
    
    // Configurar cabeçalhos HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-economia-${calculation.companyName.replace(/\s+/g, '-')}.pdf`);
    
    // Pipe do PDF para a resposta
    doc.pipe(res);
    
    // ============= CABEÇALHO =============
    doc.fontSize(16)
       .fillColor('#000')
       .text('Relatório de Economia - Ecotruck', { align: 'center' });
       
    doc.fontSize(12)
       .fillColor('#333')
       .text('Simulação de ganhos com o sistema de gestão de pneus', { align: 'center' });
    
    doc.moveDown(1);
    
    // ============= DADOS DA EMPRESA E VALOR MENSAL =============
    const companyY = doc.y + 10; // Baixado a posição da empresa conforme as setas amarelas
    doc.fontSize(10).fillColor('#000');
    doc.text('Empresa:', margin, companyY);
    
    // Forçar nome da empresa em CAIXA ALTA
    const companyNameUpper = String(calculation.companyName).toUpperCase();
    doc.font('Helvetica-Bold');
    doc.text(companyNameUpper, margin + 60, companyY);
    doc.font('Helvetica');
    
    // Mostrar a data abaixo, conforme seta verde
    doc.fontSize(9);
    doc.font('Helvetica');
    doc.text(`Data: ${formatDate(calculation.submittedAt)}`, 
             margin, companyY + 60, { width: 120, align: 'left' });
             
    // Posicionar os dois blocos de valores lado a lado (centralização melhorada)
    const middlePositionY = companyY + 40;
    const blockWidth = 110; // Aumentei a largura do bloco
    const spacing = 40; // Aumentei o espaçamento entre os blocos
    
    // Ajustando posição para a direita
    const rightSidePosition = pageWidth - margin - 260; // Colocando mais para a direita
    
    // Primeiro bloco - Valor por pneu (anteriormente retângulo vermelho)
    const block1X = rightSidePosition;
    doc.fontSize(14);
    doc.font('Helvetica-Bold');
    doc.text(`R$ ${calculation.savingsPerTirePerMonth.toFixed(2).replace('.', ',')}`, 
             block1X, middlePositionY, { width: blockWidth, align: 'center' });
    doc.font('Helvetica');
    doc.fontSize(8);
    doc.text('por mês por pneu', block1X, middlePositionY + 20, { width: blockWidth, align: 'center' });
             
    // Segundo bloco - Valor anual (anteriormente retângulo cinza)
    const block2X = block1X + blockWidth + spacing;
    
    // Calcular ganhos adicionais para o valor anual destacado
    let additionalGainsForHeader = 0;
    let additionalGainsArray = [];
    try {
      if (calculation.additionalGains) {
        if (typeof calculation.additionalGains === 'string') {
          additionalGainsArray = JSON.parse(calculation.additionalGains);
        } else if (Array.isArray(calculation.additionalGains)) {
          additionalGainsArray = calculation.additionalGains;
        }
        
        additionalGainsForHeader = additionalGainsArray
          .filter((gain: any) => gain.name?.trim() && gain.value > 0)
          .reduce((total: number, gain: any) => total + Number(gain.value), 0);
          
        console.log('💰 Ganhos Adicionais carregados do banco para PDF:', {
          total: additionalGainsForHeader,
          items: additionalGainsArray.length
        });
      }
    } catch (error) {
      console.log('Erro ao carregar ganhos adicionais para cabeçalho:', error);
    }
    
    const annualTotalDisplay = (calculation.totalSavings + additionalGainsForHeader) * 12;
    doc.fontSize(14); // Igualei o tamanho da fonte com o outro bloco
    doc.font('Helvetica-Bold');
    doc.text(formatCurrency(annualTotalDisplay), 
             block2X, middlePositionY, { width: blockWidth, align: 'center' });
    doc.font('Helvetica');
    doc.fontSize(8);
    doc.text('economia anual', block2X, middlePositionY + 20, { width: blockWidth, align: 'center' }); // Ajustado para ficar igual ao outro bloco
    
    doc.moveDown(2);
    
    // ============= TABELA DE ECONOMIA =============
    // Título
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Detalhamento da Economia', margin, doc.y);
    
    // Linha superior
    const economyTableTop = doc.y + 5;
    doc.moveTo(margin, economyTableTop)
       .lineTo(pageWidth - margin, economyTableTop)
       .stroke();
    
    // Cabeçalhos
    const headerY = economyTableTop + 10;
    doc.font('Helvetica-Bold')
       .fontSize(9);
       
    doc.text('Categoria', margin + 5, headerY);
    doc.text('Valor Mensal', pageWidth - margin - 120, headerY, { align: 'right' });
    
    // Linha após cabeçalhos
    const headerLineY = headerY + 15;
    doc.moveTo(margin, headerLineY)
       .lineTo(pageWidth - margin, headerLineY)
       .stroke();
    
    // Itens 
    doc.font('Helvetica').fontSize(9);
    
    // Posições Y fixas com espaçamento consistente
    const row1Y = headerLineY + 15;
    const row2Y = row1Y + 18;
    const row3Y = row2Y + 18;
    const row4Y = row3Y + 18;
    
    // Economia de Combustível
    doc.text('Economia de Combustível', margin + 5, row1Y);
    doc.text(formatCurrency(calculation.fuelSavings), pageWidth - margin - 120, row1Y, { align: 'right' });
    
    // Melhoria no CPK
    doc.text('Melhoria no CPK', margin + 5, row2Y);
    doc.text(formatCurrency(calculation.cpkImprovement), pageWidth - margin - 120, row2Y, { align: 'right' });
    
    // Economia na Carcaça
    doc.text('Economia na Carcaça', margin + 5, row3Y);
    doc.text(formatCurrency(calculation.carcassSavings), pageWidth - margin - 120, row3Y, { align: 'right' });
    
    // Economia no Rastreamento - usar valor salvo no banco
    const trackingCost = calculation.trackingTotalCost || 0;
    
    doc.text('Economia no Rastreamento', margin + 5, row4Y);
    doc.text(formatCurrency(trackingCost), pageWidth - margin - 120, row4Y, { align: 'right' });
    
    // Ganhos Adicionais
    const row5Y = row4Y + 18;
    let additionalGainsTotal = 0;
    
    // Carregar ganhos adicionais dos dados salvos no banco
    try {
      if (calculation.additionalGains) {
        let gainsArray = [];
        if (typeof calculation.additionalGains === 'string') {
          gainsArray = JSON.parse(calculation.additionalGains);
        } else if (Array.isArray(calculation.additionalGains)) {
          gainsArray = calculation.additionalGains;
        }
        
        additionalGainsTotal = gainsArray
          .filter((gain: any) => gain.name?.trim() && gain.value > 0)
          .reduce((total: number, gain: any) => total + Number(gain.value), 0);
          
        console.log('💰 Ganhos Adicionais na seção detalhada do PDF:', {
          total: additionalGainsTotal,
          items: gainsArray.length
        });
      }
    } catch (error) {
      console.log('Erro ao carregar ganhos adicionais no PDF:', error);
    }
    
    doc.text('Ganhos Adicionais', margin + 5, row5Y);
    doc.text(formatCurrency(additionalGainsTotal), pageWidth - margin - 120, row5Y, { align: 'right' });
    
    // Linha antes dos totais
    const subtotalLineY = row5Y + 18;
    doc.moveTo(margin, subtotalLineY)
       .lineTo(pageWidth - margin, subtotalLineY)
       .stroke();
    
    // Totais 
    const monthTotalY = subtotalLineY + 15;
    const yearTotalY = monthTotalY + 18;
    
    // Total Mensal (incluindo ganhos adicionais)
    const totalWithAdditionalGains = calculation.totalSavings + additionalGainsTotal;
    doc.text('Mês', margin + 5, monthTotalY);
    doc.text(formatCurrency(totalWithAdditionalGains), pageWidth - margin - 120, monthTotalY, { align: 'right' });
    
    // Total Anual (incluindo ganhos adicionais)
    doc.text('Ano', margin + 5, yearTotalY);
    doc.text(formatCurrency(totalWithAdditionalGains * 12), pageWidth - margin - 120, yearTotalY, { align: 'right' });
    
    // Linha final da tabela de economia
    const economyTableBottom = yearTotalY + 18;
    doc.moveTo(margin, economyTableBottom)
       .lineTo(pageWidth - margin, economyTableBottom)
       .stroke();
    
    // ============= TABELA DE PARÂMETROS =============
    // Título com espaçamento adequado
    const paramsTableTop = economyTableBottom + 25;
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .text('Parâmetros utilizados na Simulação', margin, paramsTableTop);
    
    // Linha superior
    const paramsLineTop = paramsTableTop + 15;
    doc.moveTo(margin, paramsLineTop)
       .lineTo(pageWidth - margin, paramsLineTop)
       .stroke();
    
    // Cabeçalhos
    const paramsHeaderY = paramsLineTop + 10;
    doc.fontSize(9);
    doc.text('Parâmetro', margin + 5, paramsHeaderY);
    doc.text('Valor', pageWidth - margin - 120, paramsHeaderY, { align: 'right' });
    
    // Linha após cabeçalhos
    const paramsHeaderLineY = paramsHeaderY + 15;
    doc.moveTo(margin, paramsHeaderLineY)
       .lineTo(pageWidth - margin, paramsHeaderLineY)
       .stroke();
    
    // Lista de parâmetros com posicionamento preciso
    doc.font('Helvetica').fontSize(8);
    
    // Array de parâmetros para exibição
    const params = [
      { name: 'Tamanho da Frota', value: `${formatNumber(calculation.fleetSize)} veículos` },
      { name: 'Total de Pneus', value: `${formatNumber(calculation.totalTires)} pneus` },
      { name: 'Preço do pneu novo', value: formatCurrency(calculation.tirePrice) },
      { name: 'Preço do diesel', value: formatCurrency(calculation.fuelPrice) },
      { name: 'Consumo de combustível', value: `${calculation.fuelConsumption.toFixed(2).replace('.', ',')} km/l` },
      { name: 'Quilometragem Mensal', value: `${formatNumber(calculation.monthlyMileage)} km` },
      { name: 'Vida útil do pneu novo', value: `${formatNumber(calculation.tireLifespan)} km` },
      { name: 'Vida útil do R1', value: `${formatNumber(calculation.r1TireLifespan || 0)} km` },
      { name: 'Vida útil do R2', value: `${formatNumber(calculation.r2TireLifespan || 0)} km` },
      { name: 'Preço da Recapagem', value: `R$ ${calculation.retreadPrice.toFixed(2).replace('.', ',')}` },
      { name: 'Ciclo de Recapagem', value: `${calculation.retreadingCycles} x` },
      { name: 'Verificação da calibragem', value: calculation.tirePressureCheck === 'diaria' ? 'Diária' : 
                                              calculation.tirePressureCheck === 'semanal' ? 'Semanal' : 
                                              calculation.tirePressureCheck === 'quinzenal' ? 'Quinzenal' : 'Mensal' }
    ];
    
    // Renderizar parâmetros com espaçamento preciso
    let currentParamY = paramsHeaderLineY + 15;
    const paramRowHeight = 16; // Altura fixa para cada linha de parâmetro
    
    params.forEach(param => {
      doc.text(param.name, margin + 5, currentParamY);
      doc.text(param.value, pageWidth - margin - 120, currentParamY, { align: 'right' });
      currentParamY += paramRowHeight;
    });
    
    // ============= VARIÁVEIS DE CÁLCULO =============
    // Linha superior das variáveis
    const varsLineTop = currentParamY + 5;
    doc.moveTo(margin, varsLineTop)
       .lineTo(pageWidth - margin, varsLineTop)
       .stroke();
    
    // Título das variáveis
    const varsHeaderY = varsLineTop + 15;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Variáveis de Cálculo:', margin + 5, varsHeaderY);
    
    // Valores das variáveis em uma linha compacta
    const varsValuesY = varsHeaderY + 15;
    doc.font('Helvetica').fontSize(8);
    doc.text(`Economia de Combustível: ${calculation.fuelSavingsPercentage}% • Melhoria no CPK: ${calculation.cpkImprovementPercentage}% • Economia na Carcaça: ${calculation.carcassSavingsPercentage}%`, 
            margin + 5, varsValuesY, { width: contentWidth - 10 });
    
    // Linha final após variáveis
    const varsLineBottom = varsValuesY + 15;
    doc.moveTo(margin, varsLineBottom)
       .lineTo(pageWidth - margin, varsLineBottom)
       .stroke();
    
    // Adicionar um rodapé informativo na primeira página
    doc.font('Helvetica-Oblique').fontSize(8);
    doc.text('Veja a segunda página para detalhamento dos Ganhos Adicionais', margin, doc.page.height - margin - 10, {
      align: 'center',
      width: contentWidth
    });
    
    // ============= INICIAR NOVA PÁGINA PARA OS GANHOS ADICIONAIS =============
    doc.addPage();
    
    // Adicionar um cabeçalho na segunda página para manter a identidade
    doc.fontSize(12)
       .fillColor('#000')
       .font('Helvetica-Bold')
       .text('Relatório de Economia - Ecotruck', { align: 'center' });
    
    doc.fontSize(10)
       .fillColor('#333')
       .font('Helvetica')
       .text(`Empresa: ${companyNameUpper}`, { align: 'center' });
    
    doc.moveDown(2);
    
    // ============= TABELA DE GANHOS ADICIONAIS =============
    // Título da tabela
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .text('Ganhos Adicionais', margin, doc.y);
       
    // Texto explicativo abaixo do título
    doc.font('Helvetica')
       .fontSize(9)
       .moveDown(0.5)
       .text('O cliente poderá simular os custos descritos abaixo em função dos seus próprios dados correntes e/ou pelas despesas de experiências passadas.', 
              margin, doc.y, { width: contentWidth - 10 });
    
    doc.moveDown(1);
    
    // Linha superior
    const additionalLineTop = doc.y;
    doc.moveTo(margin, additionalLineTop)
       .lineTo(pageWidth - margin, additionalLineTop)
       .stroke();
    
    // Cabeçalhos
    const additionalHeaderY = additionalLineTop + 10;
    doc.fontSize(10)
       .font('Helvetica-Bold');
    doc.text('Custos/Despesas', margin + 5, additionalHeaderY);
    doc.text('Valor (R$) / mês', pageWidth - margin - 120, additionalHeaderY, { align: 'right' });
    
    // Linha após cabeçalhos
    const additionalHeaderLineY = additionalHeaderY + 15;
    doc.moveTo(margin, additionalHeaderLineY)
       .lineTo(pageWidth - margin, additionalHeaderLineY)
       .stroke();
    
    // Lista de ganhos adicionais - carregados dos dados salvos ou valores padrão
    doc.font('Helvetica').fontSize(9);
    
    // Carregar ganhos adicionais dos dados salvos no banco
    let additionalGains = [];
    
    try {
      // Se houver dados de ganhos adicionais na simulação, use-os
      if (calculation.additionalGains) {
        let gainsArray = [];
        if (typeof calculation.additionalGains === 'string') {
          gainsArray = JSON.parse(calculation.additionalGains);
        } else if (Array.isArray(calculation.additionalGains)) {
          gainsArray = calculation.additionalGains;
        }
        
        additionalGains = gainsArray.filter((gain: any) => gain.name?.trim() && gain.value > 0);
        
        console.log('💰 Ganhos Adicionais na seção detalhada expandida do PDF:', {
          total: additionalGains.length,
          items: additionalGains
        });
      }
      
      // Se não houver dados salvos, usar lista padrão vazia para o usuário preencher
      if (additionalGains.length === 0) {
        additionalGains = [
          { name: 'Custo dos Funcionários para realizar a calibragem em todos os pneus', value: '' },
          { name: 'Custo do Tempo dos veículos parados no patio/posto para realizar a Calibragem', value: '' },
          { name: 'Custo para consertar os Veículos acidentados', value: '' },
          { name: 'Valor da reposiçao dos veiculos incendiados e indenizaçao das cargas afetadas', value: '' },
          { name: 'Valor dos gastos medicos e hospitalares em caso de acidente grave', value: '' },
          { name: 'Despesas por indenizaçao pelo Danos Ambientais causados', value: '' },
          { name: 'Valor da reposiçao de Roubos e Desvios de Pneus', value: '' },
          { name: 'Valor da Redução de Pessoal com Gestão de Pneus', value: '' },
          { name: 'Controle e eficiencia na Gestao do Recapeamento', value: '' },
          { name: 'Controle da Gestão de Descarte', value: '' },
          { name: 'Controle da localizaçao de cada pneu indicando se esta em um veiculo, no estoque, na borracharia ou na recauchutadora', value: '' },
          { name: 'Obter estatisticas de qual tipo/marca de pneu tem melhor rendimento e custo beneficio de cada rota', value: '' }
        ];
      }
    } catch (error) {
      console.log('Erro ao carregar ganhos adicionais, usando valores padrão:', error);
      additionalGains = [
        { name: 'Custo dos Funcionários para realizar a calibragem em todos os pneus', value: '' },
        { name: 'Custo do Tempo dos veículos parados no patio/posto para realizar a Calibragem', value: '' },
        { name: 'Custo para consertar os Veículos acidentados', value: '' },
        { name: 'Valor da reposiçao dos veiculos incendiados e indenizaçao das cargas afetadas', value: '' },
        { name: 'Valor dos gastos medicos e hospitalares em caso de acidente grave', value: '' },
        { name: 'Despesas por indenizaçao pelo Danos Ambientais causados', value: '' },
        { name: 'Valor da reposiçao de Roubos e Desvios de Pneus', value: '' },
        { name: 'Valor da Redução de Pessoal com Gestão de Pneus', value: '' },
        { name: 'Controle e eficiencia na Gestao do Recapeamento', value: '' },
        { name: 'Controle da Gestão de Descarte', value: '' },
        { name: 'Controle da localizaçao de cada pneu indicando se esta em um veiculo, no estoque, na borracharia ou na recauchutadora', value: '' },
        { name: 'Obter estatisticas de qual tipo/marca de pneu tem melhor rendimento e custo beneficio de cada rota', value: '' }
      ];
    }
    
    // Renderizar linhas da tabela de ganhos adicionais
    let currentGainY = additionalHeaderLineY + 15;
    const gainRowHeight = 20; // Altura maior para cada linha (aumentada)
    
    let totalAdditionalGains = 0;
    
    additionalGains.forEach(gain => {
      doc.text(gain.name, margin + 5, currentGainY);
      
      // Formatar o valor se for numérico
      let displayValue = '';
      if (gain.value && typeof gain.value === 'number' && gain.value > 0) {
        displayValue = `R$ ${gain.value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
        totalAdditionalGains += gain.value;
      } else if (gain.value && typeof gain.value === 'string' && gain.value.trim()) {
        displayValue = gain.value;
      }
      
      doc.text(displayValue, pageWidth - margin - 120, currentGainY, { align: 'right' });
      currentGainY += gainRowHeight;
    });
    
    // Linha antes do total
    doc.moveTo(margin, currentGainY + 2)
       .lineTo(pageWidth - margin, currentGainY + 2)
       .stroke();
    
    // Total
    currentGainY += 15;
    doc.font('Helvetica-Bold');
    doc.text('Total de Ganhos Adicionais / mês', margin + 5, currentGainY);
    
    // Mostrar o total apenas se houver valores
    const totalDisplayValue = totalAdditionalGains > 0 
      ? `R$ ${totalAdditionalGains.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
      : '';
    doc.text(totalDisplayValue, pageWidth - margin - 120, currentGainY, { align: 'right' });
    
    // Linha final da tabela de ganhos adicionais
    currentGainY += gainRowHeight;
    doc.moveTo(margin, currentGainY)
       .lineTo(pageWidth - margin, currentGainY)
       .stroke();
    
    // Finalizar o documento
    doc.end();
    
    return true;
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return false;
  }
}