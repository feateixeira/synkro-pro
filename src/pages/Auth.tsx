import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scissors, Mail, Lock, User, ArrowLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup";

interface FieldValidation {
  isValid: boolean;
  message: string;
}

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    fullName: false,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const validateEmail = (value: string): FieldValidation => {
    if (!value) return { isValid: false, message: "E-mail é obrigatório" };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return { isValid: false, message: "E-mail inválido" };
    return { isValid: true, message: "E-mail válido" };
  };

  const validatePassword = (value: string): FieldValidation => {
    if (!value) return { isValid: false, message: "Senha é obrigatória" };
    if (value.length < 6) return { isValid: false, message: "Mínimo 6 caracteres" };
    return { isValid: true, message: "Senha válida" };
  };

  const validateFullName = (value: string): FieldValidation => {
    if (!value) return { isValid: false, message: "Nome é obrigatório" };
    if (value.length < 2) return { isValid: false, message: "Nome muito curto" };
    return { isValid: true, message: "Nome válido" };
  };

  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);
  const fullNameValidation = validateFullName(fullName);

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/`;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          toast({
            title: "Conta criada com sucesso!",
            description: "Você tem 5 dias de teste grátis. Aproveite!",
          });
          navigate("/dashboard");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          toast({
            title: "Bem-vindo de volta!",
            description: "Redirecionando para o dashboard...",
          });
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let errorMessage = "Ocorreu um erro. Tente novamente.";
      
      if (error.message?.includes("User already registered")) {
        errorMessage = "Este e-mail já está cadastrado. Faça login.";
        setMode("login");
      } else if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "E-mail ou senha incorretos.";
      } else if (error.message?.includes("Password should be at least 6 characters")) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Google login error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível conectar com o Google. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const ValidationIndicator = ({ validation, show }: { validation: FieldValidation; show: boolean }) => {
    if (!show) return null;
    
    return (
      <div className={cn(
        "flex items-center gap-1.5 text-xs mt-1.5 transition-all duration-300",
        validation.isValid ? "text-green-500" : "text-destructive"
      )}>
        {validation.isValid ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : (
          <XCircle className="w-3.5 h-3.5" />
        )}
        {validation.message}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className={cn(
        "flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 xl:px-12 transition-all duration-700",
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
      )}>
        <div className="w-full max-w-md mx-auto">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Voltar ao site
          </Link>

          {/* Logo */}
          <div className={cn(
            "flex items-center gap-2 mb-8 transition-all duration-500 delay-100",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-lg shadow-primary/20">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">BarberPro</span>
          </div>

          {/* Header */}
          <div className={cn(
            "mb-8 transition-all duration-500 delay-150",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              {mode === "signup" ? "Crie sua conta" : "Bem-vindo de volta"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "signup"
                ? "Comece com 5 dias de teste grátis. Sem cartão de crédito."
                : "Entre para acessar sua conta."}
            </p>
          </div>

          {/* Google Login */}
          <div className={cn(
            "transition-all duration-500 delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <Button
              variant="outline"
              size="lg"
              className="w-full mb-6 group hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar com Google
            </Button>
          </div>

          {/* Divider */}
          <div className={cn(
            "relative mb-6 transition-all duration-500 delay-250",
            isVisible ? "opacity-100" : "opacity-0"
          )}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou continue com e-mail</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className={cn(
                "transition-all duration-500 delay-300",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}>
                <Label htmlFor="name" className="text-foreground">Nome completo</Label>
                <div className="relative mt-1">
                  <User className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300",
                    touched.fullName && fullNameValidation.isValid ? "text-green-500" : 
                    touched.fullName && !fullNameValidation.isValid ? "text-destructive" : "text-muted-foreground"
                  )} />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => handleBlur("fullName")}
                    className={cn(
                      "pl-10 transition-all duration-300",
                      touched.fullName && fullNameValidation.isValid && "border-green-500 focus-visible:ring-green-500",
                      touched.fullName && !fullNameValidation.isValid && "border-destructive focus-visible:ring-destructive"
                    )}
                    required
                  />
                </div>
                <ValidationIndicator validation={fullNameValidation} show={touched.fullName} />
              </div>
            )}

            <div className={cn(
              "transition-all duration-500",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              mode === "signup" ? "delay-[350ms]" : "delay-300"
            )}>
              <Label htmlFor="email" className="text-foreground">E-mail</Label>
              <div className="relative mt-1">
                <Mail className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300",
                  touched.email && emailValidation.isValid ? "text-green-500" : 
                  touched.email && !emailValidation.isValid ? "text-destructive" : "text-muted-foreground"
                )} />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur("email")}
                  className={cn(
                    "pl-10 transition-all duration-300",
                    touched.email && emailValidation.isValid && "border-green-500 focus-visible:ring-green-500",
                    touched.email && !emailValidation.isValid && "border-destructive focus-visible:ring-destructive"
                  )}
                  required
                />
              </div>
              <ValidationIndicator validation={emailValidation} show={touched.email} />
            </div>

            <div className={cn(
              "transition-all duration-500",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              mode === "signup" ? "delay-[400ms]" : "delay-[350ms]"
            )}>
              <Label htmlFor="password" className="text-foreground">Senha</Label>
              <div className="relative mt-1">
                <Lock className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300",
                  touched.password && passwordValidation.isValid ? "text-green-500" : 
                  touched.password && !passwordValidation.isValid ? "text-destructive" : "text-muted-foreground"
                )} />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  className={cn(
                    "pl-10 transition-all duration-300",
                    touched.password && passwordValidation.isValid && "border-green-500 focus-visible:ring-green-500",
                    touched.password && !passwordValidation.isValid && "border-destructive focus-visible:ring-destructive"
                  )}
                  required
                  minLength={6}
                />
              </div>
              <ValidationIndicator validation={passwordValidation} show={touched.password} />
            </div>

            <div className={cn(
              "transition-all duration-500",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              mode === "signup" ? "delay-[450ms]" : "delay-[400ms]"
            )}>
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full group"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Aguarde...
                  </>
                ) : mode === "signup" ? (
                  <span className="flex items-center gap-2">
                    Criar conta grátis
                    <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Entrar
                    <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* Toggle Mode */}
          <p className={cn(
            "text-center text-muted-foreground text-sm mt-6 transition-all duration-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            mode === "signup" ? "delay-[500ms]" : "delay-[450ms]"
          )}>
            {mode === "signup" ? (
              <>
                Já tem uma conta?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  Faça login
                </button>
              </>
            ) : (
              <>
                Não tem uma conta?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  Cadastre-se grátis
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className={cn(
        "hidden lg:flex flex-1 relative overflow-hidden transition-all duration-1000",
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute inset-0 hero-glow" />
        
        {/* Decorative Elements */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-center">
          <div className={cn(
            "glass-card p-8 max-w-lg mx-auto transition-all duration-700 delay-300",
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
              <Scissors className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              5 dias de teste grátis
            </h2>
            <p className="text-muted-foreground mb-6">
              Experimente todas as funcionalidades do plano Pro sem compromisso. 
              Cancele quando quiser.
            </p>
            <ul className="text-left space-y-3">
              {[
                "Agenda inteligente com multi-barbeiros",
                "Dashboard financeiro completo",
                "CRM de clientes integrado",
                "Sistema de comissões automático",
                "Página de agendamento online",
              ].map((feature, index) => (
                <li 
                  key={index} 
                  className={cn(
                    "flex items-center gap-3 text-sm text-foreground transition-all duration-500",
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  )}
                  style={{ transitionDelay: `${500 + index * 100}ms` }}
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
