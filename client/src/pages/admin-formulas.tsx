import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calculator, Fuel, Settings, Activity, MapPin, Mail, Send, Eye, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AdminFormulasPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const resetForm = () => {
    setManualEmail("");
    setCustomMessage("");
  };

  const handleSendEmail = async () => {
    if (!manualEmail.trim()) {
      toast({
        title: "E-mail obrigatório",
        description: "Por favor, digite o e-mail do destinatário.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/admin/send-formulas-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: manualEmail.trim(),
          customMessage: customMessage.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: "PDF enviado com sucesso!",
          description: "O PDF das fórmulas foi enviado por e-mail.",
        });
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao enviar PDF",
          description: error.message || "Ocorreu um erro ao enviar o PDF.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar PDF",
        description: "Ocorreu um erro de conexão.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/admin')}
            className="flex items-center gap-2"
          >
            Voltar ao Admin
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fórmulas do Sistema</h1>
            <p className="text-muted-foreground">
              Documentação técnica das fórmulas utilizadas nos cálculos de economia
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.open('/api/formulas-pdf-final', '_blank')}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              PDF - Preview
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Enviar PDF por Email
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Enviar PDF das Fórmulas</DialogTitle>
                  <DialogDescription>
                    Escolha como enviar o PDF com a documentação das fórmulas do sistema.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recipient-email">E-mail do destinatário</Label>
                    <Input
                      id="recipient-email"
                      type="email"
                      placeholder="Digite o e-mail do destinatário"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email-message">Mensagem personalizada (opcional)</Label>
                    <textarea
                      id="email-message"
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      placeholder="Digite uma mensagem personalizada que será incluída no e-mail (opcional)"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSendEmail}
                      disabled={isSending}
                    >
                      {isSending ? (
                        <>Enviando...</>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6">
        {/* Fórmula de Economia de Combustível */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-blue-600" />
              Economia de Combustível
            </CardTitle>
            <CardDescription>
              Cálculo da economia mensal e anual baseada na redução do consumo de combustível
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Implementação:</h4>
              <div className="font-mono text-sm bg-white p-3 rounded border">
                <p><strong>fuelSavings</strong> = quilometragemMensal × frotas × (consumoAtual - consumoComSistema) × preçoCombustível</p>
                <p><strong>consumoComSistema</strong> = consumoAtual × (1 - percentualEconomia/100)</p>
              </div>
            </div>
            <div className="text-sm space-y-2">
              <p><strong>Entrada:</strong> Quilometragem mensal, tamanho da frota, consumo atual, preço do combustível, percentual de economia</p>
              <p><strong>Saída:</strong> Economia mensal em R$ (multiplicado por 12 para anual)</p>
            </div>
          </CardContent>
        </Card>

        {/* Fórmula de CPK (Custo por Quilômetro) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              Custo por Quilômetro (CPK)
            </CardTitle>
            <CardDescription>
              Cálculo da economia baseada na melhoria do custo por quilômetro dos pneus
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Implementação:</h4>
              <div className="font-mono text-sm bg-white p-3 rounded border space-y-1">
                <p><strong>cpkAtual</strong> = (preçoPneu + (numeroRecapagens × preçoRecapagem)) / (vidaUtil + r1VidaUtil + r2VidaUtil)</p>
                <p><strong>cpkComSistema</strong> = cpkAtual × (1 - percentualMelhoria/100)</p>
                <p><strong>cpkSavings</strong> = (cpkAtual - cpkComSistema) × quilometragemMensal × numeroPneus</p>
              </div>
            </div>
            <div className="text-sm space-y-2">
              <p><strong>Entrada:</strong> Preço do pneu, preço da recapagem, vida útil, quilometragem mensal, número de pneus, percentual de melhoria</p>
              <p><strong>Saída:</strong> Economia mensal em R$ (multiplicado por 12 para anual)</p>
            </div>
          </CardContent>
        </Card>

        {/* Fórmula de Economia na Carcaça */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              Economia na Carcaça
            </CardTitle>
            <CardDescription>
              Cálculo da economia baseada na melhoria da vida útil da carcaça dos pneus
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Implementação:</h4>
              <div className="font-mono text-sm bg-white p-3 rounded border space-y-1">
                <p><strong>vidaTotalMeses</strong> = vidaUtil / quilometragemMensal</p>
                <p><strong>recapagensPorMes</strong> = numeroRecapagens / vidaTotalMeses</p>
                <p><strong>primeiraParte</strong> = (percentualEconomia/100) × recapagensPorMes × numeroPneus</p>
                <p><strong>custoTotal</strong> = preçoPneu + (numeroRecapagens × preçoRecapagem)</p>
                <p><strong>custoPorKm</strong> = custoTotal / vidaUtil</p>
                <p><strong>fatorReducao</strong> = 1 - (percentualEconomia/100)</p>
                <p><strong>diferencaKm</strong> = vidaUtil - (vidaUtil × fatorReducao)</p>
                <p><strong>segundaParte</strong> = custoPorKm × fatorReducao × diferencaKm</p>
                <p><strong>carcassSavings</strong> = primeiraParte × segundaParte</p>
              </div>
            </div>
            <div className="text-sm space-y-2">
              <p><strong>Entrada:</strong> Percentual de economia, número de recapagens, número de pneus, preço do pneu, preço da recapagem, vida útil, quilometragem mensal</p>
              <p><strong>Saída:</strong> Economia mensal em R$ (multiplicado por 12 para anual)</p>
            </div>
          </CardContent>
        </Card>

        {/* Fórmula de Economia com Rastreamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              Economia com Rastreamento
            </CardTitle>
            <CardDescription>
              Cálculo da economia baseada na implementação de sistema de rastreamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Implementação:</h4>
              <div className="font-mono text-sm bg-white p-3 rounded border">
                <p><strong>trackingSavings</strong> = veiculosComRastreamento × custoPorVeiculo</p>
              </div>
            </div>
            <div className="text-sm space-y-2">
              <p><strong>Entrada:</strong> Número de veículos com rastreamento, custo por veículo</p>
              <p><strong>Saída:</strong> Economia mensal em R$ (multiplicado por 12 para anual)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}