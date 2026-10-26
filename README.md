# Glass Player

A small Windows desktop app with a liquid-glass look that shows word-synced lyrics for whatever is playing in the Spotify desktop app. It also lets you browse your Spotify playlists and start songs from them.

Personal, non-commercial project. Built with Electron.

## What it does
- Signs in to Spotify (PKCE, no server) and lists your playlists and Liked Songs.
- Controls the Spotify app on the same PC (play, pause, skip, seek, volume). Playback control needs Spotify Premium.
- Shows lyrics word by word, using the [Spicy Lyrics API](https://developers.spicylyrics.org) when you add your own key, and line-synced lyrics from [LRCLIB](https://lrclib.net) otherwise.

## Lyrics attribution
Lyrics are fetched on demand and shown only inside the app. Nothing is republished or stored on disk. The app always names the provider and, for community syncs, links the uploader and maker as the Spicy Lyrics terms require.

## Run it
1. Install [Node.js LTS](https://nodejs.org).
2. In your Spotify developer app, add the redirect URI `http://127.0.0.1:8888/callback`.
3. Double-click `start.bat` (or `build.bat` to make `dist\Glass Player.exe`).
4. Paste your own Spotify Client ID and Spicy Lyrics key on first launch. They are stored encrypted on your PC, never in this folder.

Tip: press `[` or `]` to shift lyric timing by 50 ms.
