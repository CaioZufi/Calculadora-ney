import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface AdditionalGain {
  id: string;
  name: string;
  value: number;
}

export default function AdditionalGainsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [gains, setGains] = useState<AdditionalGain[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Buscar dados do usuário autenticado
  const userQuery = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const user = userQuery.data;

  // Função para obter a chave do localStorage baseada no usuário
  const getStorageKey = () => {
    return user?.id ? `additionalGains_user_${user.id}` : 'additionalGains';
  };

  // Carregar dados salvos do localStorage baseados no usuário - APENAS UMA VEZ
  useEffect(() => {
    if (userQuery.status === 'success' && !dataLoaded) {
      const storageKey = getStorageKey();
      
      // Limpar dados antigos do formato incorreto
      const oldStorageKey = 'additionalGains';
      localStorage.removeItem(oldStorageKey);
      
      // Verificar se há dados salvos para este usuário
      const savedGains = localStorage.getItem(storageKey);
      if (savedGains) {
        try {
          const parsedGains = JSON.parse(savedGains);
          // Verificar se os dados têm 13 itens (novo formato)
          if (parsedGains.length === 13) {
            console.log(`Carregando ganhos adicionais para usuário ${user?.id || 'anônimo'}:`, parsedGains);
            setGains(parsedGains);
            setDataLoaded(true);
            return;
          } else {
            // Se não tem 13 itens, remover dados antigos
            localStorage.removeItem(storageKey);
          }
        } catch (error) {
          console.error('Erro ao carregar ganhos adicionais:', error);
          localStorage.removeItem(storageKey);
        }
      }
      
      // No primeiro login ou se não há dados salvos, usar valores padrão (zeros)
      console.log(`Primeira vez ou sem dados salvos para usuário ${user?.id || 'anônimo'}, usando valores padrão`);
      const defaultGains = [
        { id: "1", name: "Custo dos Funcionários para realizar a calibragem em todos os pneus", value: 0 },
        { id: "2", name: "Custo do Tempo dos veículos parados no patio/posto para calibrar", value: 0 },
        { id: "3", name: "Custo para consertar os Veículos acidentados", value: 0 },
        { id: "4", name: "Valor da reposiçao dos veiculos incendiados e indenizaçao das cargas ", value: 0 },
        { id: "5", name: "Valor dos gastos medicos e hospitalares em caso de acidente ", value: 0 },
        { id: "6", name: "Despesas por indenizaçao pelo Danos Ambientais causados", value: 0 },
        { id: "7", name: "Redução de desperdício de combustível", value: 0 },
        { id: "8", name: "Valor da reposiçao de Roubos e Desvios de Pneus", value: 0 },
        { id: "9", name: "Valor da Redução de Pessoal com Gestão de Pneus", value: 0 },
        { id: "10", name: "Controle e eficiencia na Gestao do Recapeamento", value: 0 },
        { id: "11", name: "Controle da Gestão de Descarte", value: 0 },
        { id: "12", name: "Controle da localizaçao de cada pneu indicando se esta em um veiculo, no estoque, na borracharia ou na recauchutadora", value: 0 },
        { id: "13", name: "Obter estatisticas de qual tipo/marca de pneu tem melhor rendimento e custo beneficio de cada rota", value: 0 }
      ];
      setGains(defaultGains);
      setDataLoaded(true);
    }
  }, [userQuery.status, user?.id, dataLoaded]);

  // Salvar no localStorage sempre que houver mudanças (apenas se não for a primeira carga)
  useEffect(() => {
    if (user?.id && gains.length > 0) {
      const storageKey = getStorageKey();
      // Verificar se os dados mudaram realmente antes de salvar
      const currentSaved = localStorage.getItem(storageKey);
      const currentGainsString = JSON.stringify(gains);
      
      if (currentSaved !== currentGainsString) {
        localStorage.setItem(storageKey, currentGainsString);
        console.log(`Salvando ganhos adicionais para usuário ${user.id}:`, gains);
      }
    }
  }, [gains, user?.id]);

  const addNewGain = () => {
    const newGain: AdditionalGain = {
      id: Date.now().toString(),
      name: "",
      value: 0
    };
    setGains([...gains, newGain]);
  };

  const removeGain = (id: string) => {
    setGains(gains.filter(gain => gain.id !== id));
  };

  const updateGainName = (id: string, name: string) => {
    setGains(gains.map(gain => 
      gain.id === id ? { ...gain, name } : gain
    ));
  };

  const updateGainValue = (id: string, value: number) => {
    setGains(gains.map(gain => 
      gain.id === id ? { ...gain, value } : gain
    ));
  };

  const handleSave = () => {
    // Filtrar ganhos com nome e valor válidos
    const validGains = gains.filter(gain => gain.name.trim() !== "" && gain.value > 0);
    
    // Forçar salvamento no localStorage
    if (user?.id) {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(gains));
      console.log(`Salvamento forçado para usuário ${user.id}:`, gains);
    }
    
    toast({
      title: "Ganhos Adicionais Salvos",
      description: `${validGains.length} ganhos adicionais foram salvos com sucesso.`,
    });
  };



  const totalAdditionalGains = gains
    .filter(gain => gain.name.trim() !== "" && gain.value > 0)
    .reduce((total, gain) => total + gain.value, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Formulário
        </Button>
        <h1 className="text-2xl font-bold">Ganhos Adicionais</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quantifique os Ganhos Adicionais</CardTitle>
          <p className="text-sm text-muted-foreground">
            Projete valores mensais para cada ganho. Não precisa ser o valor exato. O objetivo dessa página é lembrar ao cliente que além das economias universalmente consagradas com a gestão correta do pneu, existem outras economias que são específicas de cada empresa/frota.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cabeçalho fixo com títulos alinhados - Desktop */}
          <div className="sticky top-0 bg-white z-10 border-b pb-2 mb-4 hidden md:block">
            <div className="grid grid-cols-12 gap-4 px-4 py-2">
              <div className="col-span-9">
                <Label className="text-sm font-medium">
                  Descrição do Ganho
                </Label>
              </div>
              <div className="col-span-2">
                <Label className="text-sm font-medium">
                  Valor Mensal
                </Label>
              </div>
              <div className="col-span-1"></div>
            </div>
          </div>

          {gains.map((gain, index) => (
            <div key={gain.id}>
              {/* Layout Desktop */}
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 border rounded-lg">
                <div className="col-span-9">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-blue-600 min-w-[20px]">{index + 1}</span>
                    <textarea
                      id={`gain-name-${gain.id}`}
                      value={gain.name}
                      onChange={(e) => updateGainName(gain.id, e.target.value)}
                      placeholder="Ex: Redução de custos com manutenção"
                      rows={2}
                      className="text-sm flex-1 p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <Input
                      id={`gain-value-${gain.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={gain.value || ""}
                      onChange={(e) => {
                        const numValue = parseFloat(e.target.value) || 0;
                        updateGainValue(gain.id, numValue);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const nextIndex = index + 1;
                          if (nextIndex < gains.length) {
                            setTimeout(() => {
                              const nextInput = document.getElementById(`gain-value-${gains[nextIndex].id}`);
                              nextInput?.focus();
                            }, 50);
                          } else {
                            setTimeout(() => {
                              const saveButton = document.querySelector('button:contains("Salvar")') as HTMLElement;
                              saveButton?.focus();
                            }, 50);
                          }
                        }
                      }}
                      placeholder="0,00"
                      className="pl-10 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      style={{ 
                        MozAppearance: 'textfield',
                        WebkitAppearance: 'none'
                      }}
                    />
                  </div>
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeGain(gain.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Layout Mobile */}
              <div className="md:hidden p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">{index + 1}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeGain(gain.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Descrição do Ganho
                  </Label>
                  <textarea
                    id={`gain-name-mobile-${gain.id}`}
                    value={gain.name}
                    onChange={(e) => updateGainName(gain.id, e.target.value)}
                    placeholder="Ex: Redução de custos com manutenção"
                    rows={2}
                    className="text-sm w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Valor Mensal (R$)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <Input
                      id={`gain-value-mobile-${gain.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={gain.value || ""}
                      onChange={(e) => {
                        const numValue = parseFloat(e.target.value) || 0;
                        updateGainValue(gain.id, numValue);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const nextIndex = index + 1;
                          if (nextIndex < gains.length) {
                            setTimeout(() => {
                              const nextInput = document.getElementById(`gain-value-mobile-${gains[nextIndex].id}`);
                              nextInput?.focus();
                            }, 50);
                          } else {
                            setTimeout(() => {
                              const saveButton = document.querySelector('button:contains("Salvar")') as HTMLElement;
                              saveButton?.focus();
                            }, 50);
                          }
                        }
                      }}
                      placeholder="0,00"
                      className="pl-10 w-full [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      style={{ 
                        MozAppearance: 'textfield',
                        WebkitAppearance: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={addNewGain}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Novo Campo
            </Button>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Mensal dos Ganhos Adicionais:</p>
              <p className="text-lg font-bold text-blue-600">
                R$ {totalAdditionalGains.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate("/")}>
          Cancelar
        </Button>
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
          Salvar Ganhos Adicionais
        </Button>
      </div>
    </div>
  );
}