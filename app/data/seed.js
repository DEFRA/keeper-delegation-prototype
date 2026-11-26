//
// Starting data for the prototype. Copied into each user's session on first
// request (see routes.js) so changes made during a walkthrough don't leak
// between users. "Clear data" in the footer resets it.
//

// A larger business, to see how screens cope with lots of holdings
const NORTHFIELD = [
  ['0004', 'Northfield Farm', 'Kendal'], ['0011', 'Home Farm', 'Kendal'], ['0017', 'Beck House', 'Sedbergh'],
  ['0023', 'Top Field', 'Sedbergh'], ['0031', 'Mill Lane Barns', 'Kirkby Lonsdale'], ['0038', 'Ridgeway', 'Kirkby Lonsdale'],
  ['0042', 'Low Pasture', 'Appleby'], ['0049', 'Hawthorn Rise', 'Appleby'], ['0056', 'Fold Yard', 'Shap'],
  ['0063', 'Crag End', 'Shap'], ['0070', 'Oak Tree Farm', 'Penrith'], ['0077', 'Stoneacre', 'Penrith'],
  ['0084', 'Willow Bank', 'Keswick'], ['0091', 'Heather Moor', 'Keswick'], ['0098', 'Kirk Close', 'Ambleside'],
  ['0105', 'Dale Head', 'Ambleside'], ['0112', 'Fell Side', 'Coniston'], ['0119', 'Moss Edge', 'Coniston']
].map(([n, name, town]) => ({ cph: '16/201/' + n, name, address: `${name} Lane, ${town}, Cumbria` }))
const nf = from => NORTHFIELD.slice(from[0], from[1]).map(h => h.cph)
const rolesFor = (cphs, role) => cphs.map(cph => ({ cph, role }))

// Former seasonal delegates at Northfield: each was invited, accepted and
// later had their access revoked. Gives Activity enough access events to need
// paging, and Access history some ended periods (LKPR-439, LKPR-443)
const SEASONAL = [
  ['Sian Price', 'sian.price@example.com', [0, 2], 'Mark Ellis', '2025-02-03', '2025-05-30', 'Lambing season ended'],
  ['Gareth Lloyd', 'gareth.lloyd@example.com', [2, 5], 'Mark Ellis', '2025-02-10', '2025-06-13', 'Lambing season ended'],
  ['Hannah Rigg', 'hannah.rigg@example.com', [6, 9], 'David Wright', '2025-04-14', '2025-09-26', 'Summer cover ended'],
  ['Will Thwaite', 'will.thwaite@example.com', [9, 12], 'Mark Ellis', '2025-07-07', '2025-10-31', 'Contract ended'],
  ['Megan Dodd', 'megan.dodd@example.com', [12, 15], 'David Wright', '2026-01-12', '2026-05-29', 'Lambing season ended'],
  ['Rob Airey', 'rob.airey@example.com', [15, 18], 'Mark Ellis', '2026-02-02', '2026-06-26', 'Lambing season ended']
].map(([name, email, range, invitedBy, from, to, reason], i) => ({
  rel: 'r' + (17 + i), name, email, cphs: nf(range), invitedBy, reason,
  sent: from + 'T09:00:00Z', accepted: from + 'T18:30:00Z', revoked: to + 'T16:00:00Z'
}))
const actorEmail = name => name.toLowerCase().replace(' ', '.') + '@example.com'
const SEASONAL_ACTIVITY = SEASONAL.flatMap((p, i) => {
  const base = { recipientName: p.name, recipientEmail: p.email, businessId: 'northfield', role: 'Delegate' }
  return [
    { id: `s${i}a`, at: p.sent, actorName: p.invitedBy, actorEmail: actorEmail(p.invitedBy), action: 'Invitation sent', outcome: 'Pending enrolment', detail: 'Holdings: ' + p.cphs.join(', '), ...base },
    { id: `s${i}b`, at: p.accepted, actorName: p.name, actorEmail: p.email, action: 'Appointment completed', outcome: 'Granted', detail: 'Enrolment and sign-in checks completed', ...base },
    { id: `s${i}c`, at: p.revoked, actorName: 'David Wright', actorEmail: 'david.wright@example.com', action: 'Access revoked', outcome: 'Revoked', detail: p.reason, ...base }
  ]
})

