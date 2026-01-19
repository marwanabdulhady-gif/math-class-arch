
import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { Slide } from '../types';
import Button from './Button';

interface CarouselViewerProps {
  slides: Slide[];
  onClose: () => void;
  onComplete: () => void;
}

const CarouselViewer: React.FC<CarouselViewerProps> = ({ slides, onClose, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const currentSlide = slides[currentIndex];
  
  // Dynamic Icon resolver
  const IconComponent = (Icons as any)[currentSlide.visualKeyword?.charAt(0).toUpperCase() + currentSlide.visualKeyword?.slice(1)] || Icons.Sparkles;

  // Visual Themes based on index (cycling)
  const themes = [
      'from-blue-600 to-indigo-900',
      'from-emerald-600 to-teal-900',
      'from-purple-600 to-fuchsia-900',
      'from-orange-600 to-red-900',
      'from-pink-600 to-rose-900'
  ];
  const theme = themes[currentIndex % themes.length];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-5xl h-[85vh] flex flex-col relative">
        
        {/* Header */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button onClick={onClose} className="p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-all">
                <Icons.X size={24} />
            </button>
        </div>

        {/* Slide Content */}
        <div className="flex-1 relative overflow-hidden rounded-3xl shadow-2xl border border-white/10 flex">
             {/* Background */}
             <div className={`absolute inset-0 bg-gradient-to-br ${theme} transition-all duration-700 ease-in-out`}></div>
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

             {/* Split Layout for Image & Text */}
             <div className="absolute inset-0 flex flex-col md:flex-row items-center justify-center p-8 sm:p-12 text-center md:text-left gap-8 animate-slideUp key={currentIndex}">
                  
                  {/* Left Side: Content */}
                  <div className="flex-1 max-w-2xl z-10 flex flex-col justify-center">
                      <div className="mb-6 inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg w-16 h-16 self-center md:self-start">
                          <IconComponent size={32} className="text-white" />
                      </div>

                      <h2 className="text-3xl sm:text-4xl font-black text-white mb-6 tracking-tight drop-shadow-lg leading-tight">
                          {currentSlide.title}
                      </h2>

                      <div className="space-y-4">
                          {currentSlide.content.map((point, idx) => (
                              <div key={idx} className="flex items-start gap-4 text-white/90 text-lg sm:text-xl font-medium" style={{ animationDelay: `${idx * 100}ms` }}>
                                   <div className="mt-2 w-2 h-2 rounded-full bg-white shrink-0 shadow-[0_0_10px_white]"></div>
                                   <span>{point}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Right Side: Image (if exists) */}
                  {currentSlide.imageUrl && (
                      <div className="flex-1 w-full h-64 md:h-full max-h-[500px] z-10 flex items-center justify-center relative">
                          <img 
                            src={`data:image/png;base64,${currentSlide.imageUrl}`} 
                            alt="Slide Visual" 
                            className="w-full h-full object-cover rounded-2xl shadow-2xl border border-white/20"
                          />
                          {/* OVERLAY TEXT */}
                          {currentSlide.overlayText && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="bg-black/60 backdrop-blur-sm px-6 py-4 rounded-xl border border-white/10 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                                      <span className="text-white font-bold text-2xl md:text-3xl tracking-wide drop-shadow-md text-center block">
                                          {currentSlide.overlayText}
                                      </span>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
             </div>

             {/* Progress Bar */}
             <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
                 <div 
                    className="h-full bg-white shadow-[0_0_10px_white] transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
                 />
             </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mt-6 px-4">
             <button 
                onClick={prevSlide} 
                disabled={currentIndex === 0}
                className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
             >
                 <Icons.ArrowLeft size={24} />
             </button>

             <span className="text-white/50 font-mono text-sm">
                 {currentIndex + 1} / {slides.length}
             </span>

             <button 
                onClick={nextSlide} 
                className="group flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
             >
                 {currentIndex === slides.length - 1 ? 'Finish' : 'Next'}
                 <Icons.ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
             </button>
        </div>

      </div>
    </div>
  );
};

export default CarouselViewer;
