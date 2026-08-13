"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Tag } from "lucide-react";
import { Offer } from "@/services/offerService";

interface OffersSectionProps {
  offers: Offer[];
}

export default function OffersSection({ offers }: OffersSectionProps) {
  const isMulti = offers && offers.length > 1;

  // Track clones: [O_last, O_1, O_2, ... O_last, O_1]
  const displayOffers = isMulti
    ? [offers[offers.length - 1], ...offers, offers[0]]
    : offers;

  // trackIndex starts at 1 for real first item if multi, else 0
  const [trackIndex, setTrackIndex] = useState(isMulti ? 1 : 0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-play carousel every 4 seconds
  useEffect(() => {
    if (!isMulti || isPaused) return;

    const timer = setInterval(() => {
      goToNext();
    }, 4000);

    return () => clearInterval(timer);
  }, [isMulti, isPaused, trackIndex]);

  if (!offers || offers.length === 0) return null;

  const goToNext = () => {
    if (!isTransitioning) return;
    setIsTransitioning(true);
    setTrackIndex((prev) => prev + 1);
  };

  const goToPrev = () => {
    if (!isTransitioning) return;
    setIsTransitioning(true);
    setTrackIndex((prev) => prev - 1);
  };

  // Seamless boundary reset on transition end
  const handleTransitionEnd = () => {
    if (!isMulti) return;

    if (trackIndex === displayOffers.length - 1) {
      // Reached right clone (O1_clone) -> Jump instantly to real O1 (trackIndex 1)
      setIsTransitioning(false);
      setTrackIndex(1);
      setTimeout(() => setIsTransitioning(true), 30);
    } else if (trackIndex === 0) {
      // Reached left clone (ON_clone) -> Jump instantly to real ON (trackIndex offers.length)
      setIsTransitioning(false);
      setTrackIndex(offers.length);
      setTimeout(() => setIsTransitioning(true), 30);
    }
  };

  // Real zero-based index for header counter & active dots
  const realActiveIndex = isMulti
    ? (trackIndex - 1 + offers.length) % offers.length
    : 0;

  // Touch Swipe Handlers (strict 1-item scroll per gesture)
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 35;

    if (distance > minSwipeDistance) {
      goToNext();
    } else if (distance < -minSwipeDistance) {
      goToPrev();
    }
  };

  // Mouse Drag Handlers for Desktop Swiping
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPaused(true);
    touchStartX.current = e.clientX;
    touchEndX.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchStartX.current !== null) {
      touchEndX.current = e.clientX;
    }
  };

  const handleMouseUp = () => {
    setIsPaused(false);
    if (touchStartX.current === null || touchEndX.current === null) {
      touchStartX.current = null;
      return;
    }
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 35;

    if (distance > minSwipeDistance) {
      goToNext();
    } else if (distance < -minSwipeDistance) {
      goToPrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleDotClick = (targetRealIndex: number) => {
    if (!isTransitioning) return;
    setIsTransitioning(true);
    setTrackIndex(targetRealIndex + 1);
  };

  return (
    <section className="flex flex-col gap-2.5">
      {/* Section Header */}
      <div className="flex items-center justify-between px-0.5 select-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0B392B]/10 text-[#0B392B] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C] font-poppins tracking-tight">
            Offers & Promotions
          </h2>
        </div>
        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#0B392B]/10 text-[#0B392B] uppercase tracking-wider">
          {realActiveIndex + 1} / {offers.length}
        </span>
      </div>

      {/* Controlled Continuous-Direction Carousel Viewport */}
      <div
        className="w-full overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Animated Sliding Track */}
        <div
          onTransitionEnd={handleTransitionEnd}
          className={`flex w-full ${
            isTransitioning ? "transition-transform duration-500 ease-out" : ""
          }`}
          style={{ transform: `translateX(-${trackIndex * 100}%)` }}
        >
          {displayOffers.map((offer, idx) => {
            let badgeText = "";
            if (offer.offerType === "BOGO") {
              badgeText = `BUY ${offer.buyQuantity || 1} GET ${offer.freeQuantity || 1} FREE`;
            } else if (offer.offerType === "PERCENTAGE") {
              badgeText = `${offer.discountPercentage}% OFF`;
            } else {
              badgeText = `FLAT ₹${offer.flatDiscountAmount} OFF`;
            }

            return (
              <div
                key={`${offer._id}-${idx}`}
                className="w-full shrink-0 p-0.5"
              >
                <div className="bg-gradient-to-br from-[#0B392B] via-[#0D4434] to-[#082C21] text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#145C47] flex items-center justify-between gap-4 h-36 sm:h-40 overflow-hidden relative">
                  {/* Left Content */}
                  <div className="flex-1 flex flex-col justify-between h-full py-0.5 gap-2 z-10 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#FFCC00] text-black text-[10px] sm:text-xs font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow-2xs shrink-0">
                        {badgeText}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight font-poppins truncate">
                        {offer.title}
                      </h3>
                      <p className="text-xs text-emerald-100 font-medium line-clamp-1 mt-0.5">
                        {offer.description ||
                          (offer.minCartValue
                            ? `Min order: ₹${offer.minCartValue}`
                            : "Special limited time offer")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/15">
                      <span className="text-xs text-emerald-200 font-semibold flex items-center gap-1 shrink-0">
                        <Tag className="w-3.5 h-3.5 text-[#FFCC00]" /> Use Code:
                      </span>
                      <span className="font-mono text-xs sm:text-sm font-extrabold bg-white/10 backdrop-blur-md text-white border border-white/20 px-2.5 py-0.5 rounded-lg shadow-2xs shrink-0">
                        {offer.code}
                      </span>
                    </div>
                  </div>

                  {/* Right Image */}
                  {offer.image && (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-white/20 bg-black/20 shadow-md relative">
                      <img
                        src={offer.image}
                        alt={offer.title}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Swipe Dot Navigation Indicators */}
      {offers.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {offers.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === realActiveIndex
                  ? "w-6 bg-[#0B392B]"
                  : "w-2 bg-[#0B392B]/25 hover:bg-[#0B392B]/50"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