module.exports = {
  // Bump when the shape of this data changes, so old sessions are reset
  version: 6,
  nextId: 100,

  currentEmail: null,
  currentBusinessId: null,
  currentHolding: null,

  businesses: [
    {
      id: 'hillside',
      name: 'Hillside Farm Ltd',
      holdings: [
        { cph: '12/345/0001', name: 'Hillside Farm', address: 'Hillside Lane, Ashford, Kent, TN25 4AB' },
        { cph: '12/345/0002', name: 'Lower Meadow', address: 'Church Road, Wye, Kent, TN25 5BQ' },
        { cph: '12/346/0103', name: 'Brook Field', address: 'Brook Street, Hamstreet, Kent, TN26 2HG' }
      ]
    },
    {
      id: 'meadowview',
      name: 'Meadow View Farms',
      holdings: [
        { cph: '44/112/0007', name: 'Meadow View', address: 'Long Lane, Taunton, Somerset, TA3 5PL' },
        { cph: '44/112/0019', name: 'Upper Fold', address: 'Stoke Road, Taunton, Somerset, TA3 6EX' }
      ]
    },
    {
      id: 'greenacre',
      name: 'Greenacre Farm',
      holdings: [
        { cph: '08/221/0044', name: 'Greenacre Farm', address: 'Moor Lane, Ludlow, Shropshire, SY8 2HD' }
      ]
    },
    {
      id: 'northfield',
      name: 'Northfield Estates',
      holdings: NORTHFIELD
    }
  ],

  // Stand-in for the CPH holder records held in SAM (US-EXT-01)
  sam: [
    { email: 'jane.smith@example.com', name: 'Jane Smith', businessId: 'hillside' },
    { email: 'alan.green@example.com', name: 'Alan Green', businessId: 'meadowview' },
    { email: 'mary.evans@example.com', name: 'Mary Evans', businessId: 'greenacre' },
    { email: 'david.wright@example.com', name: 'David Wright', businessId: 'northfield' }
  ],

  // Emails that fail the (yet to be agreed) eligibility and validation rules
  ineligible: ['blocked@example.com'],

  people: [
    { email: 'jane.smith@example.com', name: 'Jane Smith', phone: '07700 900101', lastSignIn: '2026-11-16T08:02:00Z' },
    { email: 'alan.green@example.com', name: 'Alan Green', phone: '07700 900102', lastSignIn: '2026-11-10T17:25:00Z' },
    { email: 'mary.evans@example.com', name: 'Mary Evans', phone: '07700 900103' },
    { email: 'sam.jones@example.com', name: 'Sam Jones', phone: '07700 900104', lastSignIn: '2026-11-12T11:31:00Z' },
    { email: 'tom.brown@example.com', name: 'Tom Brown', phone: '07700 900105', lastSignIn: '2026-11-14T06:48:00Z' },
    { email: 'priya.patel@example.com', name: 'Priya Patel', phone: '07700 900106' },
    { email: 'lucy.hart@example.com', name: 'Lucy Hart', phone: '07700 900107', lastSignIn: '2026-11-15T09:10:00Z' },
    { email: 'david.wright@example.com', name: 'David Wright', phone: '07700 900108', lastSignIn: '2026-11-17T07:40:00Z' },
    { email: 'emma.clark@example.com', name: 'Emma Clark', phone: '07700 900109', lastSignIn: '2026-11-18T13:05:00Z' },
    { email: 'josh.reid@example.com', name: 'Josh Reid', phone: '07700 900110', lastSignIn: '2026-11-18T06:20:00Z' },
    { email: 'ruth.moss@example.com', name: 'Ruth Moss', phone: '07700 900111', lastSignIn: '2026-11-11T16:45:00Z' },
    { email: 'owen.hale@example.com', name: 'Owen Hale', phone: '07700 900112' },
    { email: 'kate.lowe@example.com', name: 'Kate Lowe' },
    { email: 'ben.carter@example.com', name: 'Ben Carter' },
    { email: 'mark.ellis@example.com', name: 'Mark Ellis', lastSignIn: '2026-07-30T10:12:00Z' }
  ],

  // A relationship is one person's access to one business. Roles are held per
  // holding (LKPR-433, LKPR-438), so a person can be a keeper administrator on
  // one holding and a delegate on another.
  relationships: [
    {
      id: 'r1', email: 'jane.smith@example.com', name: 'Jane Smith', businessId: 'hillside', status: 'Active', addedBy: 'Matched to SAM record', addedOn: '2026-09-02T09:12:00Z',
      roles: [{ cph: '12/345/0001', role: 'CPH holder' }, { cph: '12/345/0002', role: 'CPH holder' }, { cph: '12/346/0103', role: 'CPH holder' }]
    },
    {
      id: 'r2', email: 'alan.green@example.com', name: 'Alan Green', businessId: 'meadowview', status: 'Active', addedBy: 'Matched to SAM record', addedOn: '2026-09-14T14:30:00Z',
      roles: [{ cph: '44/112/0007', role: 'CPH holder' }, { cph: '44/112/0019', role: 'CPH holder' }]
    },
    {
      id: 'r3', email: 'sam.jones@example.com', name: 'Sam Jones', businessId: 'hillside', status: 'Active', addedBy: 'Jane Smith', addedOn: '2026-10-03T10:05:00Z',
      roles: [{ cph: '12/345/0001', role: 'Keeper administrator' }, { cph: '12/345/0002', role: 'Keeper administrator' }, { cph: '12/346/0103', role: 'Keeper administrator' }]
    },
    {
      id: 'r4', email: 'tom.brown@example.com', name: 'Tom Brown', businessId: 'hillside', status: 'Active', addedBy: 'Jane Smith', addedOn: '2026-10-12T16:20:00Z',
      roles: [{ cph: '12/345/0001', role: 'Delegate' }, { cph: '12/345/0002', role: 'Delegate' }]
    },
    {
      id: 'r5', email: 'tom.brown@example.com', name: 'Tom Brown', businessId: 'meadowview', status: 'Active', addedBy: 'Alan Green', addedOn: '2026-09-20T08:45:00Z',
      roles: [{ cph: '44/112/0007', role: 'Delegate' }]
    },
    {
      id: 'r6', email: 'priya.patel@example.com', name: 'Priya Patel', businessId: 'hillside', status: 'Invited', addedBy: 'Sam Jones', sentDaysAgo: 2,
      roles: [{ cph: '12/346/0103', role: 'Delegate' }]
    },
    {
      id: 'r7', email: 'lucy.hart@example.com', name: 'Lucy Hart', businessId: 'hillside', status: 'Active', addedBy: 'Jane Smith', addedOn: '2026-10-20T10:00:00Z',
      roles: [{ cph: '12/345/0001', role: 'Keeper administrator' }, { cph: '12/346/0103', role: 'Delegate' }]
    },
    // LKPR-437 note: a CPH holder can also be a delegate on someone else's business
    {
      id: 'r8', email: 'alan.green@example.com', name: 'Alan Green', businessId: 'hillside', status: 'Active', addedBy: 'Jane Smith', addedOn: '2026-10-28T15:30:00Z',
      roles: [{ cph: '12/346/0103', role: 'Delegate' }]
    },
    // Northfield Estates: 18 holdings
    {
      id: 'r9', email: 'david.wright@example.com', name: 'David Wright', businessId: 'northfield', status: 'Active', addedBy: 'Matched to SAM record', addedOn: '2026-08-19T09:00:00Z',
      roles: rolesFor(nf([0, 18]), 'CPH holder')
    },
    {
      id: 'r10', email: 'emma.clark@example.com', name: 'Emma Clark', businessId: 'northfield', status: 'Active', addedBy: 'David Wright', addedOn: '2026-09-01T10:30:00Z',
      roles: [...rolesFor(nf([0, 6]), 'Keeper administrator'), ...rolesFor(nf([6, 10]), 'Delegate')]
    },
    {
      id: 'r11', email: 'josh.reid@example.com', name: 'Josh Reid', businessId: 'northfield', status: 'Active', addedBy: 'Emma Clark', addedOn: '2026-09-15T08:10:00Z',
      roles: rolesFor(nf([0, 12]), 'Delegate')
    },
    {
      id: 'r12', email: 'ruth.moss@example.com', name: 'Ruth Moss', businessId: 'northfield', status: 'Active', addedBy: 'David Wright', addedOn: '2026-10-05T14:00:00Z',
      roles: rolesFor(nf([10, 18]), 'Delegate')
    },
    {
      id: 'r13', email: 'owen.hale@example.com', name: 'Owen Hale', businessId: 'northfield', status: 'Invited', addedBy: 'Emma Clark', sentDaysAgo: 4,
      roles: rolesFor(nf([2, 5]), 'Delegate')
    },
    {
      // Sent 9 days ago, so it expires (7 days) as soon as the session starts (LKPR-430)
      id: 'r14', email: 'kate.lowe@example.com', name: 'Kate Lowe', businessId: 'northfield', status: 'Invited', addedBy: 'David Wright', sentDaysAgo: 9,
      roles: rolesFor(nf([12, 15]), 'Delegate')
    },
    {
      id: 'r15', email: 'ben.carter@example.com', name: 'Ben Carter', businessId: 'northfield', status: 'Declined', addedBy: 'David Wright', addedOn: '2026-11-10T09:30:00Z', declinedOn: '2026-11-11T18:05:00Z',
      roles: rolesFor(nf([0, 2]), 'Delegate')
    },
    {
      // A former keeper administrator, for access history (LKPR-443)
      id: 'r16', email: 'mark.ellis@example.com', name: 'Mark Ellis', businessId: 'northfield', status: 'Removed', addedBy: 'David Wright', addedOn: '2025-03-01T09:00:00Z', removedOn: '2026-07-31T16:00:00Z',
      roles: []
    },
    ...SEASONAL.map(p => ({
      id: p.rel, email: p.email, name: p.name, businessId: 'northfield', status: 'Removed', addedBy: p.invitedBy, addedOn: p.sent, removedOn: p.revoked, roles: []
    }))
  ],

  audit: [
    ...SEASONAL_ACTIVITY,
    { id: 'a1', at: '2026-09-02T09:12:00Z', actorName: 'Jane Smith', actorEmail: 'jane.smith@example.com', action: 'CPH holder role granted', recipientName: 'Jane Smith', recipientEmail: 'jane.smith@example.com', businessId: 'hillside', role: 'CPH holder', outcome: 'Granted', detail: 'Email address matched the CPH holder record in SAM' },
    { id: 'a2', at: '2026-09-14T14:30:00Z', actorName: 'Alan Green', actorEmail: 'alan.green@example.com', action: 'CPH holder role granted', recipientName: 'Alan Green', recipientEmail: 'alan.green@example.com', businessId: 'meadowview', role: 'CPH holder', outcome: 'Granted', detail: 'Email address matched the CPH holder record in SAM' },
    { id: 'a3', at: '2026-09-20T08:45:00Z', actorName: 'Alan Green', actorEmail: 'alan.green@example.com', action: 'Invitation sent', recipientName: 'Tom Brown', recipientEmail: 'tom.brown@example.com', businessId: 'meadowview', role: 'Delegate', outcome: 'Pending enrolment', detail: 'Holdings: 44/112/0007' },
    { id: 'a4', at: '2026-09-21T19:02:00Z', actorName: 'Tom Brown', actorEmail: 'tom.brown@example.com', action: 'Appointment completed', recipientName: 'Tom Brown', recipientEmail: 'tom.brown@example.com', businessId: 'meadowview', role: 'Delegate', outcome: 'Granted', detail: 'Enrolment and sign-in checks completed' },
    { id: 'a5', at: '2026-10-03T10:05:00Z', actorName: 'Jane Smith', actorEmail: 'jane.smith@example.com', action: 'Invitation sent', recipientName: 'Sam Jones', recipientEmail: 'sam.jones@example.com', businessId: 'hillside', role: 'Keeper administrator', outcome: 'Pending enrolment', detail: 'All holdings' },
    { id: 'a6', at: '2026-10-04T08:31:00Z', actorName: 'Sam Jones', actorEmail: 'sam.jones@example.com', action: 'Appointment completed', recipientName: 'Sam Jones', recipientEmail: 'sam.jones@example.com', businessId: 'hillside', role: 'Keeper administrator', outcome: 'Granted', detail: 'Enrolment and sign-in checks completed' },
    { id: 'a7', at: '2026-10-12T16:20:00Z', actorName: 'Jane Smith', actorEmail: 'jane.smith@example.com', action: 'Invitation sent', recipientName: 'Tom Brown', recipientEmail: 'tom.brown@example.com', businessId: 'hillside', role: 'Delegate', outcome: 'Pending enrolment', detail: 'Holdings: 12/345/0001, 12/345/0002' },
    { id: 'a8', at: '2026-10-13T07:55:00Z', actorName: 'Tom Brown', actorEmail: 'tom.brown@example.com', action: 'Appointment completed', recipientName: 'Tom Brown', recipientEmail: 'tom.brown@example.com', businessId: 'hillside', role: 'Delegate', outcome: 'Granted', detail: 'Enrolment and sign-in checks completed' },
    { id: 'a11', at: '2026-10-20T10:00:00Z', actorName: 'Jane Smith', actorEmail: 'jane.smith@example.com', action: 'Invitation sent', recipientName: 'Lucy Hart', recipientEmail: 'lucy.hart@example.com', businessId: 'hillside', role: 'Keeper administrator', outcome: 'Pending enrolment', detail: 'Keeper administrator on 12/345/0001. Delegate on 12/346/0103' },
    { id: 'a12', at: '2026-10-21T08:15:00Z', actorName: 'Lucy Hart', actorEmail: 'lucy.hart@example.com', action: 'Appointment completed', recipientName: 'Lucy Hart', recipientEmail: 'lucy.hart@example.com', businessId: 'hillside', role: 'Keeper administrator', outcome: 'Granted', detail: 'Enrolment and sign-in checks completed' },
    { id: 'a13', at: '2026-10-28T15:30:00Z', actorName: 'Jane Smith', actorEmail: 'jane.smith@example.com', action: 'Invitation sent', recipientName: 'Alan Green', recipientEmail: 'alan.green@example.com', businessId: 'hillside', role: 'Delegate', outcome: 'Pending enrolment', detail: 'Holdings: 12/346/0103' },
    { id: 'a14', at: '2026-10-29T12:02:00Z', actorName: 'Alan Green', actorEmail: 'alan.green@example.com', action: 'Appointment completed', recipientName: 'Alan Green', recipientEmail: 'alan.green@example.com', businessId: 'hillside', role: 'Delegate', outcome: 'Granted', detail: 'Enrolment and sign-in checks completed' },
    { id: 'a15', at: '2026-08-19T09:00:00Z', actorName: 'David Wright', actorEmail: 'david.wright@example.com', action: 'CPH holder role granted', recipientName: 'David Wright', recipientEmail: 'david.wright@example.com', businessId: 'northfield', role: 'CPH holder', outcome: 'Granted', detail: 'Email address matched the CPH holder record in SAM' },
    { id: 'a16', daysAgo: 4, actorName: 'Emma Clark', actorEmail: 'emma.clark@example.com', action: 'Invitation sent', recipientName: 'Owen Hale', recipientEmail: 'owen.hale@example.com', businessId: 'northfield', role: 'Delegate', outcome: 'Pending enrolment', detail: 'Holdings: 16/201/0017, 16/201/0023, 16/201/0031' },
    { id: 'a17', daysAgo: 9, actorName: 'David Wright', actorEmail: 'david.wright@example.com', action: 'Invitation sent', recipientName: 'Kate Lowe', recipientEmail: 'kate.lowe@example.com', businessId: 'northfield', role: 'Delegate', outcome: 'Pending enrolment', detail: 'Holdings: 16/201/0084, 16/201/0091, 16/201/0098' },
    { id: 'a18', at: '2026-11-10T09:30:00Z', actorName: 'David Wright', actorEmail: 'david.wright@example.com', action: 'Invitation sent', recipientName: 'Ben Carter', recipientEmail: 'ben.carter@example.com', businessId: 'northfield', role: 'Delegate', outcome: 'Pending enrolment', detail: 'Holdings: 16/201/0004, 16/201/0011' },
    { id: 'a19', at: '2026-11-11T18:05:00Z', actorName: 'Ben Carter', actorEmail: 'ben.carter@example.com', action: 'Invitation declined', recipientName: 'Ben Carter', recipientEmail: 'ben.carter@example.com', businessId: 'northfield', role: 'Delegate', outcome: 'Declined', detail: 'Delegate on 16/201/0004, 16/201/0011' },
    { id: 'a20', at: '2025-03-02T08:40:00Z', actorName: 'Mark Ellis', actorEmail: 'mark.ellis@example.com', action: 'Appointment completed', recipientName: 'Mark Ellis', recipientEmail: 'mark.ellis@example.com', businessId: 'northfield', role: 'Keeper administrator', outcome: 'Granted', detail: 'Enrolment and sign-in checks completed' },
    { id: 'a21', at: '2025-01-06T09:00:00Z', actorName: 'Josh Reid', actorEmail: 'josh.reid@example.com', action: 'Appointment completed', recipientName: 'Josh Reid', recipientEmail: 'josh.reid@example.com', businessId: 'northfield', role: 'Delegate', outcome: 'Granted', detail: 'Delegate on 16/201/0004' },
    { id: 'a22', at: '2025-06-30T17:00:00Z', actorName: 'David Wright', actorEmail: 'david.wright@example.com', action: 'Access revoked', recipientName: 'Josh Reid', recipientEmail: 'josh.reid@example.com', businessId: 'northfield', holding: '16/201/0004', role: 'Delegate', outcome: 'Revoked', detail: 'End of seasonal contract' },
    { id: 'a23', at: '2026-07-31T16:00:00Z', actorName: 'David Wright', actorEmail: 'david.wright@example.com', action: 'Access revoked', recipientName: 'Mark Ellis', recipientEmail: 'mark.ellis@example.com', businessId: 'northfield', role: 'Keeper administrator', outcome: 'Revoked', detail: 'Keeper administrator on 6 holdings' },
    { id: 'a24', at: '2026-10-10T10:00:00Z', actorName: 'David Wright', actorEmail: 'david.wright@example.com', action: 'Promoted to keeper administrator', recipientName: 'Emma Clark', recipientEmail: 'emma.clark@example.com', businessId: 'northfield', role: 'Keeper administrator', outcome: 'Changed', detail: 'Was delegate on 6 holdings' },
    { id: 'a25', at: '2026-08-31T12:00:00Z', actorName: 'Jane Smith', actorEmail: 'jane.smith@example.com', action: 'Access revoked', recipientName: 'Tom Brown', recipientEmail: 'tom.brown@example.com', businessId: 'hillside', holding: '12/346/0103', role: 'Delegate', outcome: 'Revoked', detail: 'Summer cover ended' },
    { id: 'a10', daysAgo: 2, actorName: 'Sam Jones', actorEmail: 'sam.jones@example.com', action: 'Invitation sent', recipientName: 'Priya Patel', recipientEmail: 'priya.patel@example.com', businessId: 'hillside', role: 'Delegate', outcome: 'Pending enrolment', detail: 'Holdings: 12/346/0103' }
  ]
}

