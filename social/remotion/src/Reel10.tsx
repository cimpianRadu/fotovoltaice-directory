import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Geist';

const { fontFamily } = loadFont();

export const FPS = 30;

// Timing per scenă (frames @30fps): hook 3,5s / tabel 7s / concret 4s / CTA 3s
const HOOK = 105;
const TABLE = 210;
const CONCRET = 120;
const CTA = 120;
export const REEL10_DURATION = HOOK + TABLE + CONCRET + CTA;

const AMBER = '#f59e0b';
const NAVY = '#1e3a5f';
const NAVY_DEEP = '#162a46';
const CREAM = '#fafaf9';
const WORDMARK = 'instalatori-fotovoltaice.ro';

// Date PVGIS-SARAH3 (data/pvgis-yields.json, verificate 2026-07-16)
const COUNTIES: Array<[string, number]> = [
  ['Constanța', 1380],
  ['Călărași', 1340],
  ['București', 1280],
  ['Timiș', 1260],
  ['Iași', 1200],
  ['Cluj', 1180],
  ['Brașov', 1160],
];

const ro = (n: number) => Math.round(n).toLocaleString('ro-RO');

const base: React.CSSProperties = { fontFamily, fontWeight: 700 };

// --- primitives ---------------------------------------------------------

function useEnter(delay: number, damping = 200) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
}

