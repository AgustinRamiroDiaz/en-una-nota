# Spotify Playlist Player

A React web application that lets you play songs from any Spotify playlist using your Spotify Premium account.

## Features

- 🎵 Load any Spotify playlist by URL
- ▶️ Full-length playback (not just 30-second previews)
- 🎮 Play/pause controls for each track
- 🔐 Secure OAuth 2.0 authentication with PKCE
- 📱 Responsive design for mobile and desktop
- 🎨 Spotify-themed UI

## Requirements

- **Spotify Premium Account** (required for full playback)
- Node.js and npm installed
- Spotify Developer App credentials

## Setup

### 1. Spotify Developer Account Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the app name and description
5. Add the following Redirect URI in app settings:
   ```
   http://localhost:3000/callback
   ```
6. Copy your **Client ID**

### 2. Environment Configuration

1. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

2. Add your Spotify Client ID to `.env`:
   ```
   REACT_APP_SPOTIFY_CLIENT_ID=your_client_id_here
   REACT_APP_REDIRECT_URI=http://localhost:3000/callback
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the App

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## How to Use

1. **Login**: Click "Login with Spotify" and authorize the app
2. **Get Playlist URL**:
   - Open Spotify (web or app)
   - Navigate to any playlist
   - Click Share → Copy link to playlist
3. **Load Playlist**: Paste the URL and click "Load Playlist"
4. **Play Music**: Click the play button on any track to start playback

## Supported URL Formats

- `https://open.spotify.com/playlist/{playlist_id}`
- `https://open.spotify.com/playlist/{playlist_id}?si=...`
- `spotify:playlist:{playlist_id}`

## API Scopes Used

- `user-top-read` - Read top tracks
- `playlist-read-private` - Read private playlists
- `playlist-read-collaborative` - Read collaborative playlists
- `streaming` - Control playback (Premium required)
- `user-read-playback-state` - Read playback state
- `user-modify-playback-state` - Modify playback state

## Technology Stack

- React 19
- Spotify Web API
- Spotify Web Playback SDK (for Premium playback)
- OAuth 2.0 with PKCE
- HTML5 Audio API (fallback for previews)

## Important Notes

- **Spotify Premium is required** for full-length playback
- Free accounts will only get 30-second previews (if available)
- Not all tracks have preview URLs available
- Preview availability varies by region and licensing

## Troubleshooting

### Authentication Issues

If you get "Code verifier not found" error:
1. Clear browser localStorage
2. Refresh the page
3. Try logging in again

### Playlist Not Loading

- Ensure the playlist URL is correct
- Check that the playlist is public or you have access
- Verify your access token hasn't expired (logout and login again)

## Development

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Available Scripts

- `npm start` - Run development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App (irreversible)

## License

MIT

## Contributing

Feel free to submit issues and pull requests!
