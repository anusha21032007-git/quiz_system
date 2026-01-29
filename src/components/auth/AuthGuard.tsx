"use client";

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRole?: 'teacher' | 'student' | 'admin';
}

const AuthGuard = ({ children, allowedRole }: AuthGuardProps) => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (allowedRole && role !== allowedRole) {
        // Redirection based on actual role if trying to access unauthorized area
        if (role === 'teacher') navigate('/teacher/dashboard');
        else if (role === 'student') navigate('/student/dashboard');
        else navigate('/');
      }
    }
  }, [user, role, loading, navigate, allowedRole]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return user && (!allowedRole || role === allowedRole) ? <>{children}</> : null;
};

export default AuthGuard;