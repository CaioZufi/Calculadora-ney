import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { AppUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: AppUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AppUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

export type LoginData = {
  email: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<AppUser | null, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 10000, // 10 segundos antes de considerar dados obsoletos
    refetchOnMount: true, // Recarrega ao montar o componente
    refetchOnWindowFocus: false // Desativa recarregamento ao focar na janela para melhorar performance
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (user: AppUser) => {
      queryClient.setQueryData(["/api/auth/user"], user);
    },
    onError: (error: Error) => {
      // Não exibimos toast aqui, o erro será tratado na página de login
      // para evitar mensagens duplicadas
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout falhou",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verificar se o usuário tem acesso administrativo
  const isAdmin = user?.isAdmin ?? false;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isAdmin,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}