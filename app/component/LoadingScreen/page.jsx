"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HeartPulse } from "lucide-react";
import Image from "next/image";

export default function LoadingScreen() {
  const [appTitle, setAppTitle] = useState("Cabinet Pédiatrique");

  useEffect(() => {
    // 1. Instant load from localStorage
    if (typeof window !== "undefined") {
      try {
        const storedTitle = localStorage.getItem("appTitle");
        if (storedTitle) {
          setAppTitle(storedTitle);
        } else {
          const stored = localStorage.getItem("cabinet");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.title || parsed?.appName) {
              setAppTitle(parsed.title || parsed.appName);
            }
          }
        }
      } catch (_) {}
    }

    // 2. Refresh from API
    fetch("/api/cabinet")
      .then((res) => res.json())
      .then((data) => {
        if (data?.title || data?.appName) {
          const title = data.title || data.appName;
          setAppTitle(title);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("appTitle", title);
              localStorage.setItem("cabinet", JSON.stringify(data));
            } catch (_) {}
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-md bg-[var(--color-900)]/50 text-white">
      {/* Flying & Pulsing Icon */}
      <motion.div
        animate={{ y: [0, 10, 0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="mb-6"
      >
        <HeartPulse
          size={60}
          className="text-[var(--color-300)] drop-shadow-lg"
        />
      </motion.div>

      {/* Logo + Title */}
      <div className="flex items-center gap-3">
        <Image src="/amel.png" alt="Cabinet Logo" width={60} height={60} />
        <h1 className="text-3xl font-extrabold tracking-wide">
          {appTitle}
        </h1>
      </div>

      {/* Animated Loading Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="mt-8 text-sm tracking-widest text-[var(--color-200)] uppercase"
      >
        Loading...
      </motion.p>
    </div>
  );
}
