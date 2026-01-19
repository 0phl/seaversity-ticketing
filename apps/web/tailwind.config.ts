import type { Config } from "tailwindcss";
import sharedConfig from "@seaversity/tailwind-config";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  presets: [sharedConfig as Config],
};

export default config;
