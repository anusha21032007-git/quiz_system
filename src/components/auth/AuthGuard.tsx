"use client";

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRole?: 'teacher' | 'student';
}

const AuthGuard = ({ children, allowedRole }: AuthGuardProps) => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate(allowedRole === 'teacher' ? '/teacher/login' : '/student/login');
      } else if (allowedRole && role !== allowedRole) {
        navigate(role === 'teacher' ? '/teacher' : '/student');
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