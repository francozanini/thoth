import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import {
  register,
  isRegistered,
  unregister,
} from "@tauri-apps/api/globalShortcut";
import { invoke } from "@tauri-apps/api";

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    invoke("hide_window", {});
  }
});

async function init() {
  await unregister("Control+Shift+Space");

  if (await isRegistered("Control+Shift+Space")) {
    return;
  }

  register("Control+Shift+Space", async () => {
    if (document.hasFocus()) {
      await invoke("hide_window", {});
    } else {
      await invoke("show_window", {});
    }
  });
}

await init();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
