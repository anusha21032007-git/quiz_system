
"use client";

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserCircle, Loader2, Lock, ArrowLeft, Mail } from 'lucide-react';

const StudentLogin = () => {
  const [registerNumber, setRegisterNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // System Email Strategy: convert register number to email
    const systemEmail = registerNumber.includes('@')
      ? registerNumber.trim()
      : `${registerNumber.trim()}@student.eduflow.com`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: systemEmail,
      password: password
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid Register Number or Password');
      } else {
        toast.error(error.message);
      }
      setLoading(false);
    } else {
      // Check if student is active
      const { data: student } = await supabase
        .from('students')
        .select('is_active')
        .eq('auth_user_id', data.user.id)
        .single();

      if (student && !student.is_active) {
        await supabase.auth.signOut();
        toast.error('Your account is inactive. Please contact your department.');
        setLoading(false);
      } else {
        navigate('/student');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="absolute top-8 left-8">
        <Link to="/">
          <Button variant="ghost" className="gap-2 text-slate-400 hover:text-primary font-bold">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      <Card className="w-full max-w-md border border-slate-800 shadow-2xl shadow-primary/5 bg-card rounded-[32px] overflow-hidden">
        <CardHeader className="pt-10 pb-6 text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <UserCircle className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black text-slate-50 tracking-tight uppercase leading-none">Student Login</CardTitle>
          <CardDescription className="text-slate-500 font-bold tracking-tight italic">Login with your academic credentials</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 px-8 pb-8">
            <div className="space-y-2">
              <Label htmlFor="registerNumber" className="text-slate-300 font-bold text-xs uppercase tracking-widest pl-1">Register Number / Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <Input
                  id="registerNumber"
                  placeholder="e.g. 2024-001"
                  className="pl-10 h-12 bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-600 focus:bg-slate-900/50 focus:border-primary focus:ring-primary/20 rounded-[14px] transition-all"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 font-bold text-xs uppercase tracking-widest pl-1">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-600 focus:bg-slate-900/50 focus:border-primary focus:ring-primary/20 rounded-[14px] transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-6 px-8 pb-10">
            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-[14px] text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null} Login
            </Button>
            <p className="text-sm text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              Not registered? <span className="text-primary font-black ml-1">Ask your teacher</span>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default StudentLogin;