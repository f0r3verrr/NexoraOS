import { createContext, useContext, useState } from 'react';

/* Открыт ли мобильный Drawer (рейка+панель) — Sidebar() и TopBar() из
   src/components/Sidebar.jsx рендерятся как отдельные соседние элементы на
   каждом экране, поэтому кнопке-гамбургеру в TopBar нужен общий стейт,
   чтобы открыть Drawer, который рисует Sidebar. */
const MobileNavContext = createContext(null);

export function MobileNavProvider({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error('useMobileNav must be used within MobileNavProvider');
  return ctx;
}
