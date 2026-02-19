"use client";

import { useState, useEffect, useRef } from 'react';
import { Message, Property } from '../types';

export const useChat = (token: string | null, handleLogout: () => void) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            type: 'agent',
            text: "Welcome to Haven AI. I'm your elite real estate concierge. Are you looking to Buy, Rent, or Sell today?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [foundProperties, setFoundProperties] = useState<Property[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const refreshAccessToken = async () => {
        const refreshToken = sessionStorage.getItem('refresh_token');
        if (!refreshToken) return null;

        try {
            const response = await fetch('http://localhost:5016/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (!response.ok) throw new Error("Refresh failed");

            const data = await response.json();
            sessionStorage.setItem('access_token', data.access_token);
            return data.access_token;
        } catch (error) {
            console.error("Token refresh error:", error);
            handleLogout();
            return null;
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            type: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput("");
        setIsLoading(true);

        const performChatRequest = async (currentToken: string | null) => {
            const response = await fetch('http://localhost:5016/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ message: currentInput })
            });

            if (response.status === 401) {
                const refreshedToken = await refreshAccessToken();
                if (refreshedToken) {
                    return fetch('http://localhost:5016/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${refreshedToken}`
                        },
                        body: JSON.stringify({ message: currentInput })
                    });
                }
            }
            return response;
        };

        try {
            const response = await performChatRequest(token);
            let data: any;
            try {
                data = await response.json();
            } catch (jsonErr) {
                console.error("Failed to parse JSON response:", jsonErr);
                data = { error: "The server returned an invalid response." };
            }

            if (!response.ok) {
                let errorText = data.error || "An unexpected error occurred.";
                // Quota handling
                if (errorText.includes("quota") || errorText.includes("RESOURCE_EXHAUSTED")) {
                    errorText = "Great things take time! I've reached my daily limit for free AI consultations. Please try again tomorrow or consider upgrading your plan.";
                } else if (errorText.includes("Token expired") || response.status === 401) {
                    errorText = "Your session has ended. Please log in again to continue.";
                    handleLogout();
                }

                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    type: 'agent',
                    text: errorText,
                    timestamp: new Date()
                }]);
                return;
            }

            // Extract properties from AI response if present
            let cleanText = data.response;
            let extractedProps: Property[] = [];

            try {
                // Match JSON array, including optional markdown code fences
                const jsonBlockRegex = /(?:```json\s*)?(\[[\s\S]*?\])(?:\s*```)?/s;
                const match = data.response.match(jsonBlockRegex);

                if (match) {
                    extractedProps = JSON.parse(match[1]);
                    cleanText = data.response.replace(match[0], "").trim();
                }
            } catch (e) {
                console.error("Failed to parse properties from response", e);
            }

            const agentMsg: Message = {
                id: (Date.now() + 1).toString(),
                type: 'agent',
                text: cleanText || "I've found some options for you.",
                timestamp: new Date(),
                properties: extractedProps.length > 0 ? extractedProps : undefined
            };

            setMessages(prev => [...prev, agentMsg]);
            if (extractedProps.length > 0) {
                setFoundProperties(extractedProps);
            }

        } catch (error: any) {
            console.error("Silent Chat error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                type: 'agent',
                text: "I'm having trouble connecting to my central intelligence. Please ensure the backend is active.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        input,
        setInput,
        isLoading,
        foundProperties,
        handleSendMessage,
        scrollRef
    };
};
