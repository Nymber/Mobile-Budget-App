"use client";

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  maxStars = 5,
  size = 'md',
  showValue = true,
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const sizeClass = sizes[size];

  return (
    <div className="flex items-center gap-3 select-none">
      <div className="inline-flex bg-background border border-border rounded-md shadow-sm p-1.5">
        {[...Array(maxStars)].map((_, index) => {
          const starValue = index + 1;
          const isActive = (hoveredRating !== null && starValue <= hoveredRating) || 
                          (hoveredRating === null && rating >= starValue);
          const isCurrentRating = rating === starValue;
          
          return (
            <button
              key={index}
              type="button"
              className={`focus:outline-none focus:ring-1 focus:ring-primary focus:ring-opacity-50 
                        transition-all duration-150 px-1 rounded-sm
                        ${isCurrentRating ? 'bg-primary bg-opacity-10' : ''}`}
              onClick={() => onRatingChange(starValue)}
              onMouseEnter={() => setHoveredRating(starValue)}
              onMouseLeave={() => setHoveredRating(null)}
              aria-label={`Rate ${starValue} out of ${maxStars}`}
              title={`${starValue} Star${starValue !== 1 ? 's' : ''}`}
            >
              <Star
                className={`${sizeClass} transition-all duration-150 ${
                  isActive
                    ? 'fill-primary text-primary'
                    : 'text-muted-foreground hover:text-primary'
                }`}
                strokeWidth={isActive ? 2 : 1.5}
              />
            </button>
          );
        })}
      </div>
      
      {showValue && rating > 0 && (
        <div className="bg-background border border-border rounded-md px-2 py-1 text-sm font-medium text-foreground shadow-sm min-w-[2.5rem] text-center">
          {rating}
        </div>
      )}
    </div>
  );
};
