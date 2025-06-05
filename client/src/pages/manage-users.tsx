import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender,
  createColumnHelper,
  ColumnDef
} from "@tanstack/react-table";
import TopNav from "@/components/admin/top-nav";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Users, Eye, EyeOff, Edit } from "lucide-react";

// Validação para o formulário de novo usuário
const newUserSchema = z.object({
  email: z.string().email({
    message: "Por favor informe um email válido."
  }),
  firstName: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres."
  }),
  lastName: z.string().min(2, {
    message: "O sobrenome deve ter pelo menos 2 caracteres."
  }),
  password: z.string().min(6, {
    message: "A senha deve ter pelo menos 6 caracteres."
  }),
  observation: z.string().optional(),
  isAdmin: z.boolean().default(false)
}).refine((data) => data.password === data.observation, {
  message: "As senhas não coincidem.",
  path: ["observation"],
});

// Validação para o formulário de edição de usuário (com senha obrigatória)
const editUserSchema = z.object({
  id: z.number(),
  email: z.string().email({
    message: "Por favor informe um email válido."
  }),
  firstName: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres."
  }),
  lastName: z.string().min(2, {
    message: "O sobrenome deve ter pelo menos 2 caracteres."
  }),
  password: z.union([
    z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
    z.string().length(0)
  ]),
  observation: z.string().optional().default(""),
  isAdmin: z.boolean().default(false)
});

type NewUserValues = z.infer<typeof newUserSchema>;
type EditUserValues = z.infer<typeof editUserSchema>;

interface AppUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  isAdmin: boolean;
}

interface UsersResponse {
  users: AppUser[];
}

