import { escapeHtml as esc } from './dom';
/** Twenty-four individual pen drawings, shown only after identification or collection. */
const drawings:Record<string,string>={
 'fridge:0':'<path d="M16 25 36 12h65v54H36L16 51z"/><circle cx="30" cy="38" r="4"/><path d="m26 34-16-17M46 31h42M46 40h30M46 49h37"/>',
 'fridge:1':'<rect x="33" y="32" width="55" height="39" rx="5"/><path d="M44 32V21a17 17 0 0 1 34 0v11"/><circle cx="60" cy="48" r="4"/><path d="M60 52v9"/>',
 'fridge:2':'<circle cx="60" cy="40" r="29"/><circle cx="60" cy="40" r="24"/><path d="M60 22v36M44 31l32 18M44 49l32-18m-16 7-6-6m6 6 6-6m-6 14-6 6m6-6 6 6"/>',
 'fridge:3':'<ellipse cx="49" cy="23" rx="13" ry="18" transform="rotate(-30 49 23)"/><path d="m56 39 24 31q8 8 12 2L65 35"/>',
 'betting:0':'<circle cx="60" cy="40" r="29"/><circle cx="60" cy="40" r="22"/><path d="M49 28h22M60 28v25M34 28l7 4m-7 20 7-4m38-16 7-4m-7 20 7 4"/>',
 'betting:1':'<path d="M26 9h65l-3 59-8-4-8 5-8-5-8 5-8-5-8 5-13-3zM40 26h37M40 39h37M40 52h22m-26-8 46-17m-44-4 42 25"/>',
 'betting:2':'<path d="m28 64 8-22L87 7l10 14-51 35zM36 42l10 14m-17 6 10-1m1-15L91 12"/>',
 'betting:3':'<rect x="14" y="19" width="91" height="48" rx="2"/><path d="m15 20 44 30 45-30M15 66l29-26m61 26L76 40"/><text x="51" y="34">£</text>',
 'ghost:0':'<rect x="33" y="14" width="55" height="59" rx="4"/><path d="M49 14V5h22v9M44 58h32"/><rect x="46" y="27" width="29" height="22" rx="2"/>',
 'ghost:1':'<rect x="10" y="22" width="100" height="35" rx="5"/><circle cx="19" cy="39" r="2"/><circle cx="101" cy="39" r="2"/><text x="34" y="48" class="sketch-large">447</text>',
 'ghost:2':'<path d="m14 55 6-30h80l6 30zM20 25l5-7h70l5 7M21 55h78"/><text x="35" y="44">ELLIS</text>',
 'ghost:3':'<path d="m42 49-7 27 18-8 8 8 4-29m8-1 14 28-17-7-8 9-2-28"/><circle cx="60" cy="30" r="23"/><circle cx="60" cy="30" r="16"/><path d="m50 30 7 7 13-15"/>',
 'long-47:0':'<ellipse cx="59" cy="20" rx="29" ry="10"/><path d="M30 20v44c0 13 58 13 58 0V20M31 32c10 10 47 10 56 0"/><text x="42" y="56">TEA</text>',
 'long-47:1':'<ellipse cx="39" cy="22" rx="14" ry="19"/><path d="m44 40 35 29q8 6 12 0L54 34M76 56l7-6m-17 0 6-5M34 14l10 10m-11-4 8-8"/>',
 'long-47:2':'<ellipse cx="60" cy="42" rx="39" ry="28"/><ellipse cx="60" cy="42" rx="33" ry="23"/><path d="m60 25 13 16-13 16-13-16zM30 66q29 10 61-1"/>',
 'long-47:3':'<circle cx="45" cy="34" r="23"/><circle cx="45" cy="34" r="18"/><path d="m63 50 30 23 5-6-31-23M30 27h29M29 34h33M31 41h28M39 18v32M47 17v34M55 21v26"/>',
 'long-57:0':'<path d="M18 16h82v17q-10 7 0 14v18H18V47q10-7 0-14zM77 21v39" stroke-dasharray="3 2"/><text x="29" y="42">PASS</text>',
 'long-57:1':'<path d="M32 10h56l-3 60-8-5-8 5-8-5-8 5-8-5-10 5zM41 21h37"/><text x="44" y="55" class="sketch-large">000</text>',
 'long-57:2':'<circle cx="61" cy="12" r="8"/><path d="M61 20v10"/><rect x="30" y="31" width="62" height="32" rx="5"/><path d="M39 31v32M47 38h33v18H47zM30 63l-6 6h72l-4-6"/>',
 'long-57:3':'<rect x="17" y="13" width="88" height="56" rx="3"/><rect x="21" y="17" width="80" height="48" rx="2"/><path d="m42 32 7 7-13 15m10-25 8-5 7 6-5 8-7 1M68 30h22M68 41h17M68 52h20"/>',
 'short-27:0':'<circle cx="60" cy="38" r="26"/><circle cx="52" cy="33" r="2"/><circle cx="68" cy="33" r="2"/><path d="M47 44q13 15 26 0M42 60l-7 13m41-13 7 13"/>',
 'short-27:1':'<path d="M32 9h44l16 16v47H32zM76 9v17h16"/><rect x="42" y="37" width="12" height="12"/><path d="m44 42 3 4 6-7M62 40h19M42 60h39"/><text x="50" y="25">42</text>',
 'short-27:2':'<path d="m21 66 8-21L79 9l12 15-50 34zM29 45l12 13M28 61l7 2M36 47l48-33"/><path d="m96 29 2 9 9 3-9 4-2 9-4-9-9-4 9-3z"/>',
 'short-27:3':'<path d="m20 18 83 4-4 47-82-4zM27 26l67 3-2 31-67-3z"/><path d="m60 31 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"/>'
};
export function artifactSketch(id:string,name:string){return `<svg viewBox="0 0 120 85" role="img" aria-label="Ink drawing of ${esc(name)}"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${drawings[id]??''}</g><style>text{fill:currentColor;stroke:none;font:12px 'Courier New',monospace}.sketch-large{font-size:23px}</style></svg>`;}
