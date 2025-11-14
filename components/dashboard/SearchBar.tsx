"use client";

import { useState } from "react";
import { SearchIcon } from "./Icons";

export default function SearchBar({
  onSearch,
  placeholder = "Search certificates...",
}: {
  onSearch: (query: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <SearchIcon />
      </div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-10 py-3 text-sm text-white placeholder:text-slate-400 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
      />
      {query && (
        <button
          onClick={() => {
            setQuery("");
            onSearch("");
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
        >
          ×
        </button>
      )}
    </div>
  );
}

