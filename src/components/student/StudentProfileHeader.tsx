"use client";

import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { User, Mail, Phone, Calendar } from 'lucide-react';

interface StudentProfileHeaderProps {
  studentName: string;
  registerNumber: string;
}

const getInitials = (name: string) => {
  // Ensure name is a string before splitting
  if (!name) return 'S';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

// Mock detailed student data
const MOCK_STUDENT_DETAILS = {
  email: 'mock.student@college.edu',
  phone: '+1 555 123 4567',
  dob: '1998-05-15',
  department: 'Computer Science',
  year: 'Final Year',
};

const StudentProfileHeader = ({ studentName, registerNumber }: StudentProfileHeaderProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-4 p-2.5 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800 cursor-pointer hover:bg-slate-900/60 transition-all group shadow-inner">
          <div className="text-right hidden sm:block">
            <h3 className="text-sm font-black truncate text-slate-100 uppercase tracking-widest">{studentName || 'Student'}</h3>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.1em]">REG: {registerNumber || 'N/A'}</p>
          </div>
          <Avatar className="h-10 w-10 border-2 border-primary/50 group-hover:border-primary transition-all shadow-lg shadow-primary/20 ring-2 ring-slate-950">
            <AvatarFallback className="bg-primary text-white font-black text-sm uppercase">
              {getInitials(studentName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-6 bg-card border border-slate-800 shadow-2xl rounded-[24px] relative z-50">
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-5">
          <Avatar className="h-14 w-14 border-2 border-primary/30 ring-4 ring-slate-900/50">
            <AvatarFallback className="bg-primary text-white font-black text-xl">
              {getInitials(studentName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-black text-lg text-slate-50 uppercase tracking-tighter leading-none mb-1">{studentName}</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Register: {registerNumber}</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 text-[11px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-7 h-7 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center">
              <Mail className="h-3.5 w-3.5 text-primary" />
            </div>
            <span>{MOCK_STUDENT_DETAILS.email}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-7 h-7 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center">
              <Phone className="h-3.5 w-3.5 text-primary" />
            </div>
            <span>{MOCK_STUDENT_DETAILS.phone}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-7 h-7 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <span>{MOCK_STUDENT_DETAILS.department}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-7 h-7 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-primary" />
            </div>
            <span>Year: {MOCK_STUDENT_DETAILS.year}</span>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 mt-4">
          <p className="text-[9px] text-slate-600 italic font-medium">
            *Simulation environment access managed by Faculty.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default StudentProfileHeader;