//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/create-routes/
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const seed = require('./data/seed')

const ADMIN_ROLES = ['CPH holder', 'Keeper administrator']
const APPOINTABLE_ROLES = ['Keeper administrator', 'Delegate']
const ROLE_ORDER = { 'CPH holder': 0, 'Keeper administrator': 1, Delegate: 2 }
const ROLE_SLUGS = { 'keeper-administrator': 'Keeper administrator', delegate: 'Delegate' }
const slugFor = role => Object.keys(ROLE_SLUGS).find(k => ROLE_SLUGS[k] === role)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RECORD_TYPES = ['Birth', 'Movement on', 'Movement off', 'Death']
const INVITATION_DAYS = 14

const CANNOT_APPOINT_REASONS = {
  self: 'You cannot appoint yourself',
  existing: 'This person already has access to the business',
  checks: 'Did not meet the eligibility and validation rules'
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getState (req) {
  if (!req.session.data.state || req.session.data.state.version !== seed.version) {
    req.session.data.state = JSON.parse(JSON.stringify(seed))
  }
  return req.session.data.state
}

const asArray = value => (Array.isArray(value) ? value : [value]).filter(v => v && v !== '_unchecked')
const isAdminRole = role => ADMIN_ROLES.includes(role)
const byRole = (a, b) => ROLE_ORDER[a] - ROLE_ORDER[b]
const findBusiness = (s, id) => s.businesses.find(b => b.id === id)
const findHolding = (business, cph) => business.holdings.find(h => h.cph === cph)
const findPerson = (s, email) => s.people.find(p => p.email === email)
const activeRelationships = (s, email) => s.relationships.filter(r => r.email === email && r.status === 'Active')
const activeRelationship = (s, email, businessId) => activeRelationships(s, email).find(r => r.businessId === businessId)

// Roles are held per holding
const roleOn = (rel, cph) => (rel.roles.find(r => r.cph === cph) || {}).role || null
const adminCphs = rel => rel.roles.filter(r => isAdminRole(r.role)).map(r => r.cph)
const relIsAdmin = rel => adminCphs(rel).length > 0
const distinctRoles = rel => [...new Set(rel.roles.map(r => r.role))].sort(byRole)

function holdingsInScope (s, rel) {
  return findBusiness(s, rel.businessId).holdings.filter(h => roleOn(rel, h.cph))
}

function describe (s, rel) {
  const business = findBusiness(s, rel.businessId)
  const holdingsList = holdingsInScope(s, rel).map(h => ({ ...h, role: roleOn(rel, h.cph) }))
  const roles = distinctRoles(rel)
  const person = findPerson(s, rel.email) || {}
  const allHoldings = holdingsList.length === business.holdings.length
  return {
    ...rel,
    businessName: business.name,
    holdingsList,
    role: roles[0],
    roleLabel: roles.join(' and '),
    mixedRoles: roles.length > 1,
    holdingsLabel: holdingsLabel(holdingsList, allHoldings && roles.length === 1),
    lastSignIn: person.lastSignIn,
    expiresOn: rel.status === 'Invited' ? new Date(new Date(rel.addedOn).getTime() + INVITATION_DAYS * 86400000).toISOString() : null
  }
}

// Lists a few holdings by CPH, otherwise gives a count so it scales
function holdingsLabel (holdings, all) {
  if (all) return holdings.length === 1 ? holdings[0].cph : `All ${holdings.length} holdings`
  if (holdings.length > 3) return `${holdings.length} holdings`
  return holdings.map(h => h.cph).join(', ')
}

// How many holdings a person has each role on
function roleCounts (holdingsList) {
  const counts = {}
  holdingsList.forEach(h => { counts[h.role] = (counts[h.role] || 0) + 1 })
  return Object.keys(counts).sort(byRole).map(role => ({ role, count: counts[role] }))
}

function rolesSummary (roles) {
  const groups = {}
  roles.forEach(r => { (groups[r.role] = groups[r.role] || []).push(r.cph) })
  return Object.keys(groups).sort(byRole).map(role => `${role} on ${groups[role].join(', ')}`).join('. ')
}

function audit (s, entry) {
  s.audit.push({ id: 'a' + (s.nextId++), at: new Date().toISOString(), ...entry })
}

function withErrors (errors) {
  return {
    errors,
    errorList: Object.entries(errors).map(([field, text]) => ({ text, href: '#' + field }))
  }
}

function signOut (s) {
  s.currentEmail = null
  s.currentBusinessId = null
  s.currentHolding = null
}

function recordSignIn (s, email) {
  const person = findPerson(s, email)
  if (person) person.lastSignIn = new Date().toISOString()
}

function buildNav (req, s, user, rel) {
  if (!user) return undefined
  const under = paths => paths.some(p => req.path === p || req.path.startsWith(p + '/'))
  const items = []
  if (rel && relIsAdmin(rel)) {
    // People, Your access and Activity sit under one Manage access section
    items.push(['/business', 'Business overview', ['/business']])
    items.push(['/people', 'Manage access', ['/people', '/your-access', '/activity']])
  } else {
    if (rel) items.push(['/holding', 'Your holding', ['/holding', '/choose-holding']])
    items.push(['/your-access', 'Your access', ['/your-access']])
  }
  items.push(['/sign-out', 'Sign out', []])
  return items.map(([href, text, paths]) => ({ href, text, active: under(paths) }))
}

// Picks a business for the signed-in user and sends them to the right place
function enterBusiness (req, res, rel) {
  const s = getState(req)
  s.currentBusinessId = rel.businessId
  s.currentHolding = null
  if (relIsAdmin(rel)) return res.redirect('/business')
  return res.redirect('/choose-holding')
}

function startWorkingOn (s, user, rel, holding) {
  if (s.currentHolding === holding.cph) return
  s.currentHolding = holding.cph
  audit(s, {
    actorName: user.name,
    actorEmail: user.email,
    action: 'Started working on holding',
    businessId: rel.businessId,
    holding: holding.cph,
    role: roleOn(rel, holding.cph),
    outcome: 'Recorded',
    detail: `Acting on behalf of ${findBusiness(s, rel.businessId).name}`
  })
}

function takeFlash (s) {
  const flash = s.flash
  delete s.flash
  return flash
}

// ---------------------------------------------------------------------------
// Make the signed-in user, business and holding available to every page
// ---------------------------------------------------------------------------

router.use((req, res, next) => {
  const s = getState(req)
  const user = s.currentEmail ? findPerson(s, s.currentEmail) : null
  const business = user && s.currentBusinessId ? findBusiness(s, s.currentBusinessId) : null
  const rel = business ? activeRelationship(s, user.email, business.id) : null
  const holding = rel && s.currentHolding ? holdingsInScope(s, rel).find(h => h.cph === s.currentHolding) : null

  res.locals.currentUser = user
  res.locals.currentBusiness = rel ? business : null
  res.locals.currentRel = rel
  res.locals.currentRelationship = rel ? describe(s, rel) : null
  res.locals.currentHolding = holding
  res.locals.currentRole = rel ? (holding ? roleOn(rel, holding.cph) : distinctRoles(rel)[0]) : null
  res.locals.adminCphs = rel ? adminCphs(rel) : []
  res.locals.isAdmin = !!(rel && relIsAdmin(rel))
  res.locals.navItems = buildNav(req, s, user, rel)
  res.locals.accessNav = res.locals.isAdmin
    ? [
        { href: '/people', text: 'People with access', active: req.path === '/people' || req.path.startsWith('/people/') },
        { href: '/your-access', text: 'Your access', active: req.path === '/your-access' },
        { href: '/activity', text: 'Activity', active: req.path === '/activity' }
      ]
    : null
  next()
})

function requireSignedIn (req, res, next) {
  if (!res.locals.currentUser) return res.redirect('/sign-in')
  if (!res.locals.currentRel) return res.redirect('/choose-business')
  next()
}

// US-DEL-02: delegates cannot manage roles. Attempts are rejected and logged.
function requireAdmin (attempted) {
  return (req, res, next) => {
    if (!res.locals.currentUser) return res.redirect('/sign-in')
    if (!res.locals.currentRel) return res.redirect('/choose-business')
    if (!res.locals.isAdmin) {
      const s = getState(req)
      const user = res.locals.currentUser
      const rel = res.locals.currentRel
      audit(s, {
        actorName: user.name,
        actorEmail: user.email,
        action: `Tried to ${attempted}`,
        businessId: rel.businessId,
        role: res.locals.currentRole,
        outcome: 'Rejected',
        detail: 'Delegates cannot manage who has access to a business'
      })
      return res.status(403).render('not-permitted', { attempted })
    }
    next()
  }
}

router.use('/people', requireAdmin('manage who has access'))
router.use('/activity', requireAdmin('view the activity log'))

// ---------------------------------------------------------------------------
// Sign in (US-EXT-01: CPH holder role granted when email matches SAM)
// ---------------------------------------------------------------------------

router.post('/sign-in', (req, res) => {
  const s = getState(req)
  const email = (req.body.signInEmail || '').trim().toLowerCase()

  if (!email) {
    return res.render('sign-in', withErrors({ signInEmail: 'Enter your email address' }))
  }
  if (!EMAIL_PATTERN.test(email)) {
    return res.render('sign-in', withErrors({ signInEmail: 'Enter an email address in the correct format, like name@example.com' }))
  }

  signOut(s)

  // Grant the CPH holder role on every holding of any SAM record that matches
  const justGranted = []
  s.sam.filter(record => record.email === email).forEach(record => {
    const business = findBusiness(s, record.businessId)
    let rel = s.relationships.find(r => r.email === email && r.businessId === record.businessId && r.status === 'Active')
    if (rel && business.holdings.every(h => roleOn(rel, h.cph) === 'CPH holder')) return
    if (!findPerson(s, email)) s.people.push({ email, name: record.name })
    if (!rel) {
      rel = { id: 'r' + (s.nextId++), email, name: record.name, businessId: record.businessId, status: 'Active', addedBy: 'Matched to SAM record', addedOn: new Date().toISOString(), roles: [] }
      s.relationships.push(rel)
    }
    rel.roles = business.holdings.map(h => ({ cph: h.cph, role: 'CPH holder' }))
    audit(s, {
      actorName: record.name,
      actorEmail: email,
      action: 'CPH holder role granted',
      recipientName: record.name,
      recipientEmail: email,
      businessId: record.businessId,
      role: 'CPH holder',
      outcome: 'Granted',
      detail: 'Email address matched the CPH holder record in SAM'
    })
    justGranted.push(record.businessId)
  })

  const rels = activeRelationships(s, email)

  if (!rels.length) {
    const invitation = s.relationships.find(r => r.email === email && r.status === 'Invited')
    audit(s, {
      actorName: email,
      actorEmail: email,
      action: 'Sign in',
      outcome: 'Not granted',
      detail: 'Email address did not match a CPH holder record in SAM'
    })
    return res.redirect(invitation ? `/no-access?invitation=${invitation.id}` : '/no-access')
  }

  s.currentEmail = email
  recordSignIn(s, email)

  if (justGranted.length) {
    s.currentBusinessId = justGranted[0]
    return res.redirect('/access-confirmed')
  }
  if (rels.length === 1) return enterBusiness(req, res, rels[0])
  return res.redirect('/choose-business')
})

router.get('/no-access', (req, res) => {
  const s = getState(req)
  const invitation = req.query.invitation ? s.relationships.find(r => r.id === req.query.invitation) : null
  res.render('no-access', { email: req.session.data.signInEmail, invitation })
})

router.get('/sign-out', (req, res) => {
  signOut(getState(req))
  req.session.data.signInEmail = ''
  res.redirect('/start')
})

router.get('/access-confirmed', requireSignedIn, (req, res) => {
  res.render('access-confirmed')
})

// ---------------------------------------------------------------------------
// Choosing a business and holding (US-DEL-01)
// ---------------------------------------------------------------------------

function businessChoices (s, email) {
  return activeRelationships(s, email).map(rel => describe(s, rel))
}

router.get('/choose-business', (req, res) => {
  const s = getState(req)
  if (!res.locals.currentUser) return res.redirect('/sign-in')
  const choices = businessChoices(s, res.locals.currentUser.email)
  if (!choices.length) return res.redirect('/your-access')
  if (choices.length === 1) return enterBusiness(req, res, choices[0])
  res.render('choose-business', { choices })
})

router.post('/choose-business', (req, res) => {
  const s = getState(req)
  if (!res.locals.currentUser) return res.redirect('/sign-in')
  const choices = businessChoices(s, res.locals.currentUser.email)
  const chosen = choices.find(c => c.businessId === req.body.chosenBusiness)
  if (!chosen) {
    return res.render('choose-business', { choices, ...withErrors({ chosenBusiness: 'Select the business you are working for' }) })
  }
  enterBusiness(req, res, chosen)
})

router.get('/choose-holding', requireSignedIn, (req, res) => {
  const s = getState(req)
  const rel = res.locals.currentRel
  const holdings = describe(s, rel).holdingsList
  if (holdings.length === 1) {
    startWorkingOn(s, res.locals.currentUser, rel, holdings[0])
    return res.redirect('/holding')
  }
  res.render('choose-holding', { holdings })
})

router.post('/choose-holding', requireSignedIn, (req, res) => {
  const s = getState(req)
  const rel = res.locals.currentRel
  const holdings = describe(s, rel).holdingsList
  const chosen = holdings.find(h => h.cph === req.body.chosenHolding)
  if (!chosen) {
    return res.render('choose-holding', { holdings, ...withErrors({ chosenHolding: 'Select the holding you are working on' }) })
  }
  startWorkingOn(s, res.locals.currentUser, rel, chosen)
  res.redirect('/holding')
})

router.get('/holding', requireSignedIn, (req, res) => {
  const s = getState(req)
  const user = res.locals.currentUser
  const rel = res.locals.currentRel
  const inScope = holdingsInScope(s, rel)

  // LKPR-420: access outside the delegated holdings is denied
  if (req.query.cph) {
    const holding = inScope.find(h => h.cph === req.query.cph)
    if (!holding) {
      audit(s, {
        actorName: user.name,
        actorEmail: user.email,
        action: 'Tried to access holding',
        businessId: rel.businessId,
        holding: req.query.cph,
        role: res.locals.currentRole,
        outcome: 'Rejected',
        detail: 'Holding is outside the access this person has been given'
      })
      return res.status(403).render('holding-denied', { cph: req.query.cph })
    }
    startWorkingOn(s, user, rel, holding)
    return res.redirect('/holding')
  }

  if (!res.locals.currentHolding) return res.redirect('/choose-holding')

  const recent = s.audit
    .filter(a => a.businessId === rel.businessId && a.holding === s.currentHolding && a.actorEmail === user.email)
    .slice()
    .reverse()
    .slice(0, 5)

  res.render('holding', {
    flash: takeFlash(s),
    recent,
    recordTypes: RECORD_TYPES,
    canChangeHolding: inScope.length > 1,
    canManageHolding: res.locals.adminCphs.includes(s.currentHolding)
  })
})

router.post('/holding', requireSignedIn, (req, res) => {
  const s = getState(req)
  const user = res.locals.currentUser
  const rel = res.locals.currentRel
  const holding = res.locals.currentHolding
  if (!holding) return res.redirect('/choose-holding')

  const recordType = req.body.recordType
  if (!RECORD_TYPES.includes(recordType)) {
    req.session.data.recordType = ''
    return res.redirect('/holding')
  }

  audit(s, {
    actorName: user.name,
    actorEmail: user.email,
    action: `Recorded a ${recordType.toLowerCase()}`,
    businessId: rel.businessId,
    holding: holding.cph,
    role: roleOn(rel, holding.cph),
    outcome: 'Recorded',
    detail: `Acted on behalf of ${res.locals.currentBusiness.name}`
  })
  s.flash = `${recordType} recorded for ${holding.name} (${holding.cph})`
  req.session.data.recordType = ''
  res.redirect('/holding')
})

// ---------------------------------------------------------------------------
// Your access (LKPR-437: view access delegated to me)
// ---------------------------------------------------------------------------

router.get('/your-access', (req, res) => {
  const s = getState(req)
  const user = res.locals.currentUser
  if (!user) return res.redirect('/sign-in')
  const relationships = activeRelationships(s, user.email)
    .map(rel => describe(s, rel))
    .sort((a, b) => a.businessName.localeCompare(b.businessName))
  const invitations = s.relationships
    .filter(r => r.email === user.email && r.status === 'Invited')
    .map(rel => describe(s, rel))
  relationships.forEach(r => { r.roleCounts = roleCounts(r.holdingsList) })
  res.render('your-access', { relationships, invitations })
})

// ---------------------------------------------------------------------------
// Business overview (administrators)
// ---------------------------------------------------------------------------

router.get('/business', requireSignedIn, (req, res) => {
  if (!res.locals.isAdmin) return res.redirect('/holding')
  const s = getState(req)
  const businessId = res.locals.currentBusiness.id
  const rels = s.relationships.filter(r => r.businessId === businessId)
  res.render('business', {
    holdings: res.locals.currentRelationship.holdingsList,
    activeCount: rels.filter(r => r.status === 'Active').length,
    invitedCount: rels.filter(r => r.status === 'Invited').length
  })
})

// ---------------------------------------------------------------------------
// People (LKPR-436 view delegated relationships, plus Route 2 of LKPR-433:
// "Manage who can act on this holding" via ?holding=)
// ---------------------------------------------------------------------------

router.get('/people', (req, res) => {
  const s = getState(req)
  const business = res.locals.currentBusiness
  const holding = req.query.holding ? findHolding(business, req.query.holding) : null

  let rels = s.relationships.filter(r => r.businessId === business.id && ['Active', 'Invited'].includes(r.status))
  if (holding) rels = rels.filter(r => roleOn(r, holding.cph))

  const people = rels
    .map(r => {
      const p = describe(s, r)
      if (holding) p.roleLabel = p.role = roleOn(r, holding.cph)
      return p
    })
    .sort((a, b) => byRole(a.role, b.role) || a.name.localeCompare(b.name))

  const active = people.filter(p => p.status === 'Active')
  const invited = people.filter(p => p.status === 'Invited')
  const delegatedCount = active.filter(p => p.role !== 'CPH holder').length

  res.render('people/index', {
    active,
    invited,
    delegatedCount,
    holding,
    canManageHolding: holding && res.locals.adminCphs.includes(holding.cph),
    filterHoldings: business.holdings.filter(h => res.locals.adminCphs.includes(h.cph)),
    flash: takeFlash(s)
  })
})

router.get('/people/add/role', (req, res) => {
  if (req.query.new) {
    const data = req.session.data
    data.newPersonRole = data.newPersonName = data.newPersonEmail = data.newPersonScope = ''
    data.newPersonHoldings = []
  }
  res.render('people/add/role')
})

router.post('/people/add/role', (req, res) => {
  if (!APPOINTABLE_ROLES.includes(req.body.newPersonRole)) {
    return res.render('people/add/role', withErrors({ newPersonRole: 'Select the role you want to give this person' }))
  }
  res.redirect('/people/add/details')
})

router.get('/people/add/details', (req, res) => {
  if (!req.session.data.newPersonRole) return res.redirect('/people/add/role')
  res.render('people/add/details')
})

router.post('/people/add/details', (req, res) => {
  const s = getState(req)
  const data = req.session.data
  const name = (req.body.newPersonName || '').trim()
  const email = (req.body.newPersonEmail || '').trim().toLowerCase()
  data.newPersonEmail = email

  const errors = {}
  if (!name) errors.newPersonName = 'Enter their full name'
  if (!email) errors.newPersonEmail = 'Enter their email address'
  else if (!EMAIL_PATTERN.test(email)) errors.newPersonEmail = 'Enter an email address in the correct format, like name@example.com'
  if (Object.keys(errors).length) return res.render('people/add/details', withErrors(errors))

  // US-KA-01 AC2: reject an ineligible appointment
  const user = res.locals.currentUser
  const business = res.locals.currentBusiness
  let reason
  if (email === user.email) reason = 'self'
  else if (s.relationships.find(r => r.email === email && r.businessId === business.id && ['Active', 'Invited'].includes(r.status))) reason = 'existing'
  else if (s.ineligible.includes(email)) reason = 'checks'

  if (reason) {
    audit(s, {
      actorName: user.name,
      actorEmail: user.email,
      action: `Tried to appoint ${data.newPersonRole.toLowerCase()}`,
      recipientName: name,
      recipientEmail: email,
      businessId: business.id,
      role: data.newPersonRole,
      outcome: 'Rejected',
      detail: CANNOT_APPOINT_REASONS[reason]
    })
    return res.redirect(`/people/add/cannot-appoint?reason=${reason}`)
  }

  res.redirect('/people/add/holdings')
})

router.get('/people/add/cannot-appoint', (req, res) => {
  res.render('people/add/cannot-appoint', { reason: req.query.reason })
})

// You can only give access to holdings you administer yourself
function appointableHoldings (res) {
  return res.locals.currentBusiness.holdings.filter(h => res.locals.adminCphs.includes(h.cph))
}

// Step 1: all the holdings you manage, or only some? (just a confirmation when
// you only manage one). Step 2, for "some": tick the holdings, with a filter.
router.get('/people/add/holdings', (req, res) => {
  if (!APPOINTABLE_ROLES.includes(req.session.data.newPersonRole)) return res.redirect('/people/add/role')
  res.render('people/add/holdings', { holdings: appointableHoldings(res) })
})

router.post('/people/add/holdings', (req, res) => {
  const data = req.session.data
  const holdings = appointableHoldings(res)
  const valid = holdings.map(h => h.cph)
  const scope = req.body.newPersonScope
  if (holdings.length === 1 || scope === 'all') {
    data.newPersonHoldings = valid
    return res.redirect('/people/add/check')
  }
  if (scope === 'some') return res.redirect('/people/add/holdings/choose')
  // Ticked holdings posted straight here (kept for direct links and tests)
  const selected = asArray(req.body.newPersonHoldings).filter(cph => valid.includes(cph))
  if (selected.length) {
    data.newPersonHoldings = selected
    return res.redirect('/people/add/check')
  }
  res.render('people/add/holdings', { holdings, ...withErrors({ newPersonScope: 'Select which holdings they can work on' }) })
})

router.get('/people/add/holdings/choose', (req, res) => {
  if (!APPOINTABLE_ROLES.includes(req.session.data.newPersonRole)) return res.redirect('/people/add/role')
  const holdings = appointableHoldings(res)
  if (holdings.length === 1) return res.redirect('/people/add/holdings')
  res.render('people/add/choose-holdings', { holdings })
})

router.post('/people/add/holdings/choose', (req, res) => {
  const holdings = appointableHoldings(res)
  const valid = holdings.map(h => h.cph)
  const selected = asArray(req.body.newPersonHoldings).filter(cph => valid.includes(cph))
  req.session.data.newPersonHoldings = selected
  if (!selected.length) {
    return res.render('people/add/choose-holdings', { holdings, ...withErrors({ newPersonHoldings: 'Select at least one holding' }) })
  }
  res.redirect('/people/add/check')
})

function draftPerson (req, res) {
  const data = req.session.data
  const selected = asArray(data.newPersonHoldings)
  return {
    role: data.newPersonRole,
    name: (data.newPersonName || '').trim(),
    email: data.newPersonEmail,
    holdings: appointableHoldings(res).filter(h => selected.includes(h.cph))
  }
}

router.get('/people/add/check', (req, res) => {
  const draft = draftPerson(req, res)
  if (!draft.role || !draft.name || !draft.email) return res.redirect('/people/add/role')
  if (!draft.holdings.length) return res.redirect('/people/add/holdings')
  const all = appointableHoldings(res)
  const allHoldings = all.length > 1 && draft.holdings.length === all.length
  res.render('people/add/check', {
    draft,
    allHoldings,
    holdingsChangeUrl: all.length > 1 && !allHoldings ? '/people/add/holdings/choose' : '/people/add/holdings'
  })
})

router.post('/people/add/check', (req, res) => {
  const s = getState(req)
  const draft = draftPerson(req, res)
  if (!draft.role || !draft.name || !draft.email || !draft.holdings.length) return res.redirect('/people/add/role')

  const user = res.locals.currentUser
  const business = res.locals.currentBusiness
  if (!findPerson(s, draft.email)) s.people.push({ email: draft.email, name: draft.name })

  const rel = {
    id: 'r' + (s.nextId++),
    email: draft.email,
    name: draft.name,
    businessId: business.id,
    roles: draft.holdings.map(h => ({ cph: h.cph, role: draft.role })),
    status: 'Invited',
    addedBy: user.name,
    addedOn: new Date().toISOString()
  }
  s.relationships.push(rel)

  audit(s, {
    actorName: user.name,
    actorEmail: user.email,
    action: 'Invitation sent',
    recipientName: rel.name,
    recipientEmail: rel.email,
    businessId: business.id,
    role: draft.role,
    outcome: 'Pending enrolment',
    detail: `Holdings: ${draft.holdings.map(h => h.cph).join(', ')}`
  })

  const data = req.session.data
  data.newPersonRole = data.newPersonName = data.newPersonEmail = data.newPersonScope = ''
  data.newPersonHoldings = []
  res.redirect(`/people/add/sent?id=${rel.id}`)
})

router.get('/people/add/sent', (req, res) => {
  const s = getState(req)
  const rel = s.relationships.find(r => r.id === req.query.id && r.businessId === res.locals.currentBusiness.id)
  if (!rel) return res.redirect('/people')
  res.render('people/add/sent', { person: describe(s, rel) })
})

// ---------------------------------------------------------------------------
// One person: view, change role per holding (LKPR-433 promote, LKPR-438
// demote), revoke per holding (LKPR-395), withdraw invitation (LKPR-403)
// ---------------------------------------------------------------------------

function personInBusiness (req, res, statuses = ['Active', 'Invited']) {
  const s = getState(req)
  return s.relationships.find(r => r.id === req.params.id && r.businessId === res.locals.currentBusiness.id && statuses.includes(r.status))
}

// Can the signed-in administrator change this person's role on this holding?
function canManage (res, rel, cph) {
  const role = roleOn(rel, cph)
  return rel.status === 'Active' &&
    rel.email !== res.locals.currentUser.email &&
    APPOINTABLE_ROLES.includes(role) &&
    res.locals.adminCphs.includes(cph)
}

const manageableHoldings = (s, res, rel) => describe(s, rel).holdingsList.filter(h => canManage(res, rel, h.cph))

router.get('/people/:id', (req, res) => {
  const s = getState(req)
  const rel = personInBusiness(req, res)
  if (!rel) return res.redirect('/people')
  const person = describe(s, rel)
  person.holdingsList.forEach(h => { h.canManage = canManage(res, rel, h.cph) })
  person.roleCounts = roleCounts(person.holdingsList)
  const manageableCount = person.holdingsList.filter(h => h.canManage).length
  const history = s.audit
    .filter(a => a.businessId === rel.businessId && (a.recipientEmail === rel.email || a.actorEmail === rel.email))
    .slice()
    .reverse()
  res.render('people/person', {
    person,
    history,
    flash: takeFlash(s),
    isSelf: rel.email === res.locals.currentUser.email,
    canRevoke: manageableCount > 0,
    canChangeSeveral: manageableCount > 1,
    someOutOfScope: rel.status === 'Active' && rel.email !== res.locals.currentUser.email && person.holdingsList.some(h => !h.canManage && h.role !== 'CPH holder')
  })
})

// Change role on one or more holdings. With lots of holdings, choose the
// holdings first (change-roles), then the role.
const cphQuery = cphs => cphs.map(cph => 'cph=' + encodeURIComponent(cph)).join('&')
const holdingNames = holdings => holdings.length > 3 ? `${holdings.length} holdings` : holdings.map(h => `${h.name} (${h.cph})`).join(', ')

function roleChange (req, res) {
  const s = getState(req)
  const rel = personInBusiness(req, res, ['Active'])
  if (!rel) return null
  const cphs = [...new Set(asArray(req.query.cph || (req.body && req.body.changeCph)))]
  const holdings = describe(s, rel).holdingsList.filter(h => cphs.includes(h.cph))
  if (!holdings.length || holdings.length !== cphs.length || !holdings.every(h => canManage(res, rel, h.cph))) return null
  const fromRoles = [...new Set(holdings.map(h => h.role))]
  return {
    s,
    rel,
    person: describe(s, rel),
    holdings,
    holding: holdings[0],
    several: holdings.length > 1,
    from: fromRoles.length === 1 ? fromRoles[0] : null,
    holdingsText: holdingNames(holdings),
    cphQuery: cphQuery(holdings.map(h => h.cph))
  }
}

router.get('/people/:id/change-roles', (req, res) => {
  const s = getState(req)
  const rel = personInBusiness(req, res, ['Active'])
  if (!rel) return res.redirect('/people')
  const holdings = manageableHoldings(s, res, rel)
  if (holdings.length < 2) return res.redirect(`/people/${rel.id}`)
  res.render('people/change-roles', { person: describe(s, rel), holdings })
})

router.post('/people/:id/change-roles', (req, res) => {
  const s = getState(req)
  const rel = personInBusiness(req, res, ['Active'])
  if (!rel) return res.redirect('/people')
  const holdings = manageableHoldings(s, res, rel)
  const selected = asArray(req.body.changeHoldings).filter(cph => holdings.some(h => h.cph === cph))
  if (!selected.length) {
    return res.render('people/change-roles', { person: describe(s, rel), holdings, ...withErrors({ changeHoldings: 'Select the holdings you want to change their role on' }) })
  }
  res.redirect(`/people/${rel.id}/role?${cphQuery(selected)}`)
})

router.get('/people/:id/role', (req, res) => {
  const change = roleChange(req, res)
  if (!change) return res.redirect(`/people/${req.params.id}`)
  res.render('people/role', change)
})

router.post('/people/:id/role', (req, res) => {
  const change = roleChange(req, res)
  if (!change) return res.redirect(`/people/${req.params.id}`)
  const to = req.body.newRole
  if (!APPOINTABLE_ROLES.includes(to)) {
    return res.render('people/role', { ...change, ...withErrors({ newRole: 'Select a role' }) })
  }
  if (to === change.from) {
    const where = change.several ? 'these holdings' : 'this holding'
    return res.render('people/role', { ...change, ...withErrors({ newRole: `${change.person.name} is already a ${to.toLowerCase()} on ${where}. Select a different role` }) })
  }
  res.redirect(`/people/${change.rel.id}/role/confirm?${change.cphQuery}&to=${slugFor(to)}`)
})

router.get('/people/:id/role/confirm', (req, res) => {
  const change = roleChange(req, res)
  const to = change && ROLE_SLUGS[req.query.to]
  if (!change || !to || to === change.from) return res.redirect(`/people/${req.params.id}`)
  const changing = change.holdings.filter(h => h.role !== to)
  res.render('people/role-confirm', { ...change, to, toSlug: req.query.to, changing, changingText: holdingNames(changing) })
})

router.post('/people/:id/role/confirm', (req, res) => {
  const change = roleChange(req, res)
  const to = change && ROLE_SLUGS[req.body.changeTo]
  if (!change || !to || to === change.from) return res.redirect(`/people/${req.params.id}`)
  const { s, rel } = change
  const user = res.locals.currentUser
  const changing = change.holdings.filter(h => h.role !== to)
  const promoted = to === 'Keeper administrator'
  changing.forEach(h => {
    rel.roles.find(r => r.cph === h.cph).role = to
    audit(s, {
      actorName: user.name,
      actorEmail: user.email,
      action: promoted ? 'Promoted to keeper administrator' : 'Changed to delegate',
      recipientName: rel.name,
      recipientEmail: rel.email,
      businessId: rel.businessId,
      holding: h.cph,
      role: to,
      outcome: 'Changed',
      detail: `Was ${h.role.toLowerCase()}. Takes effect immediately. Other holdings are not affected`
    })
  })
  const where = changing.length === 1 ? `${changing[0].name} (${changing[0].cph})` : `${changing.length} holdings`
  s.flash = `${rel.name} is now a ${to.toLowerCase()} on ${where}`
  res.redirect(`/people/${rel.id}`)
})

// Revoke access on one or more holdings
router.get('/people/:id/remove', (req, res) => res.redirect(`/people/${req.params.id}/revoke`))

router.get('/people/:id/revoke', (req, res) => {
  const s = getState(req)
  const rel = personInBusiness(req, res, ['Active'])
  if (!rel) return res.redirect('/people')
  const holdings = manageableHoldings(s, res, rel)
  if (!holdings.length) return res.redirect(`/people/${rel.id}`)
  const preselected = req.query.cph ? asArray(req.query.cph) : (holdings.length === 1 ? [holdings[0].cph] : [])
  res.render('people/revoke', { person: describe(s, rel), holdings, preselected })
})

router.post('/people/:id/revoke', (req, res) => {
  const s = getState(req)
  const rel = personInBusiness(req, res, ['Active'])
  if (!rel) return res.redirect('/people')
  const holdings = manageableHoldings(s, res, rel)
  const selected = asArray(req.body.revokeHoldings).filter(cph => holdings.some(h => h.cph === cph))
  if (!selected.length) {
    return res.render('people/revoke', { person: describe(s, rel), holdings, preselected: [], ...withErrors({ revokeHoldings: 'Select the holdings you want to revoke access to' }) })
  }
  res.redirect(`/people/${rel.id}/revoke/confirm?${cphQuery(selected)}`)
})

function revokeSelection (s, res, rel, cphs) {
  const holdings = manageableHoldings(s, res, rel).filter(h => asArray(cphs).includes(h.cph))
  return { holdings, removesAll: holdings.length === rel.roles.length }
}

router.get('/people/:id/revoke/confirm', (req, res) => {
  const s = getState(req)
  const rel = personInBusiness(req, res, ['Active'])
  if (!rel) return res.redirect('/people')
  const selection = revokeSelection(s, res, rel, req.query.cph)
  if (!selection.holdings.length) return res.redirect(`/people/${rel.id}/revoke`)
  res.render('people/revoke-confirm', { person: describe(s, rel), ...selection })
})

router.post('/people/:id/revoke/confirm', (req, res) => {
  const s = getState(req)
  const rel = personInBusiness(req, res, ['Active'])
  if (!rel) return res.redirect('/people')
  const { holdings, removesAll } = revokeSelection(s, res, rel, req.body.revokeCph)
  if (!holdings.length) return res.redirect(`/people/${rel.id}/revoke`)
  const user = res.locals.currentUser
  const business = res.locals.currentBusiness

  holdings.forEach(h => {
    audit(s, {
      actorName: user.name,
      actorEmail: user.email,
      action: 'Access revoked',
      recipientName: rel.name,
      recipientEmail: rel.email,
      businessId: rel.businessId,
      holding: h.cph,
      role: h.role,
      outcome: 'Revoked',
      detail: 'Access to other holdings and businesses is not affected'
    })
  })
  rel.roles = rel.roles.filter(r => !holdings.some(h => h.cph === r.cph))

  if (removesAll) {
    rel.status = 'Removed'
    rel.removedOn = new Date().toISOString()
    s.flash = `${rel.name} no longer has access to ${business.name}`
    return res.redirect('/people')
  }
  s.flash = `${rel.name} no longer has access to ${holdings.length > 3 ? holdings.length + ' holdings' : holdings.map(h => h.name).join(' and ')}`
  res.redirect(`/people/${rel.id}`)
})

// Withdraw an invitation that has not been accepted
router.get('/people/:id/withdraw', (req, res) => {
  const s = getState(req)
  const rel = personInBusiness(req, res, ['Invited'])
  if (!rel) return res.redirect('/people')
  res.render('people/withdraw', { person: describe(s, rel) })
})

router.post('/people/:id/withdraw', (req, res) => {
  const s = getState(req)
  const rel = personInBusiness(req, res, ['Invited'])
  if (!rel) return res.redirect('/people')
  const user = res.locals.currentUser
  rel.status = 'Withdrawn'
  audit(s, {
    actorName: user.name,
    actorEmail: user.email,
    action: 'Invitation withdrawn',
    recipientName: rel.name,
    recipientEmail: rel.email,
    businessId: rel.businessId,
    role: distinctRoles(rel)[0],
    outcome: 'Withdrawn',
    detail: 'The invitation link no longer works'
  })
  s.flash = `The invitation to ${rel.name} has been withdrawn`
  res.redirect('/people')
})

// ---------------------------------------------------------------------------
// Activity log (audit trail for KA-01 AC4, KA-03, KA-04, KA-07, DEL-01, DEL-02)
// ---------------------------------------------------------------------------

router.get('/activity', (req, res) => {
  const s = getState(req)
  const entries = s.audit
    .filter(a => a.businessId === res.locals.currentBusiness.id)
    .slice()
    .reverse()
  res.render('activity', { entries })
})

// ---------------------------------------------------------------------------
// Responding to an invitation (LKPR-423: accept or decline, enrolment)
// ---------------------------------------------------------------------------

function findInvitation (req) {
  const s = getState(req)
  const id = req.query.id || (req.body && req.body.invitationId)
  const rel = s.relationships.find(r => r.id === id && r.status === 'Invited')
  return rel ? describe(s, rel) : null
}

router.get('/invitation', (req, res) => {
  const invitation = findInvitation(req)
  if (!invitation) return res.render('invitation/not-found')
  res.render('invitation/index', { invitation })
})

router.get('/invitation/enrol', (req, res) => {
  const invitation = findInvitation(req)
  if (!invitation) return res.render('invitation/not-found')
  res.render('invitation/enrol', { invitation })
})

router.post('/invitation/enrol', (req, res) => {
  const s = getState(req)
  const invitation = findInvitation(req)
  if (!invitation) return res.render('invitation/not-found')

  if (!asArray(req.body.enrolDeclaration).length) {
    return res.render('invitation/enrol', { invitation, ...withErrors({ enrolDeclaration: 'Confirm that your details are correct and you understand your responsibilities' }) })
  }

  const rel = s.relationships.find(r => r.id === invitation.id)
  rel.status = 'Active'
  rel.activatedOn = new Date().toISOString()
  audit(s, {
    actorName: rel.name,
    actorEmail: rel.email,
    action: 'Appointment completed',
    recipientName: rel.name,
    recipientEmail: rel.email,
    businessId: rel.businessId,
    role: invitation.role,
    outcome: 'Granted',
    detail: 'Enrolment and sign-in checks completed. ' + rolesSummary(rel.roles)
  })

  signOut(s)
  s.currentEmail = rel.email
  s.currentBusinessId = rel.businessId
  recordSignIn(s, rel.email)
  req.session.data.enrolDeclaration = []
  res.redirect(`/invitation/complete?id=${rel.id}`)
})

router.get('/invitation/complete', (req, res) => {
  const s = getState(req)
  const rel = s.relationships.find(r => r.id === req.query.id && r.status === 'Active')
  if (!rel) return res.redirect('/start')
  res.render('invitation/complete', { invitation: describe(s, rel), nextUrl: relIsAdmin(rel) ? '/business' : '/choose-holding' })
})

router.get('/invitation/decline', (req, res) => {
  const invitation = findInvitation(req)
  if (!invitation) return res.render('invitation/not-found')
  res.render('invitation/decline', { invitation })
})

router.post('/invitation/decline', (req, res) => {
  const s = getState(req)
  const invitation = findInvitation(req)
  if (!invitation) return res.render('invitation/not-found')
  const rel = s.relationships.find(r => r.id === invitation.id)
  rel.status = 'Declined'
  audit(s, {
    actorName: rel.name,
    actorEmail: rel.email,
    action: 'Invitation declined',
    recipientName: rel.name,
    recipientEmail: rel.email,
    businessId: rel.businessId,
    role: invitation.role,
    outcome: 'Declined',
    detail: rolesSummary(rel.roles)
  })
  res.render('invitation/declined', { invitation })
})

module.exports = router
