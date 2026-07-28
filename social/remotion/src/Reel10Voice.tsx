import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Geist';
import { Hook, Table, Concret, Cta, FPS } from './Reel10';
import timeline from './timeline.json';

const { fontFamily } = loadFont();

const AMBER = '#f59e0b';
const NAVY = '#1e3a5f';
const CREAM = '#fafaf9';

const toF = (sec: number) => Math.round(sec * FPS);
export const REEL10_VOICE_DURATION = toF(timeline.total);

const S = timeline.sentences;
const end = (i: number) => toF(S[i].start + S[i].duration);

// Granițele scenelor: Hook = s1+s2, Table = s3+s4, Concret = s5, CTA = s6+tail
const B1 = toF(S[2].start) - 4;
const B2 = toF(S[4].start) - 4;
const B3 = toF(S[5].start) - 4;

// Caption karaoke: cuvintele propoziției curente, cel activ evidențiat amber
const Caption: React.FC<{ text: string; startF: number; durF: number }> = ({ text, startF, durF }) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  // Highlight ponderat după lungimea cuvântului — cuvintele lungi durează mai
  // mult la rostire; împărțirea uniformă defaza sincronizarea.
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
          fontFamily,
          fontWeight: 700,
          fontSize: 40,
          lineHeight: 1.35,
          textAlign: 'center',
          background: 'rgba(22,42,70,0.92)',
          color: CREAM,
          borderRadius: 22,
          padding: '18px 28px',
          maxWidth: 940,
        }}
      >
        {words.map((w, i) => (
          <span
            key={i}
            style={{
              color: i === active ? AMBER : CREAM,
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

export const Reel10Voice: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [REEL10_VOICE_DURATION - 15, REEL10_VOICE_DURATION], [1, 0], {
    extrapolateLeft: 'clamp',
  });
  return (
    <AbsoluteFill style={{ fontFamily, background: NAVY, opacity: fadeOut }}>
      {/* scene retimate pe propozițiile narațiunii */}
      <Sequence durationInFrames={B1}>
        <Hook />
      </Sequence>
      <Sequence from={B1} durationInFrames={B2 - B1}>
        <Table />
      </Sequence>
      <Sequence from={B2} durationInFrames={B3 - B2}>
        <Concret />
      </Sequence>
      <Sequence from={B3}>
        <Cta />
      </Sequence>

      {/* narațiunea, propoziție cu propoziție */}
      {S.map((s) => (
        <Sequence key={s.file} from={toF(s.start)}>
          <Audio src={staticFile(`voice/${s.file}`)} />
        </Sequence>
      ))}

      {/* captions karaoke sincronizate pe fiecare propoziție */}
      {S.map((s, i) => {
        const from = toF(s.start) - 3;
        const until = i + 1 < S.length ? toF(S[i + 1].start) : REEL10_VOICE_DURATION;
        return (
          <Sequence key={`c-${s.file}`} from={from} durationInFrames={until - from}>
            <Caption text={s.text} startF={0} durF={toF(s.duration)} />
          </Sequence>
        );
      })}

      {/* SFX: variate și discrete — un singur whoosh, restul sunete punctuale */}
      {/* ding pe momentul „Depinde de județul tău" (hero pop) */}
      <Sequence from={toF(S[1].start)}>
        <Audio src={staticFile('voice/sfx-ding.mp3')} volume={0.4} />
      </Sequence>
      {/* singurul whoosh: intrarea în tabelul cu județe */}
      <Sequence from={B1 - 6}>
        <Audio src={staticFile('voice/sfx-whoosh.mp3')} volume={0.3} />
      </Sequence>
      {/* xilofon ascendent cât cresc barele */}
      <Sequence from={B1 + 18}>
        <Audio src={staticFile('voice/sfx-ticks.mp3')} volume={0.3} />
      </Sequence>
      {/* pop de notificare pe „Județul tău? scrie-l jos" */}
      <Sequence from={B1 + 94}>
        <Audio src={staticFile('voice/sfx-pop.mp3')} volume={0.45} />
      </Sequence>
      {/* cha-ching pe „peste o mie de kilowați oră diferență" */}
      <Sequence from={end(4) + 3}>
        <Audio src={staticFile('voice/sfx-chaching.mp3')} volume={0.5} />
      </Sequence>
      {/* pop pe „lasă județul tău într-un comentariu" */}
      <Sequence from={toF(S[5].start) + 45}>
        <Audio src={staticFile('voice/sfx-pop.mp3')} volume={0.45} />
      </Sequence>
    </AbsoluteFill>
  );
};
