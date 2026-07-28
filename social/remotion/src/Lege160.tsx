import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { base, brand, Caption, Footer, PhoneFrame, Rise, toF, useEnter } from './lib';
import timeline from './timeline-lege.json';

const S = timeline.sentences;
export const LEGE160_DURATION = toF(timeline.total);

// Granițele scenelor = start-urile propozițiilor (minus 4 frames)
// A = lege (s0+s1) / B = lunar (s2) / C = gaz (s3) / D = PZU (s4)
// E = automat + ANRE (s5+s6) / F = ghid (s7) / G = CTA (s8)
const B = toF(S[2].start) - 4;
const C = toF(S[3].start) - 4;
const D = toF(S[4].start) - 4;
const E = toF(S[5].start) - 4;
const F = toF(S[7].start) - 4;
const G = toF(S[8].start) - 4;

const Label: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = brand.primary,
}) => (
  <div style={{ ...base, fontSize: 42, color, textAlign: 'center', letterSpacing: 6 }}>
    {children}
  </div>
);

const SceneLege: React.FC = () => {
  const frame = useCurrentFrame();
  const badgeP = useEnter(4, 14);
  const pulse = 1 + Math.sin(frame / 7) * 0.012;
  return (
    <AbsoluteFill
      style={{ background: brand.deep, alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        style={{
          background: brand.primary,
          borderRadius: 999,
          padding: '16px 44px',
          transform: `scale(${badgeP})`,
          opacity: badgeP,
        }}
      >
        <span style={{ ...base, fontSize: 38, color: brand.deep, letterSpacing: 4 }}>
          ⚡ INTRAT ÎN VIGOARE
        </span>
      </div>
      <Rise delay={14}>
        <div
          style={{
            ...base,
            fontSize: 132,
            color: brand.light,
            textAlign: 'center',
            lineHeight: 1.02,
            marginTop: 56,
            transform: `scale(${pulse})`,
          }}
        >
          LEGEA
          <br />
          160/2026
        </div>
      </Rise>
      <Rise delay={26}>
        <div style={{ ...base, fontSize: 54, color: brand.primary, marginTop: 44, textAlign: 'center' }}>
          Prosumatori · din 26 iulie
        </div>
      </Rise>
      <Rise delay={40}>
        <div style={{ ...base, fontSize: 36, color: '#8fa3bd', marginTop: 26, textAlign: 'center' }}>
          Monitorul Oficial nr. 603 / 23 iulie 2026
        </div>
      </Rise>
      <Footer />
    </AbsoluteFill>
  );
};

const SceneLunar: React.FC = () => {
  const strike = interpolate(useCurrentFrame(), [26, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ background: brand.dark, padding: '0 80px', justifyContent: 'center' }}>
      <Rise delay={0}>
        <Label>SCHIMBAREA 1</Label>
      </Rise>
      <Rise delay={10}>
        <div style={{ position: 'relative', alignSelf: 'center', marginTop: 60 }}>
          <div style={{ ...base, fontSize: 76, color: '#8fa3bd', textAlign: 'center' }}>
            regularizare la 24 de luni
          </div>
          <div
            style={{
              position: 'absolute',
              top: '52%',
              left: 0,
              height: 8,
              width: `${strike * 100}%`,
              background: '#e05252',
              borderRadius: 4,
            }}
          />
        </div>
      </Rise>
      <Rise delay={38}>
        <div
          style={{
            ...base,
            fontSize: 128,
            color: brand.primary,
            textAlign: 'center',
            marginTop: 60,
            lineHeight: 1.05,
          }}
        >
          COMPENSARE
          <br />
          LUNARĂ
        </div>
      </Rise>
      <Rise delay={56}>
        <div
          style={{
            alignSelf: 'center',
            marginTop: 54,
            border: `3px solid ${brand.primary}`,
            borderRadius: 20,
            padding: '20px 38px',
            ...base,
            fontSize: 48,
            color: brand.light,
          }}
        >
          sisteme până în 200 kW
        </div>
      </Rise>
      <Footer />
    </AbsoluteFill>
  );
};

const SceneGaz: React.FC = () => {
  const arrow = useEnter(30, 16);
  return (
    <AbsoluteFill style={{ background: brand.light, padding: '0 80px', justifyContent: 'center' }}>
      <Rise delay={0}>
        <Label color={brand.dark}>SCHIMBAREA 2</Label>
      </Rise>
      <Rise delay={10}>
        <div
          style={{
            ...base,
            fontSize: 66,
            color: brand.dark,
            textAlign: 'center',
            marginTop: 44,
            lineHeight: 1.15,
          }}
        >
          Persoane fizice
          <br />
          <span style={{ color: brand.primary }}>sub 27 kW</span>
        </div>
      </Rise>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          marginTop: 70,
        }}
      >
        <Rise delay={18}>
          <div
            style={{
              background: brand.primary,
              borderRadius: 28,
              padding: '38px 30px',
              width: 320,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 76 }}>☀️</div>
            <div style={{ ...base, fontSize: 40, color: brand.deep, marginTop: 12 }}>
              surplus PV
            </div>
          </div>
        </Rise>
        <div style={{ ...base, fontSize: 72, color: brand.dark, opacity: arrow }}>→</div>
        <Rise delay={42}>
          <div
            style={{
              background: brand.dark,
              borderRadius: 28,
              padding: '38px 30px',
              width: 320,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 76 }}>🔥</div>
            <div style={{ ...base, fontSize: 40, color: brand.light, marginTop: 12 }}>
              factura de gaz
            </div>
          </div>
        </Rise>
      </div>
      <Rise delay={60}>
        <div
          style={{
            ...base,
            fontSize: 42,
            color: brand.muted,
            textAlign: 'center',
            marginTop: 60,
          }}
        >
          condiție: același furnizor pentru curent și gaz
        </div>
      </Rise>
      <Footer />
    </AbsoluteFill>
  );
};

