"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
    Home as HomeIcon,
    Mail,
    Lock,
    User as UserIcon,
    Phone,
    MapPin,
    ArrowRight,
    Loader2,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "signup" | "forgot";

export default function LoginPage() {
    const [mode, setMode] = useState<AuthMode>("login");
    const [forgotStep, setForgotStep] = useState<"email" | "otp" | "reset">("email");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
    const router = useRouter();

    // Form states
    const [formData, setFormData] = useState({
        fullName: "",
        mobile: "",
        email: "",
        city: "",
        password: "",
        otp: "",
        newPassword: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const baseUrl = "http://localhost:8001";
        let endpoint = "";
        let body = {};

        if (mode === "login") {
            endpoint = "/login";
            body = { email: formData.email, password: formData.password };
        } else if (mode === "signup") {
            endpoint = "/signup";
            body = {
                full_name: formData.fullName,
                mobile: formData.mobile,
                email: formData.email,
                city: formData.city,
                password: formData.password,
            };
        } else {
            // mode === "forgot"
            if (forgotStep === "email") {
                endpoint = "/forgot-password";
                body = { email: formData.email };
            } else if (forgotStep === "otp") {
                endpoint = "/verify-otp";
                body = { email: formData.email, otp: formData.otp };
            } else {
                endpoint = "/reset-password";
                body = {
                    email: formData.email,
                    otp: formData.otp,
                    new_password: formData.newPassword
                };
            }
        }

        try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Something went wrong");
            }

            if (mode === "login") {
                localStorage.setItem("haven_user", JSON.stringify(data.user));
                setMessage({ type: "success", text: "Welcome back! Redirecting..." });
                setTimeout(() => router.push("/"), 1500);
            } else if (mode === "signup") {
                setMessage({ type: "success", text: "Account created! You can now login." });
                setTimeout(() => setMode("login"), 2000);
            } else {
                // mode === "forgot"
                if (forgotStep === "email") {
                    setMessage({ type: "success", text: "OTP sent to your email!" });
                    setForgotStep("otp");
                } else if (forgotStep === "otp") {
                    setMessage({ type: "success", text: "OTP verified! Set your new password." });
                    setForgotStep("reset");
                } else {
                    setMessage({ type: "success", text: "Password reset successfully! Please login." });
                    setTimeout(() => {
                        setMode("login");
                        setForgotStep("email");
                    }, 2000);
                }
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Something went wrong";
            setMessage({ type: "error", text: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    return (
        <main className="min-h-screen text-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="fixed inset-0 z-[-10]">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20000ms] ease-linear hover:scale-110"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop')`,
                    }}
                />
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]"></div>
            </div>

            {/* Background Glows */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full z-[-20]"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full z-[-20]"></div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full max-w-md relative z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] mb-4">
                        <HomeIcon className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white leading-none">HAVEN <span className="text-emerald-500 font-light italic">AI</span></h1>
                    <p className="text-slate-400 mt-3 text-sm tracking-wide font-medium uppercase text-center max-w-[200px]">
                        {mode === "login" ? "Elite Real Estate Access" : mode === "signup" ? "Create Your Portfolio" :
                            forgotStep === "email" ? "Identity Verification" : forgotStep === "otp" ? "Verify OTP" : "Reset Credentials"}
                    </p>
                </div>

                <div className="glass-morphism rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                    <div className="p-8">
                        <AnimatePresence mode="wait">
                            <motion.form
                                key={mode}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.3 }}
                                onSubmit={handleSubmit}
                                className="space-y-4"
                            >
                                {message && (
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={`p-4 rounded-xl flex items-center gap-3 text-sm ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                                            }`}
                                    >
                                        {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                        {message.text}
                                    </motion.div>
                                )}

                                {mode === "signup" && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    required
                                                    value={formData.fullName}
                                                    onChange={handleInputChange}
                                                    className="auth-input"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Mobile Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                                <input
                                                    type="tel"
                                                    name="mobile"
                                                    required
                                                    value={formData.mobile}
                                                    onChange={handleInputChange}
                                                    className="auth-input"
                                                    placeholder="+91 98765 43210"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="auth-input"
                                            placeholder="advisory@havenai.com"
                                        />
                                    </div>
                                </div>

                                {mode === "signup" && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">City Residing In</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                            <input
                                                type="text"
                                                name="city"
                                                required
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className="auth-input"
                                                placeholder="Mumbai"
                                            />
                                        </div>
                                    </div>
                                )}

                                {mode !== "forgot" && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center pr-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Password</label>
                                            {mode === "login" && (
                                                <button
                                                    type="button"
                                                    onClick={() => setMode("forgot")}
                                                    className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-tighter"
                                                >
                                                    Forgot?
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                            <input
                                                type="password"
                                                name="password"
                                                required
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className="auth-input"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                )}

                                {mode === "forgot" && forgotStep === "otp" && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">One-Time Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                            <input
                                                type="text"
                                                name="otp"
                                                required
                                                value={formData.otp}
                                                onChange={handleInputChange}
                                                className="auth-input"
                                                placeholder="Enter 6-digit OTP"
                                                maxLength={6}
                                            />
                                        </div>
                                    </div>
                                )}

                                {mode === "forgot" && forgotStep === "reset" && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                            <input
                                                type="password"
                                                name="newPassword"
                                                required
                                                value={formData.newPassword}
                                                onChange={handleInputChange}
                                                className="auth-input"
                                                placeholder="Enter new password"
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-4 group"
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            {mode === "login" ? "Enter Private Space" :
                                                mode === "signup" ? "Initialize Account" :
                                                    forgotStep === "email" ? "Send OTP" :
                                                        forgotStep === "otp" ? "Verify OTP" : "Reset Password"}
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        </AnimatePresence>
                    </div>

                    <div className="p-6 bg-white/5 border-t border-white/5 flex flex-col items-center gap-2">
                        <p className="text-slate-500 text-xs font-medium">
                            {mode === "login" ? "Don't have an advisor account?" : "Already a member of the collective?"}
                        </p>
                        <button
                            onClick={() => setMode(mode === "login" ? "signup" : "login")}
                            className="text-white hover:text-emerald-400 font-bold text-sm tracking-wide transition-colors"
                        >
                            {mode === "login" ? "Register New User" : "Sign In to Haven"}
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] uppercase tracking-[0.4em] font-black text-slate-700">
                    Haven Intelligence Matrix • Secure Session
                </p>
            </motion.div>

            <style jsx global>{`
        .glass-morphism {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .auth-input {
          width: 100%;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1rem 1rem 1rem 3rem;
          font-size: 0.875rem;
          color: white;
          transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .auth-input:focus {
          outline: none;
          background: rgba(30, 41, 59, 0.8);
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        .auth-input::placeholder {
          color: #475569;
        }
      `}</style>
        </main>
    );
}
