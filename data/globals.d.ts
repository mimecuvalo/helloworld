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
