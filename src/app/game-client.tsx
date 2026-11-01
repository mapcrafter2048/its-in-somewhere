"use client";

import { useEffect } from 'react';
import { startGame } from '../main';

export default function Game() {
 useEffect(() => {
  void startGame().catch(error => {
   console.error('Game startup failed:', error);
   const host = document.getElementById('app');
   if (host) host.innerHTML = '<div class="fatal" role="alert"><h1>The archive could not open.</h1><p>Please reload to retry.</p><button onclick="location.reload()">Reload archive</button></div>';
  });
 }, []);
 // React owns the host; the imperative game owns all of its contents.
 return <div id="app" dangerouslySetInnerHTML={{ __html: '<div id="loading" role="status">Opening the archive…</div>' }} />;
}
