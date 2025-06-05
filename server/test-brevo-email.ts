import { config } from 'dotenv';
import { sendEmail } from './email-service';

// Carregar variáveis de ambiente
config();

async function testBrevoEmail() {
  console.log('🧪 Testando envio de e-mail com Brevo...');

  // Verificar se a API KEY está configurada
  if (!process.env.BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY não encontrada nas variáveis de ambiente.');
    return;
  }

  console.log('🔑 BREVO_API_KEY encontrada.');

  try {
    console.log('📧 Enviando e-mail de teste...');

    const success = await sendEmail({
      from: 'caio.zufi@ecotruck.com.br',
      to: 'caiozuffi05@gmail.com',
      subject: 'Teste do Brevo - Ecotruck',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #f59e0b;">✅ Teste do Brevo na Ecotruck</h1>
          <p>Este é um e-mail de teste enviado pela aplicação Ecotruck usando a API do Brevo.</p>
          <p>Se você está recebendo este e-mail, a configuração está funcionando perfeitamente!</p>
          <p><strong>Data/hora do teste:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <p style="color: #059669;">🎉 Integração Brevo configurada com sucesso!</p>
        </div>
      `,
      text: `Teste do Brevo - Ecotruck
      
      Este é um e-mail de teste enviado pela aplicação Ecotruck usando a API do Brevo.
      Se você está recebendo este e-mail, a configuração está funcionando perfeitamente!
      
      Data/hora do teste: ${new Date().toLocaleString('pt-BR')}
      
      Integração Brevo configurada com sucesso!`
    });

    if (success) {
      console.log('✅ E-mail enviado com sucesso via Brevo!');
    } else {
      console.log('❌ Falha no envio do e-mail.');
    }
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testBrevoEmail()
  .then(() => console.log('🏁 Teste concluído.'))
  .catch(error => console.error('❌ Erro inesperado:', error));