"""Render one HTML prototype per stylesheet in styles/, all sharing the same game-screen markup."""

from pathlib import Path

ROOT = Path(__file__).parent

# (file stem, display name, trend, Google Fonts query)
STYLES = [
    ("neo-pop", "Neo Pop", "Neobrutalism", "family=Archivo+Black&family=Archivo:wght@500;600;700"),
    ("neo-grid", "Neo Grid", "Neobrutalism", "family=Unbounded:wght@600;800&family=Space+Grotesk:wght@500;700"),
    ("neo-raw", "Neo Raw", "Neobrutalism", "family=Inter+Tight:wght@500;700;900"),
    ("bauhaus", "Bauhaus", "Bauhaus", "family=Jost:wght@400;500;700"),
    ("neumorphism", "Neumorphism", "Neumorphism", "family=Plus+Jakarta+Sans:wght@500;700;800"),
    ("retro-futurism", "Retro Futurism", "Retro Futurism", "family=Audiowide&family=Exo+2:wght@500;600;700"),
    ("glassmorphism", "Glassmorphism", "Glassmorphism", "family=Outfit:wght@400;500;700"),
    ("flat", "Flat", "Flat Design", "family=Figtree:wght@500;700;800"),
]

BASE_CSS = """
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; }
body { min-height: 100vh; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
button { font: inherit; color: inherit; cursor: pointer; border: 0; background: none; padding: 0; }
.bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.app { position: relative; z-index: 1; min-height: 100vh; max-width: 460px; margin: 0 auto; padding: 20px 20px 24px; display: flex; flex-direction: column; gap: 22px; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.titles { min-width: 0; }
.playlist { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
nav { display: flex; gap: 8px; flex: none; }
.icon { width: 42px; height: 42px; display: grid; place-items: center; }
.stage { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(150px, 1fr) auto; grid-template-areas: "round" "cover" "answers"; gap: 14px; }
.round { grid-area: round; display: flex; align-items: baseline; gap: 10px; }
.cover { grid-area: cover; position: relative; display: grid; place-items: center; overflow: hidden; text-align: center; }
.cover-q, .cover-hint { position: relative; z-index: 1; }
.cover-hint { position: absolute; left: 0; right: 0; bottom: 10px; }
.answers { grid-area: answers; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; min-width: 0; }
.answer { min-height: 76px; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; text-align: left; min-width: 0; padding: 8px 14px; }
.answer .v { overflow-wrap: anywhere; }
.shape { display: none; }
.deck { display: flex; flex-direction: column; gap: 14px; }
.snippet-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
input[type=range] { width: 100%; margin: 0; }
.retry { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.retry button { height: 46px; }
.transport { display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center; }
.transport .reveal, .transport .next { height: 56px; }
.play { width: 80px; height: 80px; display: grid; place-items: center; }
.play .i-pause, .play.is-playing .i-play { display: none; }
.play.is-playing .i-pause { display: block; }
@media (min-width: 880px) {
  .app { max-width: 1200px; padding: 36px 56px 44px; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); grid-template-rows: auto 1fr; column-gap: 64px; row-gap: 40px; }
  .top { grid-column: 1 / -1; }
  .stage { flex: none; grid-template-rows: auto 340px auto; align-self: center; }
  .answer { min-height: 104px; }
  .deck { align-self: center; margin: 0; gap: 20px; }
  .retry button { height: 60px; font-size: 18px; }
  .transport .reveal, .transport .next { height: 72px; font-size: 18px; }
  .play { width: 104px; height: 104px; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
"""

BODY = """
<div class="bg" aria-hidden="true"></div>
<main class="app">
  <header class="top">
    <div class="titles">
      <div class="brand">En Una Nota</div>
      <div class="playlist">Rock Nacional Esencial <span>on Pingüino</span></div>
    </div>
    <nav>
      <button class="icon search" aria-label="Search playlists"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>
      <button class="icon avatar" aria-label="Account">A</button>
    </nav>
  </header>

  <section class="stage">
    <div class="round"><span class="round-label">Song</span><span class="round-num">7</span></div>
    <button class="cover is-hidden" data-answer="Canción Animal" aria-label="Reveal album cover">
      <i class="shape s1"></i><i class="shape s2"></i><i class="shape s3"></i>
      <span class="cover-q">?</span><span class="cover-hint">Album</span>
    </button>
    <div class="answers">
      <button class="answer is-hidden" data-answer="De música ligera"><span class="k">Song</span><span class="v">Tap to reveal</span></button>
      <button class="answer is-shown" data-answer="Soda Stereo"><span class="k">Artist</span><span class="v">Soda Stereo</span></button>
    </div>
  </section>

  <section class="deck">
    <div class="snippet">
      <div class="snippet-head"><label for="len">Snippet length</label><output for="len">1.0s</output></div>
      <input id="len" type="range" min="100" max="5000" step="100" value="1000">
    </div>
    <div class="retry">
      <button data-grow="0" class="retry-same">Replay</button>
      <button data-grow="20">+20%</button>
      <button data-grow="50">+50%</button>
      <button data-grow="100">+100%</button>
    </div>
    <div class="transport">
      <button class="reveal">Reveal all</button>
      <button class="play" aria-label="Play">
        <svg class="i-play" width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>
        <svg class="i-pause" width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4.5h4.5v15H6zM13.5 4.5H18v15h-4.5z"/></svg>
      </button>
      <button class="next">Next song</button>
    </div>
  </section>
</main>
"""

