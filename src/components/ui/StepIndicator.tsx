'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  title: string;
  isActive: boolean;
}

interface StepIndicatorProps {
  steps: Step[];
}

export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center w-full max-w-2xl mx-auto mb-16">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-200",
              step.isActive ? "bg-[#8A63F4] text-white" : "bg-[#1e2235] text-white/70"
            )}>
              {step.number}
            </div>
            <span className={cn(
              "mt-2 text-sm transition-colors duration-200",
              step.isActive ? "text-white" : "text-white/70"
            )}>
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 h-[2px] mx-4 bg-[#1e2235]">
              <div className={cn(
                "h-full bg-[#8A63F4] transition-all duration-300",
                step.isActive ? "w-full" : "w-0"
              )} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
} 