import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  // Change this if you'd rather use a different bundle identifier — it has to
  // match the one you register in Xcode when signing.
  appId: "com.lukehodg.workoutdiary",
  appName: "Workouts",
  // Capacitor bundles whatever Vite produced, so the app carries its own copy
  // of the assets and doesn't depend on the Cloudflare deployment at all.
  webDir: "dist",
  ios: {
    // Matches the app's dark chrome so the area behind the status bar and
    // home indicator doesn't flash white on launch.
    backgroundColor: "#0a0a0a",
    contentInset: "always",
  },
}

export default config
