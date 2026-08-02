import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

/**
 * Only the hosted build needs a service worker. Inside the iOS wrapper the
 * assets are already on disk and the page is served from capacitor://, where
 * service workers don't exist — so this quietly does nothing there.
 */
if (
  "serviceWorker" in navigator &&
  window.location.protocol.startsWith("http")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is a bonus; failing to register must never break
      // the app itself.
    })
  })
}
