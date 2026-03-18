export type MailboxRecord = {
  id: string
  address: string
  createdAt: string
  isFavorite: boolean
  isPinned: boolean
  canLogin: boolean
  forwardTo: string | null
  category: "personal" | "team" | "campaign"
}

export type MailMessage = {
  id: number
  sender: string
  recipients?: string
  subject: string
  preview: string
  receivedAt: string
  content: string
  htmlContent?: string
  verificationCode?: string
  status?: "delivered" | "queued"
  downloadUrl?: string
}

export type UserRecord = {
  id: number
  username: string
  role: "admin" | "user"
  mailboxCount: number
  canSend: boolean
  createdAt: string
}

const delay = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms))

const domains = ["idmail.live", "relaybox.cc", "icloud-temp.dev"]

const mailboxRecords: MailboxRecord[] = [
  {
    id: "mbx-1",
    address: "zenflow@idmail.live",
    createdAt: "2026-03-18 08:30",
    isFavorite: true,
    isPinned: true,
    canLogin: true,
    forwardTo: "ops@studio.dev",
    category: "team",
  },
  {
    id: "mbx-2",
    address: "summit-lab@relaybox.cc",
    createdAt: "2026-03-17 20:14",
    isFavorite: false,
    isPinned: true,
    canLogin: false,
    forwardTo: null,
    category: "campaign",
  },
  {
    id: "mbx-3",
    address: "aurora-note@icloud-temp.dev",
    createdAt: "2026-03-16 14:22",
    isFavorite: true,
    isPinned: false,
    canLogin: true,
    forwardTo: "review@product.cn",
    category: "personal",
  },
  {
    id: "mbx-4",
    address: "signal-park@idmail.live",
    createdAt: "2026-03-15 18:40",
    isFavorite: false,
    isPinned: false,
    canLogin: true,
    forwardTo: null,
    category: "team",
  },
  {
    id: "mbx-5",
    address: "paperplane@relaybox.cc",
    createdAt: "2026-03-15 09:08",
    isFavorite: false,
    isPinned: false,
    canLogin: false,
    forwardTo: null,
    category: "campaign",
  },
]

const users: UserRecord[] = [
  {
    id: 1,
    username: "admin",
    role: "admin",
    mailboxCount: 12,
    canSend: true,
    createdAt: "2026-02-01 09:00",
  },
  {
    id: 2,
    username: "guest",
    role: "user",
    mailboxCount: 3,
    canSend: false,
    createdAt: "2026-02-18 12:40",
  },
  {
    id: 3,
    username: "product-cn",
    role: "user",
    mailboxCount: 7,
    canSend: true,
    createdAt: "2026-03-02 18:15",
  },
]

const inboxTemplates = [
  {
    sender: "noreply@appleid.apple.com",
    subject: "Apple ID sign-in verification",
    preview: "Use the six-digit code below to complete sign in.",
    content:
      "Use verification code 642195 to continue sign in. This code will expire in 5 minutes.",
    verificationCode: "642195",
  },
  {
    sender: "updates@notion.so",
    subject: "Workspace invite accepted",
    preview: "Your workspace member list has been updated successfully.",
    content:
      "The invite for your project workspace has been accepted. Review access permissions when convenient.",
  },
  {
    sender: "support@figma.com",
    subject: "Design review summary",
    preview: "Three comments were left on the latest board.",
    content:
      "A new design review is ready. There are three comments covering copy polish, spacing, and mobile alignment.",
  },
  {
    sender: "security@cloudflare.com",
    subject: "New login noticed",
    preview: "We detected a login from a new device.",
    content:
      "A new login was detected for your account. If this was you, no further action is required.",
  },
]

const sentTemplates = [
  {
    recipients: "team@studio.dev",
    subject: "Daily inbox digest",
    preview: "Sharing the latest verification and collaboration traffic.",
    content:
      "Here is today's digest with verification emails, invite traffic, and sendability health checks.",
    status: "delivered" as const,
  },
  {
    recipients: "qa@product.cn",
    subject: "Mailbox smoke test",
    preview: "Please confirm forwarding, login state, and message rendering.",
    content:
      "This is a smoke test for the refactored mailbox flow. Please confirm forwarding, message rendering, and responsiveness.",
    status: "queued" as const,
  },
]

function hashMailbox(mailbox: string) {
  return mailbox.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function createTimestamp(baseOffset: number) {
  const date = new Date(Date.UTC(2026, 2, 18, 8, 0 + baseOffset))
  return date.toISOString().replace("T", " ").slice(0, 16)
}

function buildInbox(mailbox: string) {
  const seed = hashMailbox(mailbox)

  return inboxTemplates.map((template, index) => {
    const content = `${template.content}\n\nMailbox: ${mailbox}`
    return {
      id: seed + index + 100,
      sender: template.sender,
      subject: template.subject,
      preview: template.preview,
      receivedAt: createTimestamp(index * 11),
      content,
      htmlContent:
        index % 2 === 0
          ? `<div style="font-family:Arial,sans-serif;padding:16px"><h2>${template.subject}</h2><p>${content}</p></div>`
          : undefined,
      verificationCode: template.verificationCode,
    }
  })
}

function buildSent(mailbox: string) {
  const seed = hashMailbox(mailbox)

  return sentTemplates.map((template, index) => {
    const content = `${template.content}\n\nFrom mailbox: ${mailbox}`
    return {
      id: seed + index + 200,
      sender: mailbox,
      recipients: template.recipients,
      subject: template.subject,
      preview: template.preview,
      receivedAt: createTimestamp(index * 17 + 4),
      content,
      htmlContent:
        index === 0
          ? `<div style="font-family:Arial,sans-serif;padding:16px"><p>${content}</p></div>`
          : undefined,
      status: template.status,
    }
  })
}

export async function fetchDomains() {
  await delay(180)
  return domains
}

export async function fetchQuota() {
  await delay(260)
  return {
    limit: 20,
    used: mailboxRecords.length,
    remaining: 20 - mailboxRecords.length,
  }
}

export async function fetchMailboxes() {
  await delay(240)
  return mailboxRecords
}

export async function fetchInbox(mailbox: string) {
  await delay(320)
  return buildInbox(mailbox)
}

export async function fetchSent(mailbox: string) {
  await delay(280)
  return buildSent(mailbox)
}

export async function fetchUsers() {
  await delay(220)
  return users
}
