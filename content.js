// content.js

let lastTitle = '';
let lastVideoId = '';

const GENIUS_ACCESS_TOKEN = 'voEpadD69iJEXcHU3Vx8FlZ2kQmjXgGV4aLaWXrnxhbMWn2s9kwBUU1Vr9FgNqZ-';

const updateLyricsPanel = (lyrics) => {
    const existingPanel = document.getElementById('lyrics-panel');
    if (existingPanel) existingPanel.remove();
    const existingToggle = document.getElementById('lyrics-toggle-btn');
    if (existingToggle) existingToggle.remove();

    // --- Lyrics Panel ---
    const lyricsPanel = document.createElement('div');
    lyricsPanel.id = 'lyrics-panel';
    lyricsPanel.style.position = 'fixed';
    lyricsPanel.style.top = '0';
    lyricsPanel.style.right = '0'; // Start visible!
    lyricsPanel.style.height = '100vh';
    lyricsPanel.style.width = '350px';
    lyricsPanel.style.background = 'rgba(30, 30, 30, 0.97)';
    lyricsPanel.style.color = '#fff';
    lyricsPanel.style.padding = '24px 18px';
    lyricsPanel.style.borderRadius = '0 0 0 12px';
    lyricsPanel.style.boxShadow = '0 0 24px rgba(0, 0, 0, 0.18)';
    lyricsPanel.style.fontFamily = 'Segoe UI, Arial, sans-serif';
    lyricsPanel.style.fontSize = '15px';
    lyricsPanel.style.lineHeight = '1.6';
    lyricsPanel.style.whiteSpace = 'pre-line';
    lyricsPanel.style.zIndex = '9999';
    lyricsPanel.style.overflowY = 'auto';
    lyricsPanel.style.display = 'flex';
    lyricsPanel.style.flexDirection = 'column';
    lyricsPanel.style.pointerEvents = 'auto';
    lyricsPanel.style.transition = 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

    // --- Close Button ---
    const closeBtn = document.createElement('button');
    closeBtn.innerText = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '8px';
    closeBtn.style.right = '12px';
    closeBtn.style.background = 'transparent';
    closeBtn.style.color = '#fff';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '22px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => lyricsPanel.remove();
    lyricsPanel.appendChild(closeBtn);

    // --- Lyrics Text ---
    const textDiv = document.createElement('div');
    const lines = lyrics.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    lines.forEach(lineText => {
        const line = document.createElement('div');
        line.style.marginBottom = '6px';
        line.innerText = lineText;
        textDiv.appendChild(line);
    });
    lyricsPanel.appendChild(textDiv);

    document.body.appendChild(lyricsPanel);

    // --- Toggle Button ---
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'lyrics-toggle-btn';
    toggleBtn.innerText = '⮜'; // Start with "hide" arrow
    toggleBtn.style.position = 'fixed';
    toggleBtn.style.top = '40px';
    toggleBtn.style.right = '385px'; // Start at the edge
    toggleBtn.style.width = '28px';
    toggleBtn.style.height = '56px';
    toggleBtn.style.background = '#222';
    toggleBtn.style.color = '#fff';
    toggleBtn.style.border = 'none';
    toggleBtn.style.borderRadius = '8px 0 0 8px';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.fontSize = '22px';
    toggleBtn.style.zIndex = '10001';
    toggleBtn.style.transition = 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)'; // Add transition property

    let panelVisible = true; // Track visibility

    toggleBtn.onclick = () => {
        if (panelVisible) {
            lyricsPanel.style.right = '-100%'; // Hide
            toggleBtn.innerText = '⮞'; // Show "show" arrow
            toggleBtn.style.right = '0'; // Move button to edge
        } else {
            lyricsPanel.style.right = '0'; // Show
            toggleBtn.innerText = '⮜'; // Show "hide" arrow
            toggleBtn.style.right = '385px'; // Move button to edge of panel
        }
        panelVisible = !panelVisible;
    };
    document.body.appendChild(toggleBtn);
};

const fetchSongTitleNode = () =>
    document.querySelector('h1.ytd-watch-metadata > yt-formatted-string') ||
    document.querySelector('h1.title yt-formatted-string') ||
    document.querySelector('h1');

