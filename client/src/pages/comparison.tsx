import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import TopNav from "@/components/admin/top-nav";
import { useAuth } from "@/hooks/use-auth";

// Tipo para os dados das simulações
type Calculation = {
  id: number;
  companyName: string;
  fleetSize: number;
  totalTires: number;
  fuelConsumption: number;
  fuelPrice: number;
  monthlyMileage: number;
  tireLifespan: number;
  tirePrice: number;
  retreadPrice: number;
  tirePressureCheck: string;
  retreadingCycles: string;
  vehiclesWithTracking: number;
  trackingCostPerVehicle: number;
  fuelSavingsPercentage: number;
  cpkImprovementPercentage: number;
  carcassSavingsPercentage: number;
  r1TireLifespan: number;
  r2TireLifespan: number;
  submittedAt: string;
  savingsPerTirePerMonth: number;
  totalSavings: number;
  userName: string;
};

export default function ComparisonPage() {
  const [_, navigate] = useLocation();
  const [simulationIds, setSimulationIds] = useState<number[]>([]);
  const { logoutMutation } = useAuth();

  // Função para verificar se há diferenças nos valores
  const hasValueDifferences = (fieldName: string, simulations: any[]) => {
    if (!simulations || simulations.length <= 1) return false;
    const firstValue = simulations[0][fieldName];
    return simulations.some(sim => sim[fieldName] !== firstValue);
  };

  // Função para obter classe CSS se o valor for diferente
  const getDifferenceClass = (fieldName: string, simulations: any[]) => {
    return hasValueDifferences(fieldName, simulations) ? "text-red-600 bg-red-50" : "";
  };

  // Extrair IDs da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ids = urlParams.getAll('ids').map(id => parseInt(id));
    setSimulationIds(ids);
  }, []);

  // Buscar dados das simulações
  const { data: simulations, isLoading, isError } = useQuery({
    queryKey: ["/api/admin/comparison", simulationIds],
    queryFn: async () => {
      if (simulationIds.length === 0) return [];
      
      const params = new URLSearchParams();
      simulationIds.forEach(id => params.append('ids', id.toString()));
      
      const response = await fetch(`/api/admin/comparison?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar simulações');
      }
      
      return response.json() as Calculation[];
    },
    enabled: simulationIds.length > 0,
  });

  if (simulationIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav handleLogout={() => logoutMutation.mutate()} />
        <main className="container mx-auto p-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Nenhuma simulação selecionada</h2>
            <p className="text-gray-600 mb-6">Selecione simulações no dashboard para compará-las.</p>
            <Button onClick={() => navigate('/admin')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav handleLogout={() => logoutMutation.mutate()} />
        <main className="container mx-auto p-4">
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando simulações...</p>
          </div>
        </main>
      </div>
    );
  }

  if (isError || (!isLoading && (!simulations || !Array.isArray(simulations) || simulations.length === 0))) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav handleLogout={() => logoutMutation.mutate()} />
        <main className="container mx-auto p-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Erro ao carregar simulações</h2>
            <p className="text-gray-600 mb-4">
              {isError ? "Erro na requisição" : "Nenhuma simulação encontrada"}
            </p>
            <Button onClick={() => navigate('/admin')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav handleLogout={() => logoutMutation.mutate()} />
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Comparação de Simulações</h2>
            <p className="text-gray-600">
              Comparando {simulations?.length || 0} simulações{simulations && simulations.length > 0 ? ` da empresa ${simulations[0]?.companyName}` : ''}
            </p>
          </div>
          <Button onClick={() => navigate('/admin')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Tabela de comparação em formato responsivo */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700 border-r">Campo</th>
                  {simulations && simulations.map((sim: any, index: number) => (
                    <th key={sim.id} className="text-center p-4 font-semibold text-gray-700 border-r">
                      <div className="flex flex-col items-center">
                        <Badge variant="outline" className="mb-2">
                          Simulação #{sim.id}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(sim.submittedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Empresa */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Empresa</td>
                  {simulations.map((sim) => (
                    <td key={`company-${sim.id}`} className="p-4 text-center border-r">{sim.companyName}</td>
                  ))}
                </tr>

                {/* Usuário */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Usuário</td>
                  {simulations.map((sim) => (
                    <td key={`user-${sim.id}`} className="p-4 text-center border-r">{sim.userName || 'N/A'}</td>
                  ))}
                </tr>

                {/* Frota */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Frota</td>
                  {simulations.map((sim) => (
                    <td key={`fleet-${sim.id}`} className={`p-4 text-center border-r ${getDifferenceClass('fleetSize', simulations || [])}`}>
                      {sim.fleetSize?.toLocaleString('pt-BR')} veículos
                    </td>
                  ))}
                </tr>

                {/* Total de Pneus */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Total de Pneus</td>
                  {simulations.map((sim) => (
                    <td key={`tires-${sim.id}`} className="p-4 text-center border-r">{sim.totalTires?.toLocaleString('pt-BR')} pneus</td>
                  ))}
                </tr>

                {/* Consumo Combustível */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Consumo Combustível</td>
                  {simulations.map((sim) => (
                    <td key={`fuel-${sim.id}`} className="p-4 text-center border-r">{sim.fuelConsumption} km/l</td>
                  ))}
                </tr>

                {/* Preço Combustível */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Preço Combustível</td>
                  {simulations.map((sim) => (
                    <td key={`fuel-price-${sim.id}`} className="p-4 text-center border-r">{formatCurrency(sim.fuelPrice)}</td>
                  ))}
                </tr>

                {/* Quilometragem Mensal */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Quilometragem Mensal</td>
                  {simulations.map((sim) => (
                    <td key={`mileage-${sim.id}`} className="p-4 text-center border-r">{sim.monthlyMileage?.toLocaleString('pt-BR')} km</td>
                  ))}
                </tr>

                {/* Vida Útil Pneu */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Vida Útil Pneu</td>
                  {simulations.map((sim) => (
                    <td key={`lifespan-${sim.id}`} className="p-4 text-center border-r">{sim.tireLifespan?.toLocaleString('pt-BR')} km</td>
                  ))}
                </tr>

                {/* Preço Pneu */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Preço Pneu</td>
                  {simulations.map((sim) => (
                    <td key={`tire-price-${sim.id}`} className="p-4 text-center border-r">{formatCurrency(sim.tirePrice)}</td>
                  ))}
                </tr>

                {/* Preço Recape */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Preço Recape</td>
                  {simulations.map((sim) => (
                    <td key={`retread-price-${sim.id}`} className="p-4 text-center border-r">{formatCurrency(sim.retreadPrice)}</td>
                  ))}
                </tr>

                {/* Verificação Pressão */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Verificação Pressão</td>
                  {simulations.map((sim) => (
                    <td key={`pressure-${sim.id}`} className="p-4 text-center border-r">
                      {sim.tirePressureCheck === "semanal" ? "Semanal" : sim.tirePressureCheck === "mensal" ? "Mensal" : "Quinzenal"}
                    </td>
                  ))}
                </tr>

                {/* Ciclos Recape */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Ciclos Recape</td>
                  {simulations.map((sim) => (
                    <td key={`cycles-${sim.id}`} className="p-4 text-center border-r">{sim.retreadingCycles} ciclos</td>
                  ))}
                </tr>

                {/* Veículos com Rastreamento */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Veículos c/ Rastreamento</td>
                  {simulations.map((sim) => (
                    <td key={`tracking-${sim.id}`} className="p-4 text-center border-r">{sim.vehiclesWithTracking?.toLocaleString('pt-BR')} veículos</td>
                  ))}
                </tr>

                {/* Custo Rastreamento */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Custo Rastreamento</td>
                  {simulations.map((sim) => (
                    <td key={`tracking-cost-${sim.id}`} className="p-4 text-center border-r">{formatCurrency(sim.trackingCostPerVehicle)}</td>
                  ))}
                </tr>

                {/* Economia Combustível */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Economia Combustível</td>
                  {simulations.map((sim) => (
                    <td key={`fuel-savings-${sim.id}`} className="p-4 text-center border-r">{sim.fuelSavingsPercentage}%</td>
                  ))}
                </tr>

                {/* Melhoria CPK */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Melhoria CPK</td>
                  {simulations.map((sim) => (
                    <td key={`cpk-${sim.id}`} className="p-4 text-center border-r">{sim.cpkImprovementPercentage}%</td>
                  ))}
                </tr>

                {/* Economia Carcaça */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Economia Carcaça</td>
                  {simulations.map((sim) => (
                    <td key={`carcass-${sim.id}`} className="p-4 text-center border-r">{sim.carcassSavingsPercentage}%</td>
                  ))}
                </tr>

                {/* Vida R1 */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Vida Útil R1</td>
                  {simulations.map((sim) => (
                    <td key={`r1-${sim.id}`} className="p-4 text-center border-r">{sim.r1TireLifespan?.toLocaleString('pt-BR')} km</td>
                  ))}
                </tr>

                {/* Vida R2 */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-gray-50 border-r">Vida Útil R2</td>
                  {simulations.map((sim) => (
                    <td key={`r2-${sim.id}`} className="p-4 text-center border-r">{sim.r2TireLifespan?.toLocaleString('pt-BR')} km</td>
                  ))}
                </tr>

                {/* Economia por Pneu/Mês */}
                <tr className="border-b bg-blue-50">
                  <td className="p-4 font-medium bg-gray-50 border-r">Economia/Pneu/Mês</td>
                  {simulations.map((sim) => (
                    <td key={`savings-tire-${sim.id}`} className="p-4 text-center border-r font-semibold text-blue-600">
                      {formatCurrency(sim.savingsPerTirePerMonth)}
                    </td>
                  ))}
                </tr>

                {/* Total de Economia */}
                <tr className="border-b bg-green-50">
                  <td className="p-4 font-medium bg-gray-50 border-r">Total de Economia</td>
                  {simulations.map((sim) => (
                    <td key={`total-savings-${sim.id}`} className="p-4 text-center border-r font-bold text-green-600 text-lg">
                      {formatCurrency(sim.totalSavings)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}