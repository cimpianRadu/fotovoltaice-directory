import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { base, brand, Caption, Footer, PhoneFrame, Rise, toF, useEnter, Timeline } from './lib';
import t1 from './timeline-lege1.json';
import t2 from './timeline-lege2.json';
import t3 from './timeline-lege3.json';

export const LEGE1_DURATION = toF(t1.total);
export const LEGE2_DURATION = toF(t2.total);
export const LEGE3_DURATION = toF(t3.total);

// --- piese comune -------------------------------------------------------

const Label: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = brand.primary,
}) => (
  <div style={{ ...base, fontSize: 42, color, textAlign: 'center', letterSpacing: 6 }}>
    {children}
  </div>
);

// Voce + captions + fade final, identice pentru toate cele 3 reels
const Track: React.FC<{ timeline: Timeline; dir: string; durF: number }> = ({
  timeline,
  dir,
  durF,
}) => {
  const S = timeline.sentences;
  return (
    <>
      {S.map((s) => (
        <Sequence key={s.file} from={toF(s.start)}>
          <Audio src={staticFile(`${dir}/${s.file}`)} />
        </Sequence>
      ))}
      {S.map((s, i) => {
        const from = toF(s.start) - 3;
        const until = i + 1 < S.length ? toF(S[i + 1].start) : durF;
        return (
          <Sequence key={`c-${s.file}`} from={from} durationInFrames={until - from}>
            <Caption text={s.text} startF={0} durF={toF(s.duration)} />
          </Sequence>
        );
      })}
    </>
  );
};

// Scena de CTA, aceeași în toate reels (varianta de titlu diferă)
const SceneCta: React.FC<{ title: React.ReactNode }> = ({ title }) => {
  const btnP = useEnter(20, 14);
  return (
    <AbsoluteFill style={{ background: brand.primary, padding: '0 80px', justifyContent: 'center' }}>
      <Rise delay={0}>
        <div style={{ ...base, fontSize: 78, color: brand.dark, textAlign: 'center', lineHeight: 1.14 }}>
          {title}
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
          marginTop: 56,
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
        <div style={{ ...base, fontSize: 38, color: brand.deep, textAlign: 'center', marginTop: 38 }}>
          183 firme verificate · 34 județe
        </div>
        <div
          style={{
            ...base,
            fontSize: 34,
            color: brand.deep,
            textAlign: 'center',
            marginTop: 16,
            opacity: 0.8,
          }}
        >
          Linkul e în comentariul fixat ↓
        </div>
      </Rise>
    </AbsoluteFill>
  );
};

const Shell: React.FC<{ durF: number; children: React.ReactNode }> = ({ durF, children }) => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [durF - 12, durF], [1, 0], { extrapolateLeft: 'clamp' });
  return <AbsoluteFill style={{ background: brand.dark, opacity: fadeOut }}>{children}</AbsoluteFill>;
};

// =========================================================================
// REEL 1 — hot news: legea a intrat în vigoare + compensare lunară
// =========================================================================

const S1 = t1.sentences;
const R1_B = toF(S1[2].start) - 4; // scena „lunar"
const R1_C = toF(S1[3].start) - 4; // scena „contracte existente"
const R1_D = toF(S1[4].start) - 4; // CTA

const R1Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const badgeP = useEnter(4, 14);
  const pulse = 1 + Math.sin(frame / 7) * 0.012;
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
      <Rise delay={toF(S1[1].start - S1[0].start)}>
        <div style={{ ...base, fontSize: 36, color: '#8fa3bd', marginTop: 26, textAlign: 'center' }}>
          Monitorul Oficial nr. 603 / 23 iulie 2026
        </div>
      </Rise>
      <Footer />
    </AbsoluteFill>
  );
};

