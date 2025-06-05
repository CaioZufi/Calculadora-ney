// Importar o logo
import ecotruckLogo from "../assets/ecotruck-logo.jpg";
import { Link } from "wouter";
import { LockIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Header() {
  const { isAdmin } = useAuth();
  
  return (
    <header className="mb-3 text-center">
      <div className="bg-black py-3 px-6 rounded-t-lg shadow flex flex-col items-center justify-center relative">
        <div className="max-w-[280px] w-full">
          <img 
            src={ecotruckLogo} 
            alt="Ecotruck Logo" 
            className="w-full h-auto"
          />
        </div>
        
        {/* Link para área administrativa */}
        {isAdmin ? (
          <Link href="/admin/dashboard" className="absolute right-3 top-3 text-blue-400 hover:text-blue-300 transition-colors flex items-center">
            <span className="text-xs mr-1">Admin</span>
            <LockIcon size={16} />
          </Link>
        ) : null}
      </div>
    </header>
  );
}
