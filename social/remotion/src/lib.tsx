import React from 'react';
import {
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
// Schimbă fontul aici dacă brandul cere altul (orice familie de pe Google Fonts):
import { loadFont } from '@remotion/google-fonts/Geist';
import brand from './brand.json';

const { fontFamily } = loadFont();

export const FPS = 30;
export { brand, fontFamily };
export const base: React.CSSProperties = { fontFamily, fontWeight: 700 };

export const toF = (sec: number) => Math.round(sec * FPS);
export const fmt = (n: number) => Math.round(n).toLocaleString(brand.locale);

export type TimelineSentence = { file: string; text: string; start: number; duration: number };
export type Timeline = { sentences: TimelineSentence[]; total: number };

// --- animație de intrare -------------------------------------------------

export function useEnter(delay: number, damping = 200) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
}

export const Rise: React.FC<{
  delay: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay, children, style }) => {
  const p = useEnter(delay);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px)`, ...style }}>
      {children}
    </div>
  );
};

// Text care apare cuvânt cu cuvânt (pentru versiuni fără voce)
export const WordReveal: React.FC<{
  text: string;
  delay: number;
  perWord?: number;
  style?: React.CSSProperties;
}> = ({ text, delay, perWord = 3, style }) => {
  const frame = useCurrentFrame();
  return (
    <div style={style}>
      {text.split(' ').map((w, i) => {
        const o = interpolate(frame, [delay + i * perWord, delay + i * perWord + 6], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <span key={i} style={{ opacity: o }}>
            {w}{' '}
          </span>
        );
      })}
    </div>
  );
};

// Număr care se numără în sus (formatat pe locale-ul brandului)
export const CountUp: React.FC<{
  to: number;
  delay: number;
  suffix?: string;
  style?: React.CSSProperties;
}> = ({ to, delay, suffix = '', style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 60 }, durationInFrames: 45 });
  return (
    <span style={style}>
      {fmt(p * to)}
      {suffix}
    </span>
  );
};

// Bandă de brand jos (wordmark)
export const Footer: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 130,
      background: brand.light,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <span style={{ ...base, fontSize: 34, color: brand.dark }}>
      <span style={{ color: brand.primary }}>●</span> {brand.wordmark}
    </span>
  </div>
);

// --- captions karaoke ----------------------------------------------------

// Highlight ponderat după lungimea cuvântului: cuvintele lungi durează mai mult
// la rostire, împărțirea uniformă defazează sincronizarea (feedback validat).
export const Caption: React.FC<{ text: string; startF: number; durF: number }> = ({
  text,
  startF,
  durF,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  const weights = words.map((w) => w.length + 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const wordStarts = weights.map((w) => {
    const s = acc / total;
    acc += w;
    return s;
  });
  const progress = (frame - startF + 2) / (durF * 0.96);
  const active = wordStarts.filter((s) => s <= progress).length - 1;
  if (frame < startF - 6) return null;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 175,
        left: 40,
        right: 40,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          ...base,
          fontSize: 40,
          lineHeight: 1.35,
          textAlign: 'center',
          background: 'rgba(0,0,0,0.55)',
          color: brand.light,
          borderRadius: 22,
          padding: '18px 28px',
          maxWidth: 940,
        }}
      >
        {words.map((w, i) => (
          <span
            key={i}
            style={{
              color: i === active ? brand.primary : brand.light,
              opacity: i <= active + 1 ? 1 : 0.45,
            }}
          >
            {w}{' '}
          </span>
        ))}
      </div>
    </div>
  );
};

// --- asset-uri -----------------------------------------------------------

// Poză/screenshot cu zoom + drift lent (Ken Burns). Zoom subtil (max ~1.08),
// altfel marginile se taie vizibil.
export const KenBurnsImage: React.FC<{
  src: string;
  durF: number;
  from?: number;
  to?: number;
  drift?: number;
  style?: React.CSSProperties;
}> = ({ src, durF, from = 1.0, to = 1.07, drift = -50, style }) => {
  const frame = useCurrentFrame();
  const kb = interpolate(frame, [0, durF], [from, to]);
  const dy = interpolate(frame, [0, durF], [0, drift]);
  return (
    <Img
      src={src}
      style={{
        width: '100%',
        transform: `scale(${kb}) translateY(${dy}px)`,
        transformOrigin: 'top center',
        ...style,
      }}
    />
  );
};

// Ramă de telefon cu un screenshot Ken Burns înăuntru; intră cu spring.
export const PhoneFrame: React.FC<{
  src: string;
  durF: number;
  width?: number;
  height?: number;
  delay?: number;
}> = ({ src, durF, width = 560, height = 730, delay = 10 }) => {
  const p = useEnter(delay);
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 48,
        border: `10px solid ${brand.deep}`,
        overflow: 'hidden',
        boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
        background: brand.light,
        opacity: p,
        transform: `translateY(${(1 - p) * 80}px)`,
      }}
    >
      <KenBurnsImage src={src} durF={durF} />
    </div>
  );
};
