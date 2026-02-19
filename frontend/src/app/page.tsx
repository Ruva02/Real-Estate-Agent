"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { ChatInterface } from '../components/ChatInterface';
import { Footer } from '../components/Footer';

/**
 * HavenAI - Main Page
 * 
 * Orchestrates the landing page layout and modular components.
 * State for authentication and menu visibility is managed here and passed to components.
 */
export default function HavenAI() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const storedToken = sessionStorage.getItem('access_token');
        setToken(storedToken);
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        setToken(null);
        window.location.reload();
    };

    if (!mounted) return null;

    return (
        <main className="min-h-screen relative flex flex-col items-center">
            {/* Modular Components */}
            <Navbar
                token={token}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                handleLogout={handleLogout}
            />

            <Hero />

            <ChatInterface
                token={token}
                handleLogout={handleLogout}
            />

            <Footer />
        </main>
    );
}
