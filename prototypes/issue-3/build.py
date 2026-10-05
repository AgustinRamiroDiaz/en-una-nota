"""Static mockups of the issue #3 proposals, styled with the app's real App.css."""

from pathlib import Path

ROOT = Path(__file__).parent

PLAY = '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>'
PAUSE = '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4.5h4.5v15H6zM13.5 4.5H18v15h-4.5z"/></svg>'
PLAY_SM = PLAY.replace('width="30" height="30"', 'width="22" height="22"')
PAUSE_SM = PAUSE.replace('width="30" height="30"', 'width="22" height="22"')
NEXT_SM = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4.5v15l10-7.5zM16 4.5h3v15h-3z"/></svg>'
SEARCH = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
GEAR = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'


def topbar() -> str:
    return f"""
<header class="topbar">
  <div class="topbar-titles">
    <h1 class="brand">En Una Nota</h1>
    <p class="topbar-sub"><b>Rock Nacional Esencial</b> on En Una Nota Player</p>
  </div>
  <div class="topbar-actions">
    <button class="nb-icon">{SEARCH}</button>
    <div class="profile-menu"><button class="nb-icon nb-icon--yellow profile-button"><span class="profile-initial">A</span></button></div>
  </div>
</header>"""


def stage(revealed: bool) -> str:
    if revealed:
        cover = '<button class="cover is-shown" disabled><span class="cover-q">♪</span><span class="cover-hint">Canción Animal</span></button>'
        song = '<button class="answer is-shown" disabled><span class="answer-key">Song</span><span class="answer-value">De música ligera</span></button>'
        artist = '<button class="answer is-shown" disabled><span class="answer-key">Artist</span><span class="answer-value">Soda Stereo</span></button>'
    else:
        cover = '<button class="cover is-hidden"><span class="cover-q">?</span><span class="cover-hint">Album</span></button>'
        song = '<button class="answer is-hidden"><span class="answer-key">Song</span><span class="answer-value">Tap to reveal</span></button>'
        artist = '<button class="answer is-hidden"><span class="answer-key">Artist</span><span class="answer-value">Tap to reveal</span></button>'
    return f"""
<section class="stage">
  <div class="round"><span class="round-label">Song</span><span class="round-num">7</span></div>
  {cover}
  <div class="answers">{song}{artist}</div>
  <div class="seek"><span class="seek-time">0:01</span><input type="range" class="nb-range nb-range--thin" style="--fill:1%" value="1"><span class="seek-time">3:32</span></div>
</section>"""


SNIPPET = f"""
<div class="snippet-card nb-card">
  <div class="snippet-head"><label>Snippet length</label><output class="snippet-value">1.0s</output></div>
  <div class="snippet-row"><input type="range" class="nb-range" style="--fill:18%" min="100" max="5000" value="1000"><button class="nb-icon nb-icon--small">{GEAR}</button></div>
</div>"""

# A compact readout that stands in for the slider once it moves behind the gear.
SNIPPET_CHIP = f"""
<div class="chip nb-card"><span>Snippet</span><b>1.0s</b><button class="nb-icon nb-icon--small">{GEAR}</button></div>"""


def kbd(key: str) -> str:
    return f'<kbd>{key}</kbd>'


