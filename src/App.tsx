import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";

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
    <div className="container">
      <input
        type="text"
        onInput={(event) => search(event.currentTarget.value)}
      />
      <ul>
        {apps.map((app) => (
          <li key={app.name}>{app.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
