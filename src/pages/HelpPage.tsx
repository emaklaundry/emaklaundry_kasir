import React, { useDeferredValue, useId, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAppContext from '../contexts/useAppContext';
import { useTutorial } from '../hooks/useTutorial';
import { navSections } from '../config/navigation';
import { HELP_TOPICS, HELP_TOURS, HelpTopic, HelpTour } from '../config/helpTopics';
import { ChevronDownIcon, HelpCircleIcon, SearchIcon } from '../components/icons';
import { UserRole } from '../types';

const ALL = 'Semua';

const normalize = (text: string) => text.toLocaleLowerCase('id-ID');

const topicText = (topic: HelpTopic) =>
  normalize(
    [topic.title, topic.summary, topic.keywords ?? '', ...topic.steps, ...(topic.tips ?? [])].join(
      ' ',
    ),
  );

const HelpPage: React.FC = () => {
  const { currentUser } = useAppContext();
  const { startTour } = useTutorial();
  const navigate = useNavigate();
  const searchId = useId();
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState(ALL);
  const deferredQuery = useDeferredValue(query);

  const isAdmin = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;

  const visibleTopics = useMemo(
    () => HELP_TOPICS.filter((topic) => isAdmin || !topic.adminOnly),
    [isAdmin],
  );

  // Urutan kelompok sama dengan sidebar; kelompok tanpa topik untuk peran ini disembunyikan.
  const sections = useMemo(
    () =>
      navSections
        .map((s) => s.title)
        .filter((title) => visibleTopics.some((topic) => topic.section === title)),
    [visibleTopics],
  );

  const terms = normalize(deferredQuery).split(/\s+/).filter(Boolean);
  const matchingTopics = visibleTopics.filter((topic) => {
    if (activeSection !== ALL && topic.section !== activeSection) return false;
    if (terms.length === 0) return true;
    const text = topicText(topic);
    return terms.every((term) => text.includes(term));
  });

  const grouped = sections
    .map((section) => ({
      section,
      topics: matchingTopics.filter((topic) => topic.section === section),
    }))
    .filter((group) => group.topics.length > 0);

  const tours = HELP_TOURS.filter((tour) => isAdmin || !tour.adminOnly);

  const runTour = (tour: HelpTour) => {
    navigate(tour.path);
    // Tunggu halaman tujuan selesai dirender agar elemen tur sudah ada.
    window.setTimeout(() => startTour(tour.key), 400);
  };

  const isSearching = terms.length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-4">
        <p className="text-slate-600 dark:text-slate-400">
          Cari langkah kerja di aplikasi, atau ikuti tur interaktif di halaman yang sedang
          dipelajari.
        </p>

        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Cari topik bantuan
          </label>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari: bayar, struk, stok, PIN, karyawan…"
            autoComplete="off"
            className="block w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-base text-slate-900 placeholder:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div
          role="tablist"
          aria-label="Kategori bantuan"
          className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          {[ALL, ...sections].map((section) => {
            const selected = activeSection === section;
            return (
              <button
                key={section}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveSection(section)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors touch-target ${
                  selected
                    ? 'border-brand-blue-600 bg-brand-blue-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {section}
              </button>
            );
          })}
        </div>
      </header>

      {!isSearching && activeSection === ALL && (
        <section
          aria-labelledby="help-tours-heading"
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 sm:p-5"
        >
          <h2
            id="help-tours-heading"
            className="text-lg font-semibold text-slate-900 dark:text-white"
          >
            Tur interaktif
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Aplikasi membuka halamannya lalu menunjukkan bagian-bagian penting satu per satu.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {tours.map((tour) => (
              <button
                key={tour.key}
                type="button"
                onClick={() => runTour(tour)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-left font-medium text-slate-800 transition-colors hover:border-brand-blue-400 hover:bg-brand-blue-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700 touch-target"
              >
                <HelpCircleIcon className="h-5 w-5 shrink-0 text-brand-blue-600 dark:text-brand-blue-400" />
                {tour.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {matchingTopics.length} topik ditemukan
      </p>

      {grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
          <p className="font-medium text-slate-800 dark:text-slate-100">
            Tidak ada topik untuk “{deferredQuery}”.
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Coba kata lain, misalnya “bayar”, “stok”, atau “karyawan”.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setActiveSection(ALL);
            }}
            className="btn btn-primary btn-sm mt-4"
          >
            Tampilkan semua topik
          </button>
        </div>
      ) : (
        grouped.map(({ section, topics }) => (
          <section key={section} aria-labelledby={`help-${section}`} className="space-y-2">
            <h2
              id={`help-${section}`}
              className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              {section}
            </h2>
            <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
              {topics.map((topic) => (
                <details key={topic.id} className="group" open={isSearching || undefined}>
                  <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-slate-900 dark:text-white">
                        {topic.title}
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-400">
                        {topic.summary}
                      </span>
                    </span>
                    <ChevronDownIcon className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-3 px-4 pb-4">
                    <ol className="list-decimal space-y-1.5 pl-5 text-slate-700 marker:text-slate-400 dark:text-slate-300">
                      {topic.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    {topic.tips && (
                      <ul className="space-y-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                        {topic.tips.map((tip) => (
                          <li key={tip}>
                            <span className="font-semibold">Catatan:</span> {tip}
                          </li>
                        ))}
                      </ul>
                    )}
                    {topic.link && (
                      <Link
                        to={topic.link.to}
                        className="inline-block font-medium text-brand-blue-700 underline-offset-2 hover:underline dark:text-brand-blue-300"
                      >
                        {topic.link.label} →
                      </Link>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
};

export default HelpPage;
