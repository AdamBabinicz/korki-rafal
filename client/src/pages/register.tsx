import { useState } from "react";
import { useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui-button";
import { Input } from "@/components/ui-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-card";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "student", // Default role
  });

  const { mutate: register, isPending } = useRegister();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(formData, {
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: err.message,
        });
      },
    });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary/20 via-background to-background p-4">
      <Card className="w-full max-w-md border-secondary/20 shadow-2xl shadow-secondary/10">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-orange-500 to-primary rounded-xl mb-4 flex items-center justify-center text-white font-bold text-xl">M</div>
          <CardTitle className="text-3xl">Get Started</CardTitle>
          <p className="text-muted-foreground mt-2">Create your student account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <Input
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <Input
                required
                placeholder="johndoe"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password</label>
              <Input
                required
                type="password"
                placeholder="Choose a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full mt-4 bg-orange-500 hover:bg-orange-600 shadow-orange-500/25" isLoading={isPending} size="lg">
              Create Account
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-orange-500 hover:text-orange-600 font-semibold hover:underline">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
