"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Home as HomeIcon,
  MapPin,
  Maximize,
  MessageSquare,
  Sparkles,
  ArrowRight,
  User,
  Bot,
  LogOut
} from "lucide-react";

interface Property {
  id: number;
  type: string;
  action: string;
  location: string;
  neighborhood: string;
  bhk: number;
  size_sqft: number;
  price: number;
  amenities: string[];
  description: string;
  image_url?: string;
}

interface Message {
  role: "user" | "agent";
  content: string;
  properties?: Property[];
}

const QUICK_ACTIONS = [
  "Modern Villas for sale",
  "Luxury Apartments in Mumbai",
  "Budget Rent near Metro",
  "3 BHK with Pool"
];

export default function Home() {
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null);
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      content: "Welcome to Haven AI. I'm your dedicated advisor for premium real estate. How may I assist you in finding your next home today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("haven_user");
    if (!savedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("haven_user");
    router.push("/login");
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();

      let properties: Property[] = [];
      let cleanContent = data.response;

      try {
        const jsonMatch = cleanContent.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          properties = JSON.parse(jsonMatch[0]);
          cleanContent = cleanContent.replace(jsonMatch[0], "").trim();
        }
      } catch (err) {
        console.error("Failed to parse properties from response", err);
      }

      const agentMsg: Message = {
        role: "agent",
        content: cleanContent || "I've curated a selection of properties that match your requirements:",
        properties
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: "I'm currently unable to access our luxury portfolio. Please ensure the backend concierge is active." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null; // Wait for redirect

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-0 md:p-4 text-slate-50 overflow-hidden relative">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-[-10]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20000ms] ease-linear hover:scale-110 opacity-40"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071&auto=format&fit=crop')`,
          }}
        />
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]"></div>
      </div>

      {/* Background Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full z-[-20]"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full z-[-20]"></div>

      <div className="z-10 w-full max-w-6xl h-screen md:h-[92vh] flex flex-col glass-morphism md:rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/5 relative">

        {/* Header */}
        <header className="w-full px-8 py-6 border-b border-white/5 flex items-center justify-between bg-slate-950/40 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <HomeIcon className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white leading-none">HAVEN <span className="text-emerald-500 font-light italic">AI</span></h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400/80">Welcome, {user.full_name}</span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <nav className="flex gap-6 text-sm font-medium text-slate-400">
              <a href="#" className="hover:text-emerald-400 transition-colors">Portfolios</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Insights</a>
            </nav>
            <div className="h-8 w-[1px] bg-white/10"></div>
            <button
              onClick={handleLogout}
              className="bg-white/5 hover:bg-red-500/10 px-4 py-2 rounded-lg text-xs font-bold border border-white/10 hover:border-red-500/30 transition-all uppercase tracking-wider flex items-center gap-2 text-slate-300 hover:text-red-400"
            >
              Sign Out <LogOut size={14} />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div
          ref={scrollRef}
          className="flex-1 w-full overflow-y-auto p-6 md:p-10 space-y-10 scroll-hide"
        >
          <AnimatePresence mode="popLayout">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border border-white/10 ${msg.role === "user" ? "bg-slate-800" : "bg-emerald-500/10 text-emerald-400"}`}>
                  {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                </div>

                <div className="flex flex-col max-w-[85%] md:max-w-[75%] gap-2">
                  <div className={`${msg.role === "user" ? "chat-bubble-user p-5" : "chat-bubble-agent p-6"}`}>
                    <p className={`whitespace-pre-wrap text-[15px] leading-relaxed ${msg.role === "agent" ? "text-slate-200 font-normal" : "font-medium"}`}>
                      {msg.content}
                    </p>
                  </div>

                  {msg.properties && msg.properties.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {msg.properties.map((prop) => (
                        <motion.div
                          key={prop.id}
                          whileHover={{ y: -8 }}
                          className="bg-slate-900/40 rounded-2xl overflow-hidden border border-white/5 property-card flex flex-col group backdrop-blur-sm"
                        >
                          <div className="relative aspect-[16/10] overflow-hidden">
                            {prop.image_url ? (
                              <Image
                                src={prop.image_url}
                                alt={prop.type}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-800/50 flex flex-col items-center justify-center text-emerald-500/30 gap-3">
                                <HomeIcon size={48} strokeWidth={1} />
                                <span className="text-[10px] uppercase tracking-tighter font-bold">Haven Collection</span>
                              </div>
                            )}
                            <div className="absolute top-4 left-4 flex gap-2">
                              <span className="bg-emerald-500 text-white text-[9px] uppercase font-black px-2.5 py-1 rounded-full shadow-lg">
                                {prop.action}
                              </span>
                              <span className="bg-black/60 backdrop-blur-md text-white text-[9px] uppercase font-black px-2.5 py-1 rounded-full border border-white/10">
                                {prop.type}
                              </span>
                            </div>
                            <div className="absolute bottom-4 right-4 bg-white text-slate-950 text-base font-black px-4 py-2 rounded-xl shadow-2xl">
                              ₹{prop.price.toLocaleString()}
                            </div>
                          </div>

                          <div className="p-6 flex-1 flex flex-col bg-gradient-to-b from-transparent to-slate-950/50">
                            <h3 className="serif text-xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{prop.neighborhood}</h3>
                            <p className="text-xs text-slate-400 mb-4 flex items-center gap-1.5">
                              <MapPin size={12} className="text-emerald-500" /> {prop.location}
                            </p>

                            <p className="text-[13px] text-slate-300 line-clamp-2 italic mb-6 leading-relaxed opacity-80">&quot;{prop.description}&quot;</p>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                                <Maximize size={14} className="text-emerald-500" />
                                <span className="text-[11px] font-bold text-slate-200">{prop.size_sqft} <span className="text-slate-500 font-normal">sqft</span></span>
                              </div>
                              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                                <HomeIcon size={14} className="text-emerald-500" />
                                <span className="text-[11px] font-bold text-slate-200">{prop.bhk} <span className="text-slate-500 font-normal">BHK</span></span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-auto">
                              <div className="flex gap-1.5">
                                {prop.amenities.slice(0, 2).map((a, i) => (
                                  <span key={i} className="text-[9px] uppercase font-bold text-slate-400 bg-white/5 px-2 py-1 rounded-md border border-white/5 group-hover:border-emerald-500/30 transition-colors">
                                    {a}
                                  </span>
                                ))}
                              </div>
                              <button className="text-emerald-400 hover:text-emerald-300 transition-colors">
                                <ArrowRight size={18} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 space-y-4"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 text-center">Curated Inquiries</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(action)}
                    className="p-4 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 rounded-2xl text-left transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-300 group-hover:text-emerald-400">{action}</span>
                      <ArrowRight size={14} className="text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {isLoading && (
            <div className="flex justify-start items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-white/10">
                <Bot size={20} className="animate-pulse" />
              </div>
              <div className="chat-bubble-agent p-4 flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="w-full p-6 md:p-8 bg-slate-950/80 backdrop-blur-2xl border-t border-white/5">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-[22px] blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center">
              <div className="absolute left-6 text-emerald-500">
                <MessageSquare size={18} />
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Inquire about property, location, or investment..."
                className="w-full bg-slate-900/50 border border-white/10 rounded-[20px] pl-14 pr-32 py-5 focus:outline-none focus:border-emerald-500/50 focus:ring-0 text-white placeholder-slate-500 transition-all text-sm md:text-base"
              />
              <div className="absolute right-3 flex items-center gap-2">
                <div className="hidden md:flex items-center gap-1 px-3 text-[10px] font-black text-slate-600">
                  <div className="w-4 h-4 rounded border border-slate-700 flex items-center justify-center">↵</div> ENTER
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-slate-950 p-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] uppercase tracking-[0.3em] font-black text-slate-600">
            Premium Real Estate AI Advisory • Secure Encryption
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6 text-slate-700">
        <Sparkles size={14} className="text-emerald-500/50" />
        <p className="text-[10px] uppercase tracking-widest font-black">Powered by Haven Intelligence Matrix</p>
      </div>
    </main>
  );
}
