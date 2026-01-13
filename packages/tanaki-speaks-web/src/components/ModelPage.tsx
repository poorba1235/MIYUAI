import { Link } from "@tanstack/react-router";
import { ArrowLeft, Box3D, Orbit, Move3D } from "lucide-react";

export default function ModelPage() {
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Navigation */}
      <div className="absolute top-6 left-6 z-50">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-100 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            Back to Chat
          </span>
        </Link>
      </div>

      {/* Test H1 */}
      <div className="h-full flex items-center justify-center">
        <h1 className="text-5xl font-bold text-cyan-300 animate-pulse" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          3D MODEL PAGE
        </h1>
      </div>

      {/* Controls Panel */}
      <div className="absolute bottom-6 right-6 z-50">
        <div className="bg-gray-900/60 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-5 shadow-2xl w-64">
          <h3 className="text-cyan-300 font-bold mb-3 text-sm" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            CONTROLS
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Orbit className="text-cyan-400 w-5 h-5" />
              <span className="text-cyan-200 text-sm">Drag to rotate</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Move3D className="text-purple-400 w-5 h-5" />
              <span className="text-cyan-200 text-sm">Scroll to zoom</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Box3D className="text-green-400 w-5 h-5" />
              <span className="text-cyan-200 text-sm">Right-click to pan</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-cyan-500/20">
            <div className="text-center text-cyan-300/60 text-xs" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              MEILIN.AI 3D EXPERIENCE
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="absolute bottom-6 left-6 z-50">
        <div className="bg-gray-900/60 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-5 shadow-2xl max-w-sm">
          <h3 className="text-cyan-300 font-bold mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            COMING SOON
          </h3>
          <p className="text-cyan-200/80 text-sm leading-relaxed" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            Full 3D interactive model of MEILIN with animations and real-time rendering.
            This page is currently under development.
          </p>
          
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 bg-cyan-500/10 rounded-lg">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span className="text-cyan-300 text-xs">3D Model</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-purple-500/10 rounded-lg">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-purple-300 text-xs">Animations</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-300 text-xs">Real-time</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded-lg">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-yellow-300 text-xs">Interactive</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&family=Rajdhani:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}