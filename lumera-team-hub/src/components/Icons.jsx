const base = { width: '100%', height: '100%', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
const I = ({ children, ...props }) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>{children}</svg>
);

export const IcHome = () => <I><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></I>;
export const IcChat = () => <I><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3 8.9 8.9 0 0 1-3.2-.6L3 21l1.9-5.6a8 8 0 0 1-.9-3.9A8.4 8.4 0 0 1 12.5 3.2 8.4 8.4 0 0 1 21 11.5Z" /></I>;
export const IcDoc = () => <I><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" /><path d="M14 2v5h5" /><path d="M9 13h6M9 17h6" /></I>;
export const IcBoard = () => <I><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v12" /></I>;
export const IcCal = () => <I><rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M8 2.5v4M16 2.5v4M3 10h18" /></I>;
export const IcMegaphone = () => <I><path d="m3 11 15-6v14L3 13v-2Z" /><path d="M11.5 17.2a3 3 0 0 1-5.6-1.4" /><path d="M18 9.5a3 3 0 0 1 0 5" /></I>;
export const IcTeam = () => <I><circle cx="9" cy="8" r="3.4" /><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" /><circle cx="17" cy="9.5" r="2.6" /><path d="M15.6 14.7a5 5 0 0 1 5.6 4.8" /></I>;
export const IcShield = () => <I><path d="M12 2.8 4.5 5.6v5.6c0 4.6 3.2 8.2 7.5 9.8 4.3-1.6 7.5-5.2 7.5-9.8V5.6Z" /><path d="m8.8 11.8 2.3 2.3 4.2-4.4" /></I>;
export const IcBell = () => <I><path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9Z" /><path d="M10 20a2.2 2.2 0 0 0 4 0" /></I>;
export const IcSearch = () => <I><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></I>;
export const IcPlus = () => <I><path d="M12 5v14M5 12h14" /></I>;
export const IcX = () => <I><path d="M6 6l12 12M18 6 6 18" /></I>;
export const IcSend = () => <I><path d="m3.5 11.5 17-7.5-7.5 17-2.2-7.3Z" /></I>;
export const IcUpload = () => <I><path d="M12 16V4m0 0L7 9m5-5 5 5" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></I>;
export const IcDownload = () => <I><path d="M12 4v12m0 0 5-5m-5 5-5-5" /><path d="M4 19h16" /></I>;
export const IcTrash = () => <I><path d="M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 7" /><path d="M6.5 7 7.5 21h9l1-14" /></I>;
export const IcMenu = () => <I><path d="M4 7h16M4 12h16M4 17h16" /></I>;
export const IcLogout = () => <I><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" /><path d="m16 17 5-5-5-5M21 12H9" /></I>;
export const IcClock = () => <I><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></I>;
export const IcCheck = () => <I><path d="m5 12.5 4.5 4.5L19 7.5" /></I>;
export const IcUser = () => <I><circle cx="12" cy="8.2" r="3.8" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></I>;
export const IcMail = () => <I><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></I>;
export const IcEdit = () => <I><path d="M4 20h4.5L20 8.5a2.1 2.1 0 0 0-3-3L5.5 17 4 20Z" /><path d="m14.5 8 2.5 2.5" /></I>;
export const IcChart = () => <I><path d="M4 20V10M10 20V4M16 20v-8M21 20H3" /></I>;
export const IcLock = () => <I><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7.8a4 4 0 0 1 8 0V11" /></I>;
export const IcChevD = () => <I><path d="m6 9.5 6 6 6-6" /></I>;
export const IcHash = () => <I><path d="M9.5 4 7.5 20M16.5 4l-2 16M4.5 9h16M3.5 15h16" /></I>;
export const IcRoadmap = () => <I><path d="M4 6h9M4 6a2 2 0 1 0 0-.01M4 12h13M20 12a2 2 0 1 0 0-.01M4 18h7M11 18a2 2 0 1 0 0-.01" /></I>;
