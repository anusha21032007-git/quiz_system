
"use client";

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { GraduationCap, Loader2, Mail, Lock, ArrowLeft } from 'lucide-react';

const TeacherLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      navigate('/teacher');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center mesh-background p-6 overflow-hidden relative selection:bg-[#6C8BFF]/20 selection:text-[#1E2455]">
      {/* Decorative peripheral glows */}
      <div className="hero-glow bg-[#6C8BFF] -top-20 -left-20 animate-pulse" />
      <div className="hero-glow bg-[#E38AD6] -bottom-20 -right-20 animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="absolute top-10 left-10 z-20">
        <Link to="/">
          <Button variant="ghost" className="gap-3 text-[#1E2455] hover:text-[#6C8BFF] font-black uppercase text-[11px] tracking-[0.2em] rounded-full bg-white/40 border border-white/60 backdrop-blur-xl hover:bg-white/60 transition-all shadow-md">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      <Card className="glass-card w-full max-w-lg overflow-hidden border-white/80 shadow-[0_40px_100px_rgba(0,0,0,0.1)] relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
        <CardHeader className="pt-16 pb-10 text-center space-y-4">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] rounded-[32px] flex items-center justify-center mb-6 shadow-2xl border border-white/40 animate-float">
            <GraduationCap className="h-12 w-12 text-white" />
          </div>
          <CardTitle className="text-5xl font-black text-[#1E2455] tracking-tighter uppercase leading-none font-poppins">Faculty Login</CardTitle>
          <CardDescription className="text-[#3A3F6B] font-bold italic opacity-60 text-lg tracking-tight">Access your academic command center</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-8 px-12 pb-12">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-[#1E2455] font-black text-[11px] uppercase tracking-[0.3em] ml-2 opacity-60">Work Email</Label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7A80B8] group-focus-within:text-[#6C8BFF] transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="professor@college.edu"
                  className="glass-input pl-14 h-16 text-[#1E2455] placeholder-[#7A80B8]/40 border-white/60 focus:border-[#6C8BFF]/50 text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="password" className="text-[#1E2455] font-black text-[11px] uppercase tracking-[0.3em] ml-2 opacity-60">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7A80B8] group-focus-within:text-[#6C8BFF] transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="glass-input pl-14 h-16 text-[#1E2455] placeholder-[#7A80B8]/40 border-white/60 focus:border-[#6C8BFF]/50 text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-10 px-12 pb-16">
            <Button type="submit" className="pastel-button-primary w-full h-16 text-[12px] uppercase tracking-[0.3em] shadow-xl hover:shadow-primary/40 font-black" disabled={loading}>
              {loading ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : null} Authenticate Session
            </Button>
            <div className="text-center space-y-4">
              <p className="text-sm text-[#7A80B8] font-black uppercase tracking-[0.2em] text-[10px] opacity-70">
                New to the academic architecture?
              </p>
              <Link to="/teacher/signup">
                <button
                  type="button"
                  className="px-8 py-3 rounded-full bg-[#6C8BFF]/5 border border-[#6C8BFF]/20 text-[#6C8BFF] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#6C8BFF]/10 transition-all shadow-sm"
                >
                  Apply for Faculty Registry
                </button>
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default TeacherLogin;