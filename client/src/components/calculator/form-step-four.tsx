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
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { EnhancedSelect } from "@/components/ui/enhanced-select";

const formSchema = z.object({
  tirePrice: z.coerce.number().min(1, "Preço do pneu deve ser maior que 0"),
  tirePressureCheck: z.string().min(1, "Selecione a frequência de verificação"),
});

type FormStepFourProps = {
  formData: Partial<CalculatorFormData>;
  updateFormData: (data: Partial<CalculatorFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
};

export default function FormStepFour({ formData, updateFormData, nextStep, prevStep }: FormStepFourProps) {
  console.log("FormStepFour - dados recebidos:", formData);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tirePrice: formData.tirePrice ?? 0,
      tirePressureCheck: formData.tirePressureCheck || "",
    },
  });
  
  // Atualiza os valores do formulário quando formData mudar
  useEffect(() => {
    if (formData.tirePrice) {
      form.setValue("tirePrice", formData.tirePrice);
    }
    if (formData.tirePressureCheck) {
      form.setValue("tirePressureCheck", formData.tirePressureCheck);
    }
  }, [formData, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateFormData(values);
    nextStep();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">4. Custos e manutenção</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" autoComplete="off">
          <FormField
            control={form.control}
            name="tirePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>4.1 Preço médio do pneu novo (R$)</FormLabel>
                <FormControl>
                  <InputWithAffix 
                    prefix="R$"
                    step="0.01" 
                    placeholder="Ex: 2800.00" 
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value);
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
            name="tirePressureCheck"
            render={({ field }) => (
              <FormItem>
                <FormLabel>4.2 Frequência de verificação de pressão</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger
                      onKeyDown={(e) => {
                        // Quando pressionar Enter no select, avança para o botão "Próximo"
                        if (e.key === "Enter" && !document.querySelector('[data-state="open"]')) {
                          e.preventDefault();
                          // Encontra o botão "Próximo" e foca nele
                          const nextButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
                          if (nextButton) {
                            nextButton.focus();
                          }
                        }
                      }}
                    >
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-between pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep}
            >
              Anterior
            </Button>
            <Button type="submit">
              Próximo
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
