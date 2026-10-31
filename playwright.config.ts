import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',workers:1,timeout:60000,expect:{timeout:15000},
 use:{baseURL:process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:5173',viewport:{width:1440,height:900},launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage']},headless:true},
 webServer:{command:'npm run dev -- --port 5173 --strictPort',url:process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:5173',reuseExistingServer:true,timeout:30000},
 reporter:'list'
});