const R1Lunar: React.FC = () => {
  const strike = interpolate(useCurrentFrame(), [26, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ background: brand.dark, padding: '0 80px', justifyContent: 'center' }}>
      <Rise delay={0}>
        <Label>CEA MAI MARE SCHIMBARE</Label>
      </Rise>
      <Rise delay={10}>
        <div style={{ position: 'relative', alignSelf: 'center', marginTop: 60 }}>
          <div style={{ ...base, fontSize: 72, color: '#8fa3bd', textAlign: 'center' }}>
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
            fontSize: 124,
            color: brand.primary,
            textAlign: 'center',
            marginTop: 56,
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
            marginTop: 50,
            border: `3px solid ${brand.primary}`,
            borderRadius: 20,
            padding: '20px 38px',
            ...base,
            fontSize: 46,
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

const R1Automat: React.FC = () => (
  <AbsoluteFill style={{ background: brand.light, padding: '0 80px', justifyContent: 'center' }}>
    <Rise delay={0}>
      <div style={{ fontSize: 96, textAlign: 'center' }}>✅</div>
      <div
        style={{
          ...base,
          fontSize: 66,
          color: brand.dark,
          textAlign: 'center',
          marginTop: 30,
          lineHeight: 1.16,
        }}
      >
        Ai deja contract
        <br />
        de prosumator?
      </div>
    </Rise>
    <Rise delay={20}>
      <div
        style={{
          ...base,
          fontSize: 52,
          color: brand.primary,
          textAlign: 'center',
          marginTop: 44,
          lineHeight: 1.25,
        }}
      >
        Noile reguli se aplică
        <br />
        automat, fără cerere
      </div>
    </Rise>
    <Footer />
  </AbsoluteFill>
);

export const Lege1: React.FC = () => (
  <Shell durF={LEGE1_DURATION}>
    <Sequence durationInFrames={R1_B}>
      <R1Hero />
    </Sequence>
    <Sequence from={R1_B} durationInFrames={R1_C - R1_B}>
      <R1Lunar />
    </Sequence>
    <Sequence from={R1_C} durationInFrames={R1_D - R1_C}>
      <R1Automat />
    </Sequence>
    <Sequence from={R1_D}>
      <SceneCta
        title={
          <>
            Ai un proiect
            <br />
            fotovoltaic?
          </>
        }
      />
    </Sequence>
    <Track timeline={t1} dir="voice-lege1" durF={LEGE1_DURATION} />
    <Sequence from={2}>
      <Audio src={staticFile('voice/sfx-ding.mp3')} volume={0.4} />
    </Sequence>
    <Sequence from={R1_B - 6}>
      <Audio src={staticFile('voice/sfx-whoosh.mp3')} volume={0.3} />
    </Sequence>
    <Sequence from={R1_C + 6}>
      <Audio src={staticFile('voice/sfx-pop.mp3')} volume={0.45} />
    </Sequence>
  </Shell>
);

// =========================================================================
// REEL 2 — PF ≤ 27 kW: plata gazului din surplus
// =========================================================================

const S2 = t2.sentences;
const R2_B = toF(S2[2].start) - 4; // condiția furnizor
const R2_C = toF(S2[3].start) - 4; // alegerea destinației
const R2_D = toF(S2[4].start) - 4; // CTA

const R2Hero: React.FC = () => {
  const arrow = useEnter(34, 16);
  return (
    <AbsoluteFill style={{ background: brand.deep, padding: '0 70px', justifyContent: 'center' }}>
      <Rise delay={2}>
        <Label>NOU DIN 26 IULIE</Label>
        <div
          style={{
            ...base,
            fontSize: 84,
            color: brand.light,
            textAlign: 'center',
            marginTop: 34,
            lineHeight: 1.12,
          }}
        >
          Plătești gazul
          <br />
          din surplusul PV
        </div>
      </Rise>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 26,
          marginTop: 70,
        }}
      >
        <Rise delay={20}>
          <div
            style={{
              background: brand.primary,
              borderRadius: 28,
              padding: '34px 26px',
              width: 310,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 72 }}>☀️</div>
            <div style={{ ...base, fontSize: 38, color: brand.deep, marginTop: 12 }}>surplus PV</div>
          </div>
        </Rise>
        <div style={{ ...base, fontSize: 72, color: brand.light, opacity: arrow }}>→</div>
        <Rise delay={46}>
          <div
            style={{
              background: brand.light,
              borderRadius: 28,
              padding: '34px 26px',
              width: 310,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 72 }}>🔥</div>
            <div style={{ ...base, fontSize: 38, color: brand.dark, marginTop: 12 }}>
              factura de gaz
            </div>
          </div>
        </Rise>
      </div>
      <Rise delay={toF(S2[1].start - S2[0].start)}>
        <div
          style={{
            ...base,
            fontSize: 50,
            color: brand.primary,
            textAlign: 'center',
            marginTop: 66,
            lineHeight: 1.25,
          }}
        >
          persoane fizice,
          <br />
          sisteme de cel mult 27 kW
        </div>
      </Rise>
      <Footer />
    </AbsoluteFill>
  );
};

