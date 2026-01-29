
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { KeyRound, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-transparent relative overflow-hidden font-poppins">
            {/* Background Decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6C8BFF]/10 rounded-full blur-[140px] opacity-30" />
                <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-[#E38AD6]/10 rounded-full blur-[120px] opacity-30" />
            </div>

            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="glass-card p-10 border-white/60 shadow-2xl rounded-[40px] text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-lg">
                        <KeyRound className="h-10 w-10 text-white" />
                    </div>

                    <h1 className="text-3xl font-black text-[#1E2455] mb-4 uppercase tracking-tighter">Access Recovery</h1>
                    <p className="text-[#3A3F6B] font-bold italic opacity-70 mb-10 leading-relaxed">
                        Security protocols are strictly managed by the institutional administrator. Please contact your Department Head to reset your faculty or student access credentials.
                    </p>

                    <Link to="/login">
                        <Button className="pastel-button-primary w-full h-14 text-[10px] tracking-[0.2em]">
                            <ArrowLeft className="h-5 w-5 mr-3" /> RETURN TO HUB
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
