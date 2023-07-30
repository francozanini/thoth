import { useLayoutEffect, useState } from "react";
import { appWindow, LogicalSize } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./components/ui/command";

type Runnable = {
  name: string;
  file_name?: string;
  icon?: string;
  exec: string;
};

export async function runCommand(command: string, afterRun: () => void) {
  const wasSuccessful = await invoke("run", { path: command });

  if (wasSuccessful) {
    afterRun();
  }
}

function App() {
  const [runnables, setRunnables] = useState<Runnable[]>([]);
  const [search, setSearch] = useState("");
  const mainElementId = "main-element";
  useLayoutEffect(() => {
    function resizeWindow() {
      const height = document.getElementById(mainElementId)?.clientHeight ?? 0;
      return appWindow.setSize(new LogicalSize(750, height));
    }
    resizeWindow().catch(console.error);
  }, [runnables]);

  const handleCommandSelected = (exec: string) =>
    runCommand(exec, () => {
      setSearch("");
      setRunnables([]);
      return invoke("hide_window", {});
    });

  const handleSearchInputChange = (newValue: string) =>
    invoke<Runnable[]>("search", {
      searchInput: newValue,
    }).then((result) => {
      setRunnables(result);
      setSearch(newValue);
    });

  return (
    <main className="dark h-full rounded-xl" id={mainElementId}>
      <Command className="rounded-lg border shadow-md" shouldFilter={false}>
        <CommandInput
          id="search-bar"
          placeholder="Type a command or search..."
          autoFocus
          value={search}
          onValueChange={handleSearchInputChange}
        />
        <CommandList>
          {runnables.length === 0 && search.length > 3 && (
            <CommandEmpty>No results</CommandEmpty>
          )}
          {runnables.length > 0 && (
            <CommandGroup heading="Apps">
              {runnables.map((runnable) => (
                <CommandItem
                  key={runnable.exec}
                  onSelect={handleCommandSelected}
                >
                  <span>{runnable.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </main>
  );
}

export default App;
