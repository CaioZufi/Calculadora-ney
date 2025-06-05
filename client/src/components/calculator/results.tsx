import { useState } from "react";
import { SavingsResult } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Mail, LogOut } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ResultsProps = {
  results: SavingsResult & { calculationId?: number };
  onBack: () => void;
  onReset: () => void; // Função para resetar completamente o formulário
  onSendEmail: (email: string) => void;
  isSending: boolean;
};

export default function Results({ results, onBack, onReset, onSendEmail, isSending }: ResultsProps) {
  const [email, setEmail] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [_, navigate] = useLocation();

  // Buscar dados do usuário autenticado
  const userQuery = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const user = userQuery.data;

  // Função para calcular o total dos ganhos adicionais salvos no localStorage baseado no usuário
  const getAdditionalGainsTotal = (): number => {
    try {
      // Usar chave específica do usuário se estiver logado
      const storageKey = user?.id ? `additionalGains_user_${user.id}` : 'additionalGains';
      const savedGains = localStorage.getItem(storageKey);
      
      if (!savedGains) return 0;
      
      const gains = JSON.parse(savedGains);
      return gains
        .filter((gain: any) => gain.name.trim() && gain.value > 0)
        .reduce((total: number, gain: any) => total + Number(gain.value), 0);
    } catch (error) {
      console.error('Erro ao carregar ganhos adicionais:', error);
      return 0;
    }
  };

  const handleSendEmail = () => {
    onSendEmail(email);
    setDialogOpen(false);
  };

  const handleDownloadPDF = () => {
    // Como os Ganhos Adicionais agora são salvos no banco de dados junto com o cálculo,
    // só precisamos do ID do cálculo para gerar o PDF completo
    const url = `/api/download-pdf?calculationId=${results.calculationId || ''}`;
    console.log("📄 Baixando PDF com dados salvos no banco - Calculation ID:", results.calculationId);
    
    // Chama a API para baixar o PDF com todos os dados do banco
    window.open(url, "_blank");
  };
  
  const handleEndConsultation = () => {
    // Redirecionar imediatamente para a página de login
    navigate('/auth');
    
    // Fazer logout em segundo plano, sem esperar a resposta
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      console.error('Erro ao encerrar consulta:', error);
    });
  };

  return (
    <div className="p-4">
      <div className="text-center mb-8 bg-gradient-to-b from-yellow-50 to-white py-8 rounded-lg shadow-sm border border-yellow-100">
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">Potencial de Savings</h2>
        <div className="text-7xl font-bold text-primary my-5">
          {formatCurrency(results.savingsPerTirePerMonth)}
        </div>
        <p className="text-gray-600 text-lg">por mês por pneu</p>
      </div>
      
      {/* Descrição do Potencial de Savings Table */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Detalhamento das economias mensais</h3>
        <div className="overflow-hidden border border-gray-300 rounded-md shadow">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-gray-200">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-800">Item</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-800">R$ (mês)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              <tr>
                <td className="px-4 py-3">Melhoria no CPK</td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(results.itemizedSavings.cpkImprovement)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">Economia de Combustível</td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(results.itemizedSavings.fuelSavings)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">Economia na Carcaça</td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(results.itemizedSavings.carcassSavings)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">Economia em Rastreamento</td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(results.tracking?.trackingTotalCost || 0)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">Ganhos Adicionais</td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(getAdditionalGainsTotal())}
                </td>
              </tr>
              <tr className="font-semibold bg-gray-200">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(results.itemizedSavings.total + getAdditionalGainsTotal())}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Ciclo do Pneu Table */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Ciclo do Pneu</h3>
        <div className="overflow-hidden border border-gray-300 rounded-md shadow">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-gray-200">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-800">Fase</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-800">Duração (meses)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              <tr>
                <td className="px-4 py-3">Novo</td>
                <td className="px-4 py-3 text-right">
                  {results.tireCycle.new.toFixed(1)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">Primeira Recapagem (R1)</td>
                <td className="px-4 py-3 text-right">
                  {results.tireCycle.r1.toFixed(1)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">Segunda Recapagem (R2)</td>
                <td className="px-4 py-3 text-right">
                  {results.tireCycle.r2.toFixed(1)}
                </td>
              </tr>
              <tr className="font-semibold bg-gray-200">
                <td className="px-4 py-3">Ciclo Total</td>
                <td className="px-4 py-3 text-right">
                  {(results.tireCycle.new + results.tireCycle.r1 + results.tireCycle.r2).toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Espaço reservado para layout */}
      <div className="mb-8"></div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between mt-8 gap-4">
        <div className="flex gap-3 order-2 sm:order-1">
          <Button 
            variant="outline" 
            onClick={onBack}
            disabled={isSending}
          >
            Voltar ao formulário
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 order-1 sm:order-2">
          <Button 
            onClick={handleDownloadPDF}
            disabled={isSending}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Relatório em PDF
          </Button>
          
          <Button
            onClick={handleEndConsultation}
            disabled={isSending}
            className="bg-primary hover:bg-primary/90 flex items-center"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Encerrar Consulta
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-secondary hover:bg-secondary/90 flex items-center"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar por Email
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar resultados por email</DialogTitle>
                <DialogDescription>
                  Insira seu endereço de email para receber os resultados da calculadora de economia.
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-4">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <DialogFooter className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  disabled={isSending}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSendEmail}
                  disabled={!email || isSending}
                  className="bg-secondary hover:bg-secondary/90"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
