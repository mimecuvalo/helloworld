import { load } from 'cheerio';

export function createLiteYouTubeVideos(view: string) {
  // youtube iframe embeds -> lite-youtube embeds
  // e.g. <iframe width="480" height="270" src="https://www.youtube.com/embed/SfsCniN7Nsc?feature=oembed" title="The Suburbs Are Bleeding America Dry | Climate Town (feat. Not Just Bikes)"></iframe>
  // -> <lite-youtube videoid="SfsCniN7Nsc" playlabel="Play: The Suburbs Are Bleeding America Dry | Climate Town (feat. Not Just Bikes)"></lite-youtube>

  const $ = load(view);
  $('iframe').each((_, iframe) => {
    const src = $(iframe).attr('src');
    // Check that it's a youtube domain and extract the video id.
    if (!src) return;
    const url = new URL(src);
    if (
      !url.hostname.startsWith('www.youtube.') &&
      !url.hostname.startsWith('youtube.') &&
      !url.hostname.startsWith('www.youtu.be') &&
      !url.hostname.startsWith('youtu.be')
    )
      return;
    // Url formats could be:
    //  https://www.youtube.com/embed/SfsCniN7Nsc
    //  https://www.youtube.com/watch?v=SfsCniN7Nsc
    //  https://youtu.be/SfsCniN7Nsc
    const videoid = url.searchParams.get('v') || url.pathname.split('/').pop();
    const title = $(iframe).attr('title');
    if (videoid) {
      $(iframe).replaceWith(`<lite-youtube videoid="${videoid}" playlabel="${title}"></lite-youtube>`);
    }
  });
  return $.html();
}
