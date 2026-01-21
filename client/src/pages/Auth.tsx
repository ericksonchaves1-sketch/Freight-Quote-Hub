import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, ShieldCheck, User } from "lucide-react";

export default function AuthPage() {
  const { user, login, isLoggingIn, register, isRegistering } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  if (user) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col bg-slate-900 text-white p-12 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Truck className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-xl">FreightFlow</span>
          </div>

          <div className="mt-20 max-w-lg">
            <h1 className="font-display text-5xl font-bold leading-tight mb-6">
              Modern logistics for the digital age.
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Connect shippers with top-tier carriers. Streamline quotes, manage bids, and track shipments in one unified platform.
            </p>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <ShieldCheck className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-semibold text-lg">Secure & Reliable</h3>
              <p className="text-sm text-slate-400">Enterprise-grade security for your sensitive data.</p>
            </div>
            <div className="flex flex-col gap-2">
              <User className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-semibold text-lg">Role-based Access</h3>
              <p className="text-sm text-slate-400">Tailored experiences for clients, carriers, and auditors.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Truck className="w-6 h-6 text-primary" />
              <span className="font-display font-bold text-xl">FreightFlow</span>
            </div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
          </div>

          <Card className="border-none shadow-xl shadow-black/5 bg-white/50 backdrop-blur-sm">
            <Tabs defaultValue="login" className="w-full">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent className="pt-6">
                <TabsContent value="login">
                  <LoginForm onLogin={login} isLoading={isLoggingIn} />
                </TabsContent>
                
                <TabsContent value="register">
                  <RegisterForm onRegister={register} isLoading={isRegistering} />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onLogin, isLoading }: { onLogin: any, isLoading: boolean }) {
  const [username, setUsername] = useState("admin"); // Default for demo
  const [password, setPassword] = useState("admin");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ username, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username / Email</Label>
        <Input 
          id="username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)}
          required 
          placeholder="name@company.com"
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
        </div>
        <Input 
          id="password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          required 
          className="h-11"
        />
      </div>
      <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
      <div className="text-center text-xs text-muted-foreground mt-4">
        Try <span className="font-mono text-primary">admin / admin</span> for demo
      </div>
    </form>
  );
}

function RegisterForm({ onRegister, isLoading }: { onRegister: any, isLoading: boolean }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "client" as const
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reg-name">Full Name</Label>
        <Input 
          id="reg-name" 
          value={formData.name} 
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required 
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-role">Account Type</Label>
        <Select 
          value={formData.role} 
          onValueChange={(val: any) => setFormData({...formData, role: val})}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Client (Shipper)</SelectItem>
            <SelectItem value="carrier">Carrier</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-username">Email</Label>
        <Input 
          id="reg-username" 
          type="email"
          value={formData.username} 
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          required 
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">Password</Label>
        <Input 
          id="reg-password" 
          type="password" 
          value={formData.password} 
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required 
          className="h-11"
        />
      </div>
      <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  );
}
