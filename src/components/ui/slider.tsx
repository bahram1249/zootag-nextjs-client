'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';

interface Slide {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
}

interface SliderProps {
  slides: Slide[];
  interval?: number;
  renderOverlay?: (slide: Slide) => ReactNode;
}

export function Slider({ slides, interval = 4000, renderOverlay }: SliderProps) {
  const [slideIndex, setSlideIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setSlideIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setSlideIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const timer = setInterval(nextSlide, interval);
    return () => clearInterval(timer);
  }, [nextSlide, interval]);

  if (slides.length === 0) return null;

  return (
    <div className="relative aspect-[21/9] overflow-hidden rounded-2xl">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === slideIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <img
            src={slide.src}
            alt={slide.alt}
            className="h-full w-full object-cover"
          />
          {renderOverlay ? (
            renderOverlay(slide)
          ) : (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          )}
          {!renderOverlay && (slide.title || slide.subtitle) && (
            <div className="absolute bottom-0 right-0 left-0 p-6 text-white">
              {slide.title && <h3 className="text-lg font-bold sm:text-xl">{slide.title}</h3>}
              {slide.subtitle && <p className="mt-1 text-sm text-white/80">{slide.subtitle}</p>}
            </div>
          )}
        </div>
      ))}

      {/* RTL-aware arrows */}
      <button
        onClick={nextSlide}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <button
        onClick={prevSlide}
        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlideIndex(i)}
            className={`h-2 rounded-full transition-all ${i === slideIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
}
