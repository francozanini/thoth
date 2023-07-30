import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { register } from "@tauri-apps/api/globalShortcut";
import { invoke } from "@tauri-apps/api";

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    invoke("hide_window", {});
  }
});

await register("Control+Shift+Space", async () => {
  if (document.hasFocus()) {
    await invoke("hide_window", {});
  } else {
    await invoke("show_window", {});
    const inputElement: HTMLInputElement = document.getElementById(
      "search-bar"
    )! as HTMLInputElement;
    inputElement.focus();
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
