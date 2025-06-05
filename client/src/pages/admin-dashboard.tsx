import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender,
  createColumnHelper,
  ColumnDef
} from "@tanstack/react-table";
import { useAuth } from "@/hooks/use-auth";
import TopNav from "@/components/admin/top-nav";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Search, LogOut, Eye, Filter, Download, Calendar, Trash2, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Tipos para os objetos retornados pela API
type Calculation = {
  id: number;
  companyName: string;
  fleetSize: number;
  totalTires: number;
  submittedAt: string;
  savingsPerTirePerMonth: number;
  totalSavings: number;
  userName?: string; // Nome do usuário que fez a simulação (pode ser null)
};

type CompanyInfo = {
  name: string;
  count: number;
};

type AdminStats = {
  totalCalculations: number;
  calculationsToday: number;
  uniqueCompanies: number;
  companiesList: CompanyInfo[];
};

// Definir o tipo para a resposta da API de cálculos
type CalculationsResponse = {
  calculations: Calculation[];
  totalResults: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export default function AdminDashboard() {
  const [_, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCalculation, setSelectedCalculation] = useState<Calculation | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [companiesDialogOpen, setCompaniesDialogOpen] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [calculationToDelete, setCalculationToDelete] = useState<{id: number, userName: string} | null>(null);
  const [columnSizing, setColumnSizing] = useState({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logoutMutation } = useAuth();
  const perPage = 10;



  // Consultar lista de cálculos
  const {
    data: calculationsData,
    isLoading: isLoadingCalculations,
    isError: isCalculationsError,
    refetch: refetchCalculations
  } = useQuery({
    queryKey: ["/api/admin/calculations", page, searchTerm, dateFilter],
    queryFn: async ({ queryKey }) => {
      const [endpoint, currentPage, search, date] = queryKey as [string, number, string, string];
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('perPage', perPage.toString());
      if (search) params.append('search', search);
      if (date) params.append('dateFilter', date);

      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não autorizado');
        }
        throw new Error('Falha ao obter dados');
      }
      return response.json();
    },
    retry: false
  });



  // Definir colunas da tabela com redimensionamento
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: "select",
      header: () => {
        const allSelected = calculationsData?.calculations && selectedIds.length === calculationsData.calculations.length && calculationsData.calculations.length > 0;
        const someSelected = selectedIds.length > 0 && selectedIds.length < (calculationsData?.calculations?.length || 0);
        
        return (
          <input
            type="checkbox"
            checked={allSelected || false}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={(e) => {
              if (e.target.checked && calculationsData?.calculations) {
                setSelectedIds(calculationsData.calculations.map((calc: any) => calc.id));
              } else {
                setSelectedIds([]);
              }
            }}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        );
      },
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.original.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds(prev => [...prev, row.original.id]);
            } else {
              setSelectedIds(prev => prev.filter(id => id !== row.original.id));
            }
          }}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      ),
      size: 50,
      enableResizing: false,
    },
    {
      accessorKey: "id",
      header: "ID",
      size: 60,
      minSize: 50,
      maxSize: 100,
    },
    {
      accessorKey: "companyName",
      header: "Empresa",
      size: 200,
      minSize: 150,
      maxSize: 400,
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "userName",
      header: "Usuário",
      size: 150,
      minSize: 100,
      maxSize: 250,
      cell: ({ getValue }) => (
        <span>{(getValue() as string) || "Usuário não identificado"}</span>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: "Data",
      size: 120,
      minSize: 100,
      maxSize: 150,
      cell: ({ getValue }) => formatDate(getValue() as string),
    },
    {
      accessorKey: "fleetSize",
      header: "Frota",
      size: 100,
      minSize: 80,
      maxSize: 120,
      cell: ({ getValue }) => `${(getValue() as number).toLocaleString('pt-BR')} veículos`,
    },
    {
      accessorKey: "totalTires",
      header: "Total de Pneus",
      size: 120,
      minSize: 100,
      maxSize: 150,
      cell: ({ getValue }) => `${(getValue() as number).toLocaleString('pt-BR')} pneus`,
    },
    {
      accessorKey: "fuelConsumption",
      header: "Consumo Combustível",
      size: 140,
      minSize: 120,
      maxSize: 160,
      cell: ({ getValue }) => `${getValue()} km/l`,
    },
    {
      accessorKey: "fuelPrice",
      header: "Preço Combustível",
      size: 130,
      minSize: 110,
      maxSize: 150,
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },
    {
      accessorKey: "monthlyMileage",
      header: "Km/Mês",
      size: 100,
      minSize: 80,
      maxSize: 120,
      cell: ({ getValue }) => `${(getValue() as number).toLocaleString('pt-BR')} km`,
    },
    {
      accessorKey: "tireLifespan",
      header: "Vida Útil Pneu",
      size: 120,
      minSize: 100,
      maxSize: 140,
      cell: ({ getValue }) => `${(getValue() as number).toLocaleString('pt-BR')} km`,
    },
    {
      accessorKey: "tirePrice",
      header: "Preço Pneu",
      size: 110,
      minSize: 90,
      maxSize: 130,
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },
    {
      accessorKey: "retreadPrice",
      header: "Preço Recape",
      size: 110,
      minSize: 90,
      maxSize: 130,
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },
    {
      accessorKey: "tirePressureCheck",
      header: "Verificação Pressão",
      size: 140,
      minSize: 120,
      maxSize: 160,
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return value === "semanal" ? "Semanal" : value === "mensal" ? "Mensal" : "Quinzenal";
      },
    },
    {
      accessorKey: "retreadingCycles",
      header: "Ciclos Recape",
      size: 110,
      minSize: 90,
      maxSize: 130,
      cell: ({ getValue }) => `${getValue()} ciclos`,
    },
    {
      accessorKey: "vehiclesWithTracking",
      header: "Veículos c/ Rastreamento",
      size: 160,
      minSize: 140,
      maxSize: 200,
      cell: ({ getValue }) => `${((getValue() as number) || 0).toLocaleString('pt-BR')} veículos`,
    },
    {
      accessorKey: "trackingCostPerVehicle",
      header: "Custo Rastreamento",
      size: 140,
      minSize: 120,
      maxSize: 160,
      cell: ({ getValue }) => formatCurrency(getValue() as number || 0),
    },
    {
      accessorKey: "fuelSavingsPercentage",
      header: "% Economia Combustível",
      size: 150,
      minSize: 130,
      maxSize: 180,
      cell: ({ getValue }) => `${getValue()}%`,
    },
    {
      accessorKey: "cpkImprovementPercentage",
      header: "% Melhoria CPK",
      size: 130,
      minSize: 110,
      maxSize: 150,
      cell: ({ getValue }) => `${getValue()}%`,
    },
    {
      accessorKey: "carcassSavingsPercentage",
      header: "% Economia Carcaça",
      size: 140,
      minSize: 120,
      maxSize: 160,
      cell: ({ getValue }) => `${getValue()}%`,
    },
    {
      accessorKey: "savingsPerTirePerMonth",
      header: () => (
        <div className="whitespace-normal leading-tight">
          Economia<br />Pneu
        </div>
      ),
      size: 130,
      minSize: 100,
      maxSize: 160,
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },
    {
      accessorKey: "totalSavings",
      header: "Economia Total",
      size: 140,
      minSize: 120,
      maxSize: 180,
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },
    {
      id: "actions",
      header: "Ações",
      size: 120,
      minSize: 100,
      maxSize: 150,
      enableResizing: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => viewDetails(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-red-500 hover:text-red-700" 
            onClick={() => handleDeleteClick(row.original.id, row.original.userName)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [selectedIds]);



  // Consultar estatísticas
  const {
    data: statsData,
    isLoading: isLoadingStats,
    isError: isStatsError
  } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: false
  });

  // Configurar a tabela com redimensionamento
  const table = useReactTable({
    data: calculationsData?.calculations || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    state: {
      columnSizing,
    },
    onColumnSizingChange: setColumnSizing,
  });

  // Mutação para excluir uma simulação
  const deleteCalculationMutation = useMutation({
    mutationFn: async (calculationId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/calculations/${calculationId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir simulação');
      }
      return response.json();
    },
    onSuccess: () => {
      // Após exclusão bem-sucedida, limpar o ID da simulação a ser excluída
      setCalculationToDelete(null);

      // Invalidar consultas para atualizar os dados
      queryClient.invalidateQueries({ queryKey: ["/api/admin/calculations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });

      // Notificar o usuário
      toast({
        title: "Simulação excluída",
        description: "A simulação foi excluída com sucesso.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      // Notificar o usuário em caso de erro
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para excluir múltiplas simulações
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const results = await Promise.allSettled(
        ids.map(async (id) => {
          const response = await apiRequest('DELETE', `/api/admin/calculations/${id}`);
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Erro ao excluir simulação ${id}`);
          }
          return response.json();
        })
      );
      
      const errors = results.filter(result => result.status === 'rejected');
      if (errors.length > 0) {
        throw new Error(`${errors.length} simulações não puderam ser excluídas`);
      }
      
      return results;
    },
    onSuccess: () => {
      toast({
        title: "Simulações excluídas",
        description: `${selectedIds.length} simulações foram excluídas com sucesso.`,
      });
      // Invalidar o cache para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ["/api/admin/calculations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedIds([]);
      setBulkDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir simulações",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Tratamento de erro de autenticação
  useEffect(() => {
    const handleErrors = async () => {
      if (isCalculationsError || isStatsError) {
        // Se houver erro de autenticação, redirecionar para o login
        navigate("/admin/login");
      }
    };

    handleErrors();
  }, [isCalculationsError, isStatsError, navigate]);

  // Função para lidar com o logout administrativo - abordagem mais simples
  const handleLogout = () => {
    // Opção mais direta: forçar redirecionamento para a raiz antes de qualquer processamento
    window.location.href = window.location.origin;

    // Fazer as chamadas de API em segundo plano
    Promise.all([
      apiRequest("POST", "/api/admin/logout"),
      apiRequest("POST", "/api/auth/logout")
    ]).catch(error => {
      console.error("Erro no logout:", error);
    });
  };

  // Função para exibir detalhes de um cálculo
  const viewDetails = (calculation: Calculation) => {
    setSelectedCalculation(calculation);
    setDetailsOpen(true);
  };

  // Função para iniciar o processo de exclusão
  const handleDeleteClick = (calculationId: number, userName?: string) => {
    setCalculationToDelete({id: calculationId, userName: userName || "Usuário não identificado"});
  };

  // Função para confirmar a exclusão
  const confirmDelete = () => {
    if (calculationToDelete) {
      deleteCalculationMutation.mutate(calculationToDelete.id);
    }
  };

  // Função para cancelar a exclusão
  const cancelDelete = () => {
    setCalculationToDelete(null);
  };

  // Estado para controlar o menu de exportação
  const [exportFormat, setExportFormat] = useState<"csv" | "excel">("csv");
  const [showExportOptions, setShowExportOptions] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Hook para fechar dropdown quando clica fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportOptions(false);
      }
    };

    if (showExportOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportOptions]);




  
  // Calcular total de páginas para a paginação
  const totalPages = Math.ceil((calculationsData?.totalResults || 0) / perPage);

  const isAllSelected = calculationsData?.calculations && selectedIds.length === calculationsData.calculations.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < (calculationsData?.calculations?.length || 0);

  // Lógica para comparação de simulações
  const selectedCalculations = calculationsData?.calculations?.filter(calc => selectedIds.includes(calc.id)) || [];
  const canCompare = selectedCalculations.length >= 2 && selectedCalculations.length <= 4 && 
    selectedCalculations.every(calc => calc.companyName === selectedCalculations[0].companyName);
  

  
  const [compareOpen, setCompareOpen] = useState(false);

  // Limpar seleções quando a página muda ou quando há nova busca
  useEffect(() => {
    setSelectedIds([]);
  }, [page, searchTerm, dateFilter]);

  // Função para exportar dados em diferentes formatos
  const exportData = async (format: "csv" | "excel" = "csv") => {
    try {
      // Fechar o menu de exportação
      setShowExportOptions(false);

      // Mostrar toast informando que está exportando
      toast({
        title: "Exportando dados",
        description: `Preparando arquivo ${format.toUpperCase()}...`,
        variant: "default",
      });

      // Fazer a requisição com o formato selecionado
      const response = await apiRequest(
        "GET", 
        `/api/admin/export?filter=${dateFilter}&search=${searchTerm}&format=${format}`
      );

      if (!response.ok) {
        throw new Error("Erro ao exportar dados");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Definir a extensão do arquivo com base no formato
      const fileExtension = format === "excel" ? "xlsx" : "csv";
      a.download = `simulacoes_ecotruck_${new Date().toISOString().slice(0, 10)}.${fileExtension}`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      // Mostrar toast de sucesso
      toast({
        title: "Exportação concluída",
        description: `Os dados foram exportados com sucesso para ${format === "excel" ? "Excel" : "CSV"}.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao exportar dados:", error);

      // Mostrar toast de erro
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <TopNav handleLogout={() => {
        // Redirecionamento direto para a página do formulário sem logout
        navigate("/");
      }} />

      <main className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-6">Dashboard Administrativo</h2>

        {/* Stats Cards - Compacto */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Card className="py-2">
            <CardContent className="p-3">
              <div className="text-xs text-gray-500 mb-1">Total de Simulações</div>
              <p className="text-lg font-bold">
                {isLoadingStats ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  statsData?.totalCalculations || 0
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="py-2">
            <CardContent className="p-3">
              <div className="text-xs text-gray-500 mb-1">Simulações Hoje</div>
              <p className="text-lg font-bold text-green-600">
                {isLoadingStats ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  statsData?.calculationsToday || 0
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="py-2">
            <CardContent className="p-3 relative">
              <div className="text-xs text-gray-500 mb-1">Empresas Únicas</div>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-blue-600">
                  {isLoadingStats ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    statsData?.uniqueCompanies || 0
                  )}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => setCompaniesDialogOpen(true)}
                  disabled={isLoadingStats}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dialog para mostrar lista de empresas */}
          <Dialog open={companiesDialogOpen} onOpenChange={setCompaniesDialogOpen}>
            <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[85vh] flex flex-col">
              <div className="flex flex-col min-h-0 flex-1">
                {/* Cabeçalho fixo */}
                <div className="flex-shrink-0 border-b pb-4">
                  <DialogTitle className="text-lg font-semibold mb-3">
                    Empresas Únicas
                  </DialogTitle>
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Buscar empresa..."
                      value={companySearchTerm}
                      onChange={(e) => setCompanySearchTerm(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Área de conteúdo com scroll */}
                <div className="flex-1 overflow-hidden mt-4">
                  <div className="h-full overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead className="w-3/4">Empresa</TableHead>
                          <TableHead className="text-center w-1/4">Simulações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingStats ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                              <p className="mt-2 text-sm text-gray-500">Carregando empresas...</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          statsData?.companiesList
                            ?.filter(company => 
                              company.name.toLowerCase().includes(companySearchTerm.toLowerCase())
                            )
                            .map((company) => (
                              <TableRow key={company.name}>
                                <TableCell className="font-medium">{company.name}</TableCell>
                                <TableCell className="text-center font-semibold text-blue-600">
                                  {company.count}
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                        {!isLoadingStats && statsData?.companiesList?.filter(company => 
                          company.name.toLowerCase().includes(companySearchTerm.toLowerCase())
                        ).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                              Nenhuma empresa encontrada
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Footer fixo */}
                <div className="flex-shrink-0 flex justify-end pt-4 mt-4 border-t">
                  <Button 
                    type="button" 
                    variant="default" 
                    className="bg-blue-600 hover:bg-blue-700 text-white" 
                    onClick={() => setCompaniesDialogOpen(false)}
                  >
                    Voltar ao Dashboard
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por empresa..." 
              className="pl-8 pr-8 w-full"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // Aplicar a busca automaticamente após um curto delay
                if (e.target.value.length > 0) {
                  // Limitar a quantidade de requisições com um delay
                  const timer = setTimeout(() => {
                    setPage(1);
                    refetchCalculations();
                  }, 300);
                  return () => clearTimeout(timer);
                } else if (e.target.value === '') {
                  // Se o campo estiver vazio, resetar a busca
                  setPage(1);
                  refetchCalculations();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  refetchCalculations();
                }
              }}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                  refetchCalculations();
                }}
                className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Select 
              value={dateFilter} 
              onValueChange={(value) => {
                setDateFilter(value);
                setPage(1);
                refetchCalculations();
              }}
            >
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as datas</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>

            {selectedIds.length > 0 && (
              <Button 
                onClick={() => setBulkDeleteDialogOpen(true)}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar ({selectedIds.length})
              </Button>
            )}

            {canCompare && (
              <Button 
                onClick={() => {
                  const params = new URLSearchParams();
                  selectedIds.forEach(id => params.append('ids', id.toString()));
                  navigate(`/admin/comparison?${params.toString()}`);
                }}
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
              >
                <Eye className="mr-2 h-4 w-4" />
                Comparar
              </Button>
            )}

            <div className="relative" ref={exportDropdownRef}>
              <Button
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="flex items-center"
                variant="default"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>

              {showExportOptions && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border"
                >
                  <div className="py-1">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={(e) => {
                        e.preventDefault();
                        exportData("csv");
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Exportar como CSV
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={(e) => {
                        e.preventDefault();
                        exportData("excel");
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Exportar como Excel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Table with Resizable Columns */}
        <div className="bg-white shadow rounded-lg overflow-hidden border-2 border-blue-200">
          <div 
            className="relative max-h-[600px] overflow-auto"
            style={{ 
              scrollbarWidth: 'auto',
              scrollbarColor: '#d1d5db #f3f4f6'
            }}
          >
            <table 
              className="w-full border-collapse min-w-full"
              style={{ width: table.getCenterTotalSize() }}
            >
              <thead 
                className="bg-gray-50 border-b-2 border-gray-200 shadow-lg"
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  backgroundColor: '#f9fafb',
                  backdropFilter: 'blur(4px)'
                }}
              >
                {table.getHeaderGroups().map((headerGroup: any) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header: any) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 relative bg-gray-50"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className="absolute right-0 top-0 h-full w-1 bg-gray-300 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100 transition-opacity"
                            style={{
                              transform: header.column.getIsResizing()
                                ? `translateX(${table.getState().columnSizingInfo.deltaOffset ?? 0}px)`
                                : '',
                            }}
                          />
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoadingCalculations ? (
                  <tr>
                    <td colSpan={table.getAllColumns().length} className="text-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      <p className="mt-2 text-gray-500">Carregando dados...</p>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={table.getAllColumns().length} className="text-center py-10">
                      <p className="text-gray-500">Nenhuma simulação encontrada</p>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row: any) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell: any) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200"
                          style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage(page - 1);
                  }}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(pageNum);
                    }}
                    isActive={pageNum === page}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage(page + 1);
                  }}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={calculationToDelete !== null} onOpenChange={(open) => !open && setCalculationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Simulação</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a simulação #{calculationToDelete?.id} de {calculationToDelete?.userName} do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {deleteCalculationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Múltiplas Simulações</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente {selectedIds.length} simulações selecionadas do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => bulkDeleteMutation.mutate(selectedIds)}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {bulkDeleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                `Excluir ${selectedIds.length} Simulações`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
