type EnabledExperiment = {
  name: string;
};

type Configuration = {
  experiments: EnabledExperiment[];
};

interface Window {
  configuration: any;
}

declare module 'js-cookie';
declare module 'magic-signatures';
declare module 'md5.js';
declare module 'swipe-listener';

declare namespace JSX {
  interface IntrinsicElements {
    account: any;
    author: any;
    content: any;
    email: any;
    entry: any;
    id: any;
    knows: any;
    name: any;
    published: any;
    updated: any;
    uri: any;
    feed: any;
    generator: any;
    rights: any;
    subtitle: any;
    icon: any;
    logo: any;
  }
}
