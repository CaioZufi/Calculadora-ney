import { useState } from "react";
import { CalculatorFormData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Sliders } from "lucide-react";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Input } from "@/components/ui/input";
import { InputWithAffix } from "@/components/ui/input-with-affix";
import { Textarea } from "@/components/ui/textarea";

type CalculationVariablesProps = {
  formData: Partial<CalculatorFormData>;
  updateFormData: (data: Partial<CalculatorFormData>) => void;
  calculateResults?: () => void;
};

export default function CalculationVariables({ formData, updateFormData, calculateResults }: CalculationVariablesProps) {
  // Valores padrão para inicialização
  const defaultValues = {
    fuelSavingsPercentage: 1,      // 1%
    cpkImprovementPercentage: 5,   // 5%
    carcassSavingsPercentage: 10,  // 10%
  };
  
  // Estado do modal
  const [isOpen, setIsOpen] = useState(false);
  
  // Estados dos campos com valores textuais para edição direta
  const [fuelSavingsText, setFuelSavingsText] = useState('');
  const [cpkImprovementText, setCpkImprovementText] = useState('');
  const [carcassSavingsText, setCarcassSavingsText] = useState('');
  
  // Quando o modal abrir, inicializar os campos de texto
  const handleOpenModal = () => {
    setFuelSavingsText((formData.fuelSavingsPercentage ?? defaultValues.fuelSavingsPercentage).toString());
    setCpkImprovementText((formData.cpkImprovementPercentage ?? defaultValues.cpkImprovementPercentage).toString());
    setCarcassSavingsText((formData.carcassSavingsPercentage ?? defaultValues.carcassSavingsPercentage).toString());
    setIsOpen(true);
  };
  
  // Converter texto para número, permitindo valor zero
  const parseNumberWithDefault = (value: string, defaultValue: number): number => {
    if (value === '' || value === null) {
      return 0; // Retornar zero para campos vazios
    }
    const parsed = parseFloat(value.replace(',', '.'));
    return isNaN(parsed) ? defaultValue : parsed;
  };
  
  // Salvar os valores e atualizar o formData
  const handleSave = () => {
    // Capturar e converter os valores dos campos
    const fuelValue = parseNumberWithDefault(fuelSavingsText, defaultValues.fuelSavingsPercentage);
    const cpkValue = parseNumberWithDefault(cpkImprovementText, defaultValues.cpkImprovementPercentage);
    const carcassValue = parseNumberWithDefault(carcassSavingsText, defaultValues.carcassSavingsPercentage);
    
    const updatedData: Partial<CalculatorFormData> = {
      fuelSavingsPercentage: fuelValue,
      cpkImprovementPercentage: cpkValue,
      carcassSavingsPercentage: carcassValue
    };
    
    console.log("Salvando variáveis personalizadas com valores explícitos:", {
      fuelSavingsText,
      cpkImprovementText,
      carcassSavingsText,
      fuelValue,
      cpkValue,
      carcassValue,
      updatedData
    });
    
    // Atualizar o formData com os novos valores
    updateFormData(updatedData);
    
    // Fechar o modal
    setIsOpen(false);
    
    // Se tiver a função calculateResults, chamá-la
    if (calculateResults) {
      // Aumentamos o delay para garantir que os dados foram atualizados
      setTimeout(() => {
        console.log("Executando cálculo após salvar variáveis - valores atuais:", updatedData);
        calculateResults();
      }, 300);
    }
  };
  
  return (
    <div className="relative">
      <Button 
        onClick={handleOpenModal} 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2 border-2 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 py-6 rounded-lg shadow-md h-full"
        size="lg"
        type="button"
      >
        <Sliders size={18} />
        Personalizar Variáveis
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white w-full max-w-3xl rounded-lg shadow-xl overflow-hidden my-8" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-blue-700">Variáveis de Cálculo</h3>
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 rounded-full hover:bg-blue-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </Button>
            </div>
            
            <div className="p-4 overflow-auto max-h-[60vh]">
              <div className="space-y-4">
                {/* Grid container para os 3 campos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Economia de Combustível */}
                  <div className="bg-white p-3 rounded-md">
                    <label className="text-sm font-medium block mb-1">Economia de Combustível</label>
                    <div className="flex items-center">
                      <div className="relative w-full border border-gray-300 rounded-md overflow-hidden bg-white">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={fuelSavingsText}
                          onChange={(e) => setFuelSavingsText(e.target.value.replace(/[^0-9,.]/g, ''))}
                          className="w-full py-2 px-3 pr-7 outline-none text-left text-lg"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Fonte: American Transportation Research Institute, USA</p>
                  </div>

                  {/* Melhoria do CPK */}
                  <div className="bg-white p-3 rounded-md">
                    <label className="text-sm font-medium block mb-1">Melhoria do CPK</label>
                    <div className="flex items-center">
                      <div className="relative w-full border border-gray-300 rounded-md overflow-hidden bg-white">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={cpkImprovementText}
                          onChange={(e) => setCpkImprovementText(e.target.value.replace(/[^0-9,.]/g, ''))}
                          className="w-full py-2 px-3 pr-7 outline-none text-left text-lg"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Fonte: American Trucking Association, Arlington VA, USA</p>
                  </div>

                  {/* Economia na Carcaça */}
                  <div className="bg-white p-3 rounded-md">
                    <label className="text-sm font-medium block mb-1">Economia na Carcaça</label>
                    <div className="flex items-center">
                      <div className="relative w-full border border-gray-300 rounded-md overflow-hidden bg-white">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={carcassSavingsText}
                          onChange={(e) => setCarcassSavingsText(e.target.value.replace(/[^0-9,.]/g, ''))}
                          className="w-full py-2 px-3 pr-7 outline-none text-left text-lg"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Fonte: Recauchutadoras</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2 rounded"
                >
                  Cancelar
                </Button>
                
                <Button 
                  type="button" 
                  onClick={handleSave} 
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded"
                >
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}