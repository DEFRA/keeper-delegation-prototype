//
// Hands-on task cards for walkthroughs, one per story (shown at /task-cards).
// Each card gives a goal rather than steps, so people find their own way.
// tasks, before and notes are HTML.
//

module.exports = [
  {
    heading: 'Getting in and doing the work',
    epic: 'LKPR-402',
    cards: [
      {
        key: 'LKPR-391',
        story: 'US-EXT-01 CPH holder role from SAM',
        title: 'First time in',
        signIn: 'mary.evans@example.com',
        tasks: [
          'You hold the CPH for Greenacre Farm and have never used the service. Sign in and find out what you can do.',
          'Then sign out and try any email address that is not on the list.'
        ],
        notes: [
          'Mary is matched to the SAM record and given the CPH holder role straight away.',
          'An unknown email address is told the role was not granted.',
          'Ask: is it clear why Mary got in and the other person did not?'
        ]
      },
      {
        key: 'LKPR-392',
        story: 'US-KA-01 Appoint another keeper administrator',
        title: 'Share the admin',
        signIn: 'jane.smith@example.com',
        tasks: [
          'Your farm manager is taking on more of the paperwork. Let them manage who can act for Hillside Farm Ltd on all your holdings. Use <strong>chris.taylor@example.com</strong>.',
          'Then try the same with <strong>blocked@example.com</strong>.'
        ],
        notes: [
          'Manage access, add a person, choose keeper administrator and all holdings. Chris shows as invited.',
          'blocked@example.com is rejected as not eligible (AC2).',
          'Watch: do they understand the difference between the two roles from the descriptions?'
        ]
      },
      {
        key: 'LKPR-394',
        story: 'US-KA-03 Appoint a delegate',
        title: 'New starter on some holdings',
        signIn: 'david.wright@example.com',
        tasks: [
          'A new stockperson starts on Monday. They will work on your 2 Kendal holdings only. Let them record things there, but not manage who has access. Make up an email address for them.'
        ],
        notes: [
          'Add a person, choose delegate, then "Only some of them" and filter the list to Kendal (Northfield Farm, Home Farm).',
          'Watch: how they cope with choosing from 18 holdings.'
        ]
      },
      {
        key: 'LKPR-396',
        story: 'US-DEL-01 Act for an assigned keeper',
        title: 'A day’s work',
        signIn: 'tom.brown@example.com',
        tasks: [
          'You help out at two farming businesses. Get to Lower Meadow for Hillside Farm Ltd and record that you moved some sheep.'
        ],
        notes: [
          'Choose the business, then the holding, then the record form.',
          'The record form is a stand-in for the livestock service. Nothing it records shows in Activity.',
          'Ask: is it clear which business and holding you are working on?'
        ]
      },
      {
        key: 'LKPR-397',
        story: 'US-DEL-02 Restrict delegate role management',
        title: 'Bring in a helper',
        signIn: 'tom.brown@example.com',
        tasks: [
          'A friend wants to help you at Hillside Farm Ltd. Try to give them access yourself.'
        ],
        notes: [
          'Tom is told he cannot manage access as a delegate.',
          'The attempt is logged. Sign in as Jane and look in Activity to show it.',
          'Ask: does the message tell Tom what to do instead?'
        ]
      },
      {
        key: 'LKPR-420',
        story: 'Restrict delegate access to assigned scope',
        title: 'The other field',
        signIn: 'tom.brown@example.com',
        tasks: [
          'Can you record anything on Brook Field for Hillside Farm Ltd?'
        ],
        notes: [
          'Brook Field is not offered, because Tom has not been given it.',
          'To show the denied page, sign in as Tom and <a class="govuk-link" href="/holding?cph=12%2F346%2F0103">open Brook Field directly</a>.'
        ]
      }
    ]
  },
  {
    heading: 'Invitations',
    epic: 'LKPR-403',
    cards: [
      {
        key: 'LKPR-423',
        story: 'Invite a delegate',
        title: 'You’ve been invited',
        signIn: 'priya.patel@example.com',
        tasks: [
          'Hillside Farm Ltd has invited you to help them. Try signing in. Then open the link from your invitation email and get started.'
        ],
        before: 'Your invitation email link: <a class="govuk-link" href="/invitation?id=r6">open Priya’s invitation</a>',
        notes: [
          'Signing in first says she must accept the invitation.',
          'The link lets her accept, do the enrolment checks, then get in as a delegate.',
          'Ask: does she know who invited her and what she is agreeing to?'
        ]
      },
      {
        key: 'LKPR-426',
        story: 'Decline an invitation',
        title: 'No thanks',
        signIn: 'priya.patel@example.com',
        tasks: [
          'You have decided not to work for Hillside Farm Ltd. Turn the invitation down.'
        ],
        before: 'Use Clear data first if Priya has already accepted. Your invitation email link: <a class="govuk-link" href="/invitation?id=r6">open Priya’s invitation</a>',
        notes: [
          'She can decline from the invitation page and gets a confirmation.',
          'As David, Ben Carter shows as declined in People with access.'
        ]
      },
      {
        key: 'LKPR-428',
        story: 'Withdraw a pending invitation',
        title: 'Sent to the wrong person',
        signIn: 'jane.smith@example.com',
        tasks: [
          'Priya was invited by mistake. Stop her from being able to accept.',
          'Then <a class="govuk-link" href="/invitation?id=r6">open Priya’s invitation link</a> to see what she would see.'
        ],
        before: 'Use Clear data first if Priya has accepted or declined.',
        notes: [
          'People with access, open Priya, withdraw the invitation.',
          'The link now says the invitation has been withdrawn. The wording is a placeholder.'
        ]
      },
      {
        key: 'LKPR-430',
        story: 'Expire unused invitations',
        title: 'Too late',
        signIn: 'kate.lowe@example.com',
        tasks: [
          'Northfield Estates invited you over a week ago and you forgot about it. Try to get in now.'
        ],
        notes: [
          'Kate is told the invitation expired after 7 days and to ask David to send it again.',
          'Her <a class="govuk-link" href="/invitation?id=r14">old invitation link</a> also says it has expired.'
        ]
      },
      {
        key: 'LKPR-429',
        story: 'Resend a pending invitation',
        title: 'Another chance',
        signIn: 'david.wright@example.com',
        tasks: [
          'Kate says her invitation link does not work any more. Sort it out for her.'
        ],
        before: 'Best done after the “Too late” card.',
        notes: [
          'People with access, open Kate, send the invitation again. Same role and holdings, and the 7 days start again.',
          'Sign in as Kate: she is now asked to accept rather than told it has expired.'
        ]
      }
    ]
  },
  {
    heading: 'Seeing and changing who has access',
    epic: 'LKPR-404',
    cards: [
      {
        key: 'LKPR-436',
        story: 'View delegated relationships',
        title: 'Who can act for me?',
        signIn: 'jane.smith@example.com',
        tasks: [
          'Who can act for your business, and which of them can work on Brook Field?'
        ],
        notes: [
          'People with access lists everyone with their role on each holding. Filter by Brook Field.',
          'Ask: is anything missing that you would want to see here?'
        ]
      },
      {
        key: 'LKPR-437',
        story: 'View access delegated to me',
        title: 'What can I do?',
        signIn: 'alan.green@example.com',
        tasks: [
          'You run Meadow View Farms and also help out at Hillside Farm Ltd. Check what you are allowed to do for each.'
        ],
        notes: [
          'Your access shows both businesses with his role on each holding: CPH holder at Meadow View, delegate on Brook Field.'
        ]
      },
      {
        key: 'LKPR-433',
        story: 'US-KA-07 Promote',
        title: 'More responsibility',
        signIn: 'jane.smith@example.com',
        tasks: [
          'Tom has proved himself at Lower Meadow. Let him decide who can work there, but only there.',
          'Then sign in as Tom and check what has changed.'
        ],
        notes: [
          'Open Tom, change his role on Lower Meadow to keeper administrator.',
          'Another way in: open Lower Meadow from the business overview and choose “Manage who can act on it”.',
          'Tom now has Manage access, but only for Lower Meadow.'
        ]
      },
      {
        key: 'LKPR-438',
        story: 'Demote',
        title: 'Step back on one holding',
        signIn: 'jane.smith@example.com',
        tasks: [
          'Sam no longer needs to manage access at Brook Field, but he still works there. Change that.'
        ],
        notes: [
          'Open Sam, make him a delegate on Brook Field. His other holdings stay keeper administrator.',
          'Try the bigger version as David: open Josh Reid and “Change role on several holdings”.'
        ]
      },
      {
        key: 'LKPR-395',
        story: 'US-KA-04 Remove access',
        title: 'Moved on',
        signIn: 'jane.smith@example.com',
        tasks: [
          'Tom has stopped working at Hillside Farm, but still helps at Lower Meadow. Remove him from Hillside Farm only.',
          'Then sign in as Tom and see what he can still do.'
        ],
        notes: [
          'Open Tom, remove access to Hillside Farm, confirm.',
          'Tom still has Lower Meadow, and Meadow View Farms, which Jane does not control.'
        ]
      },
      {
        key: 'LKPR-443',
        story: 'View historical delegations',
        title: 'Who was here at lambing?',
        signIn: 'david.wright@example.com',
        tasks: [
          'A neighbour asks who was helping out on your holdings at lambing this spring. Find out.'
        ],
        notes: [
          'Manage access, Access history, filter to ended access. Megan Dodd and Rob Airey were there from early 2026.',
          'Also: Mark Ellis (former keeper administrator) and Josh’s two separate periods on Northfield Farm.',
          'Open question: is this front office or back office?'
        ]
      }
    ]
  },
  {
    heading: 'Your details',
    epic: 'LKPR-417',
    cards: [
      {
        key: 'LKPR-516',
        story: 'View my profile',
        title: 'New phone number',
        signIn: 'anyone, for example jane.smith@example.com',
        tasks: [
          'Your mobile number has changed. Update it.'
        ],
        notes: [
          'Your profile shows name, email address and phone number, but read only.',
          'They are sent to GOV.UK One Login to change them. The link goes nowhere in the prototype.',
          'Ask: would you expect to change it here?'
        ]
      }
    ]
  }
]
