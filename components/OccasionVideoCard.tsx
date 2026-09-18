'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';

export interface OccasionItem {
  name: string;
  slug: string;
  icon: string;
  desc: string;
  videoUrl?: string;
  posterUrl?: string;
}

export default function OccasionVideoCard({ occasion }: { occasion: OccasionItem }) {
  const [isHovered, setIsHovered] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy prevented or user navigated away
        });
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <Link
      href={`/search?occasion=${occasion.slug}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative group rounded-2xl overflow-hidden border border-stone-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-4 h-full min-h-[170px] text-center bg-white select-none"
    >
      {/* Background Poster & Video Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-stone-900">
        {/* Static Poster Fallback */}
        <img
          src={occasion.posterUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80'}
          alt={occasion.name}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
            isHovered ? 'scale-110 opacity-40' : 'opacity-80 scale-100'
          }`}
          loading="lazy"
        />

        {/* Hover Video Preview (Preload None for Zero Initial Overhead) */}
        {occasion.videoUrl && (
          <video
            ref={videoRef}
            src={occasion.videoUrl}
            muted
            loop
            playsInline
            preload="none"
            onLoadedData={() => setVideoLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              isHovered ? 'opacity-90' : 'opacity-0 pointer-events-none'
            }`}
          />
        )}

        {/* Dark Gradient Overlay for Maximum Text Contrast & Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/50 to-stone-900/40 group-hover:from-stone-950 group-hover:via-stone-900/70 transition duration-300" />
      </div>

      {/* Card Content (Always on top with high contrast) */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full space-y-2">
        {/* Occasion Icon Badge */}
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-2xl shadow-md group-hover:scale-110 group-hover:bg-amber-500/30 transition-all duration-300">
          {occasion.icon}
        </div>

        {/* Title & Description */}
        <div>
          <h4 className="font-extrabold text-sm text-white tracking-wide group-hover:text-amber-300 transition-colors">
            {occasion.name}
          </h4>
          <p className="text-[11px] text-stone-200 line-clamp-2 mt-1 leading-snug font-medium">
            {occasion.desc}
          </p>
        </div>

        {/* Subtle Live Preview Indicator on Desktop Hover */}
        <div className={`text-[10px] font-bold text-amber-300 tracking-wider uppercase transition-opacity duration-300 hidden sm:block ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          Previewing • Explore →
        </div>
      </div>
    </Link>
  );
}
