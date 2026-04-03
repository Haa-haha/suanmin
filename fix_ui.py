import os
import re

# 1. Update index.css
with open('src/index.css', 'r') as f:
    css = f.read()

css = css.replace("family=Noto+Serif+SC:wght@300;400;500;600&family=Zhi+Mang+Xing&display=swap", "family=Noto+Serif+SC:wght@300;400;500;600&display=swap")
css = re.sub(r'\.font-calligraphy \{[^}]+\}', '', css)
css = css.replace("letter-spacing: 0.05em;", "letter-spacing: 0.08em;")

with open('src/index.css', 'w') as f:
    f.write(css)

# 2. Update Cloud.tsx
cloud_tsx = """import { motion } from 'framer-motion';

interface CloudProps {
  className?: string;
  size?: number;
}

export function Cloud({ className = '', size = 140 }: CloudProps) {
  return (
    <motion.div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      <div 
        className="absolute inset-0 rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(0, 0, 0, 0.05) 0%, transparent 70%)',
          transform: 'scale(1.2)',
        }}
      />
      
      <motion.div
        className="relative w-[70%] h-[70%]"
        animate={{ rotate: 360 }}
        transition={{ duration: 25, ease: 'linear', repeat: Infinity }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <g transform="translate(50,50)">
            <path d="M0 -49 A49 49 0 0 0 0 49 A24.5 24.5 0 0 1 0 0 A24.5 24.5 0 0 0 0 -49" fill="#18181b"/>
            <path d="M0 -49 A49 49 0 0 1 0 49 A24.5 24.5 0 0 1 0 0 A24.5 24.5 0 0 0 0 -49" fill="#fafafa"/>
            <circle cx="0" cy="-24.5" r="6" fill="#fafafa"/>
            <circle cx="0" cy="24.5" r="6" fill="#18181b"/>
            <circle cx="0" cy="0" r="49" fill="none" stroke="#18181b" strokeWidth="0.5"/>
          </g>
        </svg>
      </motion.div>
    </motion.div>
  );
}
"""
with open('src/components/Cloud.tsx', 'w') as f:
    f.write(cloud_tsx)

# 3. Update TypewriterText.tsx
typewriter_tsx = """import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  delay?: number;
  showCursor?: boolean;
}

export function TypewriterText({
  text,
  className = '',
  onComplete,
  delay = 0,
}: TypewriterTextProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, delay + 600);
    return () => clearTimeout(timer);
  }, [delay, onComplete]);

  return (
    <motion.span
      initial={{ opacity: 0, filter: 'blur(2px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, delay: delay / 1000 }}
      className={className}
    >
      {text}
    </motion.span>
  );
}

interface AutoAdvanceLinesProps {
  lines: string[];
  className?: string;
  fadedClassName?: string;
  autoAdvanceDelay?: number;
  tapToken?: number;
  tapAdvance?: boolean;
  onAllComplete?: () => void;
}

export function AutoAdvanceLines({
  lines,
  className = '',
  fadedClassName = '',
  tapToken,
  tapAdvance = true,
  onAllComplete,
}: AutoAdvanceLinesProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const lastAdvanceAtRef = useRef(0);

  useEffect(() => {
    setVisibleCount(0);
  }, [lines]);

  useEffect(() => {
    if (visibleCount >= lines.length) {
      onAllComplete?.();
      return;
    }

    const currentLine = lines[visibleCount];
    const delay = 800 + currentLine.length * 150;

    const timer = setTimeout(() => {
      setVisibleCount(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [visibleCount, lines, onAllComplete]);

  useEffect(() => {
    if (tapToken === undefined || !tapAdvance) return;
    if (visibleCount >= lines.length) return;

    const now = Date.now();
    if (now - lastAdvanceAtRef.current < 350) return;
    lastAdvanceAtRef.current = now;

    setVisibleCount(prev => prev + 1);
  }, [tapToken, tapAdvance, lines.length]);

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {lines.slice(0, visibleCount + 1).map((line, idx) => {
          const isLastLine = idx === lines.length - 1;
          const isCurrent = idx === visibleCount || (isLastLine && visibleCount >= lines.length);
          const isPast = !isCurrent;
          
          if (idx > visibleCount) return null;

          return (
            <motion.p
              key={idx}
              initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
              animate={{ 
                opacity: isPast ? 0.4 : 1, 
                y: 0, 
                filter: 'blur(0px)' 
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={isPast ? fadedClassName : className}
            >
              {line}
            </motion.p>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
"""
with open('src/components/TypewriterText.tsx', 'w') as f:
    f.write(typewriter_tsx)

# 4. Fix Fonts in Pages
pages_to_fix = [
    'src/pages/EntrancePage.tsx',
    'src/pages/TeachingPage.tsx',
    'src/pages/ChoicePage.tsx',
    'src/pages/InputPage.tsx',
    'src/pages/QuestionPage.tsx',
    'src/pages/CastingPage.tsx',
    'src/pages/ResultPage.tsx'
]

for page in pages_to_fix:
    with open(page, 'r') as f:
        content = f.read()
    
    content = content.replace("font-calligraphy", "font-oracle")
    content = content.replace("text-4xl md:text-5xl", "text-2xl md:text-3xl")
    content = content.replace("text-3xl md:text-4xl", "text-xl md:text-2xl")
    content = content.replace(" tracking-widest", "")
    content = content.replace("font-bold", "font-medium")
    
    with open(page, 'w') as f:
        f.write(content)

