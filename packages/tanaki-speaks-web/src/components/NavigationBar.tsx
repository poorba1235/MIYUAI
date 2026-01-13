// components/NavigationBar.tsx
import { Cpu, Home, Menu, Settings, Users, Zap } from "lucide-react";
import { useState } from "react";

interface NavigationBarProps {
  className?: string;
  isMenuOpen?: boolean;
  setIsMenuOpen?: (open: boolean) => void;
  onMenuItemClick?: (item: string) => void;
}

const NavigationBar = ({ 
  className = "", 
  isMenuOpen: externalIsMenuOpen, 
  setIsMenuOpen: externalSetIsMenuOpen,
  onMenuItemClick 
}: NavigationBarProps) => {
  // Use external state if provided, otherwise use internal state
  const [internalIsMenuOpen, setInternalIsMenuOpen] = useState(false);
  const isMenuOpen = externalIsMenuOpen !== undefined ? externalIsMenuOpen : internalIsMenuOpen;
  const setIsMenuOpen = externalSetIsMenuOpen || setInternalIsMenuOpen;

  const menuItems = [
    { icon: Home, label: "Dashboard", active: true },
    { icon: Users, label: "Community" },
    { icon: Cpu, label: "Models" },
    { icon: Zap, label: "Features" },
    { icon: Settings, label: "Settings" }
  ];

  const mobileMenuItems = ["Dashboard", "Community", "Models", "Features", "Settings"];

  const handleMenuItemClick = (item: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default anchor behavior
    
    if (onMenuItemClick) {
      onMenuItemClick(item);
    }
    
    // Close mobile menu if open
    setIsMenuOpen(false);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav
      className={`flex flex-row md:flex-row gap-4 px-5 py-3 items-center justify-between md:items-start pointer-events-auto rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-gray-900/10 to-cyan-900/10 shadow-2xl ${className}`}
      style={{ pointerEvents: "auto" as const }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
          <a
            href="/"
            className="text-cyan-300 font-bold text-xl hover:text-cyan-100 transition-all duration-300 hover:drop-shadow-glow"
            style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.1em" }}
          >
            MEILIN.AI
          </a>
        </div>
        
        <div className="hidden md:flex items-center gap-1 ml-6">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href="#"
              onClick={(e) => handleMenuItemClick(item.label, e)}
              className="flex items-center gap-2 text-cyan-200/80 hover:text-cyan-100 px-4 py-2 rounded-xl hover:bg-cyan-500/10 transition-all duration-300 border border-transparent hover:border-cyan-500/30 group"
            >
              <item.icon size={16} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                {item.label}
              </span>
              {item.active && (
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
              )}
            </a>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Social Links - Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-100 transition-all duration-300 text-sm font-medium hover:scale-105 active:scale-95"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            TWITTER
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-purple-100 transition-all duration-300 text-sm font-medium hover:scale-105 active:scale-95"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            GITHUB
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden relative">
          <button
            onClick={handleMenuToggle}
            className="p-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 active:scale-95"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}>
            <Menu size={20} />
          </button>

          {/* Mobile Dropdown Menu */}
          {isMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-64 bg-gradient-to-br from-gray-900/95 to-cyan-900/95 border border-cyan-500/30 backdrop-blur-lg p-4 rounded-2xl shadow-2xl z-50"
              style={{
                animation: "fadeIn 0.2s ease-out"
              }}
            >
              {mobileMenuItems.map((item) => (
                <button
                  key={item}
                  onClick={(e) => handleMenuItemClick(item, e)}
                  className="w-full text-cyan-200 hover:text-cyan-100 p-3 rounded-lg hover:bg-cyan-500/10 transition-all duration-200 text-center font-medium mb-2 last:mb-0 active:scale-95"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  {item}
                </button>
              ))}
              
              <div className="border-t border-cyan-500/30 pt-3 mt-3">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-cyan-200 hover:text-cyan-100 p-3 rounded-lg hover:bg-cyan-500/10 transition-all duration-200 text-center font-medium mb-2 active:scale-95"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  TWITTER
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-purple-200 hover:text-purple-100 p-3 rounded-lg hover:bg-purple-500/10 transition-all duration-200 text-center font-medium active:scale-95"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  GITHUB
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </nav>
  );
};

export default NavigationBar;