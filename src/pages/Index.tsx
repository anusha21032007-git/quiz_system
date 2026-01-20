"use client";

import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GraduationCap, UserCircle, Trophy } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
      <div className="text-center bg-white p-10 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100">
        <div className="inline-flex p-4 bg-indigo-600 rounded-3xl mb-6 shadow-lg shadow-indigo-200">
          <GraduationCap className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">EduFlow</h1>
        <p className="text-lg text-slate-600 mb-10 font-medium">
          The comprehensive academic quiz management system for colleges.
        </p>
        
        <div className="space-y-4">
          <Link to="/student/login">
            <Button className="w-full py-7 text-xl font-bold bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3">
              <UserCircle className="h-6 w-6" /> Student Portal
            </Button>
          </Link>
          
          <div className="grid grid-cols-2 gap-4">
            <Link to="/teacher/login">
              <Button variant="outline" className="w-full py-7 text-lg font-bold border-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 text-slate-700 rounded-2xl transition-all">
                Teacher Access
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="ghost" className="w-full py-7 text-lg font-bold text-slate-600 hover:text-indigo-600 flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5" /> Results
              </Button>
            </Link>
          </div>
        </div>
        
        <p className="mt-8 text-sm text-slate-400 font-bold uppercase tracking-widest">
          Integrated with Supabase Auth
        </p>
      </div>
      <div className="mt-8 opacity-50">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;