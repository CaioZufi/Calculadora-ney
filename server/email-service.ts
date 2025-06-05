import { AppUser } from '@shared/schema';

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding: string;
    type: string;
  }>;
}

/**
 * Envia um e-mail utilizando o Brevo (SendinBlue)
 * @param params Parâmetros do e-mail
 * @returns Sucesso ou falha no envio
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Verifica se a chave API está configurada
    if (!process.env.BREVO_API_KEY) {
      console.warn('BREVO_API_KEY não está configurada. O e-mail não será enviado.');
      return true;
    }

    // Extrair o email do campo 'from' se estiver no formato "Nome <email@domain.com>"
    const fromEmail = params.from.includes('<') 
      ? params.from.match(/<(.+)>/)?.[1] || params.from 
      : params.from;

    // Preparar o payload para a API do Brevo
    const emailData: any = {
      sender: { email: fromEmail },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.html || params.text || 'Email enviado pelo sistema Ecotruck',
      textContent: params.text || 'Email enviado pelo sistema Ecotruck'
    };

    // Adicionar anexos se fornecidos
    if (params.attachments && params.attachments.length > 0) {
      emailData.attachment = params.attachments.map(att => ({
        name: att.filename,
        content: att.content
      }));
    }

    // Enviar e-mail via API REST do Brevo
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro ao enviar e-mail via Brevo:', response.status, errorData);
      return false;
    }

    const result = await response.json();
    console.log('E-mail enviado com sucesso via Brevo:', result);
    return true;
  } catch (error) {
    console.error('Erro ao enviar e-mail via Brevo:', error);
    return false;
  }
}

/**
 * Envia um e-mail de boas-vindas para um novo usuário
 * @param user Dados do usuário recém-cadastrado
 * @param baseUrl URL base do aplicativo
 * @param provisionalPassword Senha provisória do usuário
 * @returns Sucesso ou falha no envio
 */
export async function sendWelcomeEmail(user: AppUser, baseUrl: string = 'https://ecotruck.com.br', provisionalPassword?: string): Promise<boolean> {
  const loginUrl = `${baseUrl}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #2563eb;">Bem-vindo à Ecotruck</h1>
      </div>
      
      <p>Olá, <strong>${user.firstName} ${user.lastName}</strong>!</p>
      
      <p>Seu cadastro na plataforma Ecotruck foi realizado com sucesso.</p>
      
      <p>Você agora tem acesso à nossa ferramenta de simulação de economia com o sistema de gestão de pneus.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Seus dados de acesso:</strong></p>
        <p>E-mail: <strong>${user.email}</strong></p>
        ${provisionalPassword ? `<p>Sua senha provisória: <strong>${provisionalPassword}</strong></p>` : '<p>Utilize a senha fornecida pelo administrador.</p>'}
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Acessar a Plataforma
        </a>
      </div>
      
      <p>Se tiver qualquer dúvida ou precisar de suporte, entre em contato com a nossa equipe.</p>
      
      <p>Atenciosamente,<br>Equipe Ecotruck</p>
    </div>
  `;
  
  // Definir o remetente do e-mail (domínio deve ser verificado no Brevo)
  const sender = process.env.BREVO_SENDER_EMAIL || 'caio.zufi@ecotruck.com.br';
  
  return sendEmail({
    to: user.email,
    from: sender,
    subject: 'Bem-vindo à Ecotruck - Seu cadastro foi concluído',
    html,
    text: `Olá, ${user.firstName} ${user.lastName}! Seu cadastro na plataforma Ecotruck foi realizado com sucesso. Seus dados de acesso: E-mail: ${user.email}${provisionalPassword ? `, Sua senha provisória: ${provisionalPassword}` : ', utilize a senha fornecida pelo administrador'}. Para acessar a plataforma, visite ${loginUrl}. Atenciosamente, Equipe Ecotruck.`
  });
}