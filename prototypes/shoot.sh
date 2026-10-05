#!/usr/bin/env bash
# Usage: ./shoot.sh stem...   -> shots/<stem>-mobile.png and shots/<stem>-desktop.png
cd "$(dirname "$0")"
for s in "$@"; do
  google-chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=390,844 --virtual-time-budget=5000 --screenshot=shots/$s-mobile.png "file://$PWD/$s.html" 2>/dev/null
  google-chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1440,900 --virtual-time-budget=5000 --screenshot=shots/$s-desktop.png "file://$PWD/$s.html" 2>/dev/null
done
