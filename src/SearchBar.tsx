import React from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Runnable } from "./things";

export function SearchBar({
  onSearch,
}: {
  onSearch: (result: Runnable[]) => void;
}) {
  async function search(searchInput: string) {
    const retrieved = await invoke<Runnable[]>("search", {
      searchInput,
    });
    onSearch(retrieved);
  }

  const preventArrowMovement = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.code === "ArrowUp" || e.code === "ArrowDown") {
      e.preventDefault();
    }
  };

  return (
    <input
      id="search-bar"
      autoFocus
      type="text"
      className="w-full rounded-t-xl border-b-2 border-solid border-gray-300 bg-gray-200 p-2 pt-4 focus:outline-none"
      placeholder="Search for apps or commands..."
      onKeyDown={preventArrowMovement}
      onChange={(event) => search(event.target.value)}
    />
  );
}
