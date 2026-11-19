//
// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/filters/
//

const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter

const TIME_ZONE = 'Europe/London'

function formatDate (iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TIME_ZONE })
}

function formatTime (iso) {
  return new Date(iso)
    .toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TIME_ZONE })
    .replace(/\s/g, '')
    .toLowerCase()
}

addFilter('formatDate', formatDate)

addFilter('formatDateTime', iso => (iso ? `${formatDate(iso)} at ${formatTime(iso)}` : ''))

addFilter('tagClass', status => ({
  Active: 'govuk-tag--green',
  Granted: 'govuk-tag--green',
  Invited: 'govuk-tag--yellow',
  'Pending enrolment': 'govuk-tag--yellow',
  Rejected: 'govuk-tag--red',
  'Not granted': 'govuk-tag--red',
  Recorded: 'govuk-tag--blue',
  Changed: 'govuk-tag--purple',
  Declined: 'govuk-tag--orange',
  Revoked: 'govuk-tag--grey',
  Withdrawn: 'govuk-tag--grey',
  Removed: 'govuk-tag--grey'
}[status] || 'govuk-tag--grey'))
