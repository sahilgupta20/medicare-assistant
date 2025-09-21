// src/app/auth/redirect/page.tsx - NO AUTH VERSION
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Simple redirect - no auth needed
    const timer = setTimeout(() => {
      router.push("/medications");
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-rose-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">
          Redirecting to your dashboard...
        </p>
      </div>
    </div>
  );
}
