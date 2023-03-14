import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

type DesktopEntry = {
  name: string;
  file_name: string;
  icon: string;
  exec: string;
};

function Runnables({ runnables }: { runnables: DesktopEntry[] }) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  return (
    <ul className="mt-2 px-2">
      {runnables.map((app, index) => (
        <li
          onClick={() => setSelectedIndex(index)}
          className={
            "cursor-pointer hover:bg-gray-400" +
            (index === selectedIndex ? "bg-gray-500" : "")
          }
          key={app.file_name}
        >
          <button
            className="w-full text-left focus:bg-gray-500 focus:outline-none"
            type="button"
          >
            {app.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

function App() {
  const [runnables, setRunnables] = useState<DesktopEntry[]>([]);

  async function search(searchInput: string) {
    const retrieved = await invoke<DesktopEntry[]>("all_apps", {
      searchInput,
    });
    setRunnables(retrieved);
  }

  return (
    <div className="rounded-2xl bg-gray-200 font-mono">
      <input
        autoFocus
        type="text"
        className="h-10 w-full rounded-t-2xl border-b-2 border-solid border-gray-300 bg-gray-200 p-2 pt-4 focus:outline-none"
        placeholder="Search for apps or commands..."
        onChange={(event) => search(event.target.value)}
      />
      <Runnables runnables={runnables} />
    </div>
  );
}

export default App;