SCRIPT = """
const len = document.getElementById('len');
const out = document.querySelector('.snippet output');
const sync = () => {
  const pct = (len.value - len.min) / (len.max - len.min) * 100;
  len.style.setProperty('--fill', pct + '%');
  out.textContent = (len.value / 1000).toFixed(1) + 's';
};
len.addEventListener('input', sync);
sync();

const reveal = (el) => {
  if (!el.classList.contains('is-hidden')) return;
  el.classList.replace('is-hidden', 'is-shown');
  if (el.classList.contains('cover')) {
    el.querySelector('.cover-q').textContent = '♪';
    el.querySelector('.cover-hint').textContent = el.dataset.answer;
  } else {
    el.querySelector('.v').textContent = el.dataset.answer;
  }
};
document.querySelectorAll('[data-answer]').forEach((el) => el.addEventListener('click', () => reveal(el)));

const play = document.querySelector('.play');
const setPlaying = (on) => { play.classList.toggle('is-playing', on); play.setAttribute('aria-label', on ? 'Pause' : 'Play'); };
play.addEventListener('click', () => setPlaying(!play.classList.contains('is-playing')));
document.querySelector('.reveal').addEventListener('click', () => {
  document.querySelectorAll('[data-answer]').forEach(reveal);
  setPlaying(true);
});
document.querySelectorAll('[data-grow]').forEach((b) => b.addEventListener('click', () => {
  const grow = Number(b.dataset.grow);
  len.value = Math.min(5000, Math.round(len.value * (1 + grow / 100) / 100) * 100);
  sync();
  setPlaying(true);
}));
"""

PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>En Una Nota: {name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?{fonts}&display=swap" rel="stylesheet">
<style>{base}</style>
<style>{css}</style>
</head>
<body class="{stem}">
{body}
<script>{script}</script>
</body>
</html>
"""

INDEX = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>En Una Nota: style prototypes</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@500;700&display=swap" rel="stylesheet">
<style>
  body {{ margin: 0; background: #EDEDED; font-family: 'Archivo', sans-serif; color: #000; }}
  header {{ padding: 32px 40px 8px; }}
  h1 {{ font-family: 'Archivo Black'; font-size: 40px; margin: 0 0 6px; }}
  p {{ margin: 0; font-size: 16px; }}
  .grid {{ display: flex; flex-wrap: wrap; gap: 40px 32px; padding: 32px 40px 60px; }}
  figure {{ margin: 0; }}
  iframe {{ width: 390px; height: 844px; border: 3px solid #000; border-radius: 28px; background: #fff; box-shadow: 6px 6px 0 #000; }}
  figcaption {{ margin-top: 14px; font-size: 15px; }}
  figcaption b {{ font-family: 'Archivo Black'; font-weight: 400; font-size: 20px; display: block; }}
  a {{ color: inherit; }}
</style>
</head>
<body>
<header><h1>En Una Nota, eight directions</h1><p>Each frame is interactive at phone width. Open a style on its own to see the desktop layout.</p></header>
<div class="grid">
{figures}
</div>
</body>
</html>
"""


def main() -> None:
    figures = []
    for stem, name, trend, fonts in STYLES:
        css_path = ROOT / "styles" / f"{stem}.css"
        if not css_path.exists():
            continue
        css = css_path.read_text()
        html = PAGE.format(name=name, fonts=fonts, base=BASE_CSS, css=css, stem=stem, body=BODY, script=SCRIPT)
        (ROOT / f"{stem}.html").write_text(html)
        figures.append(
            f'<figure><iframe src="{stem}.html" title="{name}"></iframe>'
            f'<figcaption><b>{name}</b>{trend} · <a href="{stem}.html">open full page</a></figcaption></figure>'
        )
    (ROOT / "index.html").write_text(INDEX.format(figures="\n".join(figures)))


if __name__ == "__main__":
    main()
