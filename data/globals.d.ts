type User = {
  id: string;
  email: string;
  model: {
    superuser: boolean;
  };
};
declare let __user: User;

type EnabledExperiment = {
  name: string;
};

type Configuration = {
  user: User | null;
  experiments: EnabledExperiment[];
};

interface Window {
  configuration: any;
}

declare module 'js-cookie';
declare module 'md5.js';
