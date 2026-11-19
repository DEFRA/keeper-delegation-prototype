//
// Starting data for the prototype. Copied into each user's session on first
// request (see routes.js) so changes made during a walkthrough don't leak
// between users. "Clear data" in the footer resets it.
//

module.exports = {
  // Bump when the shape of this data changes, so old sessions are reset
  version: 2,
  nextId: 100,

  currentEmail: null,
  currentBusinessId: null,
  currentHolding: null,

  businesses: [
    {
      id: 'hillside',
      name: 'Hillside Farm Ltd',
      sbi: '106845921',
      holdings: [
        { cph: '12/345/0001', name: 'Hillside Farm', address: 'Hillside Lane, Ashford, Kent, TN25 4AB' },
        { cph: '12/345/0002', name: 'Lower Meadow', address: 'Church Road, Wye, Kent, TN25 5BQ' },
        { cph: '12/346/0103', name: 'Brook Field', address: 'Brook Street, Hamstreet, Kent, TN26 2HG' }
      ]
    },
    {
      id: 'meadowview',
      name: 'Meadow View Farms',
      sbi: '107223310',
      holdings: [
        { cph: '44/112/0007', name: 'Meadow View', address: 'Long Lane, Taunton, Somerset, TA3 5PL' },
        { cph: '44/112/0019', name: 'Upper Fold', address: 'Stoke Road, Taunton, Somerset, TA3 6EX' }
      ]
    },
    {
      id: 'greenacre',
      name: 'Greenacre Farm',
      sbi: '108550172',
      holdings: [
        { cph: '08/221/0044', name: 'Greenacre Farm', address: 'Moor Lane, Ludlow, Shropshire, SY8 2HD' }
      ]
    }
  ],

  // Stand-in for the CPH holder records held in SAM (US-EXT-01)
  sam: [
    { email: 'jane.smith@example.com', name: 'Jane Smith', businessId: 'hillside' },
    { email: 'alan.green@example.com', name: 'Alan Green', businessId: 'meadowview' },
    { email: 'mary.evans@example.com', name: 'Mary Evans', businessId: 'greenacre' }
  ],

  // Emails that fail the (yet to be agreed) eligibility and validation rules
  ineligible: ['blocked@example.com'],

  people: [
    { email: 'jane.smith@example.com', name: 'Jane Smith', lastSignIn: '2026-11-16T08:02:00Z' },
    { email: 'alan.green@example.com', name: 'Alan Green', lastSignIn: '2026-11-10T17:25:00Z' },
    { email: 'mary.evans@example.com', name: 'Mary Evans' },
    { email: 'sam.jones@example.com', name: 'Sam Jones', lastSignIn: '2026-11-12T11:31:00Z' },
    { email: 'tom.brown@example.com', name: 'Tom Brown', lastSignIn: '2026-11-14T06:48:00Z' },
    { email: 'priya.patel@example.com', name: 'Priya Patel' },
    { email: 'lucy.hart@example.com', name: 'Lucy Hart', lastSignIn: '2026-11-15T09:10:00Z' }
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
      id: 'r6', email: 'priya.patel@example.com', name: 'Priya Patel', businessId: 'hillside', status: 'Invited', addedBy: 'Sam Jones', addedOn: '2026-11-12T11:40:00Z',
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
    }
  ],

  audit: [
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
    { id: 'a9', at: '2026-11-03T13:10:00Z', actorName: 'Tom Brown', actorEmail: 'tom.brown@example.com', action: 'Recorded a movement on', businessId: 'hillside', holding: '12/345/0001', role: 'Delegate', outcome: 'Recorded', detail: 'Acted on behalf of Hillside Farm Ltd' },
    { id: 'a10', at: '2026-11-12T11:40:00Z', actorName: 'Sam Jones', actorEmail: 'sam.jones@example.com', action: 'Invitation sent', recipientName: 'Priya Patel', recipientEmail: 'priya.patel@example.com', businessId: 'hillside', role: 'Delegate', outcome: 'Pending enrolment', detail: 'Holdings: 12/346/0103' }
  ]
}
