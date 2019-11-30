import authorization from '../authorization';

function isInternalUser(user) {
  return user?.model?.superuser;
}

export const REGISTERED_EXPERIMENTS = {
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

export default function getExperiments(req) {
  const session = req.session;
  const user = req.session.user;
  const cookieExperimentOverrides = authorization.isAdmin(user) ? JSON.parse(req.cookies.experiments || '{}') : [];
  const allExperiments = Object.keys(REGISTERED_EXPERIMENTS).map(name => ({ name, ...REGISTERED_EXPERIMENTS[name] }));
  const enabledExperiments = allExperiments.filter(exp => {
    if (cookieExperimentOverrides[exp.name] !== undefined) {
      return cookieExperimentOverrides[exp.name];
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
    const userPercent = parseInt(session.id.replace(/[-_]/g, '').slice(0, 5), 36) / parseInt('ZZZZZ', 36);
    if (userPercent <= exp.enabledPercent) {
      return true;
    }

    return false;
  });

  const enabledExperimentNames = enabledExperiments.map(exp => exp.name);
  return enabledExperimentNames;
}

function doesUserMatch(cohort, user) {
  cohort = cohort || [];
  const email = user?.oauth?.email;
  return cohort.some(funcOrEmail => (typeof funcOrEmail === 'string' ? funcOrEmail === email : funcOrEmail(user)));
}
