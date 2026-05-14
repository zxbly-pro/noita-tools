import React from "react";
import { createRoot } from "react-dom/client";

import "react-virtualized/styles.css";

import "./index.css";
import "./i18n";
import App from "./components/App";

console.log(`v${APP_VERSION}`);

const root = createRoot(document.getElementById("root")!);
root.render(
  <App />,
);
