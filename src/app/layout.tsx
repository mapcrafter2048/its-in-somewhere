import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '../style.css';
import '../styles/surfaces.css';
import '../styles/desk.css';
import '../styles/physical-life.css';
import '../styles/material-controls.css';
import '../styles/workspaces.css';

export const metadata: Metadata = {
 title: 'It’s In Here Somewhere — The Archive',
 description: 'A bureaucratic treasure hunt. 152,616 files. One sentence. Your lunch can wait.',
};
export const viewport: Viewport = { themeColor: '#18221c' };

export default function RootLayout({ children }: { children: ReactNode }) {
 return <html lang="en"><body>{children}</body></html>;
}
