
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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

    const navLinks = [
        { label: "Home", path: "/" },
        { label: "About", path: "/about" },
        { label: "Sign In", path: "/login" },
        { label: "Sign Up", path: "/signup" },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                isScrolled
                    ? "bg-white/80 backdrop-blur-md border-indigo-100 shadow-sm py-3"
                    : "bg-transparent border-transparent py-5"
            )}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="bg-indigo-600 rounded-xl p-2 text-white transition-transform group-hover:scale-110">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-extrabold text-lg text-slate-900 leading-tight uppercase tracking-tighter">QUIZ MANAGEMENT SYSTEM</span>
                        <span className="text-[10px] text-primary font-bold tracking-widest">PREMIUM ACADEMIC PORTAL</span>
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
                                    "text-sm font-medium transition-colors hover:text-indigo-600",
                                    isActive(link.path) ? "text-indigo-600 font-semibold" : "text-slate-600"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <Link to="/signup">
                        <Button className="rounded-full px-6 font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all">
                            Get Started
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-600">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                            <div className="flex flex-col gap-6 mt-8">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={cn(
                                            "text-lg font-medium transition-colors hover:text-indigo-600 p-2 rounded-lg hover:bg-slate-50",
                                            isActive(link.path) ? "text-indigo-600 bg-indigo-50" : "text-slate-600"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <Link to="/signup" className="mt-4">
                                    <Button className="w-full rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 h-12">
                                        Get Started
                                    </Button>
                                </Link>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
