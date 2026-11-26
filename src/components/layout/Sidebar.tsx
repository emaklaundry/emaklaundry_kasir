import React, { useLayoutEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import useAppContext from '../../contexts/useAppContext';
import { ChevronLeftIcon } from '../icons';
import { NavItem, canSeeNavItem, navSections } from '../../config/navigation';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { currentUser } = useAppContext();
  const sidebarRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (sidebarRef.current) sidebarRef.current.inert = !isOpen;
  }, [isOpen]);

  const canSee = (item: NavItem) => canSeeNavItem(item, currentUser?.role);

  const renderNavLink = (item: NavItem) => (
    <li key={item.path}>
      <NavLink
        to={item.path}
        end={item.path === '/'}
        className={({ isActive }) =>
          `flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors duration-200 group ${
            isActive
              ? 'bg-brand-blue-600 dark:bg-brand-blue-600 text-white shadow-md shadow-brand-blue-500/30'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`
        }
      >
        <item.icon className="w-5 h-5 shrink-0" />
        <span className="ml-3 font-medium truncate">{item.label}</span>
      </NavLink>
    </li>
  );

  const visibleSections = navSections
    .map((section) => ({ ...section, items: section.items.filter(canSee) }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Overlay untuk mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        id="logo-sidebar"
        className={`print-hide fixed top-0 left-0 z-40 w-64 h-screen transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar"
        aria-hidden={!isOpen}
      >
        <div className="h-full px-3 py-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] overflow-y-auto bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
          {/* Header dengan toggle button */}
          <div className="flex items-center justify-between mb-6">
            <NavLink to="/" className="flex items-center group">
              <span className="self-center text-2xl font-bold text-brand-blue-600 dark:text-brand-blue-400">
                Laundry POS
              </span>
            </NavLink>
            <button
              id="sidebar-close"
              onClick={onToggle}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-target"
              aria-label="Tutup navigasi"
              title="Tutup navigasi"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          </div>

          <nav aria-label="Navigasi samping" className="flex-1">
            {visibleSections.map((section, index) => {
              const headingId = `sidebar-section-${section.title.toLowerCase().replace(/\W+/g, '-')}`;
              return (
                <div
                  key={section.title}
                  className={
                    index > 0
                      ? 'mt-4 pt-4 border-t border-slate-200 dark:border-slate-700'
                      : undefined
                  }
                >
                  <h3
                    id={headingId}
                    className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    {section.title}
                  </h3>
                  <ul className="space-y-1" aria-labelledby={headingId}>
                    {section.items.map(renderNavLink)}
                  </ul>
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
