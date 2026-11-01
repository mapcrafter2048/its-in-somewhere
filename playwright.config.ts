import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',workers:1,timeout:60000,expect:{timeout:15000},
 use:{baseURL:process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:5173',viewport:{width:1440,height:900},launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage']},headless:true},
 webServer:process.env.PLAYWRIGHT_BASE_URL ? undefined :{command:'npm run dev',url:process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:5173',reuseExistingServer:false,timeout:120000},
 reporter:'list'
});
