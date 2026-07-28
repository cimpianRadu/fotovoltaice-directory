import { Composition } from 'remotion';
import { Reel10, REEL10_DURATION, FPS } from './Reel10';
import { Reel10Voice, REEL10_VOICE_DURATION } from './Reel10Voice';
import { CereriIlfov, CERERI_ILFOV_DURATION } from './CereriIlfov';
import { Lege160, LEGE160_DURATION } from './Lege160';
import { Lege1, Lege2, Lege3, LEGE1_DURATION, LEGE2_DURATION, LEGE3_DURATION } from './LegeSerie';

export const Root = () => (
  <>
    <Composition
      id="Reel10"
      component={Reel10}
      durationInFrames={REEL10_DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="Reel10Voice"
      component={Reel10Voice}
      durationInFrames={REEL10_VOICE_DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="CereriIlfov"
      component={CereriIlfov}
      durationInFrames={CERERI_ILFOV_DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="Lege160"
      component={Lege160}
      durationInFrames={LEGE160_DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="Lege1"
      component={Lege1}
      durationInFrames={LEGE1_DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="Lege2"
      component={Lege2}
      durationInFrames={LEGE2_DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="Lege3"
      component={Lege3}
      durationInFrames={LEGE3_DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  </>
);
