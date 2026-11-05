interface DemoContext {
  lang: string;
  currentRole: string;
  currentUser: string;
  teamLeader: string;
}

interface Window {
  getItSupportDemoContext?: () => DemoContext;
  setPage: (page: string) => void;
  showNotifications: () => void;
  changeRole: (role: string) => void;
  toggleLanguage: () => void;
  resetDemo: () => void;
}
