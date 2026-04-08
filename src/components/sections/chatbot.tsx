"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, User } from "lucide-react";
import Image from "next/image";

interface Props {
  onClose: () => void;
}

interface Message {
  text: string;
  sender: "bot" | "user";
  time: string;
  sources?: { uri: string; title: string }[];
}

const getCurrentTime = () => {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Chatbot({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      text:"Hai 👋 Selamat datang di BPS Tanjung Jabung Barat. Ada yang bisa saya bantu?",
      sender: "bot",
      time: getCurrentTime(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

const formatTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const timeNow = getCurrentTime();

    const userMessage: Message = {
      text: userText,
      sender: "user",
      time: timeNow,
    };

    // pakai tempMessages biar tidak stale
    const tempMessages = [...messages, userMessage];

    setMessages(tempMessages);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = tempMessages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      const data = await response.json();

      if (!response.ok || !data.reply) {
        throw new Error(data.error || "Gagal mendapatkan response");
      }

      setMessages((prev) => [
        ...prev,
        {
          text: data.reply,
          sender: "bot",
          time: getCurrentTime(),
          sources: data.sources ?? [],
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan.";

      setMessages((prev) => [
        ...prev,
        {
          text: `Maaf, terjadi gangguan: ${errorMessage}\n\nSilakan coba lagi atau hubungi kami di 082173054213.`,
          sender: "bot",
          time: getCurrentTime(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
      />

      {/* MODAL */}
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="w-full max-w-md h-screen md:h-[90vh] bg-white md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          {/* HEADER */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
                <Image
                  src="/assets/images/logo-bps.webp"
                  alt="BPS"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  BPS Tanjung Jabung Barat
                </p>
                <p className="text-xs text-blue-100">
                  🟢 Online · Asisten Statistik
                </p>
              </div>
            </div>
            <button onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* CHAT */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.sender === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {/* BOT */}
                {msg.sender === "bot" && (
                  <div className="flex gap-2 max-w-[95%]">
                    <div className="w-20 h-7 rounded-full bg-white border flex items-center justify-center overflow-hidden">
                      <Image
                        src="/assets/images/logo-bps.webp"
                        alt="bot"
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    </div>

                    <div>
                      <div className="bg-white p-3 rounded-xl shadow text-sm whitespace-pre-wrap">
                       {formatTextWithLinks(msg.text)}
                      </div>

                      {/* FIXED SOURCES */}
                     {Array.isArray(msg.sources) && msg.sources.length > 0 && (
  <div className="mt-2 space-y-1">
    <p className="text-xs text-gray-400">Sumber:</p>

    {msg.sources.slice(0, 3).map((src, idx) => {
      if (!src?.uri) return null;

      return (
        <a
          key={idx}
          href={src.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-blue-500 hover:underline truncate"
        >
          🔗 {src.title?.trim() || src.uri}
        </a>
      );
    })}
  </div>
)}
                      <span className="text-xs text-gray-400">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                )}

                {/* USER */}
                {msg.sender === "user" && (
                  <div className="flex items-end gap-2 max-w-[75%]">
                    <div className="text-right">
                      <div className="bg-blue-600 text-white p-3 rounded-xl text-sm">
                    {formatTextWithLinks(msg.text)}
                      </div>
                      <span className="text-xs text-gray-400">
                        {msg.time}
                      </span>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* LOADING */}
            {isLoading && (
              <div className="text-sm text-gray-400">
                Mengetik...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div className="p-3 border-t flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Tulis pertanyaan..."
              className="flex-1 px-4 py-2 border rounded-full text-sm"
            />

            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 text-white p-2 rounded-full disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}