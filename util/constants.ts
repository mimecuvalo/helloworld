const constants = {
  licenses: {
    'http://creativecommons.org/licenses/by/3.0/': {
      name: 'Creative Commons Attribution 3.0 Unported License',
      img: 'https://i.creativecommons.org/l/by/3.0/88x31.png',
    },
    'http://creativecommons.org/licenses/by-sa/3.0/': {
      name: 'Creative Commons Attribution-ShareAlike 3.0 Unported License',
      img: 'https://i.creativecommons.org/l/by-sa/3.0/88x31.png',
    },
    'http://creativecommons.org/licenses/by-nd/3.0/': {
      name: 'Creative Commons Attribution-NoDerivs 3.0 Unported License',
      img: 'https://i.creativecommons.org/l/by-nd/3.0/88x31.png',
    },
    'http://creativecommons.org/licenses/by-nc/3.0/': {
      name: 'Creative Commons Attribution-NonCommercial 3.0 Unported License',
      img: 'https://i.creativecommons.org/l/by-nc/3.0/88x31.png',
    },
    'http://creativecommons.org/licenses/by-nc-sa/3.0/': {
      name: 'Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License',
      img: 'https://i.creativecommons.org/l/by-nc-sa/3.0/88x31.png',
    },
    'http://creativecommons.org/licenses/by-nc-nd/3.0/': {
      name: 'Creative Commons Attribution-NonCommercial-NoDerivs 3.0 Unported License',
      img: 'https://i.creativecommons.org/l/by-nc-nd/3.0/88x31.png',
    },
    'http://purl.org/atompub/license#unspecified': {
      name: 'Simple Copyright',
      img: '',
    },
    'http://www.opensource.org/licenses/mit-license.php': {
      name: 'MIT License',
      img: '',
    },
  },
  reservedNames: ['admin', 'api', 'dashboard', 'graphql', 'public', 'search'],
};

export default constants;

export const WEB_SUB_HUB = 'https://pubsubhubbub.appspot.com/';
export const MAX_FILE_SIZE = 1024 * 1024 * 10; // up to 10 MB

// The templates Item/ContentPage know how to dispatch on. '' is the plain
// article body; 'blank' is the same body with no site chrome around it.
export const CONTENT_TEMPLATES = ['', 'album', 'archive', 'blank', 'feed', 'latest', 'links'];

export const THUMB_WIDTH = 154;
export const THUMB_HEIGHT = 154;

// An uploaded image is kept three ways, in the layout the bucket has always
// used: the untouched file under `original/`, a grid thumbnail under `thumbs/`,
// and the one the post itself points at — the "medium" — sitting at the album
// root between them.
export const ORIGINAL_DIR = 'original';
export const THUMBS_DIR = 'thumbs';

// Both bound a box the image is fitted inside, so aspect ratio is kept.
// The thumbnail is displayed at THUMB_WIDTH, with room to spare for the
// densest screens. The medium is what a post shows: the old one topped out at
// 1280 and looked soft on anything retina, so it's ~2x that now.
export const THUMB_SIZE = 512;
export const MEDIUM_SIZE = 2560;

// Re-encoding quality for both derivatives. Originals are never touched.
export const IMAGE_QUALITY = 82;
