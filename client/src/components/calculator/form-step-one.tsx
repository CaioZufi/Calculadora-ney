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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DecimalInput } from "@/components/ui/decimal-input";
import { InputWithAffix } from "@/components/ui/input-with-affix";

const formSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  fleetSize: z.coerce.number().min(1, "Tamanho da frota deve ser pelo menos 1"),
  totalTires: z.coerce.number().min(1, "Quantidade total de pneus deve ser pelo menos 1"),
});

type FormStepOneProps = {
  formData: Partial<CalculatorFormData>;
  updateFormData: (data: Partial<CalculatorFormData>) => void;
  nextStep: () => void;
  isBlocked?: boolean; // Propriedade para controlar se os campos estão bloqueados
  jumpToCalculationPage?: () => void; // Nova função para pular para a página de cálculo
};

export default function FormStepOne({ formData, updateFormData, nextStep, isBlocked = false, jumpToCalculationPage }: FormStepOneProps) {
  console.log("FormStepOne renderizando com formData:", formData);
  console.log("Campos bloqueados:", isBlocked);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: formData.companyName || "",
      fleetSize: formData.fleetSize || 0,
      totalTires: formData.totalTires || 0,
    },
  });
  
  // Esta função é chamada quando os dados do formulário chegam do servidor
  // Atualiza os valores do formulário quando os dados externos mudam
  useEffect(() => {
    console.log("FormStepOne - useEffect formData:", formData);
    if (formData && Object.keys(formData).length > 0) {
      // Atualize cada campo individualmente
      form.setValue("companyName", formData.companyName || "");
      form.setValue("fleetSize", formData.fleetSize || 0);
      form.setValue("totalTires", formData.totalTires || 0);
    }
  }, [formData, form]);
  
  // Efeito para focar o primeiro campo quando o formulário é renderizado 
  // e os campos não estão bloqueados
  useEffect(() => {
    if (!isBlocked) {
      // Pequeno atraso para garantir que o DOM está totalmente renderizado
      setTimeout(() => {
        // Encontra o primeiro input não desabilitado e foca nele
        const firstInput = document.querySelector('form input:not([disabled])') as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
  }, [isBlocked]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateFormData(values);
    nextStep();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">1. Informações sobre sua frota</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" autoComplete="off">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>1.1 Nome da empresa</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Transportes Brasil Ltda" 
                    autoComplete="off"
                    disabled={isBlocked}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="fleetSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>1.2 Quantidade de cavalos/ônibus da frota</FormLabel>
                <FormControl>
                  <InputWithAffix 
                    min="1" 
                    placeholder="Ex: 50" 
                    step="1"
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                    suffix="veículos"
                    disabled={isBlocked}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="totalTires"
            render={({ field }) => (
              <FormItem>
                <FormLabel>1.3 Qual a quantidade total de pneus da sua frota?</FormLabel>
                <FormControl>
                  <InputWithAffix 
                    min="1" 
                    placeholder="Ex: 300" 
                    step="1"
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                    suffix="pneus"
                    disabled={isBlocked}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-between pt-2">
            {jumpToCalculationPage && (
              <Button 
                type="button" 
                variant="outline"
                className="bg-secondary text-black hover:bg-secondary/80"
                onClick={(e) => {
                  e.preventDefault();
                  jumpToCalculationPage();
                }}
                disabled={isBlocked}
              >
                Página Cálculo
              </Button>
            )}
            <Button type="submit" disabled={isBlocked}>
              Próximo
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
