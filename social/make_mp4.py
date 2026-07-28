"""Genereaza reel.mp4 dintr-un folder cu slide-uri native 1080x1920.

Durate: hook 3s, slide-uri de continut 4.5s, CTA 4s (decizia 2026-07-08:
durata per slide controlata local, nu de slideshow-ul FB blocat la 2s/cadru).
Track audio silentios AAC pentru compatibilitate FB.

Ruleaza: python3 make_mp4.py <folder> [<folder> ...]
"""
import subprocess
import sys
import tempfile
from pathlib import Path

HOOK_S, BODY_S, CTA_S = 3.0, 4.5, 4.0


def build(folder: Path):
    slides = sorted(folder.glob("slide-*.png"))
    if len(slides) < 2:
        print(f"!! {folder.name}: prea putine slide-uri, sar")
        return
    durations = [HOOK_S] + [BODY_S] * (len(slides) - 2) + [CTA_S]
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
        for slide, dur in zip(slides, durations):
            f.write(f"file '{slide.resolve()}'\nduration {dur}\n")
        # concat demuxer cere ultimul fisier repetat ca sa aplice durata finala
        f.write(f"file '{slides[-1].resolve()}'\n")
        concat_list = f.name
    out = folder / "reel.mp4"
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", concat_list,
        "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
        "-shortest",
        "-vf", "fps=30,format=yuv420p",
        "-c:v", "libx264", "-preset", "slow", "-crf", "18",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        str(out),
    ], check=True, capture_output=True)
    total = sum(durations)
    print(f"OK {folder.name}: {len(slides)} slide-uri, {total:.1f}s -> {out.name}")


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        build(Path(arg))
