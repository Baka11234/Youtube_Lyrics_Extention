// lyrics_fetcher.js

const API_URL = 'https://api.genius.com/search?q=';
const GENIUS_ACCESS_TOKEN = 'YOUR_GENIUS_ACCESS_TOKEN'; // Replace with your Genius API token

async function fetchLyricsFromGenius(songName) {
    const response = await fetch(`${API_URL}${encodeURIComponent(songName)}`, {
        headers: {
            'Authorization': `Bearer ${GENIUS_ACCESS_TOKEN}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch lyrics from Genius');
    }

    const data = await response.json();
    const songPath = data.response.hits[0]?.result?.path;

    if (songPath) {
        return scrapeLyricsFromGeniusPage(`https://genius.com${songPath}`);
    } else {
        throw new Error('Lyrics not found');
    }
}

async function scrapeLyricsFromGeniusPage(url) {
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const lyricsElement = doc.querySelector('.lyrics');

    if (lyricsElement) {
        return lyricsElement.innerText;
    } else {
        throw new Error('Failed to scrape lyrics from Genius page');
    }
}

async function fetchLyrics(songName) {
    try {
        return await fetchLyricsFromGenius(songName);
    } catch (error) {
        console.error(error);
        return 'Lyrics not available';
    }
}