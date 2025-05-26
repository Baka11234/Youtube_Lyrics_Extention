import express from 'express';
import helmet from 'helmet'; // Import helmet
import cors from 'cors';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

const app = express();
const port = process.env.PORT || 3000;
const GENIUS_ACCESS_TOKEN = 'voEpadD69iJEXcHU3Vx8FlZ2kQmjXgGV4aLaWXrnxhbMWn2s9kwBUU1Vr9FgNqZ-';

// Set CSP using helmet
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"], // Default policy: only allow resources from the same origin
            fontSrc: ["'self'", "https://fonts.gstatic.com"], // Allow fonts from Google Fonts
            styleSrcElem: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"], // Allow stylesheets from Google Fonts
            imgSrc: ["'self'", "data:"], // Allow images from the same origin and data URIs
        },
    })
);

app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Enable JSON parsing

// Clean up song title for better Genius search
function cleanSongTitle(title) {
    // Add "official music video" and similar tags to the filter
    return title
        .replace(/\s*-\s*(remastered|live|acoustic|edit|version|mono|stereo|explicit|clean|deluxe|bonus track|single|album mix|radio edit|official music video|remaster(ed)? \d{4}|lyrics|lyric video|official lyric video)/gi, '')
        .replace(/\(.*?(remastered|live|acoustic|edit|version|mono|stereo|explicit|clean|deluxe|bonus track|single|album mix|radio edit|official music video|remaster(ed)? \d{4}|lyrics|lyric video|official lyric video).*?\)/gi, '')
        .replace(/\[.*?(remastered|live|acoustic|edit|version|mono|stereo|explicit|clean|deluxe|bonus track|single|album mix|radio edit|official music video|remaster(ed)? \d{4}|lyrics|lyric video|official lyric video).*?\]/gi, '')
        .replace(/\(official music video\)/gi, '') // Remove standalone (Official Music Video)
        .replace(/\[official music video\]/gi, '') // Remove standalone [Official Music Video]
        .replace(/\s+/g, ' ')
        .trim();
}

app.get('/lyrics', async (req, res) => {
    const artist = req.query.artist || '';
    const song = req.query.song || req.query.title || '';
    if (!song) return res.status(400).send('Missing song title');
    try {
        // Build a better search query
        let cleanSong = cleanSongTitle(song);
        let searchQuery = cleanSong;
        if (artist) searchQuery = `${artist} ${cleanSong}`;
        console.log('Genius search query:', searchQuery); // <-- Add this line
        const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(searchQuery)}`;
        const searchRes = await fetch(searchUrl, {
            headers: { Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}` }
        });
        const searchData = await searchRes.json();
        if (!searchData.response.hits.length) return res.send('No lyrics found on Genius.');

        console.log('Genius hits:', searchData.response.hits.map(h => ({
            title: h.result.full_title,
            artist: h.result.primary_artist.name
        })));

        // Only consider hits that are actual songs
        const songHits = searchData.response.hits.filter(h => h.type === "song");

        if (!songHits.length) return res.send('No song lyrics found on Genius.');

        let hit = songHits[0];
        if (artist) {
            // Try to find a hit where the artist matches exactly
            hit = songHits.find(h =>
                h.result.primary_artist &&
                h.result.primary_artist.name.toLowerCase() === artist.toLowerCase()
            ) ||
            // Try to find a hit where the artist contains the channel name
            songHits.find(h =>
                h.result.primary_artist &&
                h.result.primary_artist.name.toLowerCase().includes(artist.toLowerCase())
            ) || hit;
        }

        const songPath = hit.result.path;
        const songTitle = hit.result.full_title;
        const songUrl = `https://genius.com${songPath}`;
        const pageRes = await fetch(songUrl);
        const pageText = await pageRes.text();

        const dom = new JSDOM(pageText);
        const lyricDivs = dom.window.document.querySelectorAll('div[data-lyrics-container="true"]');
        if (!lyricDivs.length) return res.send('Lyrics not found or Genius page layout changed.');

        let lyrics = Array.from(lyricDivs).map(div => {
            let html = div.innerHTML.replace(/<br\s*\/?>/gi, '\n');
            const temp = dom.window.document.createElement('div');
            temp.innerHTML = html;
            return temp.textContent;
        }).join('\n').trim();

        // Remove non-lyrics lines (contributors, translations, etc.)
        lyrics = lyrics
            .split('\n')
            .filter(line =>
                line.trim() &&
                !/contributors?/i.test(line) &&
                !/translations?/i.test(line) &&
                !/русский|français|deutsch|español|português|türkçe|українська/i.test(line)
            )
            .join('\n')
            .trim();

        // Prepend the song title
        lyrics = `${songTitle}\n\n${lyrics}`;

        if (lyrics) {
            console.log('Lyrics found (just before sending):', lyrics); // <-- Add this line
            res.send(lyrics);
        } else {
            console.log('Lyrics not found.');
            res.status(404).send('Lyrics not found');
        }
    } catch (e) {
        res.send('Error fetching lyrics from Genius.');
    }
});

app.get('/genius-artist-exists', async (req, res) => {
    const artist = req.query.q;
    if (!artist) return res.json({ exists: false });
    try {
        const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(artist)}`;
        const searchRes = await fetch(searchUrl, {
            headers: { Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}` }
        });
        const searchData = await searchRes.json();
        const exists = searchData.response.hits.some(hit =>
            hit.result.primary_artist &&
            hit.result.primary_artist.name.toLowerCase() === artist.toLowerCase()
        );
        res.json({ exists });
    } catch {
        res.json({ exists: false });
    }
});

app.listen(port, () => {
    console.log(`Lyrics proxy running on http://localhost:${port}`);
});