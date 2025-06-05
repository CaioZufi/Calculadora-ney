import { Resend } from 'resend';
import { config } from 'dotenv';

// Carregar variáveis de ambiente se houver
config();

// Função principal que será executada
async function testResendEmail() {
  // Verificar se a API KEY está configurada
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY não encontrada nas variáveis de ambiente.');
    return;
  }

  console.log('🔑 RESEND_API_KEY encontrada.');
  
  // Inicializar o cliente Resend
  const resend = new Resend(apiKey);
  
  // Email de destino de teste 
  console.log('Por favor, informe para qual email você gostaria de enviar o teste:')
  const testEmail = process.argv[2] || 'test@example.com'; // Use o email fornecido como argumento ou um valor padrão
  
  try {
    console.log(`📧 Enviando email de teste para ${testEmail}...`);
    
    // Enviar email de teste
    const { data, error } = await resend.emails.send({
      from: 'Ecotruck <onboarding@resend.dev>', // email padrão do Resend para testes
      to: 'caiozuffi05@gmail.com', // Email de teste solicitado
      subject: 'Teste do Resend na aplicação Ecotruck',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #f59e0b;">Teste da API do Resend</h1>
          <p>Este é um email de teste enviado pela aplicação Ecotruck usando a API do Resend.</p>
          <p>Se você está recebendo este email, a configuração está funcionando corretamente!</p>
          <p>Data/hora do teste: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });
    
    if (error) {
      console.error('❌ Erro ao enviar email:', error);
    } else {
      console.log('✅ Email enviado com sucesso!');
      console.log('📋 Detalhes da resposta:', data);
    }
  } catch (error) {
    console.error('❌ Exceção ao enviar email:', error);
  }
}

// Executar a função principal
testResendEmail()
  .then(() => console.log('✨ Teste concluído.'))
  .catch(error => console.error('❌ Erro inesperado:', error));