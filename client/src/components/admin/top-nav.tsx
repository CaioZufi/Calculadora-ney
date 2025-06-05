import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useLocation } from "wouter";
import ecotruckLogo from "../../assets/ecotruck-logo.jpg";

interface TopNavProps {
  handleLogout: () => void;
}

export default function TopNav({ handleLogout }: TopNavProps) {
  const [location, navigate] = useLocation();
  
  // Verificar se a URL contém o caminho, não apenas se é exatamente igual
  const isDashboard = location.includes("/admin/dashboard");
  const isManageUsers = location.includes("/admin/users");
  const isFormulas = location.includes("/admin/formulas");

  return (
    <header className="bg-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-center">
            <img 
              src={ecotruckLogo} 
              alt="Ecotruck Logo" 
              className="w-32 h-auto"
            />
            <span className="text-sm font-semibold mt-1">Admin</span>
          </div>
          
          <div className="flex space-x-4">
            <Button 
              variant="link" 
              className={`text-white hover:text-gray-200 py-1 px-3 ${isDashboard ? 'border border-white rounded-md' : 'border border-transparent rounded-md'}`}
              onClick={() => navigate("/admin/dashboard")}
            >
              Dashboard
            </Button>
            <Button 
              variant="link" 
              className={`text-white hover:text-gray-200 py-1 px-3 ${isManageUsers ? 'border border-white rounded-md' : 'border border-transparent rounded-md'}`}
              onClick={() => navigate("/admin/users")}
            >
              Usuários
            </Button>
            <Button 
              variant="link" 
              className={`text-white hover:text-gray-200 py-1 px-3 ${isFormulas ? 'border border-white rounded-md' : 'border border-transparent rounded-md'}`}
              onClick={() => navigate("/admin/formulas")}
            >
              Fórmulas
            </Button>
          </div>
        </div>
        <Button 
          id="back-to-form-btn"
          variant="secondary"
          className="bg-white text-primary hover:bg-gray-100"
          onClick={() => navigate("/")}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Voltar Formulário</span>
        </Button>
      </div>
    </header>
  );
}