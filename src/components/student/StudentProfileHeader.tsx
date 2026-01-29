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
        <div className="flex items-center gap-4 p-2.5 bg-white/40 backdrop-blur-md rounded-[20px] border border-white/50 cursor-pointer hover:bg-white/60 transition-all group shadow-sm hover:shadow-md">
          <div className="text-right hidden sm:block">
            <h3 className="text-sm font-black truncate text-[#1E2455] uppercase tracking-tighter font-poppins">{studentName || 'Student'}</h3>
            <p className="text-[10px] text-[#7A80B8] font-black tracking-[0.1em]">REG: {registerNumber || 'N/A'}</p>
          </div>
          <Avatar className="h-11 w-11 border-2 border-white/60 group-hover:scale-105 transition-all shadow-md">
            <AvatarFallback className="bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] text-white font-black text-sm uppercase">
              {getInitials(studentName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 glass-card border-white/50 overflow-hidden shadow-2xl z-50 mt-4" align="end" sideOffset={12}>
        <div className="bg-gradient-to-r from-[#6C8BFF] to-[#E38AD6] p-8 text-center flex flex-col items-center">
          <Avatar className="h-20 w-20 border-4 border-white/30 shadow-xl mb-4">
            <AvatarFallback className="bg-white/20 backdrop-blur-xl text-white font-black text-3xl">
              {getInitials(studentName)}
            </AvatarFallback>
          </Avatar>
          <h4 className="font-black text-xl text-white uppercase tracking-tighter leading-tight font-poppins">{studentName}</h4>
          <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mt-1">Register: {registerNumber}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 text-[10px] font-black uppercase tracking-widest pl-1">
            <div className="flex items-center gap-4 text-[#3A3F6B]">
              <div className="w-9 h-9 bg-[#6C8BFF]/10 rounded-xl flex items-center justify-center border border-[#6C8BFF]/20 shadow-sm">
                <Mail className="h-4 w-4 text-[#6C8BFF]" />
              </div>
              <span className="truncate">{MOCK_STUDENT_DETAILS.email}</span>
            </div>
            <div className="flex items-center gap-4 text-[#3A3F6B]">
              <div className="w-9 h-9 bg-[#FFB86C]/10 rounded-xl flex items-center justify-center border border-[#FFB86C]/20 shadow-sm">
                <Phone className="h-4 w-4 text-[#FFB86C]" />
              </div>
              <span>{MOCK_STUDENT_DETAILS.phone}</span>
            </div>
            <div className="flex items-center gap-4 text-[#3A3F6B]">
              <div className="w-9 h-9 bg-[#4EE3B2]/10 rounded-xl flex items-center justify-center border border-[#4EE3B2]/20 shadow-sm">
                <User className="h-4 w-4 text-[#4EE3B2]" />
              </div>
              <span>{MOCK_STUDENT_DETAILS.department}</span>
            </div>
            <div className="flex items-center gap-4 text-[#3A3F6B]">
              <div className="w-9 h-9 bg-[#6C8BFF]/10 rounded-xl flex items-center justify-center border border-[#6C8BFF]/20 shadow-sm">
                <Calendar className="h-4 w-4 text-[#6C8BFF]" />
              </div>
              <span>{MOCK_STUDENT_DETAILS.year}</span>
            </div>
          </div>

          <div className="pt-6 border-t border-[#7A80B8]/10 mt-2 text-center">
            <p className="text-[9px] text-[#7A80B8] italic font-bold opacity-60">
              *Academic Profile managed by Faculty.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default StudentProfileHeader;