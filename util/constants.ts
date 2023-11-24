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
  thumbWidth: 480,
  thumbHeight: 360,
  normalWidth: 1280,
  normalHeight: 960,
};

export default constants;

export const WEB_SUB_HUB = 'https://pubsubhubbub.appspot.com/';
export const MAX_FILE_SIZE = 1024 * 1024 * 10; // up to 10 MB

export const THUMB_WIDTH = 154;
export const THUMB_HEIGHT = 154;
