
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
    department: '',
    message: ''
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
        department: requestData.department,
        message: requestData.message
      });

      toast.success("Request sent to administration! You will be notified once approved.");
      setShowRequestModal(false);
      setRequestData({ name: '', year: '', department: '', message: '' });
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Request failed:", err);
      toast.error(err.message || "Failed to send request. Please try again.");
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
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Login fetch error:", error);
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
              <UserCircle className="h-12 w-12 text-white" />
            </div>
            <CardTitle className="text-5xl font-black text-[#1E2455] tracking-tighter uppercase leading-none font-poppins">Student Login</CardTitle>
            <CardDescription className="text-[#3A3F6B] font-bold italic opacity-60 text-lg tracking-tight">Access your academic portal</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-8 px-12 pb-12">
              <div className="space-y-3">
                <Label htmlFor="registerNumber" className="text-[#1E2455] font-black text-[11px] uppercase tracking-[0.3em] ml-2 opacity-60">Register Number / Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7A80B8] group-focus-within:text-[#6C8BFF] transition-colors" />
                  <Input
                    id="registerNumber"
                    placeholder="e.g. 2024-001"
                    className="glass-input pl-14 h-16 text-[#1E2455] placeholder-[#7A80B8]/40 border-white/60 focus:border-[#6C8BFF]/50 text-base"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
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
                {loading ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : null} Authenticate Access
              </Button>
              <div className="text-center space-y-4">
                <p className="text-sm text-[#7A80B8] font-black uppercase tracking-[0.2em] text-[10px] opacity-70">
                  Not registered in the ecosystem?
                </p>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(true)}
                  className="px-8 py-3 rounded-full bg-[#6C8BFF]/5 border border-[#6C8BFF]/20 text-[#6C8BFF] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#6C8BFF]/10 transition-all shadow-sm"
                >
                  Request Faculty Connection
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Request Access Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1E2455]/40 backdrop-blur-2xl p-6 animate-in fade-in duration-500">
          <Card className="glass-card w-full max-w-lg relative animate-in zoom-in-95 duration-500 border-white/60 p-4 shadow-[0_50px_150px_rgba(0,0,0,0.3)]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-6 top-6 text-[#7A80B8] hover:text-[#1E2455] rounded-full hover:bg-white/40 transition-all z-20"
              onClick={() => setShowRequestModal(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <CardHeader className="text-center pb-8 pt-12">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] rounded-[28px] flex items-center justify-center mb-6 shadow-2xl animate-float">
                <UserCircle className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-4xl font-black text-[#1E2455] uppercase leading-none font-poppins tracking-tighter">Request Connection</CardTitle>
              <CardDescription className="text-[#3A3F6B] text-base font-bold italic opacity-60 mt-2">Initialize your profile with the faculty registry</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-10 pb-4">
              <div className="space-y-2">
                <Label htmlFor="reqName" className="text-[11px] font-black uppercase tracking-[0.3em] text-[#7A80B8] ml-2">Full Name</Label>
                <Input
                  id="reqName"
                  placeholder="John Doe"
                  className="glass-input h-14 text-[#1E2455] border-white/60 placeholder-[#7A80B8]/40"
                  value={requestData.name}
                  onChange={e => setRequestData({ ...requestData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reqYear" className="text-[11px] font-black uppercase tracking-[0.3em] text-[#7A80B8] ml-2">Academic Year</Label>
                <div className="relative">
                  <select
                    id="reqYear"
                    className="flex h-14 w-full glass-input px-4 py-2 text-sm text-[#1E2455] focus:ring-2 focus:ring-[#6C8BFF]/50 border-white/60 appearance-none font-bold"
                    value={requestData.year}
                    onChange={e => setRequestData({ ...requestData, year: e.target.value })}
                  >
                    <option value="" disabled>Select Year</option>
                    <option value="I">I (First Year)</option>
                    <option value="II">II (Second Year)</option>
                    <option value="III">III (Third Year)</option>
                    <option value="IV">IV (Final Year)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#7A80B8]">
                    <ArrowLeft className="h-4 w-4 rotate-[270deg]" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reqDept" className="text-[11px] font-black uppercase tracking-[0.3em] text-[#7A80B8] ml-2">Department</Label>
                <Input
                  id="reqDept"
                  placeholder="e.g. CSE, ECE"
                  className="glass-input h-14 text-[#1E2455] border-white/60 placeholder-[#7A80B8]/40"
                  value={requestData.department}
                  onChange={e => setRequestData({ ...requestData, department: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reqMsg" className="text-[11px] font-black uppercase tracking-[0.3em] text-[#7A80B8] ml-2">Message / Purpose</Label>
                <textarea
                  id="reqMsg"
                  placeholder="Type your message here..."
                  className="w-full min-h-[100px] glass-input p-4 text-[#1E2455] border-white/60 placeholder-[#7A80B8]/40 resize-none font-bold"
                  value={requestData.message}
                  onChange={e => setRequestData({ ...requestData, message: e.target.value })}
                />
              </div>
            </CardContent>
            <CardFooter className="px-10 pt-8 pb-12">
              <Button
                className="pastel-button-primary w-full h-16 text-[12px] uppercase tracking-[0.4em] font-black shadow-2xl hover:shadow-primary/40"
                onClick={handleRequestAccess}
                disabled={requestLoading}
              >
                {requestLoading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : "Transmit Request"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
};

export default StudentLogin;