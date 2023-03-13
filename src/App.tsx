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
    <div className="gradient">
      <input
        type="text"
        className="h-8 w-full p-2"
        placeholder="Search for apps or commands..."
        onInput={(event) => search(event.currentTarget.value)}
      />
      <ul className="mt-2 px-2">
        {apps.map((app) => (
          <li key={app.name}>{app.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