DECKS = {
    "baseline": f"""
<section class="deck">
  {SNIPPET}
  <div class="retry">
    <button class="nb-btn nb-btn--green">Replay</button><button class="nb-btn">+20%</button><button class="nb-btn">+50%</button><button class="nb-btn">+100%</button>
  </div>
  <div class="transport">
    <button class="nb-btn">Reveal All</button>
    <button class="nb-btn nb-btn--yellow play-button">{PLAY}</button>
    <button class="nb-btn nb-btn--blue">Next Song</button>
  </div>
</section>""",
    "option-1": f"""
<section class="deck">
  <div class="secondary">
    {SNIPPET_CHIP}
    <button class="nb-icon nb-icon--yellow" aria-label="Play">{PLAY_SM}</button>
    <button class="nb-icon" aria-label="Next">{NEXT_SM}</button>
  </div>
  <button class="nb-btn reveal-wide">Reveal All</button>
  <div class="retry-grid">
    <button class="nb-btn nb-btn--green">Replay</button><button class="nb-btn nb-btn--yellow">+20%</button>
    <button class="nb-btn nb-btn--yellow">+50%</button><button class="nb-btn nb-btn--yellow">+100%</button>
  </div>
</section>""",
    "option-2": f"""
<section class="deck">
  <div class="secondary">
    {SNIPPET_CHIP}
    <button class="nb-icon nb-icon--yellow" aria-label="Play">{PLAY_SM}</button>
    <button class="nb-icon" aria-label="Next">{NEXT_SM}</button>
  </div>
  <button class="nb-btn reveal-wide">Reveal All</button>
  <div class="step" role="radiogroup"><span class="step-label">Step</span>
    <button>=</button><button>+20</button><button class="on">+50</button><button>+100</button>
  </div>
  <button class="nb-btn nb-btn--green mega">Replay +50%<small>1.0s → 1.5s</small></button>
</section>""",
    "option-3-before": f"""
<section class="deck">
  <div class="secondary">
    {SNIPPET_CHIP}
    <button class="nb-icon nb-icon--yellow" aria-label="Play">{PLAY_SM}</button>
    <button class="nb-icon" aria-label="Next">{NEXT_SM}</button>
  </div>
  <button class="nb-btn reveal-wide">Reveal All</button>
  <div class="retry-grid">
    <button class="nb-btn nb-btn--green">Replay</button><button class="nb-btn nb-btn--yellow">+20%</button>
    <button class="nb-btn nb-btn--yellow">+50%</button><button class="nb-btn nb-btn--yellow">+100%</button>
  </div>
</section>""",
    "option-3-after": f"""
<section class="deck">
  <div class="retry retry--small">
    <button class="nb-btn nb-btn--green">Replay</button><button class="nb-btn">+20%</button><button class="nb-btn">+50%</button><button class="nb-btn">+100%</button>
  </div>
  <div class="after">
    <button class="nb-btn nb-btn--yellow big">{PAUSE}<span>Pause</span></button>
    <button class="nb-btn nb-btn--blue big">Next Song →</button>
  </div>
</section>""",
    "option-4": f"""
<section class="deck">
  {SNIPPET}
  <div class="retry">
    <button class="nb-btn nb-btn--green">Replay{kbd('Space')}</button><button class="nb-btn">+20%{kbd('1')}</button><button class="nb-btn">+50%{kbd('2')}</button><button class="nb-btn">+100%{kbd('3')}</button>
  </div>
  <div class="transport">
    <button class="nb-btn">Reveal All{kbd('R')}</button>
    <button class="nb-btn nb-btn--yellow play-button">{PLAY}{kbd('P')}</button>
    <button class="nb-btn nb-btn--blue">Next Song{kbd('N')}</button>
  </div>
  <p class="shortcut-hint">Press {kbd('?')} for keyboard shortcuts</p>
</section>""",
}

EXTRA_CSS = """
body { margin: 0; }
button { cursor: default; }
.secondary { display: flex; align-items: center; gap: 10px; }
.chip { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 6px 6px 6px 14px; font-weight: 700; box-shadow: var(--shadow-sm); }
.chip b { font-family: var(--display); font-weight: 400; font-size: 20px; margin-left: auto; }
.reveal-wide { width: 100%; min-height: 52px; }
.retry-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.retry-grid .nb-btn { min-height: 76px; font-family: var(--display); font-weight: 400; font-size: 24px; }
.retry-grid .nb-btn--green { font-family: var(--body); font-weight: 800; }
.step { display: grid; grid-template-columns: auto repeat(4, 1fr); align-items: center; gap: 8px; }
.step-label { font-weight: 700; font-size: 15px; padding-right: 4px; }
.step button { min-height: 40px; border: var(--line); border-radius: 999px; background: var(--paper); font-family: var(--display); font-size: 15px; }
.step button.on { background: var(--ink); color: var(--paper); }
.deck .mega { width: 100%; min-height: 128px; flex-direction: column; gap: 2px; font-family: var(--display); font-weight: 400; font-size: 34px; }
.deck .mega small { font-family: var(--body); font-weight: 700; font-size: 16px; }
.retry--small .nb-btn { min-height: 40px; font-size: 14px; box-shadow: var(--shadow-sm); }
.after { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.after .big { min-height: 128px; flex-direction: column; font-family: var(--display); font-weight: 400; font-size: 22px; }
.nb-btn, .play-button { position: relative; }
kbd { position: absolute; top: -11px; right: -8px; min-width: 22px; padding: 2px 6px; border: 2px solid var(--ink); border-radius: 6px; background: var(--paper); color: var(--ink); font: 700 12px/1.2 var(--body); box-shadow: 2px 2px 0 var(--ink); }
.shortcut-hint kbd { position: static; display: inline-block; margin: 0 4px; }
.shortcut-hint { margin: 4px 0 0; text-align: center; font-weight: 600; }
"""

PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Issue #3: {name}</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../src/index.css">
<link rel="stylesheet" href="../../src/App.css">
<style>{css}</style>
</head>
<body>
<div class="App"><div class="dashboard">
{topbar}
{stage}
{deck}
</div></div>
</body>
</html>
"""


def main() -> None:
    for name, deck in DECKS.items():
        revealed = name == "option-3-after"
        html = PAGE.format(name=name, css=EXTRA_CSS, topbar=topbar(), stage=stage(revealed), deck=deck)
        (ROOT / f"{name}.html").write_text(html)


if __name__ == "__main__":
    main()
