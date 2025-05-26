# 🎵 YouTube Lyrics Extension

A browser extension that automatically displays the lyrics of a song when you're listening to music on YouTube. The goal is to create a lightweight, user-friendly tool that makes it easy to sing along or understand your favorite songs — without switching tabs or searching manually.

---

## 🌟 Key Features

- ✅ **Auto-detects song title** from the current YouTube video.
- ✅ **Fetches lyrics** from public sources like Genius.com.
- ✅ **Displays lyrics** in a styled sidebar on the right side of the YouTube video.
- ✅ **Non-intrusive UI**, styled to blend with YouTube's theme.
- ✅ **Toggle button** to hide/show the lyrics sidebar.
- ✅ **Automatically closes** when navigating back to the main YouTube page.
- ✅ **Filters song titles** to remove irrelevant terms like "Official Music Video" and "Lyrics."

---

## 📁 Project Structure

```
youtube-lyrics-extension/
│
├── manifest.json            # Extension config (for Chrome / Manifest V3)
├── content.js               # Injected script to read song title & update UI
├── lyrics_fetcher.js        # Fetches lyrics using API or web scraping
├── popup.html               # Optional popup UI when clicking extension icon
├── style.css                # Styles for embedded lyrics panel
└── icons/                   # Extension icon files
```

---

## 🛠️ Technologies Used

- **JavaScript** — for content scripts and API integration.
- **HTML/CSS** — for layout and display.
- **Manifest V3** — Chrome's current extension format.
- **Genius.com** — source of lyrics (via API).
- **YouTube DOM inspection** — to detect currently playing song title.
- **Render.com** - for backend deployment

---

## 🔍 How It Works

1.  When a user navigates to a YouTube video page, `content.js` is injected.
2.  The script parses the video title and channel name to identify the song and artist.
3.  The script cleans the video title to remove irrelevant terms.
4.  The extension sends a request to the backend deployed on Render.com, which fetches lyrics from Genius.com using the cleaned song name and artist.
5.  The returned lyrics are displayed in a styled sidebar on the right side of the video.
6.  A toggle button allows the user to hide or show the lyrics sidebar.
7.  The lyrics panel automatically closes if the user navigates back to the main YouTube page.

---

## 🚀 Installation (Developer Mode)

1.  Clone or download this repo.
2.  Open your browser’s extensions page:
    *   Chrome: `chrome://extensions`
    *   Edge: `edge://extensions`
3.  Enable **Developer mode**.
4.  Click **Load unpacked** and select the project folder.
5.  Go to YouTube and play a song — lyrics should appear!

---

## 💖 Credits

*   Lyrics from [Genius](https://genius.com/)
*   Backend deployed on [Render](https://render.com/)
*   Inspired by the need for easier sing-alongs
*   Created with love by [Bak_a]