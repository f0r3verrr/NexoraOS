import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useUnreadChangelog, useMarkChangelogRead } from '../hooks/useChangelog.js';
import { useUnreadNews, useMarkNewsRead } from '../hooks/useNews.js';

const ChangelogContext = createContext(null);

export function ChangelogProvider({ children }) {
  const { data: unreadChangelog = [] } = useUnreadChangelog();
  const { data: unreadNews = [] } = useUnreadNews();
  const markChangelogRead = useMarkChangelogRead();
  const markNewsRead = useMarkNewsRead();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false); // не показывать повторно за сессию

  const items = useMemo(() => {
    const c = unreadChangelog.map(c => ({ ...c, _kind: 'changelog', _date: c.release_date }));
    const n = unreadNews.map(n => ({ ...n, _kind: 'news', _date: n.created_at }));
    return [...c, ...n].sort((a, b) => new Date(a._date) - new Date(b._date));
  }, [unreadChangelog, unreadNews]);

  useEffect(() => {
    if (shown || open) return;
    if (items.length > 0) {
      setOpen(true);
      setShown(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, shown]);

  function dismiss() {
    const changelogIds = items.filter(i => i._kind === 'changelog').map(i => i.id);
    const newsIds = items.filter(i => i._kind === 'news').map(i => i.id);
    if (changelogIds.length) markChangelogRead.mutate(changelogIds);
    if (newsIds.length) markNewsRead.mutate(newsIds);
    setOpen(false);
  }

  return (
    <ChangelogContext.Provider value={{ open, items, dismiss }}>
      {children}
    </ChangelogContext.Provider>
  );
}

export function useChangelogModal() {
  const ctx = useContext(ChangelogContext);
  if (!ctx) throw new Error('useChangelogModal must be used inside ChangelogProvider');
  return ctx;
}
