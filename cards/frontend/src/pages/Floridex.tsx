import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import BirdCard from '../components/BirdCard';
import BirdModal from '../components/BirdModal';
import Footer from '../components/Footer';
import './Floridex.css';

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

/* ── Get userId from localStorage (set at login) ── */
function getUserId(): string | null {
  try { return localStorage.getItem('userId'); } catch { return null; }
}

/* ══════════════════════════════════════════════
   Floridex page
   ══════════════════════════════════════════════ */
export default function Floridex() {
  /* ── Remote bird data ── */
  const [birds, setBirds] = useState<Bird[]>([]);

  /* ── Seen state — sourced from account API ── */
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set());

  /* ── Sighting metadata (date / city) — sourced from account API ── */
  const [sightings, setSightings] = useState<Record<number, Sighting>>({});

  /* ── Loading / error state ── */
  const [loadingSeenIds, setLoadingSeenIds] = useState(true);

  /* ── Filter / sort state ── */
  const [search,       setSearch]       = useState('');
  const [seenFilter,   setSeenFilter]   = useState<SeenFilter>('all');
  const [familyFilter, setFamilyFilter] = useState('');
  const [sortBy,       setSortBy]       = useState<SortMode>('index');

  /* ── Modal state ── */
  const [selectedBird, setSelectedBird] = useState<Bird | null>(null);

  /* ── Fetch all birds from Express API ── */
  useEffect(() => {
    fetch('/api/birds')
      .then((res) => res.json())
      .then((data: Bird[]) => setBirds(data))
      .catch(console.error);
  }, []);

  /* ── Fetch saved birds for this account from the API ── */
  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      setLoadingSeenIds(false);
      return;
    }

    setLoadingSeenIds(true);

    fetch('/api/get-saved-birds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error('get-saved-birds error:', data.error);
          return;
        }

        const ids = new Set<number>();
        const newSightings: Record<number, Sighting> = {};

        for (const bird of data.identfiedBirds ?? []) {
          // The API returns full bird objects merged with metadata.
          // ID field matches the Birds collection.
          const id = Number(bird.ID ?? bird.id);
          if (!Number.isFinite(id)) continue;

          ids.add(id);

          if (bird.foundCity || bird.foundDate) {
            newSightings[id] = {
              city: bird.foundCity ?? undefined,
              date: bird.foundDate ?? undefined,
            };
          }
        }

        setSeenIds(ids);
        setSightings(newSightings);
      })
      .catch(console.error)
      .finally(() => setLoadingSeenIds(false));
  }, []);

  /* ── Toggle seen — calls /api/save-bird (add) or /api/unsave-bird (remove) ── */
  function toggleSeen(id: number): void {
    const userId = getUserId();
    if (!userId) return;

    const isCurrentlySeen = seenIds.has(id);

    // Optimistic UI update
    setSeenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else              next.add(id);
      return next;
    });

    if (isCurrentlySeen) {
      // Remove from account — call unsave endpoint if available,
      // otherwise re-fetch after a short delay to stay in sync.
      fetch('/api/unsave-bird', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, birdId: String(id) }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.error('unsave-bird error:', data.error);
            // Revert optimistic update on failure
            setSeenIds((prev) => { const next = new Set(prev); next.add(id); return next; });
          }
        })
        .catch((err) => {
          console.error('unsave-bird failed:', err);
          setSeenIds((prev) => { const next = new Set(prev); next.add(id); return next; });
        });
    } else {
      // Save to account
      const sighting = sightings[id];
      fetch('/api/save-bird', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          birdId: String(id),
          foundCity: sighting?.city ?? undefined,
          foundDate: sighting?.date ?? undefined,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.error('save-bird error:', data.error);
            // Revert optimistic update on failure
            setSeenIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
          }
        })
        .catch((err) => {
          console.error('save-bird failed:', err);
          setSeenIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        });
    }
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
      <Header/>

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
        {loadingSeenIds ? (
          <div className="no-results">Loading your Floridex…</div>
        ) : filtered.length === 0 ? (
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
