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
  fuelConsumption: z.coerce.number().min(0.1, "Consumo de combustível deve ser maior que 0"),
  fuelPrice: z.coerce.number().min(0.1, "Preço do combustível deve ser maior que 0"),
});

type FormStepTwoProps = {
  formData: Partial<CalculatorFormData>;
  updateFormData: (data: Partial<CalculatorFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
};

export default function FormStepTwo({ formData, updateFormData, nextStep, prevStep }: FormStepTwoProps) {
  console.log("FormStepTwo - dados recebidos:", formData);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fuelConsumption: formData.fuelConsumption ?? 0,
      fuelPrice: formData.fuelPrice ?? 0,
    },
  });
  
  // Atualiza os valores do formulário quando formData mudar
  useEffect(() => {
    if (formData.fuelConsumption) {
      form.setValue("fuelConsumption", formData.fuelConsumption);
    }
    if (formData.fuelPrice) {
      form.setValue("fuelPrice", formData.fuelPrice);
    }
  }, [formData, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateFormData(values);
    nextStep();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">2. Consumo de combustível</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" autoComplete="off">
          <FormField
            control={form.control}
            name="fuelConsumption"
            render={({ field }) => (
              <FormItem>
                <FormLabel>2.1 Média do consumo de combustível (km/l)</FormLabel>
                <FormControl>
                  <InputWithAffix 
                    step="0.01" 
                    placeholder="Ex: 2.5" 
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                    suffix="km/l"
                    autoFocus={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="fuelPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>2.2 Preço médio do combustível (R$/litro)</FormLabel>
                <FormControl>
                  <InputWithAffix 
                    prefix="R$"
                    step="0.01" 
                    placeholder="Ex: 5.79" 
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                    isMonetary={true}
                  />
                </FormControl>
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