export default function ManageUsers() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AppUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [columnSizing, setColumnSizing] = useState({});

  // Consulta para buscar os usuários
  const { 
    data: users, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<UsersResponse>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: false
  });

  // Tratamento de erro de autenticação
  useEffect(() => {
    if (error) {
      // Se houver erro de autenticação, redirecionar para o login
      navigate("/admin/login");
    }
  }, [error, navigate]);

  // Form com react-hook-form e validação zod para novo usuário
  const form = useForm<NewUserValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      observation: "",
      isAdmin: false
    }
  });

  // Form para edição de usuário
  const editForm = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      id: 0,
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      observation: "",
      isAdmin: false
    }
  });

  // Mutação para criar um novo usuário
  const createUserMutation = useMutation({
    mutationFn: async (data: NewUserValues) => {
      try {
        const res = await apiRequest("POST", "/api/admin/users", data);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Erro ao criar usuário");
        }
        return await res.json();
      } catch (error) {
        console.error("Erro na criação de usuário:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado com sucesso",
        description: "O usuário foi adicionado à lista de usuários autorizados.",
      });
      setIsNewUserOpen(false);
      form.reset();
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro ao tentar criar o usuário",
        variant: "destructive",
      });
    }
  });

  // Mutação para excluir um usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Usuário removido com sucesso",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para atualizar um usuário
  const updateUserMutation = useMutation({
    mutationFn: async (data: EditUserValues) => {
      // Criar uma cópia dos dados para enviar
      const payload: any = { ...data };

      // Se a senha estiver vazia, removê-la do payload para manter a senha atual
      if (payload.password === "") {
        delete payload.password;
      }

      const res = await apiRequest("PUT", `/api/admin/users/${data.id}`, payload);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado com sucesso",
        description: "As informações do usuário foram atualizadas."
      });
      setIsEditUserOpen(false);
      setUserToEdit(null);
      editForm.reset();
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  function onSubmit(values: NewUserValues) {
    try {
      console.log("Enviando dados do novo usuário:", { ...values, password: "***" });
      createUserMutation.mutate(values);
    } catch (error) {
      console.error("Erro ao submeter formulário:", error);
      toast({
        title: "Erro ao criar usuário",
        description: "Ocorreu um erro ao processar o formulário. Tente novamente.",
        variant: "destructive",
      });
    }
  }

  function onEditSubmit(values: EditUserValues) {
    try {
      // Não alterar o campo de observação, manter o que o usuário digitou
      console.log("Enviando dados de edição:", { ...values, password: values.password ? "***" : "" });
      updateUserMutation.mutate(values);
    } catch (error) {
      console.error("Erro ao submeter formulário de edição:", error);
      toast({
        title: "Erro ao atualizar usuário",
        description: "Ocorreu um erro ao processar o formulário. Tente novamente.",
        variant: "destructive",
      });
    }
  }

  async function handleEditUser(user: AppUser) {
    setUserToEdit(user);

    try {
      // Buscar informações adicionais do usuário
      const response = await fetch(`/api/admin/users/${user.id}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar informações do usuário');
      }

      const userData = await response.json();

      editForm.reset({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: "", // Campo de senha vazio
        observation: userData.observation || "", isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);

      // Em caso de erro, usar os dados básicos
      editForm.reset({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: "", // Campo de senha vazio
        observation: "", isAdmin: user.isAdmin
      });
    }

    setIsEditUserOpen(true);
  }

  // Função para voltar ao dashboard
  const goToDashboard = () => navigate("/admin/dashboard");

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <TopNav handleLogout={() => {
        apiRequest("POST", "/api/admin/logout")
          .then(() => window.location.href = window.location.origin)
          .catch(() => window.location.href = window.location.origin);
      }} />

      <main className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
          <Button onClick={() => setIsNewUserOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !users || !users.users || users.users.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <Users className="h-12 w-12 text-gray-300" />
              <h3 className="text-xl font-medium">Nenhum usuário encontrado</h3>
              <p className="text-gray-500">
                Adicione usuários para permitir acesso ao sistema.
              </p>
              <Button onClick={() => setIsNewUserOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Usuário
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Usuários Autorizados</CardTitle>
              <CardDescription>
                Os usuários abaixo têm permissão para acessar a calculadora de economia Ecotruck.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table isResizable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead>Acesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users && users.users && users.users.map((user: AppUser) => (
                    <TableRow key={user.id} isResizable>
                      <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isAdmin ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
                          {user.isAdmin ? "Administrativo" : "Padrão"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-5 w-5 text-blue-600" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const confirmMessage = `Tem certeza que deseja excluir o usuário ${user.firstName} ${user.lastName}?`;
                              const originalTitle = document.title;
                              document.title = "Confirmar exclusão"; // Muda o título temporariamente

                              if (window.confirm(confirmMessage)) {
                                deleteUserMutation.mutate(user.id);
                              }

                              document.title = originalTitle; // Restaura o título original
                            }}
                          >
                            <Trash2 className="h-5 w-5 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Modal para adicionar novo usuário */}
      <Dialog open={isNewUserOpen} onOpenChange={setIsNewUserOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para adicionar um novo usuário autorizado.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@empresa.com.br" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobrenome</FormLabel>
                      <FormControl>
                        <Input placeholder="Sobrenome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Senha" 
                            {...field} 
                          />
                          <button 
                            type="button" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Redigitar Senha</FormLabel>
                      <FormControl>
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirme a senha" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Acesso Administrativo</FormLabel>
                      <FormDescription>
                        Se marcado, o usuário terá acesso à área administrativa.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewUserOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal para editar usuário */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere as informações do usuário conforme necessário.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobrenome</FormLabel>
                      <FormControl>
                        <Input placeholder="Sobrenome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Senha
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            type={showEditPassword ? "text" : "password"} 
                            placeholder="Digite nova senha" 
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-10 w-10 text-muted-foreground"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                        >
                          {showEditPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="observation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Redigitar Senha
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="text"
                          placeholder="Confirme a senha" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="isAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Acesso Administrativo</FormLabel>
                      <FormDescription>
                        Se marcado, o usuário terá acesso à área administrativa.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditUserOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : "Atualizar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}