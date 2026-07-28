import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import {
  base,
  brand,
  Caption,
  Footer,
  PhoneFrame,
  Rise,
  toF,
  useEnter,
} from './lib';
import timeline from './timeline-cereri.json';

const S = timeline.sentences;
export const CERERI_ILFOV_DURATION = toF(timeline.total);

// Scene: A = alertă (s1) / B = screenshot (s2) / C = urgență (s3+s4) / D = CTA (s5)
const B1 = toF(S[1].start) - 4;
const B2 = toF(S[2].start) - 4;
const B3 = toF(S[4].start) - 4;

const SceneAlerta: React.FC = () => {
  const frame = useCurrentFrame();
  const badgeP = useEnter(4, 14);
  const pulse = 1 + Math.sin(frame / 6) * 0.015;
  return (
    <AbsoluteFill style={{ background: brand.deep, alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          background: brand.primary,
          borderRadius: 999,
          padding: '16px 44px',
          transform: `scale(${badgeP})`,
          opacity: badgeP,
        }}
      >
        <span style={{ ...base, fontSize: 40, color: brand.deep, letterSpacing: 4 }}>
          ⚡ ALERTĂ LEAD-URI
        </span>
      </div>
      <Rise delay={14}>
        <div
          style={{
            ...base,
            fontSize: 150,
            color: brand.light,
            textAlign: 'center',
            lineHeight: 1.02,
            marginTop: 60,
            transform: `scale(${pulse})`,
          }}
        >
          2 CERERI
          <br />
          NOI
        </div>
      </Rise>
      <Rise delay={26}>
        <div style={{ ...base, fontSize: 56, color: brand.primary, marginTop: 50 }}>
          Ilfov · intrate azi
        </div>
      </Rise>
      <Footer />
    </AbsoluteFill>
  );
};

const SceneScreenshot: React.FC = () => (
  <AbsoluteFill style={{ background: brand.light, alignItems: 'center', paddingTop: 110 }}>
    <Rise delay={0}>
      <div style={{ ...base, fontSize: 58, color: brand.dark, textAlign: 'center', lineHeight: 1.2 }}>
        Live pe <span style={{ color: brand.primary }}>/cereri</span> chiar acum
      </div>
    </Rise>
    <div style={{ marginTop: 46 }}>
      <PhoneFrame src={staticFile('screenshot-cereri-ilfov.png')} durF={toF(S[1].duration) + 30} height={1250} />
    </div>
    <Footer />
  </AbsoluteFill>
);

const SceneUrgenta: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(Math.max(0, frame - 40) / 7) * 0.02;
  return (
    <AbsoluteFill style={{ background: brand.dark, padding: '0 90px', justifyContent: 'center' }}>
      <Rise delay={0}>
        <div style={{ ...base, fontSize: 46, color: brand.primary, textAlign: 'center', letterSpacing: 6 }}>
          STATUS
        </div>
        <div
          style={{
            ...base,
            fontSize: 88,
            color: brand.light,
            textAlign: 'center',
            lineHeight: 1.12,
            marginTop: 24,
          }}
        >
          Nicio revendicare
          <br />
          până acum
        </div>
      </Rise>
      <Rise delay={16}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, margin: '70px 0' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 150,
                height: 26,
                borderRadius: 13,
                border: `3px solid ${brand.primary}`,
                background: 'transparent',
              }}
            />
          ))}
        </div>
        <div style={{ ...base, fontSize: 46, color: '#8fa3bd', textAlign: 'center' }}>
          maxim 3 firme per cerere
        </div>
      </Rise>
      <Rise delay={34}>
        <div
          style={{
            marginTop: 70,
            background: brand.primary,
            borderRadius: 24,
            padding: '30px 40px',
            ...base,
            fontSize: 56,
            color: brand.deep,
            textAlign: 'center',
            transform: `scale(${pulse})`,
          }}
        >
          Fii primul care sună
        </div>
      </Rise>
      <Footer />
    </AbsoluteFill>
  );
};

const SceneCta: React.FC = () => {
  const btnP = useEnter(18, 14);
  return (
    <AbsoluteFill style={{ background: brand.primary, padding: '0 90px', justifyContent: 'center' }}>
      <Rise delay={0}>
        <div style={{ ...base, fontSize: 92, color: brand.dark, textAlign: 'center', lineHeight: 1.12 }}>
          Revendică
          <br />
          acum
        </div>
      </Rise>
      <div
        style={{
          alignSelf: 'center',
          marginTop: 70,
          background: brand.dark,
          borderRadius: 60,
          padding: '34px 62px',
          transform: `scale(${0.7 + btnP * 0.3})`,
          opacity: btnP,
        }}
      >
        <span style={{ ...base, fontSize: 46, color: brand.light }}>{brand.wordmark}/cereri</span>
      </div>
      <Rise delay={32}>
        <div style={{ ...base, fontSize: 38, color: brand.deep, textAlign: 'center', marginTop: 44 }}>
          Linkul e în comentariul fixat ↓
        </div>
      </Rise>
    </AbsoluteFill>
  );
};

export const CereriIlfov: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [CERERI_ILFOV_DURATION - 12, CERERI_ILFOV_DURATION], [1, 0], {
    extrapolateLeft: 'clamp',
  });
  return (
    <AbsoluteFill style={{ background: brand.dark, opacity: fadeOut }}>
      <Sequence durationInFrames={B1}>
        <SceneAlerta />
      </Sequence>
      <Sequence from={B1} durationInFrames={B2 - B1}>
        <SceneScreenshot />
      </Sequence>
      <Sequence from={B2} durationInFrames={B3 - B2}>
        <SceneUrgenta />
      </Sequence>
      <Sequence from={B3}>
        <SceneCta />
      </Sequence>

      {S.map((s) => (
        <Sequence key={s.file} from={toF(s.start)}>
          <Audio src={staticFile(`voice-cereri/${s.file}`)} />
        </Sequence>
      ))}

      {S.map((s, i) => {
        const from = toF(s.start) - 3;
        const until = i + 1 < S.length ? toF(S[i + 1].start) : CERERI_ILFOV_DURATION;
        return (
          <Sequence key={`c-${s.file}`} from={from} durationInFrames={until - from}>
            <Caption text={s.text} startF={0} durF={toF(s.duration)} />
          </Sequence>
        );
      })}

      {/* SFX rare: ding pe alertă, un whoosh spre screenshot, pop pe status și pe revendică */}
      <Sequence from={2}>
        <Audio src={staticFile('voice/sfx-ding.mp3')} volume={0.4} />
      </Sequence>
      <Sequence from={B1 - 6}>
        <Audio src={staticFile('voice/sfx-whoosh.mp3')} volume={0.3} />
      </Sequence>
      <Sequence from={B2 + 4}>
        <Audio src={staticFile('voice/sfx-pop.mp3')} volume={0.45} />
      </Sequence>
      <Sequence from={toF(S[4].start) + 20}>
        <Audio src={staticFile('voice/sfx-pop.mp3')} volume={0.45} />
      </Sequence>
    </AbsoluteFill>
  );
};
