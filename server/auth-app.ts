import { Request, Response, NextFunction, Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { AppUser } from "@shared/schema";
import { storage } from "./storage";
import { sendWelcomeEmail } from "./email-service";

declare global {
    namespace Express {
        interface Request {
            appUser?: AppUser;
        }
    }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function isAppAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (!req.session.appUserId) {
        return res.status(401).json({ message: "Não autenticado" });
    }
    next();
}

export function setupAppAuth(app: Express) {
    // Endpoint para criar usuários (somente admin pode acessar)
    app.post("/api/admin/users", async (req: Request, res: Response) => {
        try {
            console.log("Recebendo requisição para criar usuário:", { 
                body: { ...req.body, password: req.body.password ? "[REDACTED]" : undefined },
                isAdmin: req.session.isAdmin
            });

            // Verificar se o usuário é admin
            if (!req.session.isAdmin) {
                console.log("Tentativa de criação de usuário sem permissão de admin");
                return res.status(401).json({ message: "Não autorizado" });
            }

            // Validar dados obrigatórios
            if (!req.body.email || !req.body.password || !req.body.firstName || !req.body.lastName) {
                console.log("Dados obrigatórios faltando na requisição de criação de usuário");
                return res.status(400).json({ message: "Dados obrigatórios faltando" });
            }

            // Verificar se o email já existe
            console.log("Verificando se o email já existe:", req.body.email);
            const existingUser = await storage.getAppUserByEmail(req.body.email);
            if (existingUser) {
                console.log("Email já cadastrado para outro usuário:", req.body.email);
                return res.status(400).json({ message: "Este email já está cadastrado" });
            }

            // Hash da senha
            console.log("Gerando hash da senha...");
            const hashedPassword = await hashPassword(req.body.password);

            // Criar usuário
            console.log("Criando usuário no banco de dados...");
            const user = await storage.createAppUser({
                ...req.body,
                password: hashedPassword,
            });

            // Confirmar criação
            console.log("Usuário criado com sucesso:", { id: user.id, email: user.email });
            
            // Enviar e-mail de boas-vindas
            try {
                // Obter a URL base a partir do request ou usar uma padrão
                const protocol = req.headers["x-forwarded-proto"] || req.protocol;
                const host = req.headers.host || req.get("host");
                const baseUrl = `${protocol}://${host}`;
                
                console.log("Enviando e-mail de boas-vindas para:", user.email);
                const emailResult = await sendWelcomeEmail(user, baseUrl, req.body.password);
                console.log("Resultado do envio de e-mail:", emailResult ? "Enviado com sucesso" : "Falha no envio");
            } catch (emailError) {
                // Apenas logar o erro e continuar, não queremos que 
                // a falha no envio do e-mail impeça a criação do usuário
                console.error("Erro ao enviar e-mail de boas-vindas:", emailError);
            }

            // Remover senha antes de retornar
            const { password, ...userWithoutPassword } = user;
            res.status(201).json(userWithoutPassword);
        } catch (error) {
            console.error("Erro ao criar usuário:", error);
            // Retornar mensagem de erro mais descritiva
            res.status(500).json({ 
                message: "Erro ao criar usuário", 
                details: error instanceof Error ? error.message : "Erro desconhecido" 
            });
        }
    });

    // Endpoint para listar usuários (somente admin pode acessar)
    app.get("/api/admin/users", async (req: Request, res: Response) => {
        try {
            // Verificar se o usuário é admin
            if (!req.session.isAdmin) {
                return res.status(401).json({ message: "Não autorizado" });
            }

            const searchTerm = req.query.search as string | undefined;
            const users = await storage.getAppUsers(searchTerm);

            // Remover senhas antes de retornar
            const usersWithoutPasswords = users.map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });

            res.json({ users: usersWithoutPasswords });
        } catch (error) {
            console.error("Erro ao listar usuários:", error);
            res.status(500).json({ message: "Erro ao listar usuários" });
        }
    });
    
    // Endpoint para obter um usuário específico para edição (somente admin pode acessar)
    app.get("/api/admin/users/:id", async (req: Request, res: Response) => {
        try {
            // Verificar se o usuário é admin
            if (!req.session.isAdmin) {
                return res.status(401).json({ message: "Não autorizado" });
            }
            
            const userId = parseInt(req.params.id);
            if (isNaN(userId)) {
                return res.status(400).json({ message: "ID de usuário inválido" });
            }
            
            const user = await storage.getAppUser(userId);
            if (!user) {
                return res.status(404).json({ message: "Usuário não encontrado" });
            }
            
            // Para segurança, não enviamos a senha real, mas indicamos que ela existe
            const { password, ...userInfo } = user;
            
            res.json({ 
                ...userInfo, 
                // Enviamos um marcador para indicar que a senha existe, mas não a enviamos
                hasPassword: true
            });
        } catch (error) {
            console.error("Erro ao obter usuário:", error);
            res.status(500).json({ message: "Erro ao obter usuário" });
        }
    });

    // Endpoint para excluir usuário (somente admin pode acessar)
    app.delete("/api/admin/users/:id", async (req: Request, res: Response) => {
        try {
            // Verificar se o usuário é admin
            if (!req.session.isAdmin) {
                return res.status(401).json({ message: "Não autorizado" });
            }

            const userId = parseInt(req.params.id);
            await storage.deleteAppUser(userId);

            res.status(200).json({ message: "Usuário excluído com sucesso" });
        } catch (error) {
            console.error("Erro ao excluir usuário:", error);
            res.status(500).json({ message: "Erro ao excluir usuário" });
        }
    });
    
    // Endpoint para atualizar usuário (somente admin pode acessar)
    app.put("/api/admin/users/:id", async (req: Request, res: Response) => {
        try {
            // Verificar se o usuário é admin
            if (!req.session.isAdmin) {
                return res.status(401).json({ message: "Não autorizado" });
            }

            const userId = parseInt(req.params.id);
            const { email, firstName, lastName, password, observation, isAdmin } = req.body;
            
            // Verificar se o usuário existe
            const existingUser = await storage.getAppUser(userId);
            if (!existingUser) {
                return res.status(404).json({ message: "Usuário não encontrado" });
            }

            // Preparar os dados para atualização
            const userData: Partial<AppUser> = {
                email,
                firstName,
                lastName,
                observation,
                isAdmin
            };
            
            // Se uma nova senha foi fornecida e não é undefined, criptografá-la
            if (password !== undefined) {
                userData.password = await hashPassword(password);
            }
            
            // Atualizar o usuário no banco de dados
            const updatedUser = await storage.updateAppUser(userId, userData);
            
            // Remover a senha antes de retornar
            const { password: _, ...userWithoutPassword } = updatedUser;
            
            res.status(200).json(userWithoutPassword);
        } catch (error) {
            console.error("Erro ao atualizar usuário:", error);
            res.status(500).json({ message: "Erro ao atualizar usuário" });
        }
    });

    // Endpoint para login do usuário
    app.post("/api/auth/login", async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;

            // Buscar usuário pelo email
            const user = await storage.getAppUserByEmail(email);
            if (!user) {
                return res.status(401).json({ message: "Email ou senha inválidos" });
            }

            // Verificar senha
            const isPasswordValid = await comparePasswords(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Email ou senha inválidos" });
            }

            // Remover senha antes de salvar na sessão
            const { password: _, ...userWithoutPassword } = user;

            // Salvar ID do usuário e status admin na sessão
            req.session.appUserId = user.id;
            req.session.isAdmin = user.isAdmin;
            
            res.status(200).json(userWithoutPassword);
        } catch (error) {
            console.error("Erro no login:", error);
            
            // Verificar se é um erro de conexão com o banco de dados
            if (error instanceof Error && error.message && error.message.includes("connect")) {
                console.error("Erro de conexão com o banco de dados:", error.message);
                return res.status(503).json({ 
                    message: "Serviço temporariamente indisponível. Por favor, tente novamente em alguns instantes." 
                });
            }
            
            // Outros erros
            res.status(500).json({ message: "Erro ao processar login. Por favor, tente novamente." });
        }
    });

    // Endpoint para logout do usuário
    app.post("/api/auth/logout", (req: Request, res: Response) => {
        // Remover ID do usuário e flag admin da sessão
        req.session.appUserId = undefined;
        req.session.isAdmin = undefined;
        res.status(200).json({ message: "Logout realizado com sucesso" });
    });

    // Endpoint para obter dados do usuário atual
    app.get("/api/auth/user", async (req: Request, res: Response) => {
        try {
            if (!req.session.appUserId) {
                return res.status(401).json({ message: "Não autenticado" });
            }

            // Buscar usuário pelo ID
            const user = await storage.getAppUser(req.session.appUserId);
            if (!user) {
                req.session.appUserId = undefined;
                return res.status(401).json({ message: "Usuário não encontrado" });
            }

            // Remover senha antes de retornar
            const { password, ...userWithoutPassword } = user;
            res.status(200).json(userWithoutPassword);
        } catch (error) {
            console.error("Erro ao obter usuário:", error);
            res.status(500).json({ message: "Erro ao obter usuário" });
        }
    });

    // Middleware para injetar o usuário na requisição se estiver autenticado
    app.use(async (req: Request, res: Response, next: NextFunction) => {
        if (req.session.appUserId) {
            try {
                const user = await storage.getAppUser(req.session.appUserId);
                if (user) {
                    req.appUser = user;
                }
            } catch (error) {
                console.error("Erro ao carregar usuário na requisição:", error);
            }
        }
        next();
    });
}