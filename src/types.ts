export type DocumentKind = 'memo'|'email'|'report'|'expense'|'calls'|'calendar'|'spreadsheet'|'letter'|'ticket'|'proposal'|'training'|'transcript'|'visitor'|'maintenance'|'resignation'|'survey'|'complaint'|'research'|'reference';
export interface Cell {value:string;comment?:string;clue?:boolean}
export interface Sheet {name:string;columns:string[];rows:Cell[][];hiddenRows?:number[]}
export interface Voucher {value:number;note:string}
export interface SourceRef {id:string;excerpt:number;title:string;section:string}
export type RecordFamily = 'fax'|'carbon'|'access'|'delivery'|'receipt'|'chart'|'plan'|'contract'|'annotated'|'damaged'|'newsletter'|'revision';
export interface RecordPresentation {
 family:RecordFamily; register:string; fields:[string,string][];
 table?:{columns:string[];rows:string[][]};
 diagram?:{kind:'chart'|'plan';labels:string[];values?:number[]};
 annotation?:string; revision?:{series:string;version:string};
}
export interface ArchiveDocument {
 id:number;title:string;kind:DocumentKind;author:string;date:string;subject:string;pages:string[];
 sheets?:Sheet[];annotation?:string;story?:string;chapter?:number;evidence?:string;next?:number;previous?:number;fragment?:boolean;
 voucher?:Voucher;source?:SourceRef;scenario?:number;category?:'reference'|'office'|'social'|'evidence';bodyKey?:string;
 presentation?:RecordPresentation;thread?:string;
}
export interface StoryChapter {title:string;kind?:DocumentKind;text:string;evidence:string;sheet?:Sheet}
export interface Story {id:string;title:string;description:string;chapters:StoryChapter[];ending:string;reward:number}
export type UpgradeId = 'drawers'|'browsing'|'summaries'|'bookmarks'|'highlighter'|'index'|'comparison'|'tabs'|'stationery'|'pinboard'|'sticky-capacity'|'sticky-colours';
export interface Settings {sensitivity:number;volume:number;textSize:number;quality:'low'|'medium'|'high';reducedMotion:boolean}
export interface CabinetMarker {/** Storage catalogue unit ID; 0–511 retain the original front-bank meaning. */ cabinet:number;color:'gold'|'blue'|'rose'|'green';label:string}
export interface LegacyBindings {target:number;inspected:number[];storyLocations:Record<string,number[]>;fragments:number[]}
export interface BoardStroke {tool:'marker'|'eraser';color:'black'|'blue'|'red';width:number;points:[number,number][]}
export type PropId='fan'|'shredder'|'printer-input'|'sink'|'coffee'|'coffee-cup'|'water'|'fridge'|'microwave'|'microwave-control'|'cupboard-0'|'cupboard-1'|'cupboard-2'|'cupboard-3'|'printer'|'printer-output'|'chair-desk'|'chair-work'|'chair-dining';
export interface OfficeState {fanOn?:boolean;open:PropId[];coffee:0|1;water:0|1;printedFile:number|null}
export interface PropTarget {kind:'prop';id:PropId;label:string}
export interface Save {
 /** Missing means the released archive, including all its original wording. */
 recordPack?:1;
 deskLife?:import('./desk/types').DeskLife;
 inventoryVersion?:1;
 environmentVersion?:number;
 zone?:'hub'|'archive';
 physical?:import('./physical').PhysicalState;
 office?:OfficeState;
 whiteboards?:BoardStroke[][];
 version:2|3;contentVersion:2|3;placementVersion?:2|3;seed:number;target:number;wing:number;started:boolean;completed:boolean;
 position:[number,number,number];rotation:[number,number];inspected:number[];searched:number[];bookmarks:number[];clues:number[];
 claimedStories:string[];claimedMilestones:number[];credits:number;upgrades:UpgradeId[];hintLevel:number;selectedFile:number|null;
 selectedPhrase:string;messages:string[];settings:Settings;playSeconds:number;
 collectedVouchers:number[];redeemedVouchers:number[];markers:CabinetMarker[];earlyVouchers:number[];legacy?:LegacyBindings;
}
export interface SourceManifestEntry {id:string;title:string;author:string;edition:string;url:string;license:string;licenseUrl:string;notice:string;file:string;sha256:string;excerpts:number;words:number}
export interface ContentPack {id:string;excerpts:{section:string;text:string}[]}
