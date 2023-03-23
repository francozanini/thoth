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
  }, dependencies);
}

function useListNavigation(listLength: number) {
  const [selectedIndex, moveIndexTo] = useState(0);
  const keyboardHandler = (event: KeyboardEvent) => {
    if (event?.code === "ArrowDown" || event.code === "Tab") {
      event.preventDefault();
      if (selectedIndex === listLength - 1) {
        moveIndexTo(0);
      } else {
        moveIndexTo(Math.min(selectedIndex + 1, listLength - 1));
      }
    }

    if (event?.code === "ArrowUp") {
      if (selectedIndex === 0) {
        moveIndexTo(listLength - 1);
      } else {
        moveIndexTo(Math.max(selectedIndex - 1, 0));
      }
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", keyboardHandler);
    return () => window.removeEventListener("keydown", keyboardHandler);
  });

  return selectedIndex;
}

async function runCommand(
  command: string,
  afterRun: (message: string) => void
) {
  const wasSuccessful = await invoke("run", { path: command });
  const inputElement: HTMLInputElement = document.getElementById(
    "search-bar"
  )! as HTMLInputElement;
  inputElement.value = "";
  afterRun(wasSuccessful ? "thoth.app" : "Error running command");
}

function SearchResults({
  runnables,
  onCommand,
}: {
  runnables: DesktopEntry[];
  onCommand: (message: string) => void;
}) {
  const selectedIndex = useListNavigation(runnables.length);
  useEffect(() => {
    const handleEnterKey = (event: KeyboardEvent) => {
      if (event.code === "Enter") {
        runCommand(runnables[selectedIndex].exec, onCommand).catch(
          console.error
        );
      }
    };
    document.addEventListener("keydown", handleEnterKey);
    return () => document.removeEventListener("keydown", handleEnterKey);
  });

  if (!runnables.length) {
    return null;
  }

  return (
    <ul className="mt-2 px-2">
      {runnables.map((app, index) => (
        <li
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
            onClick={() => runCommand(app.exec, onCommand)}
          >
            {app.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

function cn(...classes: (string | boolean)[]): string {
  return classes.filter(Boolean).join(" ");
}

function Footer({
  includeBorder,
  message = "thoth.app",
}: {
  includeBorder: boolean;
  message: string;
}) {
  return (
    <footer
      className={cn(
        "rounded-b-xl border-solid border-gray-300 text-center text-sm",
        includeBorder && "border-t-2"
      )}
    >
      {message}
    </footer>
  );
}

function SearchBar({
  onSearch,
}: {
  onSearch: (result: DesktopEntry[]) => void;
}) {
  async function search(searchInput: string) {
    const retrieved = await invoke<DesktopEntry[]>("search", {
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
    <form>
      <input
        id="search-bar"
        autoFocus
        type="text"
        className="w-full rounded-t-xl border-b-2 border-solid border-gray-300 bg-gray-200 p-2 pt-4 focus:outline-none"
        placeholder="Search for apps or commands..."
        onKeyDown={preventArrowMovement}
        onChange={(event) => search(event.target.value)}
      />
    </form>
  );
}

function App() {
  const [runnables, setRunnables] = useState<DesktopEntry[]>([]);
  const [footerMessage, setFooterMessage] = useState<string>("thoth.app");
  useAutoWindowResizing([runnables]);

  return (
    <div id="container" className="h-full rounded-xl bg-gray-200 font-mono">
      <SearchBar onSearch={setRunnables} />
      <SearchResults
        runnables={runnables}
        onCommand={(message) => {
          setFooterMessage(message);
          setRunnables([]);
        }}
      />
      <Footer
        message={footerMessage}
        includeBorder={runnables.length > 0}
      ></Footer>
    </div>
  );
}

export default App;
