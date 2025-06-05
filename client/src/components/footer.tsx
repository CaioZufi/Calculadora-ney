import { Link, useLocation } from "wouter";
import { Lock, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Footer() {
  const { logoutMutation } = useAuth();
  const [_, navigate] = useLocation();
  
  // Função para fazer logout
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        // Limpar o localStorage para garantir que dados armazenados não persistam
        localStorage.removeItem("ecotruck_formData");
        // Redirecionamento explícito para a página de autenticação
        navigate("/auth");
      },
      onError: () => {
        // Mesmo em caso de erro, tentar navegar para a página de autenticação
        navigate("/auth");
      }
    });
  };

  return (
    <footer className="mt-8 text-center text-gray-500 text-sm">
      <div className="mb-2 flex justify-center gap-4">
        <Link to="/admin" className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors">
          <Lock className="h-4 w-4 mr-1" />
          <span className="text-xs">Admin</span>
        </Link>
        
        <button 
          onClick={handleLogout}
          className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <LogOut className="h-4 w-4 mr-1" />
          <span className="text-xs">Logout</span>
        </button>
      </div>
      <p>© {new Date().getFullYear()} Ecotruck - Todos os direitos reservados</p>
    </footer>
  );
}
