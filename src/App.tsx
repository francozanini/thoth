import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

type DesktopEntry = {
  name: string;
  icon: string;
  exec: string;
};

function App() {
  const [apps, setApps] = useState<ReadonlyArray<DesktopEntry>>([]);

  async function search(searchInput: string) {
    setApps(await invoke("all_apps", { searchInput }));
  }

  return (
    <div className="bg-gray-200 font-mono">
      <input
        type="text"
        className="h-10 w-full border-b-2 border-solid border-gray-300 bg-gray-200 p-2 pt-4 focus:outline-none"
        placeholder="Search for apps or commands..."
        onInput={(event) => search(event.currentTarget.value)}
      />
      <ul className="mt-2 px-2">
        {apps.map((app) => (
          <li className="cursor-pointer hover:bg-gray-400" key={app.name}>
            <button
              type="button"
              className="focus:bg-gray-400 focus:outline-none"
            >
              {app.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
