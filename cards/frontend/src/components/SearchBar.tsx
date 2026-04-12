import React from 'react';
import './SearchBar.css';

type SeenFilter = 'all' | 'seen' | 'unseen';
type SortMode = 'index' | 'name' | 'family';

interface SearchBarProps {
  search: string;
  setSearch: (v: string) => void;
  seenFilter: SeenFilter;
  setSeenFilter: (v: SeenFilter) => void;
  familyFilter: string;
  setFamilyFilter: (v: string) => void;
  sortBy: SortMode;
  setSortBy: (v: SortMode) => void;
  families: string[];
  totalCount: number;
  resultsCount: number;
}

const SEEN_BUTTONS: { val: SeenFilter; label: string }[] = [
  { val: 'all',    label: 'All'      },
  { val: 'seen',   label: 'Seen'     },
  { val: 'unseen', label: 'Not Seen' },
];

export default function SearchBar({
  search,
  setSearch,
  seenFilter,
  setSeenFilter,
  familyFilter,
  setFamilyFilter,
  sortBy,
  setSortBy,
  families,
  totalCount,
  resultsCount,
}: SearchBarProps) {
  const showResultsLabel = resultsCount !== totalCount;

  return (
    <div id="controls-bar">
      <div id="controls-left">
        {/* Search input */}
        <input
          id="search-input"
          type="text"
          placeholder="Search birds…"
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Filter panel */}
        <div id="filter-panel">
          <span className="ctrl-label">Filter</span>

          <select
            id="family-select"
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
          >
            <option value="">Family</option>
            {families.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          {/* All / Seen / Not Seen toggle buttons */}
          <div id="seen-filter-btns">
            {SEEN_BUTTONS.map(({ val, label }) => (
              <button
                key={val}
                className={`seen-btn${seenFilter === val ? ' active' : ''}`}
                onClick={() => setSeenFilter(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort panel */}
        <div id="sort-panel">
          <span className="ctrl-label">Sort</span>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortMode)}
          >
            <option value="index">Index</option>
            <option value="name">Name</option>
            <option value="family">Family</option>
          </select>
        </div>
      </div>

      {/* Results label — only shown when filtered */}
      <div id="results-label">
        {showResultsLabel ? `Showing ${resultsCount} of ${totalCount} birds` : ''}
      </div>
    </div>
  );
}
