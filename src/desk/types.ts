export type Ink = 'black' | 'blue' | 'red' | 'green';
export type Paper = 'cream' | 'rose' | 'blue' | 'sage';
export interface SketchStroke {
    tool: 'marker' | 'eraser';
    color: Ink;
    width: number;
    points: [
        number,
        number
    ][];
}
export interface PaperNote {
    id: number;
    sheet?: number;
    title: string;
    text: string;
    paper: Paper;
    strokes: SketchStroke[];
    digitalExcerpt?: { id: string; text: string; label: string };
    excerpt?: {
        file: number;
        text: string;
        label: string;
    };
}
export type NoteKind = 'notebook' | 'sticky';
export type ToolId = 'pad' | 'thread' | 'marker';
export type StickyColor = 'yellow' | 'rose' | 'blue' | 'sage';
export interface StickyNote { id:number; text:string; color:StickyColor; place:'box'|'inventory'|'held'|'board' }
export interface VendingState { drink:'cola'|'orange'|'water'|null; place:'none'|'dispensing'|'tray'|'held'|'inventory'; due:number; empty:boolean }
export interface BoardPin {
    kind?: NoteKind;
    note: number;
    x: number;
    y: number;
}
export interface BoardString {
    fromKind?: NoteKind;
    toKind?: NoteKind;
    from: number;
    to: number;
    color: Ink;
    label: string;
}
export type Contact = 'martin' | 'tess' | 'facilities' | 'accounts';
export type MailTopic = 'inquiry' | 'evidence' | 'lead' | 'location' | 'martin';
export type DesktopApp = 'mail' | 'files' | 'directory' | 'print' | 'snake' | 'catalogue';
export interface ResponseHistory { choice: string; mail: number; at: number }
export interface MailDraft {
    choice?: string;
    recipient: Contact;
    caseId: string;
    topic: MailTopic;
    artifact: string;
    body: string;
    attachments: number[];
}
export interface DeskMail extends MailDraft {
    id: number;
    direction: 'in' | 'out';
    subject: string;
    text: string;
    sentAt: number;
    due: number;
    read: boolean;
    signature: string;
    hint?: number;
    resolves?: string;
}
export interface DeskLife {
    unlockedFiles?:string[];
    version: 3;
    sheetPapers?: Record<number,Paper>;
    stickies: StickyNote[];
    nextSticky: number;
    stickyDraft: {text:string;color:StickyColor};
    tools: Record<ToolId,'box'|'inventory'|'held'>;
    vending: VendingState;
    responses: ResponseHistory[];
    snakeBest: number;
    notes: PaperNote[];
    nextNote: number;
    pins: BoardPin[];
    strings: BoardString[];
    collected: string[];
    identified: string[];
    rewards: number[];
    stamp: string;
    fileStamps: Record<string, string>;
    mail: DeskMail[];
    drafts: MailDraft[];
    nextMail: number;
    resolved: string[];
    counters: {
        issuedAt: number;
        notesWritten: number;
        mailSent: number;
    };
}
