import { createContext, useContext, useEffect, useState } from 'react';
import { useUnreadChangelog, useMarkChangelogRead } from '../hooks/useChangelog.js';

const ChangelogContext = createContext(null);

export function ChangelogProvider({ children }) {
  const { data: unread = [] } = useUnreadChangelog();
  const markRead = useMarkChangelogRead();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false); // не показывать повторно за сессию

  useEffect(() => {
    if (shown || open) return;
    if (unread.length > 0) {
      setOpen(true);
      setShown(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread.length, shown]);

  function dismiss() {
    if (unread.length) markRead.mutate(unread.map(u => u.id));
    setOpen(false);
  }

  return (
    <ChangelogContext.Provider value={{ open, unread, dismiss }}>
      {children}
    </ChangelogContext.Provider>
  );
}

export function useChangelogModal() {
  const ctx = useContext(ChangelogContext);
  if (!ctx) throw new Error('useChangelogModal must be used inside ChangelogProvider');
  return ctx;
}
