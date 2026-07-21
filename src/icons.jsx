const ICON_PATHS = {
  menu:        <path d="M4 6h16M4 12h16M4 18h16"/>,
  home:        <><path d="M3 11l9-8 9 8"/><path d="M5 9.5V21h14V9.5"/></>,
  inbox:       <><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7l3.5-7z"/></>,
  sun_today:   <><circle cx="12" cy="12" r="3.5"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/></>,
  calendar:    <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
  layers:      <><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 12l10 5 10-5M2 17l10 5 10-5"/></>,
  note:        <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h7M8 17h5"/></>,
  file:        <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></>,
  wallet:      <><path d="M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/><path d="M3 7V5a2 2 0 0 1 2-2h11"/><circle cx="16.5" cy="13" r="1.2"/></>,
  users:       <><circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6"/><path d="M17 11a3 3 0 1 0 0-6"/><path d="M22 21c0-2.6-1.6-4.6-4-5.5"/></>,
  target:      <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></>,
  archive:     <><rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></>,
  settings:    <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9A1.7 1.7 0 0 0 10 3.1V3a2 2 0 0 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.4.6 1 1 1.7 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
  lock:        <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
  search:      <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  plus:        <><path d="M12 5v14M5 12h14"/></>,
  minus:       <><path d="M5 12h14"/></>,
  check:       <><path d="m4 12 5 5L20 6"/></>,
  x:           <><path d="M6 6l12 12M18 6 6 18"/></>,
  chevron_down:<path d="m6 9 6 6 6-6"/>,
  chevron_right:<path d="m9 6 6 6-6 6"/>,
  chevron_left:<path d="m15 6-6 6 6 6"/>,
  chevron_up:  <path d="m6 15 6-6 6 6"/>,
  more:        <><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></>,
  filter:      <><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>,
  sort:        <><path d="M3 6h13M3 12h9M3 18h5"/><path d="m17 13 4 4-4 4"/><path d="M21 17h-8"/></>,
  flag:        <><path d="M4 21V4M4 4h13l-2 4 2 4H4"/></>,
  bookmark:    <><path d="M6 3h12v18l-6-4-6 4z"/></>,
  clock:       <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  bell:        <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
  mic:         <><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></>,
  paperclip:   <path d="m21 11-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8"/>,
  star:        <path d="m12 3 2.7 5.7L21 9.6l-4.5 4.4 1 6.3L12 17.6 6.5 20.3l1-6.3L3 9.6l6.3-.9z"/>,
  flame:       <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>,
  pin:         <><path d="M12 17v5"/><path d="M9 3h6l-1 5 3 4-7 2-1-2 3-4-3-5z"/></>,
  snooze:      <><circle cx="12" cy="12" r="9"/><path d="M9 9h6l-6 6h6"/></>,
  repeat:      <><path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>,
  arrow_up_right:<path d="M7 17 17 7M8 7h9v9"/>,
  trending_up: <><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></>,
  zap:         <path d="m13 2-9 13h7l-1 7 9-13h-7z"/>,
  heart:        <path d="M12 20s-7-4.4-7-10a4.5 4.5 0 0 1 8.5-2A4.5 4.5 0 0 1 22 10c0 5.6-10 10-10 10Z"/>,
  heart_filled: <path d="M12 20s-7-4.4-7-10a4.5 4.5 0 0 1 8.5-2A4.5 4.5 0 0 1 22 10c0 5.6-10 10-10 10Z" fill="currentColor" stroke="none"/>,
  smile:       <><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9.5" r=".7"/><circle cx="15" cy="9.5" r=".7"/></>,
  battery:     <><rect x="3" y="8" width="16" height="8" rx="1.5"/><path d="M21 11v2"/><path d="M6 11v2M9 11v2M12 11v2"/></>,
  command:     <path d="M15 6a3 3 0 1 1 3 3h-3V6zm-6 0a3 3 0 1 0-3 3h3V6zm0 12a3 3 0 1 1-3-3h3v3zm6 0a3 3 0 1 0 3-3h-3v3zM9 9h6v6H9z"/>,
  arrow_right: <path d="M5 12h14M13 6l6 6-6 6"/>,
  arrow_down:  <path d="M12 5v14M6 13l6 6 6-6"/>,
  download:    <><path d="M12 3v12M8 11l4 4 4-4"/><path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/></>,
  car:         <><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></>,
  music:       <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
  briefcase:   <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></>,
  phone:       <path d="M5 4h4l2 5-2 1a11 11 0 0 0 5 5l1-2 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>,
  video:       <><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></>,
  message:     <path d="M21 12a8 8 0 0 1-12 7l-5 1 1-4a8 8 0 1 1 16-4z"/>,
  send:        <><path d="m22 2-11 11"/><path d="M22 2 15 22l-4-9-9-4z"/></>,
  edit:        <><path d="M4 20h4l10-10-4-4L4 16z"/><path d="m14 6 4 4"/></>,
  trash:       <><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M6 7v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7"/></>,
  drop:        <path d="M12 3s-7 8-7 13a7 7 0 0 0 14 0c0-5-7-13-7-13z"/>,
  moon:        <path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z"/>,
  external:    <><path d="M14 3h7v7"/><path d="M21 3l-9 9"/><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/></>,
  globe:       <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  folder:      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
  coin:        <><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M9.5 9.5h3.5a1.5 1.5 0 0 1 0 3h-3m0 .5h4a1.5 1.5 0 0 1 0 3H9.5"/></>,
  activity:    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>,
  book:        <><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/><path d="M8 6h8M8 10h8M8 14h5"/></>,
  landmark:    <><rect x="3" y="11" width="18" height="10" rx="1"/><path d="M3 7l9-4 9 4v4H3z"/><path d="M7 15v2M12 15v2M17 15v2"/></>,
  camera:      <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
  link:        <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
  circle:      <circle cx="12" cy="12" r="9"/>,
  check_circle:<><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></>,
  log_out:     <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></>,
  info:        <><circle cx="12" cy="12" r="9"/><path d="M12 17v-5"/><circle cx="12" cy="7.5" r=".8" fill="currentColor" stroke="none"/></>,
  eye:         <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  eye_off:     <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></>,
  copy:        <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
  film:        <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v16M17 4v16M2 9h5M17 9h5M2 15h5M17 15h5"/></>,
  tv:          <><rect x="2" y="7" width="20" height="13" rx="2"/><path d="m8 3 4 4 4-4"/></>,
  star_filled: <path d="m12 3 2.7 5.7L21 9.6l-4.5 4.4 1 6.3L12 17.6 6.5 20.3l1-6.3L3 9.6l6.3-.9z" fill="currentColor" stroke="none"/>,
  list:        <><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="3" cy="18" r="1.2" fill="currentColor" stroke="none"/></>,
  grid:        <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  shield:      <path d="M12 3l8 3.5v5.5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6.5z"/>,
};

export function Icon({ name, size = 16, stroke = 1.5, className = '', style = {} }) {
  const path = ICON_PATHS[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flex: 'none', ...style }}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
