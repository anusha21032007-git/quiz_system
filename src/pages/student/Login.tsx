"use client";

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserCircle, Loader2 } from 'lucide-react';

const StudentLogin = () => {
  const [registerNumber, setRegisterNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // System Email Strategy: convert register number to email
    const systemEmail = `${registerNumber.trim()}@student.eduflow.com`;

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
    <div className="min-h-screen flex items-center justify-center bg-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-indigo-100">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <UserCircle className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-indigo-950">Student Portal</CardTitle>
          <CardDescription>Login with your college registration details</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="registerNumber">Register Number</Label>
              <Input id="registerNumber" placeholder="e.g. 2024-001" value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Enter Dashboard
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default StudentLogin;