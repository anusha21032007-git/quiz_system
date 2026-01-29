
"use client";

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserCircle, Loader2, Lock, ArrowLeft, Mail, X } from 'lucide-react';
import { useCreateStudentRequest } from '@/integrations/supabase/student_requests';

const StudentLogin = () => {
  const [registerNumber, setRegisterNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- Request Access Modal State ---
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({
    name: '',
    year: '',
    department: ''
  });
  const [requestLoading, setRequestLoading] = useState(false);
  const createRequestMutation = useCreateStudentRequest();

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestData.name || !requestData.year || !requestData.department) {
      toast.error("Please fill in all fields.");
      return;
    }

    setRequestLoading(true);

    try {
      await createRequestMutation.mutateAsync({
        name: requestData.name,
        year: requestData.year,
        department: requestData.department
      });

      toast.success("Request sent to administration! You will be notified once approved.");
      setShowRequestModal(false);
      setRequestData({ name: '', year: '', department: '' });
    } catch (error: any) {
      console.error("Request failed:", error);
      toast.error(error.message || "Failed to send request. Please try again.");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // System Email Strategy: convert register number to email
    const systemEmail = registerNumber.includes('@')
      ? registerNumber.trim()
      : `${registerNumber.trim()}@student.eduflow.com`;

    let result;
    try {
      result = await supabase.auth.signInWithPassword({
        email: systemEmail,
        password: password
      });
    } catch (err: any) {
      console.error("Login fetch error:", err);
      toast.error('Connection failed. Please check your internet connection.');
      setLoading(false);
      return;
    }

    const { data, error } = result;

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
    <>
      <div className="min-h-screen flex items-center justify-center bg-transparent p-6">
        <div className="absolute top-8 left-8">
          <Link to="/">
            <Button variant="ghost" className="gap-2 text-[#7A80B8] hover:text-[#6C8BFF] font-bold rounded-full">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>

        <Card className="glass-card w-full max-w-md overflow-hidden border-white/40">
          <CardHeader className="pt-10 pb-6 text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] rounded-[22px] flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
              <UserCircle className="h-9 w-9 text-white" />
            </div>
            <CardTitle className="text-3xl font-black text-[#1E2455] tracking-tight uppercase leading-none font-poppins">Student Login</CardTitle>
            <CardDescription className="text-[#3A3F6B] font-medium tracking-tight">Access your academic portal</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-5 px-8 pb-8">
              <div className="space-y-2">
                <Label htmlFor="registerNumber" className="text-[#1E2455] font-bold text-[10px] uppercase tracking-widest pl-1">Register Number / Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7A80B8]" />
                  <Input
                    id="registerNumber"
                    placeholder="e.g. 2024-001"
                    className="glass-input pl-11 h-12 text-[#1E2455] placeholder-[#7A80B8]/60"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#1E2455] font-bold text-[10px] uppercase tracking-widest pl-1">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7A80B8]" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="glass-input pl-11 h-12 text-[#1E2455] placeholder-[#7A80B8]/60"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-6 px-8 pb-12">
              <Button type="submit" className="pastel-button-primary w-full h-12 text-sm uppercase tracking-widest" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null} Login
              </Button>
              <p className="text-sm text-center text-[#7A80B8] font-bold uppercase tracking-widest text-[10px]">
                Not registered?
                <button
                  type="button"
                  onClick={() => setShowRequestModal(true)}
                  className="text-[#6C8BFF] font-black ml-1 hover:underline focus:outline-none"
                >
                  Ask your teacher
                </button>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Request Access Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E2455]/20 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <Card className="glass-card w-full max-w-sm relative animate-in zoom-in-95 duration-300 border-white/50 p-2">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-[#7A80B8] hover:text-[#1E2455] rounded-full"
              onClick={() => setShowRequestModal(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] rounded-2xl flex items-center justify-center mb-3 shadow-md">
                <UserCircle className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl font-black text-[#1E2455] font-poppins">Request Account</CardTitle>
              <CardDescription className="text-[#3A3F6B] text-xs font-semibold">Message your class teacher</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="reqName" className="text-[10px] font-bold uppercase tracking-wider text-[#7A80B8] pl-1">Full Name</Label>
                <Input
                  id="reqName"
                  placeholder="John Doe"
                  className="glass-input h-10 text-[#1E2455]"
                  value={requestData.name}
                  onChange={e => setRequestData({ ...requestData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reqYear" className="text-[10px] font-bold uppercase tracking-wider text-[#7A80B8] pl-1">Year</Label>
                <select
                  id="reqYear"
                  className="flex h-10 w-full glass-input px-3 py-2 text-sm text-[#1E2455] focus:ring-2 focus:ring-[#6C8BFF] appearance-none"
                  value={requestData.year}
                  onChange={e => setRequestData({ ...requestData, year: e.target.value })}
                >
                  <option value="" disabled>Select Year</option>
                  <option value="I">I (First Year)</option>
                  <option value="II">II (Second Year)</option>
                  <option value="III">III (Third Year)</option>
                  <option value="IV">IV (Final Year)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reqDept" className="text-[10px] font-bold uppercase tracking-wider text-[#7A80B8] pl-1">Department</Label>
                <Input
                  id="reqDept"
                  placeholder="e.g. CSE, ECE"
                  className="glass-input h-10 text-[#1E2455]"
                  value={requestData.department}
                  onChange={e => setRequestData({ ...requestData, department: e.target.value })}
                />
              </div>
            </CardContent>
            <CardFooter className="pt-4 pb-6">
              <Button
                className="pastel-button-primary w-full h-11 text-xs uppercase tracking-widest"
                onClick={handleRequestAccess}
                disabled={requestLoading}
              >
                {requestLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Submit Request"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
};

export default StudentLogin;