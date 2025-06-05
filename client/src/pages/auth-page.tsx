import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ecotruckLogo from "@assets/logo Ecotruck amarelo e preto_1747235539155.jpg";

// Validação para o formulário de login
const loginSchema = z.object({
  email: z.string().email({
    message: "Por favor informe um email válido."
  }),
  password: z.string().min(6, {
    message: "A senha deve ter pelo menos 6 caracteres."
  })
});

type LoginValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, isLoading, loginMutation, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Redirecionar se já estiver logado ou após login bem-sucedido
  useEffect(() => {
    if (user) {
      navigate("/form");
    }
  }, [user, navigate, loginMutation.isSuccess]);
  
  // Monitorar erros da mutation
  useEffect(() => {
    if (loginMutation.error) {
      let errorMessage = loginMutation.error.message;
      
      // Personalizar mensagens de erro comuns
      if (errorMessage.includes("Email ou senha inválidos")) {
        setLoginError("Email ou senha incorretos. Por favor, verifique suas credenciais e tente novamente.");
      } else if (errorMessage.includes("401")) {
        setLoginError("Email ou senha incorretos. Por favor, verifique suas credenciais e tente novamente.");
      } else {
        setLoginError("Ocorreu um erro ao fazer login. Por favor, tente novamente.");
      }
    } else {
      setLoginError(null);
    }
  }, [loginMutation.error]);

  // Form com react-hook-form e validação zod
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  // Handler para o formulário de login
  function onLoginSubmit(values: LoginValues) {
    // Limpar mensagens de erro anteriores
    setLoginError(null);
    loginMutation.mutate(values, {
      onSuccess: () => {
        // Navegar diretamente para o formulário após login bem-sucedido
        // para otimizar a resposta sem esperar pelo efeito
        navigate("/form");
      }
    });
  }

  // Otimização: Carregar mesmo que esteja carregando os dados do usuário
  // Isso evita a tela de carregamento que causa a impressão de lentidão

  return (
    <div className="flex min-h-screen">
      {/* Lado esquerdo com formulário */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 bg-white p-6">
        <div className="max-w-md w-full">
          <div className="bg-black py-4 px-6 rounded-lg shadow mb-8 flex flex-col items-center justify-center">
            <div className="max-w-[280px] w-full">
              <img 
                src={ecotruckLogo} 
                alt="Ecotruck Logo" 
                className="w-full h-auto"
                loading="eager"
              />
            </div>
            <p className="text-white text-sm mt-2">Calculadora de Savings</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              
              {/* Exibir alerta de erro quando necessário */}
              {loginError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro de login</AlertTitle>
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form 
                  onSubmit={form.handleSubmit(onLoginSubmit)} 
                  className="space-y-4" 
                  autoComplete="off"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="seu.email@empresa.com.br" autoFocus {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Sua senha" 
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck="false"
                              {...field} 
                            />
                            <button 
                              type="button" 
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                  
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      Se esqueceu a sua senha ligue para o seu contato na Ecotruck
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Lado direito com hero */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-primary p-6 text-white">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-4">Calculadora de Economia Ecotruck</h1>
          <p className="text-lg mb-6">
            Este sistema permite simular a economia potencial na sua frota ao
            implementar o sistema de gestão de pneus da Ecotruck.
          </p>
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <h3 className="font-semibold mb-2">Benefícios:</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Reduza o custo por kilômetro da sua frota</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Economize combustível com calibragem otimizada</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Aumente a vida útil das carcaças com recapagens</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Ganhe eficiência operacional com rastreamento</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}