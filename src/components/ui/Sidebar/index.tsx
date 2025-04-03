"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

interface Links {
  label?: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  suffix?: React.ReactNode;
  isActive?: boolean;
  isDropdownContainer?: boolean;
  isVisible?: boolean;
  items?: Links[];
  isDivider?: boolean;
  className?: string;
  isExclusive?: boolean;
}

type SidebarContextType = {
  isHovered: boolean;
};

export const SidebarContext = createContext<SidebarContextType>({ isHovered: false });

export function Sidebar({ children }: { children: React.ReactNode }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <SidebarContext.Provider value={{ isHovered }}>
      <div
        className={cn(
          "h-screen bg-[#0A0D1F] border-r border-[#1e2235] transition-all duration-300 ease-in-out relative group fixed top-0 left-0 z-40",
          isHovered ? "w-64" : "w-[68px]"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function SidebarBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("h-full flex flex-col p-3 justify-between", className)}>
      {children}
    </div>
  );
}

export function SidebarDropdownContainer({ items, isVisible }: { items: Links[], isVisible: boolean }) {
  return (
    <div 
      className={cn(
        "overflow-hidden transition-all duration-500 ease-in-out",
        isVisible ? "max-h-96 opacity-100 my-2" : "max-h-0 opacity-0 my-0"
      )}
    >
      <div className={cn(
        "pl-3 ml-2 border-l border-[#1e2235] space-y-1 transition-all duration-500 ease-in-out",
        isVisible ? "translate-y-0 opacity-100 delay-100" : "-translate-y-4 opacity-0"
      )}>
        {items.map((link, idx) => (
          <SidebarLink key={idx} link={link} />
        ))}
      </div>
    </div>
  );
}

export function SidebarLink({ link }: { link: Links }) {
  const { isHovered } = useContext(SidebarContext);

  if (link.isDropdownContainer) {
    return <SidebarDropdownContainer items={link.items || []} isVisible={link.isVisible || false} />;
  }

  if (link.isDivider) {
    return <div className={link.className} />;
  }

  return (
    <Link
      href={link.href || "#"}
      onClick={link.onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg transition-all duration-300",
        isHovered ? "px-3" : "px-[10px]",
        "py-2",
        link.isActive ? "bg-[#1e2235] text-white" : "text-white/70 hover:text-white",
        link.isExclusive && "text-[#8A63F4] font-medium"
      )}
    >
      {/* Indicador de seleção */}
      {link.isActive && (
        <div className={cn(
          "absolute -right-1 top-0 bottom-0 w-1 rounded-l",
          link.isExclusive ? "bg-[#a47ef8]" : "bg-[#8A63F4]"
        )} />
      )}

      {/* Ícone */}
      <div className={cn(
        "w-5 h-5 flex items-center justify-center flex-shrink-0",
        link.isExclusive && "text-[#a47ef8]"
      )}>
        {link.icon}
      </div>

      {/* Label e Suffix */}
      <div className={cn(
        "flex flex-1 items-center justify-between overflow-hidden transition-all duration-300",
        !isHovered && "w-0"
      )}>
        <span className="whitespace-nowrap font-medium">
          {link.label}
        </span>
        {link.suffix && (
          <span className="ml-auto">
            {link.suffix}
          </span>
        )}
      </div>
    </Link>
  );
}

export function Logo() {
  const { isHovered } = useContext(SidebarContext);
  
  return (
    <div className={cn(
      "flex items-center gap-4 pt-2 pb-6 transition-all duration-300",
      isHovered ? "px-3" : "px-[8px]"
    )}>
      <LogoIcon />
      <span className={cn(
        "font-semibold text-lg text-white transition-all duration-300 whitespace-nowrap",
        !isHovered && "w-0 opacity-0"
      )}>
        Clonify
      </span>
    </div>
  );
}

export const LogoIcon = () => {
  return (
    <div className="relative h-10 w-10 flex-shrink-0">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full rotate-[-45deg]"
      >
        <path
          d="M18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18"
          className="stroke-[#8A63F4]"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle
          cx="12"
          cy="12"
          r="3"
          className="fill-[#a47ef8]"
        />
      </svg>
    </div>
  );
};

export function UserProfile() {
  const { isHovered } = useContext(SidebarContext);

  return (
    <div className="py-4 border-t border-[#1e2235]">
      <div className={cn(
        "flex items-center gap-3",
        !isHovered ? "justify-center" : ""
      )}>
        <div className="h-8 w-8 rounded-full bg-[#1e2235] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          V
        </div>
        <div className={cn(
          "flex flex-col min-w-0 transition-all duration-300",
          !isHovered ? "w-0 opacity-0" : "w-auto opacity-100"
        )}>
          <span className="text-sm font-medium text-white whitespace-nowrap">
            Victor Alves
          </span>
          <span className="text-xs text-white/70 truncate max-w-[140px]">
            quartotech20@gmail.com
          </span>
        </div>
      </div>
    </div>
  );
} 