import { CalculatorFormData } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, BarChart4, Calculator, Sliders } from "lucide-react";
import CalculationVariables from "./calculation-variables";
import { DecimalInput } from "@/components/ui/decimal-input";
import { InputWithAffix } from "@/components/ui/input-with-affix";

// Defina os valores permitidos como um tipo
type RetreadingCycleValue = "0" | "1" | "2";

// Esquema de validação do formulário
const formSchema = z.object({
  retreadPrice: z.coerce.number().min(1, "Preço da recapagem deve ser maior que 0"),
  retreadingCycles: z.enum(["0", "1", "2"] as const, {
    errorMap: () => ({ message: "Selecione uma das opções disponíveis" })
  }),
  r1TireLifespan: z.number().min(1, "Quilometragem do pneu R1 deve ser maior que 0").optional(),
  r2TireLifespan: z.number().min(1, "Quilometragem do pneu R2 deve ser maior que 0").optional(),
});

// Tipo inferido do esquema para manter a consistência
type FormValues = z.infer<typeof formSchema>;

// Definir uma versão tipada de CalculatorFormData para este componente
interface StepFiveData extends Partial<CalculatorFormData> {
  retreadPrice?: number;
  retreadingCycles?: RetreadingCycleValue;
  r1TireLifespan?: number;
  r2TireLifespan?: number;
}

type FormStepFiveProps = {
  formData: Partial<CalculatorFormData>;
  updateFormData: (data: Partial<CalculatorFormData>) => void;
  calculateResults: () => void;
  prevStep: () => void;
  nextStep: () => void;
  isCalculating: boolean;
};

export default function FormStepFive({ 
  formData, 
  updateFormData, 
  calculateResults, 
  prevStep,
  nextStep,
  isCalculating 
}: FormStepFiveProps) {
  // Log dos dados do formulário para depuração
  console.log("FormStepFive - dados recebidos:", {
    retreadingCycles: formData.retreadingCycles,
    r1TireLifespan: formData.r1TireLifespan,
    r2TireLifespan: formData.r2TireLifespan
  });
  
  // Certifique-se de que o valor de retreadingCycles seja válido para o enum
  const validateRetreadingCycles = (): RetreadingCycleValue | undefined => {
    const value = formData.retreadingCycles;
    if (value === "0" || value === "1" || value === "2") {
      return value;
    }
    return undefined;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      retreadPrice: formData.retreadPrice ?? 0,
      retreadingCycles: validateRetreadingCycles(),
      r1TireLifespan: formData.r1TireLifespan || undefined,
      r2TireLifespan: formData.r2TireLifespan || undefined,
    },
  });

  const onSubmit = (values: FormValues) => {
    console.log("Form values on submit:", values);
    
    // Garantir que os valores são atualizados antes de seguir para a próxima etapa
    updateFormData({
      retreadPrice: values.retreadPrice,
      retreadingCycles: values.retreadingCycles,
      r1TireLifespan: values.r1TireLifespan,
      r2TireLifespan: values.r2TireLifespan
    } as StepFiveData);
    
    // Avançar para a próxima etapa (etapa 6)
    nextStep();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">5. Informações de recapagem</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" autoComplete="off">
          <FormField
            control={form.control}
            name="retreadPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>5.1 Preço médio da recapagem (R$)</FormLabel>
                <FormControl>
                  <InputWithAffix 
                    prefix="R$"
                    step="0.01" 
                    placeholder="Ex: 800.00" 
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Atualizar imediatamente o formData para refletir a mudança
                      updateFormData({ retreadPrice: value });
                    }}
                    isMonetary={true}
                    autoFocus={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="retreadingCycles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>5.2 Número de recapagens por pneu</FormLabel>
                <Select 
                  onValueChange={(value: RetreadingCycleValue) => {
                    field.onChange(value);
                    // Atualizar imediatamente o formData para refletir a mudança
                    updateFormData({ retreadingCycles: value } as StepFiveData);
                  }} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger
                      onKeyDown={(e) => {
                        // Quando pressionar Enter no select, move o foco
                        if (e.key === "Enter" && !document.querySelector('[data-state="open"]')) {
                          e.preventDefault();
                          
                          // Verifica o valor atual das recapagens
                          const cycles = form.getValues("retreadingCycles");
                          
                          if (cycles === "0") {
                            // Se "Nenhuma recapagem", vai direto para o botão de "Próximo"
                            const nextButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
                            if (nextButton) nextButton.focus();
                          } else {
                            // Se há recapagens, foca no próximo campo (r1TireLifespan)
                            const nextField = document.querySelector('input[name="r1TireLifespan"]') as HTMLInputElement;
                            if (nextField) nextField.focus();
                          }
                        }
                      }}
                    >
                      <SelectValue placeholder="Selecione uma quantidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Nenhuma recapagem</SelectItem>
                    <SelectItem value="1">1 recapagem (R1)</SelectItem>
                    <SelectItem value="2">2 recapagens (R2)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Campos de quilometragem dos pneus R1 e R2 - apenas visíveis conforme a opção de recapagem */}
          {form.watch("retreadingCycles") && form.watch("retreadingCycles") !== "0" && (
            <>
              {/* Campo para quilometragem do pneu R1 - visível quando há pelo menos 1 recapagem */}
              <FormField
                control={form.control}
                name="r1TireLifespan"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>5.3 Quantos quilômetros roda o pneu R1?</FormLabel>
                    <FormControl>
                      <InputWithAffix
                        placeholder="Ex: 60000"
                        onValueChange={(value) => {
                          field.onChange(value);
                          updateFormData({ r1TireLifespan: value } as StepFiveData);
                        }}
                        value={field.value || ""}
                        suffix="km"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Campo para quilometragem do pneu R2 - visível apenas quando há 2 recapagens */}
          {form.watch("retreadingCycles") === "2" && (
            <FormField
              control={form.control}
              name="r2TireLifespan"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>5.4 Quantos quilômetros roda o pneu R2?</FormLabel>
                  <FormControl>
                    <InputWithAffix
                      placeholder="Ex: 55000"
                      onValueChange={(value) => {
                        field.onChange(value);
                        updateFormData({ r2TireLifespan: value } as StepFiveData);
                      }}
                      value={field.value || ""}
                      suffix="km"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
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
              
              <Button 
                type="button" 
                variant="default" 
                onClick={() => {
                  // Verificação básica antes de prosseguir
                  if (formData.retreadPrice && formData.retreadingCycles) {
                    nextStep();
                  } else {
                    // Preencher valores padrão se necessário
                    if (!formData.retreadPrice) {
                      updateFormData({ retreadPrice: 600 });
                    }
                    if (!formData.retreadingCycles) {
                      updateFormData({ retreadingCycles: '2' });
                    }
                    // Pequeno delay para garantir que os dados foram atualizados
                    setTimeout(() => nextStep(), 100);
                  }
                }}
                disabled={isCalculating}
              >
                Próximo
              </Button>
            </div>
            
            {/* O botão de personalizar variáveis foi movido para o Step 6 */}
          </div>
        </form>
      </Form>
    </div>
  );
}