const Rise: React.FC<{ delay: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay,
  children,
  style,
}) => {
  const p = useEnter(delay);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px)`, ...style }}>
      {children}
    </div>
  );
};

// Captions stil karaoke: cuvintele apar eșalonat
const WordReveal: React.FC<{ text: string; delay: number; perWord?: number; style?: React.CSSProperties }> = ({
  text,
  delay,
  perWord = 3,
  style,
}) => {
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

const CountUp: React.FC<{ to: number; delay: number; suffix?: string; style?: React.CSSProperties }> = ({
  to,
  delay,
  suffix = '',
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 60 }, durationInFrames: 45 });
  return <span style={style}>{ro(p * to)}{suffix}</span>;
};

const Footer: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 130,
      background: CREAM,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <span style={{ ...base, fontSize: 34, color: NAVY }}>
      <span style={{ color: AMBER }}>●</span> {WORDMARK}
    </span>
  </div>
);

// --- scene --------------------------------------------------------------

export const Hook: React.FC = () => {
  const heroP = useEnter(18, 14);
  return (
    <AbsoluteFill style={{ background: AMBER, padding: '0 90px', justifyContent: 'center' }}>
      <Rise delay={0}>
        <div style={{ ...base, fontSize: 58, color: NAVY, textAlign: 'center', lineHeight: 1.25 }}>
          Cât produce 1 kWp de panouri într-un an?
        </div>
      </Rise>
      <div
        style={{
          ...base,
          fontSize: 130,
          color: CREAM,
          textAlign: 'center',
          margin: '70px 0',
          lineHeight: 1.05,
          transform: `scale(${0.6 + heroP * 0.4})`,
          opacity: heroP,
          textShadow: '0 6px 0 rgba(30,58,95,0.25)',
        }}
      >
        DEPINDE
        <br />
        UNDE
      </div>
      <WordReveal
        delay={45}
        text="Între județe, diferența trece de 20%. Cifrele oficiale PVGIS:"
        style={{ ...base, fontSize: 46, color: NAVY, textAlign: 'center', lineHeight: 1.35 }}
      />
      <Footer />
    </AbsoluteFill>
  );
};

export const Table: React.FC = () => {
  const frame = useCurrentFrame();
  const min = 1100;
  const max = 1380;
  const netDelay = 20 + COUNTIES.length * 8 + 20;
  const pulse = 1 + Math.sin(Math.max(0, frame - netDelay) / 8) * 0.02;
  return (
    <AbsoluteFill style={{ background: CREAM, padding: '110px 80px 0' }}>
      <Rise delay={0}>
        <div style={{ ...base, fontSize: 56, color: NAVY, textAlign: 'center', lineHeight: 1.2 }}>
          kWh pe an, pentru fiecare kWp instalat
        </div>
      </Rise>
      <div style={{ marginTop: 70 }}>
        {COUNTIES.map(([name, value], i) => {
          const d = 20 + i * 8;
          const p = spring({ frame: frame - d, fps: FPS, config: { damping: 200 } });
          const barW = interpolate(value, [min, max], [90, 620]);
          return (
            <div
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                marginBottom: 34,
                opacity: p,
                transform: `translateX(${(1 - p) * -60}px)`,
              }}
            >
              <span style={{ ...base, fontSize: 44, color: NAVY, width: 250 }}>{name}</span>
              <div
                style={{
                  height: 34,
                  width: barW * p,
                  borderRadius: 17,
                  background: i === 0 ? NAVY : AMBER,
                }}
              />
              <CountUp to={value} delay={d} style={{ ...base, fontSize: 44, color: NAVY }} />
            </div>
          );
        })}
      </div>
      <Rise delay={netDelay}>
        <div
          style={{
            marginTop: 40,
            background: NAVY,
            borderRadius: 24,
            padding: '34px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transform: `scale(${pulse})`,
          }}
        >
          <span style={{ ...base, fontSize: 52, color: CREAM }}>Județul tău?</span>
          <span style={{ ...base, fontSize: 52, color: AMBER }}>scrie-l jos ↓</span>
        </div>
      </Rise>
      <Rise delay={netDelay + 12}>
        <div
          style={{
            ...base,
            fontWeight: 400,
            fontStyle: 'italic',
            fontSize: 30,
            color: '#6b7280',
            textAlign: 'center',
            marginTop: 36,
          }}
        >
          PVGIS-SARAH3, sistem fix orientat sud, înclinare ~30°. Variația reală: ±5-10%.
        </div>
      </Rise>
      <Footer />
    </AbsoluteFill>
  );
};

export const Concret: React.FC = () => (
  <AbsoluteFill style={{ background: NAVY, padding: '0 90px', justifyContent: 'center' }}>
    <Rise delay={0}>
      <div style={{ ...base, fontSize: 46, color: AMBER, textAlign: 'center', letterSpacing: 6 }}>
        CONCRET
      </div>
      <div
        style={{ ...base, fontSize: 72, color: CREAM, textAlign: 'center', lineHeight: 1.15, marginTop: 26 }}
      >
        Aceeași investiție, producție diferită
      </div>
    </Rise>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 60, margin: '80px 0' }}>
      {[
        ['Constanța', 6900, 8],
        ['Brașov', 5800, 16],
      ].map(([name, val, d]) => (
        <Rise key={name as string} delay={d as number} style={{ textAlign: 'center' }}>
          <div style={{ ...base, fontSize: 44, color: AMBER }}>{name}</div>
          <div style={{ ...base, fontSize: 92, color: CREAM, fontVariantNumeric: 'tabular-nums' }}>
            <CountUp to={val as number} delay={d as number} />
          </div>
          <div style={{ ...base, fontSize: 36, color: '#8fa3bd' }}>kWh / an la 5 kWp</div>
        </Rise>
      ))}
    </div>
    <Rise delay={40}>
      <div
        style={{
          background: AMBER,
          borderRadius: 24,
          padding: '30px 40px',
          ...base,
          fontSize: 50,
          color: NAVY,
          textAlign: 'center',
          lineHeight: 1.25,
        }}
      >
        peste 1.000 kWh diferență, an{' '}de{' '}an
      </div>
    </Rise>
    <WordReveal
      delay={60}
      text="De asta calculul se face pe județul tău, nu pe media națională."
      style={{ ...base, fontSize: 44, color: CREAM, textAlign: 'center', lineHeight: 1.4, marginTop: 60 }}
    />
    <Footer />
  </AbsoluteFill>
);

export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const btnP = useEnter(40, 14);
  const phoneP = useEnter(10);
  // Ken Burns: zoom + drift lent pe screenshotul real al calculatorului
  const kb = interpolate(frame, [0, 120], [1.0, 1.07]);
  const drift = interpolate(frame, [0, 120], [0, -60]);
  return (
    <AbsoluteFill style={{ background: AMBER, alignItems: 'center', paddingTop: 100 }}>
      <Rise delay={0}>
        <div style={{ ...base, fontSize: 84, color: NAVY, textAlign: 'center', lineHeight: 1.12 }}>
          Calculator pe județul tău
        </div>
      </Rise>
      <Rise delay={8}>
        <div
          style={{
            ...base,
            fontSize: 42,
            color: NAVY_DEEP,
            textAlign: 'center',
            lineHeight: 1.3,
            marginTop: 22,
            padding: '0 120px',
          }}
        >
          Alegi județul și consumul, noi folosim exact datele PVGIS.
        </div>
      </Rise>
      <div
        style={{
          marginTop: 44,
          width: 560,
          height: 730,
          borderRadius: 48,
          border: `10px solid ${NAVY_DEEP}`,
          overflow: 'hidden',
          boxShadow: '0 30px 60px rgba(22,42,70,0.35)',
          background: CREAM,
          opacity: phoneP,
          transform: `translateY(${(1 - phoneP) * 80}px)`,
        }}
      >
        <Img
          src={staticFile('screenshot-calculator.png')}
          style={{
            width: '100%',
            transform: `scale(${kb}) translateY(${drift}px)`,
            transformOrigin: 'top center',
          }}
        />
      </div>
      <div
        style={{
          marginTop: 48,
          background: NAVY,
          borderRadius: 60,
          padding: '32px 60px',
          transform: `scale(${0.7 + btnP * 0.3})`,
          opacity: btnP,
        }}
      >
        <span style={{ ...base, fontSize: 46, color: CREAM }}>{WORDMARK}</span>
      </div>
      <Rise delay={55}>
        <div style={{ ...base, fontSize: 36, color: NAVY_DEEP, textAlign: 'center', marginTop: 34 }}>
          Linkul e în comentariul fixat ↓
        </div>
      </Rise>
    </AbsoluteFill>
  );
};

export const Reel10: React.FC = () => (
  <AbsoluteFill style={{ fontFamily }}>
    <Sequence durationInFrames={HOOK}>
      <Hook />
    </Sequence>
    <Sequence from={HOOK} durationInFrames={TABLE}>
      <Table />
    </Sequence>
    <Sequence from={HOOK + TABLE} durationInFrames={CONCRET}>
      <Concret />
    </Sequence>
    <Sequence from={HOOK + TABLE + CONCRET} durationInFrames={CTA}>
      <Cta />
    </Sequence>
  </AbsoluteFill>
);
