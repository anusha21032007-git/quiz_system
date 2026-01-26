-- Database Schema for Quiz System

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  role TEXT CHECK (role IN ('teacher', 'student')) DEFAULT 'student',
  full_name TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  register_number TEXT UNIQUE NOT NULL,
  year_semester TEXT,
  department TEXT,
  batch TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 3. Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  course_name TEXT NOT NULL,
  time_limit_minutes INTEGER DEFAULT 0,
  negative_marking BOOLEAN DEFAULT FALSE,
  competition_mode BOOLEAN DEFAULT FALSE,
  scheduled_date DATE,
  start_time TIME,
  end_time TIME,
  negative_marks_value NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  pass_mark_percentage NUMERIC DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  required_correct_answers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 4. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer TEXT NOT NULL,
  marks INTEGER DEFAULT 1,
  time_limit_minutes INTEGER DEFAULT 1,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 5. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  score NUMERIC DEFAULT 0,
  total_questions INTEGER NOT NULL,
  time_taken_seconds INTEGER NOT NULL,
  passed BOOLEAN DEFAULT FALSE,
  answers JSONB NOT NULL,
  violation_count INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('SUBMITTED', 'CORRUPTED', 'PENDING')) DEFAULT 'SUBMITTED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Grant Permissions (Standard Supabase defaults, but explicit for safety)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- RLS Policies

-- Profiles: Users can read their own profile, teachers can read all profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Teachers can read all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Students: Teachers can manage students, students can read their own record
CREATE POLICY "Teachers can manage students" ON public.students FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Students can read own record" ON public.students FOR SELECT USING (
  auth.uid() = auth_user_id
);

-- Quizzes: Everyone can read published quizzes, teachers can manage their own
CREATE POLICY "Everyone can read published quizzes" ON public.quizzes FOR SELECT USING (status = 'published');
CREATE POLICY "Teachers can manage own quizzes" ON public.quizzes FOR ALL USING (
  auth.uid() = teacher_id
);

-- Questions: Everyone can read questions for published quizzes
CREATE POLICY "Everyone can read questions for published quizzes" ON public.questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND status = 'published')
);
CREATE POLICY "Teachers can manage own questions" ON public.questions FOR ALL USING (
  auth.uid() = teacher_id
);

-- Quiz Attempts: Students can manage their own attempts, teachers can read all
CREATE POLICY "Students can manage own attempts" ON public.quiz_attempts FOR ALL USING (
  auth.uid() = student_id
);
CREATE POLICY "Teachers can read all attempts" ON public.quiz_attempts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);