const R2Conditie: React.FC = () => (
  <AbsoluteFill style={{ background: brand.light, padding: '0 80px', justifyContent: 'center' }}>
    <Rise delay={0}>
      <Label color={brand.dark}>O SINGURĂ CONDIȚIE</Label>
    </Rise>
    <Rise delay={12}>
      <div
        style={{
          ...base,
          fontSize: 74,
          color: brand.dark,
          textAlign: 'center',
          marginTop: 46,
          lineHeight: 1.15,
        }}
      >
        curent și gaz
        <br />
        de la <span style={{ color: brand.primary }}>același furnizor</span>
      </div>
    </Rise>
    <Rise delay={30}>
      <div
        style={{
          alignSelf: 'center',
          marginTop: 60,
          background: brand.dark,
          borderRadius: 24,
          padding: '26px 38px',
          ...base,
          fontSize: 42,
          color: brand.light,
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        verifică pe factură dacă
        <br />
        furnizorul tău vinde ambele
      </div>
    </Rise>
    <Footer />
  </AbsoluteFill>
);

const R2Optiune: React.FC = () => (
  <AbsoluteFill style={{ background: brand.dark, padding: '0 80px', justifyContent: 'center' }}>
    <Rise delay={0}>
      <Label>ALEGI PRIN CONTRACT</Label>
    </Rise>
    <Rise delay={12}>
      <div
        style={{
          ...base,
          fontSize: 58,
          color: brand.light,
          textAlign: 'center',
          marginTop: 46,
          lineHeight: 1.3,
        }}
      >
        unde merg banii
        <br />
        din compensare
      </div>
    </Rise>
    <Rise delay={26}>
      <div
        style={{
          alignSelf: 'center',
          marginTop: 54,
          border: `3px solid ${brand.primary}`,
          borderRadius: 20,
          padding: '22px 40px',
          ...base,
          fontSize: 48,
          color: brand.primary,
        }}
      >
        minimum 12 luni
      </div>
    </Rise>
    <Footer />
  </AbsoluteFill>
);

export const Lege2: React.FC = () => (
  <Shell durF={LEGE2_DURATION}>
    <Sequence durationInFrames={R2_B}>
      <R2Hero />
    </Sequence>
    <Sequence from={R2_B} durationInFrames={R2_C - R2_B}>
      <R2Conditie />
    </Sequence>
    <Sequence from={R2_C} durationInFrames={R2_D - R2_C}>
      <R2Optiune />
    </Sequence>
    <Sequence from={R2_D}>
      <SceneCta
        title={
          <>
            Vrei panouri
            <br />
            pe casă?
          </>
        }
      />
    </Sequence>
    <Track timeline={t2} dir="voice-lege2" durF={LEGE2_DURATION} />
    <Sequence from={2}>
      <Audio src={staticFile('voice/sfx-ding.mp3')} volume={0.4} />
    </Sequence>
    <Sequence from={toF(S2[0].start) + 46}>
      <Audio src={staticFile('voice/sfx-chaching.mp3')} volume={0.35} />
    </Sequence>
    <Sequence from={R2_B - 6}>
      <Audio src={staticFile('voice/sfx-whoosh.mp3')} volume={0.3} />
    </Sequence>
    <Sequence from={R2_D + 20}>
      <Audio src={staticFile('voice/sfx-pop.mp3')} volume={0.45} />
    </Sequence>
  </Shell>
);

// =========================================================================
// REEL 3 — comercial: 200-400 kW, termen 2030, metodologia ANRE
// =========================================================================

const S3 = t3.sentences;
const R3_B = toF(S3[2].start) - 4; // 200-400 kW
const R3_C = toF(S3[3].start) - 4; // ANRE (+ avertisment)
const R3_D = toF(S3[5].start) - 4; // CTA

const R3Hero: React.FC = () => (
  <AbsoluteFill style={{ background: brand.deep, padding: '0 80px', justifyContent: 'center' }}>
    <Rise delay={2}>
      <Label>PENTRU FIRME</Label>
      <div
        style={{
          ...base,
          fontSize: 78,
          color: brand.light,
          textAlign: 'center',
          marginTop: 34,
          lineHeight: 1.14,
        }}
      >
        Legea 160/2026
        <br />
        schimbă și pragurile
      </div>
    </Rise>
    <Rise delay={toF(S3[1].start - S3[0].start)}>
      <div
        style={{
          alignSelf: 'center',
          marginTop: 70,
          background: brand.primary,
          borderRadius: 26,
          padding: '30px 40px',
          ...base,
          fontSize: 50,
          color: brand.deep,
          textAlign: 'center',
          lineHeight: 1.25,
        }}
      >
        compensare cantitativă
        <br />
        până în 200 kW
      </div>
      <div
        style={{
          ...base,
          fontSize: 46,
          color: brand.light,
          textAlign: 'center',
          marginTop: 44,
          lineHeight: 1.3,
        }}
      >
        se acordă până la
        <br />
        <span style={{ color: brand.primary }}>31 decembrie 2030</span>
      </div>
    </Rise>
    <Footer />
  </AbsoluteFill>
);

const R3Pzu: React.FC = () => (
  <AbsoluteFill style={{ background: brand.dark, padding: '0 80px', justifyContent: 'center' }}>
    <Rise delay={0}>
      <Label>200 – 400 kW</Label>
    </Rise>
    <Rise delay={12}>
      <div
        style={{
          ...base,
          fontSize: 68,
          color: brand.light,
          textAlign: 'center',
          marginTop: 40,
          lineHeight: 1.2,
        }}
      >
        regularizare
        <br />
        financiară
      </div>
    </Rise>
    <Rise delay={34}>
      <div
        style={{
          alignSelf: 'center',
          marginTop: 56,
          background: brand.primary,
          borderRadius: 26,
          padding: '30px 40px',
          ...base,
          fontSize: 48,
          color: brand.deep,
          textAlign: 'center',
          lineHeight: 1.25,
        }}
      >
        preț mediu ponderat PZU
      </div>
      <div
        style={{
          ...base,
          fontSize: 42,
          color: '#8fa3bd',
          textAlign: 'center',
          marginTop: 40,
          lineHeight: 1.3,
        }}
      >
        din luna în care
        <br />
        ai produs energia
      </div>
    </Rise>
    <Footer />
  </AbsoluteFill>
);

const R3Anre: React.FC = () => (
  <AbsoluteFill style={{ background: brand.light, padding: '0 80px', justifyContent: 'center' }}>
    <Rise delay={0}>
      <Label color={brand.dark}>MAI LIPSEȘTE UN PAS</Label>
      <div
        style={{
          ...base,
          fontSize: 72,
          color: brand.dark,
          textAlign: 'center',
          marginTop: 34,
          lineHeight: 1.15,
        }}
      >
        metodologia ANRE
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
            fontSize: 46,
            color: brand.dark,
          }}
        >
          termen: 24 septembrie
        </div>
      </div>
    </Rise>
    <Rise delay={toF(S3[4].start - S3[3].start)}>
      <div
        style={{
          alignSelf: 'center',
          marginTop: 64,
          background: brand.dark,
          borderRadius: 24,
          padding: '28px 38px',
          ...base,
          fontSize: 44,
          color: brand.light,
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        până atunci, nu semna
        <br />
        acte adiționale grăbite
      </div>
    </Rise>
    <Footer />
  </AbsoluteFill>
);

export const Lege3: React.FC = () => (
  <Shell durF={LEGE3_DURATION}>
    <Sequence durationInFrames={R3_B}>
      <R3Hero />
    </Sequence>
    <Sequence from={R3_B} durationInFrames={R3_C - R3_B}>
      <R3Pzu />
    </Sequence>
    <Sequence from={R3_C} durationInFrames={R3_D - R3_C}>
      <R3Anre />
    </Sequence>
    <Sequence from={R3_D}>
      <SceneCta
        title={
          <>
            Pui panouri
            <br />
            anul acesta?
          </>
        }
      />
    </Sequence>
    <Track timeline={t3} dir="voice-lege3" durF={LEGE3_DURATION} />
    <Sequence from={2}>
      <Audio src={staticFile('voice/sfx-ding.mp3')} volume={0.4} />
    </Sequence>
    <Sequence from={R3_B - 6}>
      <Audio src={staticFile('voice/sfx-whoosh.mp3')} volume={0.3} />
    </Sequence>
    <Sequence from={R3_C + 8}>
      <Audio src={staticFile('voice/sfx-ticks.mp3')} volume={0.3} />
    </Sequence>
    <Sequence from={R3_D + 20}>
      <Audio src={staticFile('voice/sfx-pop.mp3')} volume={0.45} />
    </Sequence>
  </Shell>
);
