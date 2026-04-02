import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

export default function LiveDisplay() {
  const [slide, setSlide] = useState({ 
    type: 'blank', 
    content: '', 
    reference: '', 
    background: 'bg-black',
    animation: 'fade'
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'live_state', 'current'), (doc) => {
      if (doc.exists()) {
        setSlide(doc.data() as any);
      }
    });
    return () => unsubscribe();
  }, []);

  const getAnimationVariants = () => {
    switch (slide.animation) {
      case 'slide-up':
        return {
          initial: { opacity: 0, y: 50 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -50 }
        };
      case 'zoom-in':
        return {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.1 }
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  const variants = getAnimationVariants();

  return (
    <div className={`w-screen h-screen overflow-hidden flex flex-col items-center justify-center p-16 text-center transition-colors duration-1000 ${slide.background}`}>
      <AnimatePresence mode="wait">
        {slide.type !== 'blank' && (
          <motion.div
            key={slide.content + slide.reference}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="max-w-6xl w-full flex flex-col items-center"
          >
            <div className="text-white font-serif text-5xl md:text-7xl lg:text-8xl leading-tight mb-12 drop-shadow-2xl">
              {slide.type === 'verse' ? `"${slide.content}"` : slide.content}
            </div>
            
            {slide.reference && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-white/90 font-sans text-2xl md:text-3xl lg:text-4xl font-semibold tracking-[0.2em] uppercase drop-shadow-lg"
              >
                {slide.reference}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
