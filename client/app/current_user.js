let CurrentUser;

if (typeof window !== 'undefined') {
  CurrentUser = window.configuration.user;
} else {
  CurrentUser = {};
}

export default CurrentUser;
