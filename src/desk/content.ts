import type { Contact } from './types';
export const CONTACTS: Record<Contact, string> = { martin: 'Martin Voss', tess: 'Tess Morgan', facilities: 'Facilities', accounts: 'Accounts' };
export const CASES = [
    { id: 'fridge', title: 'Cold war', contact: 'tess' as Contact, intro: 'Clive would like his sandwich classified as a security incident. Compare his incident register with the witness account.', resolution: 'The sandwich investigation is closed. The yoghurt has requested separate representation.', items: ['Sandwich evidence tag', 'Miniature padlock', 'Refrigerator catalogue badge', 'Abandoned yoghurt spoon'] },
    { id: 'betting', title: 'The lunch market', contact: 'tess' as Contact, intro: 'Someone called the betting pool a catering forecast. Please compare the workbook with its terms and conditions.', resolution: 'The stakes were refunded. Your professional existence is no longer a tradable instrument.', items: ['Betting token', 'Crossed-out odds slip', 'Catering pencil', 'Unclaimed refund envelope'] },
    { id: 'ghost', title: 'The employee who never arrived', contact: 'accounts' as Contact, intro: 'Ellis Ward has perfect attendance and no identifiable desk. Please compare the facilities ticket with the payroll evidence.', resolution: 'The cupboard remains employed as a cupboard. Its promotion prospects are modest.', items: ["Ellis’s blank badge", 'Extension 447 plate', 'Cupboard nameplate', 'Attendance rosette'] },
    { id: 'long-47', title: 'The tea budget', contact: 'accounts' as Contact, intro: 'The tea budget has doubled. The tea has not. Compare the retained order records with the private club account.', resolution: 'The coffee was repaid. Nobody has volunteered to calculate interest on the teabags.', items: ['Emergency teabag tin', 'Ceremonial teaspoon', 'Club coaster', 'Exhausted tea strainer'] },
    { id: 'long-57', title: 'The photocopier queue', contact: 'facilities' as Contact, intro: 'Priority passes were sold for an unavailable copier. Compare the sales account with the repair record.', resolution: 'Printing has resumed without a class system. Please queue in the ordinary human order.', items: ['Priority pass', 'Queue number zero', 'Toner charm', 'Laminated repair promise'] },
    { id: 'short-27', title: 'The perfect survey', contact: 'martin' as Contact, intro: 'One hundred percent satisfaction is an excellent result. Accounts has a question about the denominator. Compare the original survey and retained workbook.', resolution: 'The revised score will not be displayed on my door. This is a typography decision.', items: ['Satisfaction badge', 'Forty-second ballot', 'Enthusiastic pencil', 'Miniature award plaque'] }
];
export const ARTIFACTS = CASES.flatMap(c => c.items.map((name, i) => ({ id: `${c.id}:${i}`, caseId: c.id, name, shape: i % 4, description: [
        'A small object with a disproportionately thorough paper trail.',
        'Retained after everyone agreed it belonged to somebody else.',
        'Evidence of office life. Not evidence in your assignment.',
        'The accompanying form has been lost. The object seems relieved.'
    ][i] })));
export const REWARDS = [{ at: 4, name: 'RETAINED FOR REASONS', kind: 'stamp' }, { at: 8, name: 'Desk paperweight', kind: 'accessory' }, { at: 12, name: 'PROVISIONALLY UNDERSTOOD', kind: 'stamp' }, { at: 16, name: 'Miniature display stand', kind: 'accessory' }, { at: 20, name: 'ADMINISTRATIVELY COMPLETE', kind: 'stamp' }, { at: 24, name: 'Certificate of incidental thoroughness', kind: 'certificate' }];
export const NOTICES = [
    'If the corridor seems familiar, please confirm that you have actually left it.',
    'The cursor has been reported to Facilities. Facilities cannot reproduce it.',
    'Please stop referring to the ceiling as a texture. It has worked here longer than you.',
    'If you can read this from the other side of the room, your text settings are approved.',
    'This notice supersedes the notice asking you not to supersede notices.',
    'The suggestion box is full. Suggestions for a second box are being accepted verbally.',
    'Please label your lunch before reporting its disappearance. After eating it is too late.',
    'The emergency stationery is for stationery emergencies. Enthusiasm is not an emergency.',
    'No meeting may be described as brief until it has ended.',
    'The lost-property form has been mislaid. Please retain anything you find.',
    'Do not straighten the archive. The crooked folders are load-bearing emotionally.',
    'This department has gone zero-paper. Please sign the attached acknowledgement.'
];
export const MUG_DISPUTE = [
    'Unclaimed mug in the kitchenette. Blue. Contains a spoon and an atmosphere.',
    'The blue mug is not unclaimed. Its owner is considering their position.',
    'Please stop adding evidence labels to the blue mug. It is already under review.',
    'Accounts will not reimburse a replacement atmosphere. Wash the mug.',
    'The mug has been washed. Three departments have claimed responsibility.',
    'The mug now has a nameplate. The spoon has lodged an appeal.'
];
