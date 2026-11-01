import type { NextConfig } from 'next';

const config: NextConfig = {
 allowedDevOrigins: ['127.0.0.1'],
 outputFileTracingRoot: process.cwd(),
 // Use the compiler API with the project's TypeScript 6 toolchain.
 experimental: { useTypeScriptCli: false },
};

export default config;
