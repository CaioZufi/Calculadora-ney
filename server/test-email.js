import { sendEmail } from './email-service.ts';

async function testEmailSending() {
  console.log('🚀 Iniciando teste de envio de e-mail...');
  
  const testEmailParams = {
    to: 'caiozuffi05@gmail.com',
    from: 'noreply@ecotruck.com.br',
    subject: 'Teste de E-mail - Configuração Brevo/Domínio',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🧪 Teste de E-mail - Sistema Ecotruck</h2>
        <p>Este é um e-mail de teste para verificar a configuração do domínio no Brevo.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">📋 Detalhes do teste:</h3>
          <ul style="color: #374151;">
            <li>✅ Enviado através do sistema Ecotruck</li>
            <li>✅ Teste de configuração de remetente</li>
            <li>✅ Verificação de entrega via Brevo</li>
            <li>✅ Teste de formatação HTML</li>
          </ul>
        </div>
        
        <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #166534;"><strong>✅ Se você recebeu este e-mail, a configuração está funcionando corretamente!</strong></p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;"><em>🚛 Equipe Ecotruck - Sistema de Simulação de Economia de Pneus</em></p>
        <p style="color: #9ca3af; font-size: 12px;">Data do teste: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    `,
    text: `
Teste de E-mail - Sistema Ecotruck

Este é um e-mail de teste para verificar a configuração do domínio no Brevo.

Detalhes do teste:
- Enviado através do sistema Ecotruck
- Teste de configuração de remetente  
- Verificação de entrega via Brevo
- Teste de formatação

Se você recebeu este e-mail, a configuração está funcionando corretamente!

Equipe Ecotruck - Sistema de Simulação de Economia de Pneus
Data do teste: ${new Date().toLocaleString('pt-BR')}
    `
  };

  try {
    const success = await sendEmail(testEmailParams);
    
    if (success) {
      console.log('✅ E-mail de teste enviado com sucesso para caiozuffi05@gmail.com');
      console.log('📧 Verifique sua caixa de entrada (e spam) para ver como ficou o remetente');
    } else {
      console.log('❌ Falha ao enviar e-mail de teste');
    }
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error.message);
  }
}

testEmailSending();