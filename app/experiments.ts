import Cookies from 'js-cookie';

function isInternalUser(user: User | null): boolean {
  return !!user?.model?.superuser;
}

type EnabledOption = string | ((user: User | null) => boolean);

export type $Experiment = {
  startDate: string;
  enabledPercent: number;
  allowedUsers: string[];
  disallowedUsers: string[];
  enabledFor: EnabledOption[];
};

export const REGISTERED_EXPERIMENTS: { [key: string]: $Experiment } = {
  'my-experiment': {
    startDate: '2019-11-11',
    enabledPercent: 0.1, // 10% enabled
    allowedUsers: [], // Define a certain cohort of users
    disallowedUsers: [], // Exclude certain users
    enabledFor: ['someemail@gmail.com', isInternalUser],
  },
};

// const RETIRED_EXPERIMENTS = [
//   'some-old-experiment',
// ];

export default function getExperiments(user: User | null): EnabledExperiment[] {
  const cookieExperimentOverrides =
    user?.model.superuser || process.env.NODE_ENV === 'development'
      ? JSON.parse(decodeURIComponent(Cookies.get('experiments') || '{}'))
      : [];

  const allExperiments = Object.keys(REGISTERED_EXPERIMENTS).map((name) => ({
    name,
    ...REGISTERED_EXPERIMENTS[name],
  }));
  const enabledExperiments = allExperiments.filter((exp) => {
    if (cookieExperimentOverrides[exp.name]) {
      return true;
    }

    if (doesUserMatch(exp.enabledFor, user)) {
      return true;
    }

    if (exp.allowedUsers.length && !doesUserMatch(exp.allowedUsers, user)) {
      return false;
    }

    if (doesUserMatch(exp.disallowedUsers, user)) {
      return false;
    }

    // Convert the GUID hash to a percent:
    // - remove '-' and '_'
    // - get first 5 letters
    // - compare that with the last number in base 36 which is ZZZZZ
    const userIdPartial = user?.id?.replace(/[-_]/g, '').slice(0, 5) || '';
    const userPercent = parseInt(userIdPartial, 36) / parseInt('ZZZZZ', 36);
    if (userPercent <= exp.enabledPercent) {
      return true;
    }

    return false;
  });

  const enabledExperimentNames = enabledExperiments.map((exp) => exp.name) as unknown as EnabledExperiment[];
  return enabledExperimentNames;
}

function doesUserMatch(cohort: EnabledOption[], user: User | null) {
  cohort = cohort || [];
  const email = user?.email;
  return cohort.some((funcOrEmail: EnabledOption) =>
    typeof funcOrEmail === 'string' ? funcOrEmail === email : funcOrEmail(user)
  );
}
