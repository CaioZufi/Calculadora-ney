import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Não precisamos mais pré-carregar o logo pois agora usamos SVG

// Forçar o uso de ponto como separador decimal, independente das configurações regionais
// Isso garante consistência em todos os navegadores
const originalToLocaleString = Number.prototype.toLocaleString;
Number.prototype.toLocaleString = function() {
  return originalToLocaleString.call(this, 'en-US');
};

// Configurar formato de entrada para usar ponto decimal
// Esta é uma abordagem não invasiva que modifica o comportamento padrão do navegador
document.documentElement.lang = 'en-US';

// Set document title
document.title = "Ecotruck - Calculadora de Economia";

// Add favicon if needed
const link = document.createElement('link');
link.rel = 'icon';
link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚚</text></svg>';
document.head.appendChild(link);

// Add meta description for SEO
const meta = document.createElement('meta');
meta.name = 'description';
meta.content = 'Calcule a economia potencial ao implementar o sistema de gestão de pneus da Ecotruck. Simulador online gratuito para empresas de transporte.';
document.head.appendChild(meta);

createRoot(document.getElementById("root")!).render(<App />);
