import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";

function useArray<T>(initialState: T[]) {
    const [array, setArray] = useState(initialState);

    function add(toAdd: T) {
        setArray([...array, toAdd]);
    }

    function remove(toRemove: T) {
        setArray(array.filter(e => e !== toRemove));
    }

    return {array, add, remove} as const;
}

type DesktopEntry = {
    name: string,
    icon: string,
    exec: string,
}

function App() {
    const [apps, setApps] = useState<ReadonlyArray<DesktopEntry>>([]);

  async function search(searchInput: string) {
      setApps(await invoke('all_apps', { searchInput}))
  }

  return (
    <div className="container">
        <input type='text' onInput={event => search(event.currentTarget.value)} />
        <ul>{apps.slice(0, 10).map(app => <li key={app.name}>{app.name}</li>)}</ul>
    </div>
  );
}

export default App;
