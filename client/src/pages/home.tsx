import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalculatorFormData, SavingsResult } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { v4 as uuidv4 } from "uuid";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

import Header from "@/components/header";
import Footer from "@/components/footer";
import FormStepOne from "@/components/calculator/form-step-one";
import FormStepTwo from "@/components/calculator/form-step-two";
import FormStepThree from "@/components/calculator/form-step-three";
import FormStepFour from "@/components/calculator/form-step-four";
import FormStepFive from "@/components/calculator/form-step-five";
import FormStepSix from "@/components/calculator/form-step-six";
import Results from "@/components/calculator/results";
import ThankYou from "@/components/calculator/thank-you";
import CalculationVariables from "@/components/calculator/calculation-variables";

import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  // Número máximo de etapas no formulário
  const MAX_STEPS = 6;
  const [formData, setFormData] = useState<Partial<CalculatorFormData>>({});
  const [calculationResults, setCalculationResults] = useState<SavingsResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showDataRestoreAlert, setShowDataRestoreAlert] = useState(true); // Iniciamos com true para mostrar o alerta de restauração
  const { toast } = useToast();
  const { user } = useAuth(); // Obtém o usuário autenticado
  
  // Gerar ou recuperar sessionId e dados do formulário
  useEffect(() => {
    // Gerar um sessionId para a sessão atual
    const storedSessionId = localStorage.getItem("ecotruck_session_id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = uuidv4();
      localStorage.setItem("ecotruck_session_id", newSessionId);
      setSessionId(newSessionId);
    }
    
    // Tentar recuperar dados do formulário do localStorage
    const storedFormData = localStorage.getItem("ecotruck_form_data");
    if (storedFormData) {
      try {
        const parsedData = JSON.parse(storedFormData);
        if (Object.keys(parsedData).length > 0) {
          setFormData(parsedData);
          console.log("Dados do formulário recuperados do localStorage:", parsedData);
        }
      } catch (e) {
        console.error("Erro ao recuperar dados do localStorage:", e);
      }
    }
    
    setIsLoading(false);
  }, []);

  // Buscar último cálculo do usuário ou da sessão
  const lastCalculationQuery = useQuery({
    queryKey: ['/api/last-calculation', user?.id || sessionId],
    queryFn: async () => {
      try {
        // Se o usuário estiver autenticado, buscamos pelo ID do usuário
        // Caso contrário, usamos o sessionId
        const queryParam = user?.id 
          ? `userId=${user.id}` 
          : `sessionId=${encodeURIComponent(sessionId)}`;
        
        // Se não tiver nenhum dos dois, retornamos null
        if (!user?.id && !sessionId) return null;
        
        // Adicionar um pequeno atraso para priorizar o carregamento da UI
        // Isso é especialmente útil quando voltamos da área administrativa
        const delayLoad = new URLSearchParams(window.location.search).get('fromAdmin') === 'true';
        if (delayLoad) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const response = await apiRequest(
          "GET", 
          `/api/last-calculation?${queryParam}`
        );
        return response.json();
      } catch (error) {
        console.log("Sem cálculos anteriores", user?.id ? "para este usuário" : "para esta sessão");
        return null;
      }
    },
    enabled: (!isLoading && (!!user?.id || !!sessionId)),
    retry: false,
    // Diminui a prioridade desta query para melhorar o tempo de carregamento visual
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false
  });

  // Flag para controlar se devemos restaurar os dados automaticamente
  const [shouldRestoreData, setShouldRestoreData] = useState(true);
  
  // Função para restaurar os dados manualmente
  const restoreLastCalculation = () => {
    if (!lastCalculationQuery.data) return;
    
    const formDataWithCorrectTypes = {
      ...lastCalculationQuery.data.formData,
      r1TireLifespan: lastCalculationQuery.data.formData.r1TireLifespan ? 
                      Number(lastCalculationQuery.data.formData.r1TireLifespan) : undefined,
      r2TireLifespan: lastCalculationQuery.data.formData.r2TireLifespan ? 
                      Number(lastCalculationQuery.data.formData.r2TireLifespan) : undefined
    };
    
    setFormData(formDataWithCorrectTypes);
    
    // Salvar os dados no localStorage
    try {
      localStorage.setItem("ecotruck_form_data", JSON.stringify(formDataWithCorrectTypes));
    } catch (e) {
      console.error("Erro ao salvar dados restaurados no localStorage:", e);
    }
    
    // Não exibimos mais o toast para melhorar a experiência do usuário
    // Quando o usuário clica em "restaurar dados", ele já sabe o que vai acontecer
  };
  
  // Preencher o formulário com os dados do último cálculo quando disponível
  useEffect(() => {
    console.log("useEffect para restaurar dados:", { 
      hasData: !!lastCalculationQuery.data, 
      queryStatus: lastCalculationQuery.status,
      showResults,
      showThankYou,
      formDataEmpty: Object.keys(formData).length === 0,
      shouldRestoreData
    });

    // MEDIDA DE SEGURANÇA: Verificar se o usuário está logado e tem seus próprios dados
    // 1. Se não estiver logado, não restaura dados para evitar vazamento entre sessões
    // 2. Se estiver logado, só restaura dados que pertençam a este usuário específico
    if (!user?.id) {
      // Se não há usuário logado, não restauramos dados
      console.log("Usuário não logado, não restaurando dados para evitar vazamento de informações");
      return;
    }

    // Se o usuário está logado mas não tem cálculos (retornou erro 404), 
    // limpar dados do localStorage e permitir preencher o formulário normalmente
    if (lastCalculationQuery.status === 'error' || 
        (lastCalculationQuery.status === 'success' && !lastCalculationQuery.data)) {
      console.log("Sem cálculos anteriores", "para este usuário");
      
      // IMPORTANTE: Limpar o localStorage e o estado para não mostrar dados de outro usuário
      localStorage.removeItem("ecotruck_form_data");
      
      // Se existe algum dado no formData, limpar para o novo usuário começar do zero
      if (Object.keys(formData).length > 0) {
        setFormData({});
      }
      
      return;
    }

    if (lastCalculationQuery.data) {
      console.log("Dados do último cálculo obtidos para o usuário:", user.id);
      
      // Garantia adicional de segurança: Verificar se tem um appUserId nos resultados
      // e se corresponde ao usuário atual
      if (lastCalculationQuery.data.appUserId && 
          lastCalculationQuery.data.appUserId !== user.id) {
        console.error("ALERTA DE SEGURANÇA: Os dados pertencem a outro usuário!");
        // Limpar o localStorage para evitar vazamento de dados entre usuários
        localStorage.removeItem("ecotruck_form_data");
        // Não restauramos os dados e limpamos o formulário
        setFormData({});
        return;
      }
      
      // Verifica se temos dados para restaurar, se não está mostrando resultados ou tela de agradecimento
      if (!showResults && !showThankYou && shouldRestoreData) {
        console.log("Restaurando dados do formulário para o usuário:", user.id);
        
        // Garantir que os campos r1TireLifespan e r2TireLifespan são do tipo number 
        const formDataWithCorrectTypes = {
          ...lastCalculationQuery.data.formData,
          r1TireLifespan: lastCalculationQuery.data.formData.r1TireLifespan ? 
                          Number(lastCalculationQuery.data.formData.r1TireLifespan) : undefined,
          r2TireLifespan: lastCalculationQuery.data.formData.r2TireLifespan ? 
                          Number(lastCalculationQuery.data.formData.r2TireLifespan) : undefined
        };
        
        setFormData(formDataWithCorrectTypes);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCalculationQuery.data, lastCalculationQuery.status, showResults, showThankYou, shouldRestoreData, user?.id]);

  const calculateMutation = useMutation({
    mutationFn: async (data: CalculatorFormData) => {
      // Registrar valores críticos antes do envio
      console.log("Valores críticos sendo enviados para cálculo:", {
        fuelSavingsPercentage: data.fuelSavingsPercentage,
        cpkImprovementPercentage: data.cpkImprovementPercentage,
        carcassSavingsPercentage: data.carcassSavingsPercentage
      });
      
      // Buscar Ganhos Adicionais do localStorage para enviar junto com o cálculo
      let additionalGains = [];
      try {
        const storageKey = user?.id ? `additionalGains_user_${user.id}` : 'additionalGains';
        const savedGains = localStorage.getItem(storageKey);
        if (savedGains) {
          const parsedGains = JSON.parse(savedGains);
          additionalGains = parsedGains.filter((gain: any) => gain.name?.trim() && gain.value > 0);
          console.log("📊 Enviando Ganhos Adicionais para salvar no banco:", additionalGains);
        }
      } catch (error) {
        console.error('Erro ao processar ganhos adicionais para envio:', error);
      }
      
      const payload = {
        ...data,
        sessionId, // Incluir o sessionId no payload
        additionalGains, // Incluir os Ganhos Adicionais no payload
      };
      // O backend já pega o userId da sessão, não precisamos enviar explicitamente
      const response = await apiRequest("POST", "/api/calculate", payload);
      return response.json();
    },
    onSuccess: (data: SavingsResult & { calculationId: number }) => {
      setCalculationResults(data);
      setCalculationId(data.calculationId);
      setShowResults(true);
    },
    onError: (error) => {
      toast({
        title: "Erro ao calcular",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar os dados",
        variant: "destructive",
      });
    },
  });

  const [calculationId, setCalculationId] = useState<number | null>(null);
  
  const sendEmailMutation = useMutation({
    mutationFn: async (data: { email: string; calculationId: number }) => {
      const response = await apiRequest("POST", "/api/send-email", data);
      return response.json();
    },
    onSuccess: () => {
      setShowResults(false);
      setShowThankYou(true);
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar email",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao enviar o email",
        variant: "destructive",
      });
    },
  });

  const updateFormData = (stepData: Partial<CalculatorFormData>) => {
    setFormData((prev) => {
      const newData = { ...prev, ...stepData };
      
      // Salvar os dados no localStorage sempre que forem atualizados
      try {
        localStorage.setItem("ecotruck_form_data", JSON.stringify(newData));
        console.log("Dados salvos no localStorage:", newData);
      } catch (e) {
        console.error("Erro ao salvar dados no localStorage:", e);
      }
      
      return newData;
    });
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, MAX_STEPS));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };
  
  // Função para ir diretamente para a página de cálculo (página 6)
  const jumpToCalculationPage = () => {
    setCurrentStep(6);
  };

  const calculateResults = () => {
    // SOLUÇÃO DEFINITIVA PARA O PROBLEMA DAS VARIÁVEIS PERSONALIZADAS
    
    // 1. Obtenha os valores atuais do localStorage
    const storedData = localStorage.getItem("ecotruck_form_data");
    const parsedData = storedData ? JSON.parse(storedData) : {};
    
    // 2. Crie uma cópia limpa dos dados do formulário
    const calculationData = {
      // Copie todos os dados do formulário
      ...formData,
      
      // PARTE CRÍTICA: Obtenha os valores personalizados do localStorage
      // Se não existirem, use os valores do formulário ou os padrões
      fuelSavingsPercentage: parsedData.fuelSavingsPercentage ?? formData.fuelSavingsPercentage ?? 1,
      cpkImprovementPercentage: parsedData.cpkImprovementPercentage ?? formData.cpkImprovementPercentage ?? 5,
      carcassSavingsPercentage: parsedData.carcassSavingsPercentage ?? formData.carcassSavingsPercentage ?? 10,
    };
    
    // 3. Exiba os valores que serão utilizados no cálculo
    console.log("VALORES EXATOS QUE SERÃO USADOS NO CÁLCULO:", {
      economia_combustivel: calculationData.fuelSavingsPercentage + "%",
      melhoria_cpk: calculationData.cpkImprovementPercentage + "%",
      economia_carcaca: calculationData.carcassSavingsPercentage + "%"
    });
    
    // 4. Verifique os campos obrigatórios
    const baseRequiredFields = [
      { key: 'companyName', label: 'Nome da empresa' },
      { key: 'fleetSize', label: 'Tamanho da frota' },
      { key: 'totalTires', label: 'Quantidade total de pneus' },
      { key: 'fuelConsumption', label: 'Consumo de combustível' },
      { key: 'fuelPrice', label: 'Preço do combustível' },
      { key: 'monthlyMileage', label: 'Quilometragem mensal' },
      { key: 'tireLifespan', label: 'Vida útil dos pneus' },
      { key: 'tirePrice', label: 'Preço do pneu' },
      { key: 'retreadPrice', label: 'Preço da recapagem' },
      { key: 'tirePressureCheck', label: 'Frequência de verificação de pressão' },
      { key: 'retreadingCycles', label: 'Número de recapagens por pneu' }
    ];
    
    // Campos condicionais baseados no valor de retreadingCycles
    let conditionalFields: Array<{key: string, label: string}> = [];
    
    // Se tiver pelo menos 1 recapagem, exige quilometragem do pneu R1
    if (calculationData.retreadingCycles === '1' || calculationData.retreadingCycles === '2') {
      conditionalFields.push({ key: 'r1TireLifespan', label: 'Quilometragem do pneu R1' });
    }
    
    // Se tiver 2 recapagens, exige quilometragem do pneu R2
    if (calculationData.retreadingCycles === '2') {
      conditionalFields.push({ key: 'r2TireLifespan', label: 'Quilometragem do pneu R2' });
    }
    
    // Combina os campos base com os campos condicionais
    const requiredFields = [...baseRequiredFields, ...conditionalFields];
    
    // Verifica quais campos estão faltando
    const missingFields = requiredFields.filter(field => {
      const value = calculationData[field.key as keyof typeof calculationData];
      return value === undefined || value === null || value === '' || 
             (typeof value === 'number' && isNaN(value));
    });
    
    // 5. Se não houver campos faltando, envie os dados para cálculo
    if (missingFields.length === 0) {
      // IMPORTANTE: Use os dados preparados e não o formData original
      calculateMutation.mutate(calculationData as CalculatorFormData);
    } else {
      // Formatando a mensagem do toast como texto
      const missingFieldsBullets = missingFields.map(field => `• ${field.label}`).join('\n');
      
      toast({
        title: "Formulário incompleto",
        description: `Preencha os seguintes campos:\n${missingFieldsBullets}`,
        variant: "destructive",
        duration: 6000, // Aumentar a duração para dar tempo de ler
      });
      
      // Vamos também destacar visualmente os campos faltantes
      if (missingFields.some(field => ['tirePressureCheck', 'retreadingCycles'].includes(field.key))) {
        // Se campos do último passo estiverem faltando, mantenha o usuário nele
        // e exiba o erro no toast
      } else {
        // Se os campos estiverem em passos anteriores, volte para o primeiro passo com campos faltantes
        const stepsWithMissingFields = [
          // Passo 1
          missingFields.some(field => ['companyName', 'fleetSize', 'totalTires'].includes(field.key)) ? 1 : 0,
          // Passo 2
          missingFields.some(field => ['fuelConsumption', 'fuelPrice'].includes(field.key)) ? 2 : 0,
          // Passo 3
          missingFields.some(field => ['monthlyMileage', 'tireLifespan'].includes(field.key)) ? 3 : 0,
          // Passo 4
          missingFields.some(field => ['tirePrice', 'retreadPrice'].includes(field.key)) ? 4 : 0,
        ].filter(step => step > 0);
        
        if (stepsWithMissingFields.length > 0) {
          // Voltar para o primeiro passo com campos faltantes
          setCurrentStep(stepsWithMissingFields[0]);
        }
      }
      
      console.log("Campos preenchidos:", calculationData);
      console.log("Campos faltando:", missingFields);
    }
  };

  const handleSendEmail = (email: string) => {
    if (calculationResults && calculationId) {
      sendEmailMutation.mutate({ 
        email, 
        calculationId: calculationId
      });
    } else {
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível identificar o cálculo. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    // Limpar todos os dados do formulário
    setFormData({});
    setCalculationResults(null);
    setCalculationId(null);
    
    // Esconder resultados e página de agradecimento
    setShowResults(false);
    setShowThankYou(false);
    
    // Redefinir para o primeiro passo
    setCurrentStep(1);
    
    // Limpar dados do formulário no localStorage
    localStorage.removeItem("ecotruck_form_data");
    
    // Criar um novo sessionId para evitar a restauração dos dados do último cálculo
    const newSessionId = uuidv4();
    localStorage.setItem("ecotruck_session_id", newSessionId);
    setSessionId(newSessionId);
    
    // Desativar a restauração automática dos dados
    setShouldRestoreData(false);
    
    // Forçar uma re-renderização da página atual
    // Isso garante que todos os campos sejam atualizados
    setTimeout(() => {
      // Este setState vazio força uma re-renderização 
      // e garante que o componente FormStepOne receba os novos dados vazios
      setCurrentStep(prev => prev);
    }, 50);
    
    // Feedback para o usuário
    toast({
      title: "Formulário reiniciado",
      description: "Um novo formulário em branco foi criado para você.",
    });
  };

  const calculateProgress = () => {
    return (currentStep / 5) * 100;
  };

  const renderFormStep = () => {
    console.log("Renderizando formulário, passo atual:", currentStep);
    switch (currentStep) {
      case 1:
        return (
          <FormStepOne 
            formData={formData} 
            updateFormData={updateFormData} 
            isBlocked={showDataRestoreAlert && Object.keys(formData).length > 0} // Bloquear quando tiver dados para restaurar e alerta estiver visível
            jumpToCalculationPage={jumpToCalculationPage} // Passar função para pular para página de cálculo
            nextStep={() => {
              // Só permitir avançar se o usuário já fez uma escolha em relação aos dados restaurados
              // ou se não há dados para restaurar
              if (!showDataRestoreAlert || Object.keys(formData).length === 0) {
                nextStep();
              } else {
                // Destaca o alerta para chamar atenção do usuário
                const alertElement = document.querySelector('.border-yellow-400');
                if (alertElement) {
                  alertElement.classList.add('animate-pulse');
                  setTimeout(() => {
                    alertElement.classList.remove('animate-pulse');
                  }, 1000);
                }
              }
            }}
          />
        );
      case 2:
        return (
          <FormStepTwo 
            formData={formData} 
            updateFormData={updateFormData} 
            nextStep={nextStep} 
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <FormStepThree 
            formData={formData} 
            updateFormData={updateFormData} 
            nextStep={nextStep} 
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <FormStepFour 
            formData={formData} 
            updateFormData={updateFormData} 
            nextStep={nextStep} 
            prevStep={prevStep}
          />
        );
      case 5:
        return (
          <FormStepFive 
            formData={formData} 
            updateFormData={updateFormData} 
            calculateResults={calculateResults} 
            prevStep={prevStep}
            nextStep={nextStep}
            isCalculating={calculateMutation.isPending}
          />
        );
      case 6:
        return (
          <FormStepSix 
            formData={formData} 
            updateFormData={updateFormData} 
            calculateResults={calculateResults} 
            prevStep={prevStep}
            isCalculating={calculateMutation.isPending}
          />
        );
      default:
        return null;
    }
  };

  // Condicional para mostrar o aviso de dados restaurados - simplificada
  const showRestoredDataAlert = lastCalculationQuery.isSuccess && 
                              lastCalculationQuery.data && 
                              !showResults && 
                              !showThankYou &&
                              showDataRestoreAlert; // Simplificamos a condição
                              
  // Adicionar console.log para verificar o estado
  useEffect(() => {
    // Log mais detalhado para debug
    console.log("Estado detalhado:", { 
      showRestoredDataAlert, 
      showDataRestoreAlert,
      lastCalculationSuccess: lastCalculationQuery.isSuccess,
      hasData: !!lastCalculationQuery.data,
      hasFormData: Object.keys(formData).length > 0,
      showResults,
      showThankYou
    });
  }, [showRestoredDataAlert, showDataRestoreAlert, lastCalculationQuery.isSuccess, 
      lastCalculationQuery.data, formData, showResults, showThankYou]);
                              
  // Função para fechar o alerta e continuar com o formulário atual
  const continueWithCurrentForm = () => {
    setShowDataRestoreAlert(false); // Esconde o alerta em todas as páginas
    console.log("Continuando com o formulário atual - alerta fechado");
    
    // Não avança automaticamente, apenas remove o alerta
    // permitindo que o usuário edite os campos na página 1
  };
  
  // SOLUÇÃO CORRIGIDA: Implementação direcionada para limpar apenas dados do formulário
  const handleResetForm = () => {
    // Esconde o alerta primeiro
    setShowDataRestoreAlert(false);
    
    // Procedimento de limpeza controlada:
    // 1. Limpar APENAS os dados do formulário no localStorage
    localStorage.removeItem("ecotruck_form_data");
    
    // 2. Criar um novo sessionId para evitar restauração dos mesmos dados
    const newSessionId = uuidv4();
    localStorage.setItem("ecotruck_session_id", newSessionId);
    setSessionId(newSessionId);
    
    // 3. Limpar completamente o estado do formulário
    setFormData({});
    setCalculationResults(null);
    setCalculationId(null);
    setShowResults(false);
    setShowThankYou(false);
    
    // 4. Impedir restaurações automáticas de dados antigos
    setShouldRestoreData(false);
    
    // 5. Forçar reset do formulário para o passo 1
    // Primeiro volta para um passo inválido para forçar re-renderização
    setCurrentStep(0);
    setTimeout(() => {
      setCurrentStep(1);
    }, 10);
    
    // 6. Confirma a ação para o usuário
    toast({
      title: "Dados limpos",
      description: "O formulário foi reiniciado com sucesso.",
      variant: "default",
    });
  };
  
  // Removemos o botão "Limpar formulário" por completo, 
  // já que o botão "Novo cálculo" no alerta cumpre a mesma função

  // Debug info
  console.log("Estado atual:", { 
    currentStep, 
    showResults, 
    showThankYou, 
    hasFormData: Object.keys(formData).length > 0,
    formData
  });

  return (
    <div className="min-h-screen bg-gray-100 py-3 flex flex-col justify-center sm:py-6">
      <div className="relative sm:max-w-3xl sm:mx-auto w-full px-4 sm:px-0">
        <Header />
        
        {/* Alerta aparece somente na primeira página do formulário, não na página de resultados */}
        {showDataRestoreAlert && Object.keys(formData).length > 0 && !showResults && !showThankYou && currentStep === 1 && (
          <div className="mb-3 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-yellow-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                <span className="font-medium">Bem-vindo de volta!</span> | Sua simulação anterior foi recuperada
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={continueWithCurrentForm}
                className="flex-1 sm:flex-auto px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
              >
                Continuar
              </button>
              <button 
                onClick={handleResetForm}
                className="flex-1 sm:flex-auto px-4 py-2 bg-primary text-white text-sm font-medium rounded hover:bg-primary/90 transition-colors"
              >
                Limpar dados
              </button>
            </div>
          </div>
        )}
        
        {/* Removemos o botão "Limpar formulário" e aproximamos o Card principal */}
        <Card className="shadow-lg rounded-lg overflow-hidden mt-2">
          {/* Progress bar */}
          {!showResults && !showThankYou && (
            <div className="w-full bg-gray-200 h-2">
              <div 
                className="bg-secondary h-2 transition-all duration-300" 
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          )}
          
          <CardContent className="p-0">
            {!showResults && !showThankYou && renderFormStep()}
            
            {showResults && calculationResults && (
              <Results 
                results={calculationResults}
                onBack={() => setShowResults(false)}
                onReset={resetForm}
                onSendEmail={handleSendEmail}
                isSending={sendEmailMutation.isPending}
              />
            )}
            
            {showThankYou && (
              <ThankYou onNewCalculation={resetForm} />
            )}
          </CardContent>
        </Card>
        
        <Footer />
      </div>
    </div>
  );
}
