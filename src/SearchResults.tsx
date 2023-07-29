import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { cn, Runnable } from "./things";
import { useState } from "react";

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

  if (wasSuccessful) {
    afterRun("thoth.app");
  } else {
    afterRun("Error running command");
  }
}

export function SearchResults({
  runnables,
  onCommand,
}: {
  runnables: Runnable[];
  onCommand: (message: string) => void;
}) {
  const selectedIndex = useListNavigation(runnables.length);
  const handleEnterKey = async (event: KeyboardEvent) => {
    if (event.code === "Enter") {
      runCommand(runnables[selectedIndex].exec, onCommand);
    }
  };

  useEffect(() => {
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
          key={app.name}
        >
          <button
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
