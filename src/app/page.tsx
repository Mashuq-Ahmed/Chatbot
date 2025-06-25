"use client";
require("dotenv").config()
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

// === Types ===
interface Message {
  sender: "user" | "bot";
  text: string;
}

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  parts: GeminiPart[];
}

interface GeminiCandidate {
  content: GeminiContent;
}

interface GeminiAPIResponse {
  candidates?: GeminiCandidate[];
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

const GEMINI_API_KEY = process.env.API_KEY;

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Show animated typing placeholder
    const typingMessage: Message = { sender: "bot", text: "__typing__" };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userMessage.text }] }],
          }),
        }
      );

      const data: GeminiAPIResponse = await res.json();

      if (!res.ok || !data.candidates || !data.candidates[0]?.content.parts[0]?.text) {
        throw new Error(data.error?.message || "Invalid response from Gemini API");
      }

      const aiText = data.candidates[0].content.parts[0].text;

      // Replace typing placeholder
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "bot", text: aiText },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "bot", text: "Error: Unable to get response." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-2xl h-[85vh] flex flex-col rounded-3xl shadow-2xl backdrop-blur-md bg-gray-800/80 border border-gray-700"
      >
        <div className="text-center text-2xl font-bold p-4 border-b border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-3xl">
          ✨ Chatbot
        </div>

        <CardContent className="flex-1 p-4 overflow-hidden">
          <ScrollArea className="h-full pr-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.25 }}
                  className={`flex items-end gap-2 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.sender === "bot" && (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-500 rounded-full flex items-center justify-center text-xs">
                      🤖
                    </div>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-xs text-sm shadow-md break-words ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-100"
                    }`}
                  >
                    {msg.text === "__typing__" ? (
                      <div className="flex gap-1 animate-pulse">
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                  {msg.sender === "user" && (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-sky-500 rounded-full flex items-center justify-center text-xs">
                      👤
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={scrollRef} />
            </AnimatePresence>
          </ScrollArea>
        </CardContent>

        <div className="p-4 border-t border-gray-700 bg-gray-900/60 flex items-center gap-2 rounded-b-3xl">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 rounded-full bg-gray-700 text-white placeholder-gray-400 border-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg"
            disabled={loading}
          >
            {loading ? "..." : "Send"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Chatbot;


