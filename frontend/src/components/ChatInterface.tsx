"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ShieldCheck, MapPin, Send, Lock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useChat } from '../hooks/useChat';
import PropertyDetailsModal from './PropertyDetailsModal';
import { Property } from '../types';

interface ChatInterfaceProps {
    token: string | null;
    handleLogout: () => void;
}

export const ChatInterface = ({ token, handleLogout }: ChatInterfaceProps) => {
    const {
        messages,
        input,
        setInput,
        isLoading,
        handleSendMessage,
        scrollRef
    } = useChat(token, handleLogout);
    const [selectedProperty, setSelectedProperty] = React.useState<Property | null>(null);

    return (
        <section id="ai-chat" className="w-full max-w-4xl px-6 py-24">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold serif mb-4">Elite Concierge</h2>
                <p className="text-slate-400 italic">Tell us what you desire, and Haven will deliver.</p>
            </div>

            <div className="glass-morphism rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl flex flex-col h-[600px]">
                {/* Chat Header */}
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <MessageSquare className="text-white w-6 h-6" />
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full" />
                        </div>
                        <div>
                            <p className="font-bold text-white uppercase tracking-widest text-xs">Haven AI</p>
                            <p className="text-xs text-emerald-400 font-medium">System Active • High Precision</p>
                        </div>
                    </div>
                    <ShieldCheck className="text-slate-500 w-6 h-6" />
                </div>

                {/* Chat Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scroll-hide">
                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] ${msg.type === 'user' ? 'chat-bubble-user' : 'chat-bubble-agent'} p-4 md:p-6`}>
                                    <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>

                                    {msg.properties && (
                                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {msg.properties.map((prop, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-slate-950/40 rounded-xl p-4 border border-white/5 hover:border-emerald-500/50 transition-all cursor-pointer group relative overflow-hidden"
                                                    onClick={() => setSelectedProperty(prop)}
                                                >
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ExternalLink className="w-4 h-4 text-emerald-500" />
                                                    </div>
                                                    <h4 className="font-bold text-emerald-400 mb-1 leading-tight pr-4">{prop.title || "Elite Property"}</h4>
                                                    <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                                                        <MapPin className="w-3 h-3" /> {prop.location || (prop as any).address || (prop as any).city || "Location on Request"}
                                                    </p>
                                                    <p className="text-sm font-bold text-white tracking-widest">
                                                        {typeof prop.price === 'number'
                                                            ? `$${prop.price.toLocaleString()}`
                                                            : (prop as any).rent
                                                                ? `$${(prop as any).rent.toLocaleString()}`
                                                                : (prop as any).rent_amount
                                                                    ? `$${(prop as any).rent_amount.toLocaleString()}`
                                                                    : (prop as any).price_amount
                                                                        ? `$${(prop as any).price_amount.toLocaleString()}`
                                                                        : "Price on Request"}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-[10px] mt-2 opacity-50 uppercase tracking-widest">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="chat-bubble-agent p-4 flex gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Input */}
                <div className="p-6 bg-white/5 border-top border-white/5 relative">
                    {!token && (
                        <div className="absolute inset-0 z-20 backdrop-blur-sm bg-slate-950/60 flex flex-col items-center justify-center p-4 text-center">
                            <Lock className="text-emerald-500 w-8 h-8 mb-4" />
                            <h3 className="text-white font-bold mb-2">Login Required</h3>
                            <p className="text-slate-400 text-xs mb-4">You must be a registered member to access Haven Intelligence.</p>
                            <div className="flex gap-4">
                                <Link href="/login" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4">Sign In</Link>
                                <Link href="/register" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4">Register</Link>
                            </div>
                        </div>
                    )}
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={token ? "I'm looking for a 3BHK penthouse in New York under 10M..." : "Please login to chat..."}
                            disabled={!token}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 pr-16 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors backdrop-blur-md disabled:opacity-30"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !input.trim() || !token}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-transform disabled:opacity-50"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <PropertyDetailsModal
                property={selectedProperty}
                onClose={() => setSelectedProperty(null)}
            />
        </section>
    );
};
