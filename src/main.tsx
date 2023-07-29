import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { register } from "@tauri-apps/api/globalShortcut";
import { appWindow } from "@tauri-apps/api/window";

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    appWindow.hide();
  }
});

document.addEventListener("onblur", async () => await appWindow.hide());

await register("CommandOrControl+Shift+P", async () => {
  if (document.hasFocus()) {
    await appWindow.hide();
  } else {
    await appWindow.show();
    await appWindow.center();
    await appWindow.setFocus();
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
