import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Send metadata in the initial head for every crawler and browser.
  // Avoid relying on JavaScript to relocate streamed metadata from the body.
  htmlLimitedBots: /.*/,
};

export default nextConfig;
