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
  monthlyMileage: z.coerce.number().min(1, "Quilometragem mensal deve ser maior que 0"),
  tireLifespan: z.coerce.number().min(1, "Vida útil dos pneus deve ser maior que 0"),
});

type FormStepThreeProps = {
  formData: Partial<CalculatorFormData>;
  updateFormData: (data: Partial<CalculatorFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
};

export default function FormStepThree({ formData, updateFormData, nextStep, prevStep }: FormStepThreeProps) {
  console.log("FormStepThree - dados recebidos:", formData);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      monthlyMileage: formData.monthlyMileage ?? 0,
      tireLifespan: formData.tireLifespan ?? 0,
    },
  });
  
  // Atualiza os valores do formulário quando formData mudar
  useEffect(() => {
    if (formData.monthlyMileage) {
      form.setValue("monthlyMileage", formData.monthlyMileage);
    }
    if (formData.tireLifespan) {
      form.setValue("tireLifespan", formData.tireLifespan);
    }
  }, [formData, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateFormData(values);
    nextStep();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">3. Informações operacionais</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" autoComplete="off">
          <FormField
            control={form.control}
            name="monthlyMileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>3.1 Média mensal de quilometragem rodado por veículo</FormLabel>
                <FormControl>
                  <InputWithAffix 
                    placeholder="Ex: 10000" 
                    step="1"
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                    suffix="km"
                    autoFocus={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="tireLifespan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>3.2 Vida útil média dos pneus novos</FormLabel>
                <FormControl>
                  <InputWithAffix 
                    placeholder="Ex: 80000" 
                    step="1"
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                    suffix="km"
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
