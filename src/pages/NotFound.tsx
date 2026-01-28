import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-6">
        <div className="relative">
          <h1 className="text-9xl font-black text-slate-900 opacity-50 tracking-tighter">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-2xl font-black text-slate-100 uppercase tracking-[0.2em] transform translate-y-8">Lost in Library</p>
          </div>
        </div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">The requested manuscript could not be found</p>
        <div className="pt-8">
          <a href="/" className="px-8 py-3 bg-primary/10 border border-primary/20 text-primary font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5">
            Return to Study Desk
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
