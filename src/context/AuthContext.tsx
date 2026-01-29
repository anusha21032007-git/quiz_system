"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface TeacherProfileData {
  full_name?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: 'teacher' | 'student' | null;
  loading: boolean;
  studentData: any | null;
  teacherData: TeacherProfileData | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<'teacher' | 'student' | null>(null);
  const [studentData, setStudentData] = useState<any | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, department')
        .eq('id', userId)
        .single();

      if (profile) {
        setRole(profile.role);
        if (profile.role === 'student') {
          const { data: sData } = await supabase
            .from('students')
            .select('*')
            .eq('auth_user_id', userId)
            .single();
          setStudentData(sData);
          setTeacherData(null);
        } else if (profile.role === 'teacher') {
          setTeacherData({ full_name: profile.full_name, department: profile.department });
          setStudentData(null);
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Auth session error:", error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setRole(null);
        setStudentData(null);
        setTeacherData(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, studentData, teacherData, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};