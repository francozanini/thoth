import React, { useEffect, useLayoutEffect, useState } from "react";
import { appWindow, LogicalSize } from "@tauri-apps/api/window";
import { SearchResults } from "./SearchResults";
import { SearchBar } from "./SearchBar";
import { Runnable, cn } from "./things";
import { invoke } from "@tauri-apps/api/tauri";

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

function App() {
  const [runnables, setRunnables] = useState<Runnable[]>([]);
  const [footerMessage, setFooterMessage] = useState<string>("thoth.app");
  const mainElementId = "main-element";
  useLayoutEffect(() => {
    function resizeWindow() {
      const height = document.getElementById(mainElementId)?.clientHeight ?? 0;
      return appWindow.setSize(new LogicalSize(750, height));
    }

    resizeWindow().catch(console.error);
  }, [runnables]);

  return (
    <main
      id={mainElementId}
      className="h-full rounded-xl bg-gray-200 font-mono"
    >
      <SearchBar onSearch={setRunnables} />
      <SearchResults
        runnables={runnables}
        onCommand={(message) => {
          setFooterMessage(message);
          setRunnables([]);
          invoke("hide_window", {});
        }}
      />
      <Footer message={footerMessage} includeBorder={runnables.length > 0} />
    </main>
  );
}

export default App;
