import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow, LogicalSize } from "@tauri-apps/api/window";

type DesktopEntry = {
  name: string;
  file_name: string;
  icon: string;
  exec: string;
};

function useAutoWindowResizing(dependencies: React.DependencyList) {
  useEffect(() => {
    async function resizeWindow() {
      const height = document.getElementById("container")?.clientHeight ?? 0;
      await appWindow.setSize(new LogicalSize(750, height));
    }

    resizeWindow().catch(console.error);
  }, [dependencies]);
}

function Runnables({ runnables }: { runnables: DesktopEntry[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  useAutoWindowResizing(runnables);

  if (!runnables.length) {
    return null;
  }

  async function runCommand(command: string) {
    console.log(command);
    await invoke("spawn_process", { path: command });
  }

  return (
    <ul className="mt-2 px-2">
      {runnables.map((app, index) => (
        <li
          onClick={() => setSelectedIndex(index)}
          className={cn(
            "cursor-pointer",
            index === selectedIndex && "bg-gray-400"
          )}
          key={app.file_name}
        >
          <button
            id={index === 0 ? "first-search-result" : ""}
            className="w-full text-left focus:bg-gray-400 focus:outline-none"
            type="button"
            onClick={() => runCommand(app.exec)}
          >
            {app.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

function cn(...classes: (string | boolean)[]): string {
  return classes.filter(Boolean).join(", ");
}

function Footer({ searchIsDone }: { searchIsDone: boolean }) {
  return (
    <footer
      className={cn(
        "rounded-b-xl border-solid border-gray-300 text-center text-sm",
        searchIsDone && "border-t-2"
      )}
    >
      thoth.app
    </footer>
  );
}

function SearchBar({
  onSearch,
}: {
  onSearch: (result: DesktopEntry[]) => void;
}) {
  async function search(searchInput: string) {
    const retrieved = await invoke<DesktopEntry[]>("all_apps", {
      searchInput,
    });
    onSearch(retrieved);
  }
  return (
    <input
      autoFocus
      type="text"
      className="w-full rounded-t-xl border-b-2 border-solid border-gray-300 bg-gray-200 p-2 pt-4 focus:outline-none"
      placeholder="Search for apps or commands..."
      onChange={(event) => search(event.target.value)}
    />
  );
}

function App() {
  const [runnables, setRunnables] = useState<DesktopEntry[]>([]);

  return (
    <div id="container" className="h-full rounded-xl bg-gray-200 font-mono">
      <SearchBar onSearch={setRunnables} />
      <Runnables runnables={runnables} />
      <Footer searchIsDone={runnables.length > 0}></Footer>
    </div>
  );
}

export default App;