// Periods of access, one per person, role and holding, with start and end
// dates (LKPR-443 access history). Current access comes from the relationships
// above; past access is listed here. Kept up to date as roles change.
const ROLE_CHANGED = { 'emma.clark@example.com': '2026-10-10T10:00:00Z' }
const PAST = [
  ...nf([0, 6]).map(cph => ({ email: 'mark.ellis@example.com', name: 'Mark Ellis', businessId: 'northfield', cph, role: 'Keeper administrator', from: '2025-03-02T08:40:00Z', to: '2026-07-31T16:00:00Z', ended: 'Revoked' })),
  { email: 'josh.reid@example.com', name: 'Josh Reid', businessId: 'northfield', cph: '16/201/0004', role: 'Delegate', from: '2025-01-06T09:00:00Z', to: '2025-06-30T17:00:00Z', ended: 'Revoked' },
  ...nf([0, 6]).map(cph => ({ email: 'emma.clark@example.com', name: 'Emma Clark', businessId: 'northfield', cph, role: 'Delegate', from: '2026-09-01T10:30:00Z', to: '2026-10-10T10:00:00Z', ended: 'Role changed' })),
  { email: 'tom.brown@example.com', name: 'Tom Brown', businessId: 'hillside', cph: '12/346/0103', role: 'Delegate', from: '2026-06-01T08:00:00Z', to: '2026-08-31T12:00:00Z', ended: 'Revoked' },
  ...SEASONAL.flatMap(p => p.cphs.map(cph => ({ email: p.email, name: p.name, businessId: 'northfield', cph, role: 'Delegate', from: p.accepted, to: p.revoked, ended: 'Revoked' })))
]
module.exports.periods = [
  ...PAST,
  ...module.exports.relationships
    .filter(r => r.status === 'Active')
    .flatMap(r => r.roles.map(({ cph, role }) => ({
      email: r.email,
      name: r.name,
      businessId: r.businessId,
      cph,
      role,
      from: (role === 'Keeper administrator' && ROLE_CHANGED[r.email]) || r.addedOn,
      to: null,
      ended: null
    })))
].map((p, i) => ({ id: 'p' + (i + 1), ...p }))
