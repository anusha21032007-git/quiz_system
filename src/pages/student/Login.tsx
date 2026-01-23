
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="absolute top-8 left-8">
        <Link to="/">
          <Button variant="ghost" className="gap-2 text-slate-500 hover:text-indigo-600 font-bold">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      <Card className="w-full max-w-md border-0 shadow-2xl shadow-indigo-100/50 rounded-[32px] overflow-hidden">
        <CardHeader className="pt-10 pb-6 text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-100">
            <UserCircle className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Student Login</CardTitle>
          <CardDescription className="text-slate-500 font-medium tracking-tight">Login with your academic credentials</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 px-8 pb-8">
            <div className="space-y-2">
              <Label htmlFor="registerNumber" className="text-slate-700 font-bold">Register Number / Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="registerNumber"
                  placeholder="e.g. 2024-001"
                  className="pl-10 h-11 bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 rounded-xl"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-bold">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11 bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-6 px-8 pb-10">
            <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-lg font-bold shadow-lg shadow-indigo-100" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null} Login
            </Button>
            <p className="text-sm text-center text-slate-500 font-medium">
              Not registered? <span className="text-indigo-600 font-bold">Ask your teacher</span>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default StudentLogin;