"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, DollarSign, Home, Info, ShieldCheck } from "lucide-react";
import { Property } from "../types";

interface PropertyDetailsModalProps {
    property: Property | null;
    onClose: () => void;
}

const PropertyDetailsModal = ({ property, onClose }: PropertyDetailsModalProps) => {
    if (!property) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="glass-morphism flex flex-col w-full max-h-[90vh] max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl"
                >
                    {/* Header */}
                    <div className="relative w-full h-64 overflow-hidden bg-slate-900">
                        {property.image ? (
                            <img
                                src={property.image}
                                alt={property.title}
                                className="object-cover w-full h-full opacity-80"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full bg-emerald-500/10">
                                <Home className="w-16 h-16 text-emerald-500/40" />
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="absolute z-20 p-3 transition-colors rounded-full top-6 right-6 bg-slate-950/60 backdrop-blur-md text-white hover:bg-emerald-500"
                            aria-label="Close modal"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-8">
                            <span className="inline-block px-3 py-1 mb-3 text-[10px] font-bold tracking-widest text-white uppercase rounded-full bg-emerald-500">
                                {property.action}
                            </span>
                            <h2 className="text-3xl font-bold text-white serif">{property.title}</h2>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 space-y-8 overflow-y-auto scroll-hide">
                        {/* Key Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 text-center border rounded-2xl bg-white/5 border-white/5">
                                <DollarSign className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
                                <p className="mb-1 text-[10px] tracking-widest uppercase text-slate-400">Price</p>
                                <p className="text-lg font-bold text-white">
                                    {property.price ? `$${property.price.toLocaleString()}` : "Price upon request"}
                                </p>
                            </div>
                            <div className="p-4 text-center border rounded-2xl bg-white/5 border-white/5">
                                <Home className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
                                <p className="mb-1 text-[10px] tracking-widest uppercase text-slate-400">Configuration</p>
                                <p className="text-lg font-bold text-white">{property.bhk} BHK</p>
                            </div>
                            <div className="p-4 text-center border rounded-2xl bg-white/5 border-white/5">
                                <MapPin className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
                                <p className="mb-1 text-[10px] tracking-widest uppercase text-slate-400">Location</p>
                                <p className="px-2 text-lg font-bold truncate text-white">{property.location}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Info className="w-5 h-5 text-emerald-500" />
                                <h3 className="text-sm font-bold tracking-widest text-white uppercase">Description</h3>
                            </div>
                            <p className="italic leading-relaxed text-slate-400">
                                "{property.description || "No detailed description available for this elite listing. Contact concierge for a private showing."}"
                            </p>
                        </div>

                        {/* Security Badge */}
                        <div className="flex items-center gap-4 p-4 border rounded-2xl bg-emerald-500/10 border-emerald-500/20">
                            <ShieldCheck className="w-8 h-8 text-emerald-500" />
                            <div>
                                <p className="text-sm font-bold text-white">Haven Verified Listing</p>
                                <p className="text-xs text-emerald-400/60">This property has been vetted by our elite selection team.</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-8 border-t bg-white/5 border-white/5">
                        <button
                            className="w-full py-4 font-bold text-white transition-all shadow-lg rounded-2xl bg-emerald-500 hover:bg-emerald-400 hover:scale-[1.02] shadow-emerald-500/20"
                            onClick={() => alert("Viewing request sent to Concierge!")}
                        >
                            Schedule Private Viewing
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PropertyDetailsModal;
