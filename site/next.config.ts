import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't let `next dev` write agent instruction files into site/. Next 16.3 writes them when it
  // detects an AI coding agent.
  agentRules: false,
};

export default nextConfig;
