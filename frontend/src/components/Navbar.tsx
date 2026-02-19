"use client";

import React from 'react';
import Link from 'next/link';
import { Home, LogOut, Menu, X } from 'lucide-react';

interface NavbarProps {
    token: string | null;
    isMenuOpen: boolean;
    setIsMenuOpen: (open: boolean) => void;
    handleLogout: () => void;
}

export const Navbar = ({ token, isMenuOpen, setIsMenuOpen, handleLogout }: NavbarProps) => {
    return (
        <nav className="w-full max-w-7xl px-6 py-6 flex justify-between items-center z-50">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Home className="text-white w-6 h-6" />
                </div>
                <span className="text-2xl font-bold tracking-tight serif">Haven <span className="text-emerald-500">AI</span></span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                <a href="#" className="hover:text-emerald-400 transition-colors uppercase tracking-widest">Properties</a>
                <a href="#" className="hover:text-emerald-400 transition-colors uppercase tracking-widest">Intelligence</a>
                <a href="#" className="hover:text-emerald-400 transition-colors uppercase tracking-widest">Concierge</a>
                {!token ? (
                    <>
                        <Link href="/login" className="px-6 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full hover:bg-emerald-500 hover:text-white transition-all duration-300">
                            Login
                        </Link>
                        <Link href="/register" className="px-6 py-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all duration-300">
                            Register
                        </Link>
                    </>
                ) : (
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-6 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300"
                    >
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                )}
            </div>

            <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
            </button>
        </nav>
    );
};
