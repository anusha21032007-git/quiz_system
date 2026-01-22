"use client";

import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GraduationCap, UserCircle, Trophy } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-4 font-sans">
      <div className="bg-white p-12 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] max-w-lg w-full text-center border border-white">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-[#5d5bf0] rounded-[30px] mb-8 shadow-xl shadow-indigo-100">
          <GraduationCap className="h-12 w-12 text-white" />
        </div>

        <h1 className="text-[56px] font-black text-[#1e293b] mb-4 tracking-[-0.04em]">EduFlow</h1>

        <p className="text-[17px] text-[#64748b] mb-12 max-w-[320px] mx-auto leading-relaxed font-medium">
          The comprehensive academic quiz management system for colleges.
        </p>

        <div className="space-y-4">
          <Link to="/student/login">
            <Button className="w-full h-16 text-lg font-bold bg-[#5d5bf0] hover:bg-[#4f46e5] rounded-2xl shadow-lg shadow-indigo-50 flex items-center justify-center gap-3 transition-all">
              <UserCircle className="h-5 w-5" /> Student Portal
            </Button>
          </Link>

          <div className="grid grid-cols-2 gap-4">
            <Link to="/teacher/login">
              <Button variant="outline" className="w-full h-16 text-base font-bold border-2 border-[#f1f5f9] hover:border-[#5d5bf0] hover:bg-indigo-50 text-[#475569] rounded-2xl transition-all">
                Teacher Access
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="ghost" className="w-full h-16 text-base font-bold text-[#64748b] hover:text-[#5d5bf0] flex items-center justify-center gap-2 transition-all">
                <Trophy className="h-5 w-5 text-[#64748b]" /> Results
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <p className="text-[11px] text-[#94a3b8] font-black uppercase tracking-[0.1em] mb-2">
            Integrated with Supabase Auth
          </p>
        </div>
      </div>

      <div className="mt-12 text-slate-400 font-medium text-sm">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;