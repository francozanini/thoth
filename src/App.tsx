import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

type DesktopEntry = {
  name: string;
  icon: string;
  exec: string;
};

function Runnables({ runnables }: { runnables: ReadonlyArray<DesktopEntry> }) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  return (
    <ul className="mt-2 px-2">
      {runnables.map((app, index) => (
        <li
          className={
            "cursor-pointer hover:bg-gray-400" +
            (index === selectedIndex ? "bg-gray-500" : "")
          }
          key={app.name}
        >
          <button onClick={() => setSelectedIndex(index)} type="button">
            {app.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

function App() {
  const [runnables, setRunnables] = useState<ReadonlyArray<DesktopEntry>>([]);

  async function search(searchInput: string) {
    setRunnables(await invoke("all_apps", { searchInput }));
  }

  return (
    <div className="rounded-2xl bg-gray-200 font-mono">
      <input
        type="text"
        className="h-10 w-full rounded-t-2xl border-b-2 border-solid border-gray-300 bg-gray-200 p-2 pt-4 focus:outline-none"
        placeholder="Search for apps or commands..."
        onInput={(event) => search(event.currentTarget.value)}
      />
      <Runnables runnables={runnables} />
    </div>
  );
}

export default App;