// Fetch the channel (owner) name from the YouTube page
function fetchChannelName() {
    // Try the most specific selector first (official artist channel)
    let node = document.querySelector('#owner ytd-channel-name #text a');
    if (node && node.innerText.trim()) return node.innerText.trim();
    // Fallback: sometimes the artist name is not a link
    node = document.querySelector('#owner ytd-channel-name #text');
    if (node && node.innerText.trim()) return node.innerText.trim();
    // Fallback: channel name in the sidebar or elsewhere
    node = document.querySelector('ytd-channel-name a');
    if (node && node.innerText.trim()) return node.innerText.trim();
    // Fallback: meta tag (rare)
    node = document.querySelector('meta[itemprop="author"]');
    if (node && node.content) return node.content.trim();
    return '';
}

// Check if an artist exists on Genius via your backend
async function geniusArtistExists(artist) {
    const params = new URLSearchParams({ q: artist });
    try {
        const res = await fetch(`http://localhost:3000/genius-artist-exists?${params.toString()}`);
        const data = await res.json();
        return data.exists;
    } catch {
        return false;
    }
}

// Async version that uses channel name if artist is missing
async function getArtistAndSong(rawTitle) {
    let artist = '', song = '';
    if (rawTitle.includes(' - ')) {
        [artist, song] = rawTitle.split(' - ', 2);
    } else if (/ by /i.test(rawTitle)) {
        [song, artist] = rawTitle.split(/ by /i, 2);
    } else {
        song = rawTitle;
        const channel = fetchChannelName();
        console.log('Detected channel name:', channel);
        if (channel) {
            artist = channel;
        }
    }
    return { artist: artist.trim(), song: song.trim() };
}

async function fetchGeniusLyrics(rawTitle) {
    const { artist, song } = await getArtistAndSong(rawTitle);
    console.log('Sending to backend:', { artist, song }); // <-- Add this line
    const params = new URLSearchParams();
    if (artist) params.append('artist', artist);
    params.append('song', song);
    try {
        const res = await fetch(`http://localhost:3000/lyrics?${params.toString()}`);
        return await res.text();
    } catch (e) {
        return 'Error fetching lyrics from backend.';
    }
}

// Example click handler
function attachClickListener() {
    const node = fetchSongTitleNode();
    if (!node) {
        setTimeout(attachClickListener, 300);
        return;
    }
    node.onclick = null;
    node.addEventListener('click', async () => {
        const freshNode = fetchSongTitleNode();
        const title = freshNode ? freshNode.innerText : '';
        if (title) {
            updateLyricsPanel('Loading lyrics...');
            const lyrics = await fetchGeniusLyrics(title);
            updateLyricsPanel(lyrics);
        }
    });
}

function attachVideoEndListener() {
    const video = document.querySelector('video');
    if (!video) {
        setTimeout(attachVideoEndListener, 300);
        return;
    }
    video.addEventListener('ended', () => {
        const panel = document.getElementById('lyrics-panel');
        if (panel) panel.remove();
    });
}

// Re-attach listener on navigation or URL change
let lastUrl = location.href;
setInterval(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(attachClickListener, 500);
        setTimeout(attachVideoEndListener, 500);
    }
}, 500);

window.addEventListener('yt-navigate-finish', () => {
    setTimeout(attachClickListener, 1000);
    setTimeout(attachVideoEndListener, 1000);
});

// Function to close the lyrics panel
function closeLyricsPanel() {
    const existingPanel = document.getElementById('lyrics-panel');
    if (existingPanel) existingPanel.remove();
    const existingToggle = document.getElementById('lyrics-toggle-btn');
    if (existingToggle) existingToggle.remove();
}

// Create a mutation observer to detect URL changes
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
            // Check if the URL has changed to the main YouTube page
            if (window.location.pathname === '/') {
                closeLyricsPanel();
            }
        }
    });
});

// Start observing the document for changes to the URL
observer.observe(document.querySelector('body'), {
    attributes: true,
    attributeFilter: ['href'],
    subtree: true
});

attachClickListener();