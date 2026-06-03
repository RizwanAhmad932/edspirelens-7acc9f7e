import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string' || query.length > 200) {
      return new Response(JSON.stringify({ error: 'Invalid query' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' education lecture')}&sp=EgIQAQ%253D%253D`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const html = await res.text();
    const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
    if (!m) throw new Error('Could not parse YouTube response');
    const data = JSON.parse(m[1]);
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents ?? [];
    const videos: any[] = [];
    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents ?? [];
      for (const it of items) {
        const v = it?.videoRenderer;
        if (!v) continue;
        videos.push({
          videoId: v.videoId,
          title: v.title?.runs?.[0]?.text ?? '',
          channel: v.ownerText?.runs?.[0]?.text ?? '',
          duration: v.lengthText?.simpleText ?? '',
          views: v.viewCountText?.simpleText ?? '',
          published: v.publishedTimeText?.simpleText ?? '',
          thumbnail: v.thumbnail?.thumbnails?.slice(-1)[0]?.url ?? `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${v.videoId}`,
        });
        if (videos.length >= 5) break;
      }
      if (videos.length >= 5) break;
    }
    return new Response(JSON.stringify({ videos }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});