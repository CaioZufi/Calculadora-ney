import { CalculatorFormData } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";


import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { InputWithAffix } from "@/components/ui/input-with-affix";
import { Sliders } from "lucide-react";
import CalculationVariables from "@/components/calculator/calculation-variables";

const formSchema = z.object({
  vehiclesWithTracking: z.coerce.number().min(0, "Número de veículos com rastreamento deve ser um valor positivo").optional(),
  trackingCostPerVehicle: z.coerce.number().min(0, "Valor mensal do rastreamento deve ser um valor positivo").optional(),
});

type FormStepSixProps = {
  formData: Partial<CalculatorFormData>;
  updateFormData: (data: Partial<CalculatorFormData>) => void;
  calculateResults: () => void;
  prevStep: () => void;
  isCalculating: boolean;
};

export default function FormStepSix({ 
  formData, 
  updateFormData, 
  calculateResults, 
  prevStep,
  isCalculating 
}: FormStepSixProps) {
  console.log("FormStepSix - dados recebidos:", formData);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehiclesWithTracking: formData.vehiclesWithTracking ?? 0,
      trackingCostPerVehicle: formData.trackingCostPerVehicle ?? 0,
    },
  });
  
  // Atualiza os valores do formulário quando formData mudar
  useEffect(() => {
    if (formData.vehiclesWithTracking !== undefined) {
      form.setValue("vehiclesWithTracking", formData.vehiclesWithTracking);
    }
    if (formData.trackingCostPerVehicle !== undefined) {
      form.setValue("trackingCostPerVehicle", formData.trackingCostPerVehicle);
    }
  }, [formData, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Atualizar os valores do formulário
    const updatedFormValues = {
      vehiclesWithTracking: values.vehiclesWithTracking,
      trackingCostPerVehicle: values.trackingCostPerVehicle
    };
    
    // Atualizar o estado do formulário com os valores atuais
    updateFormData(updatedFormValues);
    
    // SOLUÇÃO SIMPLES E DIRETA: Envio manual para o endpoint normal
    // mas com os valores corretos de variáveis personalizadas
    
    // Pegamos os valores finais das variáveis de localStorage
    const storedData = localStorage.getItem("ecotruck_form_data");
    let parsedData = storedData ? JSON.parse(storedData) : {};
    
    // Garantimos que estamos usando o nome da empresa mais atualizado
    // Obtendo diretamente do localStorage para evitar problemas de sincronia
    const latestCompanyName = parsedData.companyName || formData.companyName;
    
    // Atualizamos manualmente o formData com os valores corretos
    // Incluindo o nome da empresa atualizado do localStorage
    const currentFormData = {
      ...formData,
      ...updatedFormValues,
      companyName: latestCompanyName, // Garantir que o nome da empresa esteja correto
      fuelSavingsPercentage: parsedData.fuelSavingsPercentage || formData.fuelSavingsPercentage || 1,
      cpkImprovementPercentage: parsedData.cpkImprovementPercentage || formData.cpkImprovementPercentage || 5,
      carcassSavingsPercentage: parsedData.carcassSavingsPercentage || formData.carcassSavingsPercentage || 10,
    }
    
    // Fazemos o log dos valores que serão enviados
    console.log("ENVIANDO VALORES EXATOS:", {
      economia_combustivel: currentFormData.fuelSavingsPercentage + "%",
      melhoria_cpk: currentFormData.cpkImprovementPercentage + "%",
      economia_carcaca: currentFormData.carcassSavingsPercentage + "%"
    });
    
    // Atualizamos o formData no estado global primeiro
    updateFormData(currentFormData);
    
    // Mostramos os resultados usando a função calculateResults 
    // que já está disponível como prop e fará a chamada ao API
    calculateResults();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">6. Rastreamento de Frota</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" autoComplete="off">
          <FormField
            control={form.control}
            name="vehiclesWithTracking"
            render={({ field }) => (
              <FormItem>
                <FormLabel>6.1 Quantos cavalos/ônibus têm rastreamento via 4G?</FormLabel>
                <FormControl>
                  <InputWithAffix 
                    step="1" 
                    placeholder="Ex: 30" 
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Atualizar imediatamente o formData para refletir a mudança
                      updateFormData({ vehiclesWithTracking: value });
                    }}
                    suffix="veículos"
                    autoFocus={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="trackingCostPerVehicle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>6.2 Qual o valor mensal do rastreamento por veículo?</FormLabel>
                <FormControl>
                  <InputWithAffix 
                    prefix="R$" 
                    placeholder="Ex: 120,00" 
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Atualizar imediatamente o formData para refletir a mudança
                      updateFormData({ trackingCostPerVehicle: value });
                    }}
                    isMonetary={true}
                    showThousandSeparator={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-8 pt-2">
            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={prevStep}
                disabled={isCalculating}
              >
                Anterior
              </Button>
            </div>
            
            {/* Botões para personalizar variáveis e ganhos adicionais */}
            <div className="pt-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CalculationVariables
                  formData={formData}
                  updateFormData={updateFormData}
                  calculateResults={calculateResults}
                />
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 border-2 border-green-300 bg-green-50 text-green-700 hover:bg-green-100 py-6 rounded-lg shadow-md h-full"
                  size="lg"
                  onClick={() => window.location.href = '/additional-gains'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M2 12h20"/>
                  </svg>
                  Ganhos Adicionais
                </Button>
              </div>
            </div>
            
            {/* Botão principal para calcular economia */}
            <div className="pt-0">
              <Button
                type="submit"
                disabled={isCalculating}
                className="bg-primary hover:bg-primary/90 font-bold text-lg px-8 py-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform w-full"
                size="lg"
              >
                {isCalculating ? (
                  <>
                    <div className="animate-spin mr-2 h-5 w-5 border-t-2 border-b-2 border-current rounded-full" />
                    Calculando...
                  </>
                ) : (
                  <>
                    CALCULAR ECONOMIA
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}