const ScenePzu: React.FC = () => (
  <AbsoluteFill style={{ background: brand.deep, padding: '0 80px', justifyContent: 'center' }}>
    <Rise delay={0}>
      <Label>SEGMENT COMERCIAL</Label>
    </Rise>
    <Rise delay={10}>
      <div
        style={{
          ...base,
          fontSize: 118,
          color: brand.light,
          textAlign: 'center',
          marginTop: 44,
          lineHeight: 1.05,
        }}
      >
        200 – 400 kW
      </div>
    </Rise>
    <Rise delay={26}>
      <div
        style={{
          alignSelf: 'center',
          marginTop: 60,
          background: brand.primary,
          borderRadius: 26,
          padding: '32px 40px',
          ...base,
          fontSize: 52,
          color: brand.deep,
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        preț mediu ponderat PZU
      </div>
    </Rise>
    <Rise delay={46}>
      <div
        style={{
          ...base,
          fontSize: 44,
          color: '#8fa3bd',
          textAlign: 'center',
          marginTop: 46,
          lineHeight: 1.3,
        }}
      >
        din luna în care ai produs energia,
        <br />
        plus regularizare financiară
      </div>
    </Rise>
    <Footer />
  </AbsoluteFill>
);

const SceneAnre: React.FC = () => {
  const check = useEnter(8, 14);
  return (
    <AbsoluteFill style={{ background: brand.dark, padding: '0 80px', justifyContent: 'center' }}>
      <div
        style={{
          alignSelf: 'center',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          background: 'rgba(250,250,249,0.08)',
          borderRadius: 26,
          padding: '30px 38px',
          opacity: check,
          transform: `translateY(${(1 - check) * 40}px)`,
        }}
      >
        <span style={{ fontSize: 56 }}>✅</span>
        <span style={{ ...base, fontSize: 46, color: brand.light, lineHeight: 1.25 }}>
          Contractele existente
          <br />
          intră automat pe noile reguli
        </span>
      </div>
      <Rise delay={toF(S[6].start - S[5].start)}>
        <div
          style={{
            ...base,
            fontSize: 44,
            color: brand.primary,
            textAlign: 'center',
            marginTop: 80,
            letterSpacing: 4,
          }}
        >
          MAI LIPSEȘTE
        </div>
        <div
          style={{
            ...base,
            fontSize: 82,
            color: brand.light,
            textAlign: 'center',
            marginTop: 22,
            lineHeight: 1.12,
          }}
        >
          metodologia
          <br />
          ANRE
        </div>
        <div
          style={{
            alignSelf: 'center',
            marginTop: 40,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              border: `3px solid ${brand.primary}`,
              borderRadius: 20,
              padding: '18px 34px',
              ...base,
              fontSize: 44,
              color: brand.primary,
            }}
          >
            termen: finalul lui septembrie
          </div>
        </div>
      </Rise>
      <Footer />
    </AbsoluteFill>
  );
};

const SceneGhid: React.FC = () => (
  <AbsoluteFill style={{ background: brand.light, alignItems: 'center', paddingTop: 100 }}>
    <Rise delay={0}>
      <div
        style={{
          ...base,
          fontSize: 54,
          color: brand.dark,
          textAlign: 'center',
          lineHeight: 1.2,
          padding: '0 60px',
        }}
      >
        Ghidul complet, cu <span style={{ color: brand.primary }}>citate din lege</span>
      </div>
    </Rise>
    <div style={{ marginTop: 40 }}>
      <PhoneFrame
        src={staticFile('screenshot-lege.png')}
        durF={toF(S[7].duration) + 40}
        height={1230}
      />
    </div>
    <Footer />
  </AbsoluteFill>
);

const SceneCta: React.FC = () => {
  const btnP = useEnter(20, 14);
  return (
    <AbsoluteFill style={{ background: brand.primary, padding: '0 80px', justifyContent: 'center' }}>
      <Rise delay={0}>
        <div
          style={{
            ...base,
            fontSize: 78,
            color: brand.dark,
            textAlign: 'center',
            lineHeight: 1.14,
          }}
        >
          Ai un proiect
          <br />
          fotovoltaic?
        </div>
      </Rise>
      <Rise delay={14}>
        <div
          style={{
            ...base,
            fontSize: 46,
            color: brand.deep,
            textAlign: 'center',
            marginTop: 40,
            lineHeight: 1.3,
          }}
        >
          Lasă o cerere și o trimitem
          <br />
          instalatorilor verificați
        </div>
      </Rise>
      <div
        style={{
          alignSelf: 'center',
          marginTop: 60,
          background: brand.dark,
          borderRadius: 60,
          padding: '32px 58px',
          transform: `scale(${0.7 + btnP * 0.3})`,
          opacity: btnP,
        }}
      >
        <span style={{ ...base, fontSize: 42, color: brand.light }}>
          {brand.wordmark}/cere-oferta
        </span>
      </div>
      <Rise delay={38}>
        <div style={{ ...base, fontSize: 38, color: brand.deep, textAlign: 'center', marginTop: 40 }}>
          183 firme verificate · 34 județe
        </div>
        <div style={{ ...base, fontSize: 34, color: brand.deep, textAlign: 'center', marginTop: 18, opacity: 0.8 }}>
          Linkul e în comentariul fixat ↓
        </div>
      </Rise>
    </AbsoluteFill>
  );
};

export const Lege160: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [LEGE160_DURATION - 12, LEGE160_DURATION], [1, 0], {
    extrapolateLeft: 'clamp',
  });
  return (
    <AbsoluteFill style={{ background: brand.dark, opacity: fadeOut }}>
      <Sequence durationInFrames={B}>
        <SceneLege />
      </Sequence>
      <Sequence from={B} durationInFrames={C - B}>
        <SceneLunar />
      </Sequence>
      <Sequence from={C} durationInFrames={D - C}>
        <SceneGaz />
      </Sequence>
      <Sequence from={D} durationInFrames={E - D}>
        <ScenePzu />
      </Sequence>
      <Sequence from={E} durationInFrames={F - E}>
        <SceneAnre />
      </Sequence>
      <Sequence from={F} durationInFrames={G - F}>
        <SceneGhid />
      </Sequence>
      <Sequence from={G}>
        <SceneCta />
      </Sequence>

      {S.map((s) => (
        <Sequence key={s.file} from={toF(s.start)}>
          <Audio src={staticFile(`voice-lege/${s.file}`)} />
        </Sequence>
      ))}

      {S.map((s, i) => {
        const from = toF(s.start) - 3;
        const until = i + 1 < S.length ? toF(S[i + 1].start) : LEGE160_DURATION;
        return (
          <Sequence key={`c-${s.file}`} from={from} durationInFrames={until - from}>
            <Caption text={s.text} startF={0} durF={toF(s.duration)} />
          </Sequence>
        );
      })}

      {/* SFX rare: ding pe hero, un singur whoosh spre schimbarea 1,
          ticks pe „24 luni" tăiat, cha-ching pe factura de gaz, pop pe CTA */}
      <Sequence from={2}>
        <Audio src={staticFile('voice/sfx-ding.mp3')} volume={0.4} />
      </Sequence>
      <Sequence from={B - 6}>
        <Audio src={staticFile('voice/sfx-whoosh.mp3')} volume={0.3} />
      </Sequence>
      <Sequence from={B + 30}>
        <Audio src={staticFile('voice/sfx-ticks.mp3')} volume={0.3} />
      </Sequence>
      <Sequence from={C + 42}>
        <Audio src={staticFile('voice/sfx-chaching.mp3')} volume={0.35} />
      </Sequence>
      <Sequence from={G + 20}>
        <Audio src={staticFile('voice/sfx-pop.mp3')} volume={0.45} />
      </Sequence>
    </AbsoluteFill>
  );
};
