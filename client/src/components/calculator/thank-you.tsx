import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

type ThankYouProps = {
  onNewCalculation: () => void;
};

export default function ThankYou({ onNewCalculation }: ThankYouProps) {
  return (
    <div className="p-6">
      <div className="text-center py-8">
        <div className="text-5xl text-secondary mb-4">
          <CheckCircle className="w-16 h-16 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Obrigado!</h2>
        <p className="text-gray-600 mb-6">
          Seu relatório foi enviado com sucesso.
        </p>
        <p className="text-gray-600 mb-6">
          Em breve, um especialista da Ecotruck entrará em contato para discutir como 
          podemos ajudar a melhorar a eficiência da sua frota.
        </p>
        <Button 
          onClick={onNewCalculation}
          className="bg-primary hover:bg-primary/90"
        >
          Nova Calculadora
        </Button>
      </div>
    </div>
  );
}
