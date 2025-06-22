'use client';

import { Button } from "@/components/ui/button";
import { VscVscode } from "react-icons/vsc";
import { Logo } from "@/components/ui/logo";
import { useRouter } from "next/navigation";

export function Hero() {
    const router = useRouter();
  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-800 via-violet-900 to-purple-800" />

      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0),rgba(17,24,39,1))] opacity-70"
      />
      <div 
        className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 animate-gradient-xy mix-blend-soft-light"
        style={{
          backgroundSize: '200% 200%',
        }}
      />

      {/* Noise texture */}
      <div 
        className="absolute inset-0 opacity-[0.65] mix-blend-overlay"
        style={{
          backgroundImage: `url(/noise.png)`,
          backgroundRepeat: 'repeat',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Grain overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            repeating-conic-gradient(#080808 0% 0.000001%, transparent 0% 0.0625%),
            repeating-conic-gradient(#080808 0% 0.000001%, transparent 0% 0.0625%)
          `,
          backgroundSize: '30px 30px',
          opacity: 0.35,
          mixBlendMode: 'color-burn',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 container px-4 mx-auto text-center">
        <div className="mb-8 inline-block">
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-white/20 rounded-full transform -rotate-6" />
            <h1 className="relative text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight bg-clip-text">
              Code Smarter, Not Harder
            </h1>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white/90 mt-4">
            Track Your Productivity
          </h2>
        </div>
        
        <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-12 leading-relaxed">
          A powerful VS Code extension that seamlessly tracks your coding activity across multiple devices. 
          Get real-time insights into your coding patterns, focus sessions, and project time allocation.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Button 
            size="lg"
            variant="default"
            className="h-12 px-6"
          >
            <VscVscode className="h-6 w-6 text-[#007acc]" />
            Download Extension
          </Button>
          
          <Button 
            size="lg"
            variant="outline"
            className="h-12"
            onClick={
                () => router.push('/dashboard')
            }
          >
            <Logo width={40} height={40} />
            Get Started
          </Button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
} 