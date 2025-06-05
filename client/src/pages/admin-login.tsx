import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export default function RestrictedAccess() {
  const [_, navigate] = useLocation();
  const { user, isAdmin, isLoading } = useAuth();
  
  // Se o usuário já estiver logado como admin, redirecionar para o dashboard
  useEffect(() => {
    if (user && isAdmin && !isLoading) {
      navigate("/admin/dashboard");
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Mostrar indicador de carregamento enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Acesso Restrito
          </CardTitle>
          <CardDescription className="text-center">
            Esta área é restrita para usuários com privilégios administrativos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p>Para acessar esta área, você precisa:</p>
            <ol className="list-decimal text-left pl-6 space-y-2">
              <li>Ter uma conta com privilégios administrativos.</li>
              <li>Estar logado com esta conta.</li>
            </ol>
            <p className="pt-2">
              Se você já possui uma conta administrativa, clique no botão "Fazer login" abaixo.
              Se não possui, entre em contato com o administrador do sistema.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-4">
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o início
          </Button>
          <Button onClick={() => navigate("/auth")} variant="default">
            Fazer login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}