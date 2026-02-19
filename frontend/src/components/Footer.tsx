"use client";

import React from 'react';
import { Home } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="w-full border-t border-white/5 py-12 px-6 bg-slate-950/50 backdrop-blur-md">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-2 opacity-50">
                    <Home className="text-emerald-500 w-5 h-5" />
                    <span className="font-bold serif uppercase tracking-widest text-sm">Haven AI</span>
                </div>
                <p className="text-slate-500 text-sm lowercase tracking-widest opacity-50 italic">
                    © 2026 Haven AI Intelligence. All Rights Reserved.
                </p>
                <div className="flex gap-6">
                    {['Terms', 'Privacy', 'Security'].map(item => (
                        <a key={item} href="#" className="text-xs text-slate-500 hover:text-emerald-400 transition-colors uppercase tracking-widest">{item}</a>
                    ))}
                </div>
            </div>
        </footer>
    );
};
