import { motion, AnimatePresence } from 'framer-motion';
import type { LineType } from '../types/oracle';

type HexagramDiagramProps = {
  lines: LineType[];
  movingLine: number;
  size?: 'sm' | 'md';
  animateKey?: string | number;
};

export function HexagramDiagram({ lines, movingLine, size = 'md', animateKey }: HexagramDiagramProps) {
  const isSmall = size === 'sm';
  const fullWidth = isSmall ? 'w-28' : 'w-48 md:w-56';
  const segWidth = isSmall ? 'w-12' : 'w-20 md:w-24';
  const gap = isSmall ? 'gap-2' : 'gap-4';
  const height = isSmall ? 'h-[3px]' : 'h-1';
  const spacing = isSmall ? 'gap-2' : 'gap-3';

  return (
    <div className={`flex flex-col-reverse items-center ${spacing}`}> 
      {lines.map((line, index) => {
        const isMoving = index === movingLine - 1;
        const color = isMoving ? '#9B3028' : '#C5A97D';
        const keySuffix = animateKey === undefined ? '' : String(animateKey);

        const renderLine = (t: LineType) =>
          t === 'yang' ? (
            <div className={`${fullWidth} ${height} rounded-full`} style={{ background: color }} />
          ) : (
            <div className={`flex ${gap}`}>
              <div className={`${segWidth} ${height} rounded-full`} style={{ background: color }} />
              <div className={`${segWidth} ${height} rounded-full`} style={{ background: color }} />
            </div>
          );

        return (
          <div key={index} className="relative">
            {isMoving && (
              <div
                className={`${isSmall ? '-left-4' : '-left-6'} absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full`}
                style={{ background: color }}
              />
            )}

            {isMoving && animateKey !== undefined ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${index}-${line}-${keySuffix}`}
                  initial={{ opacity: 0.4, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0.2, scale: 0.98 }}
                    transition={{ duration: 0.8 }}
                >
                  {renderLine(line)}
                </motion.div>
              </AnimatePresence>
            ) : (
              renderLine(line)
            )}
          </div>
        );
      })}
    </div>
  );
}
