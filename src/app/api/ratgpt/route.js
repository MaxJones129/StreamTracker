import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// eslint-disable-next-line prefer-destructuring
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const normalizePlatformName = (rawName) => {
  const knownMappings = {
    Netflix: 'Netflix',
    'Netflix with Ads': 'Netflix',
    'Netflix Standard with Ads': 'Netflix',
    'Disney+': 'Disney Plus',
    'Disney Plus': 'Disney Plus',
    'Amazon Prime Video': 'Amazon Prime Video',
    'Prime Video': 'Amazon Prime Video',
    'Apple TV+': 'Apple TV Plus',
    'Apple TV Plus': 'Apple TV Plus',
  };
  return knownMappings[rawName] || rawName;
};

export async function getOrCreatePlatform(platformName) {
  const normalized = normalizePlatformName(platformName);

  const platformRes = await fetch('http://localhost:5193/api/Platforms');
  if (!platformRes.ok) throw new Error('Failed to fetch platforms');
  const platformData = await platformRes.json();
  const existing = platformData.$values.find((p) => p.name.toLowerCase() === normalized.toLowerCase());

  if (existing) return existing.id;

  const createRes = await fetch('http://localhost:5193/api/Platforms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: normalized }),
  });

  if (!createRes.ok) throw new Error('Failed to create platform');
  const newPlatform = await createRes.json();
  return newPlatform.id;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages } = body;

    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `
            You are RatGPT, an assistant that helps users manage a streaming tracker app.
            When a user asks to add a show or movie, respond ONLY with a JSON object like this (no explanation):
            {
              "title": "Breaking Bad",
              "description": "A high school chemistry teacher becomes a meth producer.",
              "genre": "Drama",
              "releaseYear": 2008,
              "status": "Not Watched",
              "rating": 0
            }
            If you don't know the description, leave it empty. All fields must be present. Use realistic values.
          `,
        },
        ...messages,
      ],
    });

    const content = chat.choices[0]?.message?.content?.trim();
    const parsed = JSON.parse(content);

    const { title, genre, releaseYear, status, rating, description } = parsed;
    if (!title || !genre || !releaseYear || !status || rating === undefined) {
      return new Response(JSON.stringify({ reply: 'Missing required video fields.' }), { status: 400 });
    }

    const videoPayload = {
      title,
      description: description || '',
      genre,
      releaseYear: parseInt(releaseYear, 10),
      status,
      rating: parseInt(rating, 10),
      userId: 1,
    };

    const videoRes = await fetch('http://localhost:5193/api/Videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(videoPayload),
    });

    if (!videoRes.ok) throw new Error('Failed to create show');
    const createdShow = await videoRes.json();

    const searchRes = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
    const searchData = await searchRes.json();
    const tvShow = searchData.results?.[0];
    if (!tvShow) throw new Error('Show not found in TMDb');

    const tvId = tvShow.id;

    // 🔗 Add TMDB watch page as streaming URL
    const tmdbUrl = `https://www.themoviedb.org/tv/${tvId}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const tmdbPlatformId = await getOrCreatePlatform('TMDB');

    await fetch('http://localhost:5193/api/VideoUrls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: createdShow.id, platformId: tmdbPlatformId, url: tmdbUrl }),
    });

    // 🧩 Episodes
    const detailsRes = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}`);
    const detailsData = await detailsRes.json();
    const seasons = detailsData.seasons || [];

    const episodePromises = seasons.map(async (season) => {
      const seasonRes = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${season.season_number}?api_key=${TMDB_API_KEY}`);
      if (!seasonRes.ok) return [];
      const seasonData = await seasonRes.json();
      return seasonData.episodes || [];
    });

    const episodes = (await Promise.all(episodePromises)).flat().sort((a, b) => {
      if (a.season_number === 0 && b.season_number !== 0) return 1;
      if (b.season_number === 0 && a.season_number !== 0) return -1;
      return a.season_number - b.season_number || a.episode_number - b.episode_number;
    });

    const episodePayloads = episodes.map((ep) => ({
      name: ep.name,
      season: ep.season_number,
      episodeNumber: ep.episode_number,
      timeStopped: '00:00:00',
      status: 'Not Watched',
      rating: 0,
      videoId: createdShow.id,
      userId: createdShow.userId,
    }));

    await Promise.all(
      episodePayloads.map((payload) =>
        fetch('http://localhost:5193/api/Episodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
      ),
    );

    return new Response(JSON.stringify({ reply: `✅ I added "${createdShow.title}" with episodes and TMDB streaming info!` }), { status: 200 });
  } catch (error) {
    console.error('RatGPT error:', error);
    return new Response(JSON.stringify({ reply: '❌ Error: Unable to add the show.' }), {
      status: 500,
    });
  }
}
