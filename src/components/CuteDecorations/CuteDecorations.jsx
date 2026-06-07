import { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './CuteDecorations.css';

// Decoration definitions — 32 elements across 4 types
const DECORATIONS = [
  // Sparkles (10)
  { symbol: '✦', type: 'sparkle' },
  { symbol: '✦', type: 'sparkle' },
  { symbol: '✦', type: 'sparkle' },
  { symbol: '✦', type: 'sparkle' },
  { symbol: '✦', type: 'sparkle' },
  { symbol: '✦', type: 'sparkle' },
  { symbol: '✦', type: 'sparkle' },
  { symbol: '✦', type: 'sparkle' },
  { symbol: '✦', type: 'sparkle' },
  { symbol: '✦', type: 'sparkle' },
  // Hearts (8)
  { symbol: '♥', type: 'heart' },
  { symbol: '♥', type: 'heart' },
  { symbol: '♥', type: 'heart' },
  { symbol: '♥', type: 'heart' },
  { symbol: '♥', type: 'heart' },
  { symbol: '♥', type: 'heart' },
  { symbol: '♥', type: 'heart' },
  { symbol: '♥', type: 'heart' },
  // Cats (6)
  { symbol: '🐱', type: 'cat' },
  { symbol: '🐱', type: 'cat' },
  { symbol: '🐱', type: 'cat' },
  { symbol: '🐱', type: 'cat' },
  { symbol: '🐱', type: 'cat' },
  { symbol: '🐱', type: 'cat' },
  // Flowers (8)
  { symbol: '✿', type: 'flower' },
  { symbol: '❀', type: 'flower' },
  { symbol: '✿', type: 'flower' },
  { symbol: '❀', type: 'flower' },
  { symbol: '✿', type: 'flower' },
  { symbol: '❀', type: 'flower' },
  { symbol: '✿', type: 'flower' },
  { symbol: '❀', type: 'flower' },
];

// Seeded pseudo-random for deterministic placement
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Place decoration in edge/corner zones to avoid central content
function getPlacement(index) {
  const r1 = seededRandom(index * 7 + 3);
  const r2 = seededRandom(index * 13 + 7);
  const r3 = seededRandom(index * 19 + 11);

  // Distribute across 4 edge zones + 4 corners
  const zone = Math.floor(r1 * 8);
  let left, top;

  switch (zone) {
    case 0: // Top-left corner
      left = 2 + r2 * 8;
      top = 2 + r3 * 10;
      break;
    case 1: // Top-right corner
      left = 90 + r2 * 8;
      top = 2 + r3 * 10;
      break;
    case 2: // Bottom-left corner
      left = 2 + r2 * 8;
      top = 88 + r3 * 10;
      break;
    case 3: // Bottom-right corner
      left = 90 + r2 * 8;
      top = 88 + r3 * 10;
      break;
    case 4: // Top edge
      left = 12 + r2 * 76;
      top = 2 + r3 * 10;
      break;
    case 5: // Bottom edge
      left = 12 + r2 * 76;
      top = 88 + r3 * 10;
      break;
    case 6: // Left edge
      left = 2 + r2 * 8;
      top = 14 + r3 * 72;
      break;
    case 7: // Right edge
      left = 90 + r2 * 8;
      top = 14 + r3 * 72;
      break;
    default:
      left = 2 + r2 * 8;
      top = 2 + r3 * 10;
  }

  return { left, top };
}

const CuteDecorations = () => {
  const { currentTheme } = useTheme();

  const items = useMemo(() => {
    return DECORATIONS.map((item, i) => {
      const { left, top } = getPlacement(i);
      const rSize = seededRandom(i * 5 + 1);
      const rDelay = seededRandom(i * 11 + 2);
      const rDuration = seededRandom(i * 9 + 1);

      // Sizes increased by ~40%
      let size;
      switch (item.type) {
        case 'cat':
          size = 22 + rSize * 14; // 22–36px
          break;
        case 'heart':
          size = 18 + rSize * 14; // 18–32px
          break;
        case 'flower':
          size = 18 + rSize * 12; // 18–30px
          break;
        case 'sparkle':
        default:
          size = 16 + rSize * 14; // 16–30px
          break;
      }

      const delay = rDelay * 10;
      const duration = 8 + rDuration * 8; // 8–16s (slower)
      const opacity = 0.18 + seededRandom(i * 4 + 3) * 0.10; // 0.18–0.28

      return {
        ...item,
        key: `${item.type}-${i}`,
        style: {
          left: `${left}%`,
          top: `${top}%`,
          fontSize: `${size}px`,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          opacity,
        },
      };
    });
  }, []);

  if (currentTheme !== 'cute') return null;

  return (
    <div className="cute-decorations" aria-hidden="true">
      {items.map((item) => (
        <span
          key={item.key}
          className={`cute-decoration cute-decoration--${item.type}`}
          style={item.style}
        >
          {item.symbol}
        </span>
      ))}
    </div>
  );
};

export default CuteDecorations;