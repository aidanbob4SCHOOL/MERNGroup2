import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import BirdCard from '../components/BirdCard';
import BirdModal from '../components/BirdModal';
import Footer from '../components/Footer';
import './Home.css';

/* ── Types ── */
interface Bird {
  id: number;
  name: string;
  color: string;
  image: string;
  order: string;
  family: string;
  genus: string;
  species: string;
}

interface Sighting {
  date?: string;
  city?: string;
}

type SeenFilter = 'all' | 'seen' | 'unseen';
type SortMode   = 'index' | 'name' | 'family';

/* ── localStorage helpers ── */
const STORAGE_KEY  = 'floridex_seen';
const SIGHTING_KEY = 'floridex_sightings';

function loadSeenIds(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set<number>(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}
function saveSeenIds(set: Set<number>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...set])); } catch {}
}
function loadSightings(): Record<number, Sighting> {
  try {
    const raw = localStorage.getItem(SIGHTING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

/* ══════════════════════════════════════════════
   Home page
   ══════════════════════════════════════════════ */
export default function Home() {
  /* ── Remote bird data ── */
  const [birds, setBirds] = useState<Bird[]>([]);

  /* ── Seen state — sourced from localStorage ── */
  const [seenIds, setSeenIds] = useState<Set<number>>(loadSeenIds);

  /* ── Sighting metadata (date / city) ── */
  const [sightings] = useState<Record<number, Sighting>>(loadSightings);

  /* ── Filter / sort state ── */
  const [search,       setSearch]       = useState('');
  const [seenFilter,   setSeenFilter]   = useState<SeenFilter>('all');
  const [familyFilter, setFamilyFilter] = useState('');
  const [sortBy,       setSortBy]       = useState<SortMode>('index');

  /* ── Modal state ── */
  const [selectedBird, setSelectedBird] = useState<Bird | null>(null);

  /* ── Fetch birds from Express API ── */
  useEffect(() => {
    fetch('/api/birds')
      .then((res) => res.json())
      .then((data: Bird[]) => setBirds(data))
      .catch(console.error);
  }, []);

  /* ── Toggle seen + persist ── */
  function toggleSeen(id: number): void {
    setSeenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else              next.add(id);
      saveSeenIds(next);
      return next;
    });
  }

  /* ── Derived data ── */
  const families = useMemo(
    () => [...new Set(birds.map((b) => b.family))].sort(),
    [birds]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = birds.slice();

    if (q)
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.family.toLowerCase().includes(q)
      );

    if (familyFilter)
      list = list.filter((b) => b.family === familyFilter);

    if (seenFilter === 'seen')
      list = list.filter((b) => seenIds.has(b.id));
    else if (seenFilter === 'unseen')
      list = list.filter((b) => !seenIds.has(b.id));

    if (sortBy === 'name')
      list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'family')
      list.sort((a, b) => a.family.localeCompare(b.family) || a.id - b.id);

    return list;
  }, [birds, search, familyFilter, seenFilter, sortBy, seenIds]);

  const seenCount = useMemo(
    () => birds.filter((b) => seenIds.has(b.id)).length,
    [birds, seenIds]
  );

  // Birds that are seen — passed to Header for the multi-color progress bar
  const seenBirds = useMemo(
    () => birds.filter((b) => seenIds.has(b.id)),
    [birds, seenIds]
  );

  return (
    <div className="home-page">
      {/* Sticky header: logo + title + progress + logout + Log Bird */}
      <Header
        seenCount={seenCount}
        total={birds.length}
        seenBirds={seenBirds}
      />

      {/* Controls strip: search + family filter + seen filter + sort */}
      <SearchBar
        search={search}
        setSearch={setSearch}
        seenFilter={seenFilter}
        setSeenFilter={setSeenFilter}
        familyFilter={familyFilter}
        setFamilyFilter={setFamilyFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        families={families}
        totalCount={birds.length}
        resultsCount={filtered.length}
      />

      {/* Bird grid */}
      <div id="grid">
        {filtered.length === 0 ? (
          <div className="no-results">No birds match your search.</div>
        ) : (
          filtered.map((bird) => (
            <BirdCard
              key={bird.id}
              bird={bird}
              isSeen={seenIds.has(bird.id)}
              onClick={() => setSelectedBird(bird)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* Bird detail modal — only mounts when a bird is selected */}
      <BirdModal
        bird={selectedBird}
        isSeen={selectedBird ? seenIds.has(selectedBird.id) : false}
        sighting={selectedBird ? sightings[selectedBird.id] : undefined}
        onClose={() => setSelectedBird(null)}
        onToggleSeen={toggleSeen}
      />
    </div>
  );
}
