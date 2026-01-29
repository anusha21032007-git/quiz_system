
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User } from "lucide-react";

const Navbar = () => {
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);

    // Handle scroll effect for sticky navbar
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    const { user, role, signOut } = useAuth();

    const navLinks = [
        { label: "Home", path: "/" },
        { label: "About", path: "/about" },
        { label: "Login", path: "/login" },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                isScrolled
                    ? "bg-white/65 backdrop-blur-md border-white/30 shadow-glass py-2"
                    : "bg-transparent border-transparent py-4"
            )}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] rounded-xl p-2 text-white transition-transform group-hover:scale-110 shadow-lg shadow-primary/20">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-extrabold text-lg text-[#1E2455] leading-tight uppercase tracking-tighter">QUIZ MANAGEMENT</span>
                        <span className="text-[10px] text-primary font-bold tracking-widest uppercase">ACADEMIC PORTAL</span>
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    "text-sm font-semibold transition-all hover:text-primary hover:scale-105",
                                    isActive(link.path) || (link.path === '/login' && location.pathname === '/login')
                                        ? "text-primary pb-1 border-b-2 border-primary"
                                        : "text-[#7A80B8]"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {user && (
                            <div className="flex items-center gap-4 ml-2 border-l border-[#7A80B8]/20 pl-6">
                                <Link
                                    to={role === 'teacher' ? "/teacher/dashboard" : "/student/dashboard"}
                                    className="text-xs font-black uppercase tracking-widest text-[#1E2455] hover:text-primary transition-colors flex items-center gap-2"
                                >
                                    <User className="h-4 w-4" /> Dashboard
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => signOut()}
                                    className="text-[10px] font-black uppercase tracking-widest text-[#FF6B8A] hover:text-[#FF6B8A] hover:bg-[#FF6B8A]/10 px-4 h-9 rounded-xl border border-transparent hover:border-[#FF6B8A]/20"
                                >
                                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-slate-800">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-card border-l border-slate-800 p-0">
                            <div className="flex flex-col gap-6 p-8">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={cn(
                                            "text-lg font-medium transition-colors hover:text-primary p-3 rounded-xl hover:bg-slate-800",
                                            isActive(link.path) ? "text-primary bg-primary/5 border border-primary/10" : "text-slate-400"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
