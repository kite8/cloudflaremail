import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  Download,
  Eraser,
  Copy,
  Inbox,
  Mail,
  MenuIcon,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Sparkles,
  Star,
  Trash2,
  Menu,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { AppShell } from "@/components/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  clearInboxEmails,
  deleteInboxEmail,
  deleteSentEmail,
  fetchInbox,
  fetchInboxDetail,
  fetchSent,
  fetchSentDetail,
  getInboxEmailDownloadUrl,
  sendEmail,
} from "@/lib/api"
import { useAppState } from "@/lib/app-state"
import { type MailMessage } from "@/lib/mock-mail"

function panelClassName() {
  return "rounded-2xl border border-border bg-card text-card-foreground shadow-[0_8px_30px_color-mix(in_oklab,var(--color-foreground)_6%,transparent)]"
}

function getMailIdentity(message: MailMessage, tab: "inbox" | "sent") {
  return tab === "inbox" ? message.sender : (message.recipients ?? message.sender)
}

function getDomainLogoUrl(identity?: string) {
  const domain = identity?.split("@")[1]?.trim().toLowerCase()
  if (!domain) {
    return null
  }
  return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(domain)}`
}

function MailIdentityAvatar({
  identity,
  active,
}: {
  identity?: string
  active?: boolean
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const logoUrl = getDomainLogoUrl(identity)

  return (
    <div
      className={`flex size-10 shrink-0 items-center justify-center rounded-full border transition ${
        active
          ? "border-primary/25 bg-primary/12 text-primary"
          : "border-border bg-secondary text-secondary-foreground"
      }`}
    >
      {logoUrl && !imageFailed ? (
        <img
          src={logoUrl}
          alt={identity ?? "mail identity"}
          className="size-5 rounded-full"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Mail className="size-4" />
      )}
    </div>
  )
}

export function DashboardPage() {
  const queryClient = useQueryClient()
  const {
    quota,
    domains,
    mailboxes,
    currentMailbox,
    selectedDomain,
    mailboxLength,
    forwardAddress,
    search,
    setSearch,
    setSelectedDomain,
    setMailboxLength,
    setComposeForwardAddress,
    selectMailbox,
    generateMailbox,
    createMailbox,
    toggleFavorite,
    saveForward,
    copyMailbox,
  } = useAppState()
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox")
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [mailboxDialogOpen, setMailboxDialogOpen] = useState(false)
  const [mobileListOpen, setMobileListOpen] = useState(false)
  const [desktopListCollapsed, setDesktopListCollapsed] = useState(false)
  const [detailView, setDetailView] = useState<"text" | "html">("text")
  const [composeTo, setComposeTo] = useState("")
  const [composeSubject, setComposeSubject] = useState("")
  const [composeBody, setComposeBody] = useState("")
  const [customLocalPart, setCustomLocalPart] = useState("")

  const inboxQuery = useQuery<MailMessage[]>({
    queryKey: ["inbox", currentMailbox],
    queryFn: () => fetchInbox(currentMailbox),
    enabled: currentMailbox.length > 0,
  })
  const sentQuery = useQuery<MailMessage[]>({
    queryKey: ["sent", currentMailbox],
    queryFn: () => fetchSent(currentMailbox),
    enabled: currentMailbox.length > 0,
  })
  const selectedInboxDetailQuery = useQuery({
    queryKey: ["email-detail", selectedEmailId, currentMailbox],
    queryFn: () => fetchInboxDetail(selectedEmailId as number, currentMailbox),
    enabled: activeTab === "inbox" && selectedEmailId !== null && currentMailbox.length > 0,
  })
  const selectedSentDetailQuery = useQuery({
    queryKey: ["sent-detail", selectedEmailId, currentMailbox],
    queryFn: () => fetchSentDetail(selectedEmailId as number, currentMailbox),
    enabled: activeTab === "sent" && selectedEmailId !== null && currentMailbox.length > 0,
  })

  const visibleMessages = useMemo(() => {
    const source = activeTab === "inbox" ? inboxQuery.data ?? [] : sentQuery.data ?? []
    const keyword = search.trim().toLowerCase()
    if (!keyword) {
      return source
    }

    return source.filter((message) =>
      [message.subject, message.sender, message.preview, message.recipients]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    )
  }, [activeTab, inboxQuery.data, search, sentQuery.data])

  const selectedEmail =
    visibleMessages.find((message) => message.id === selectedEmailId) ??
    visibleMessages[0] ??
    null
  const selectedEmailDetail =
    (activeTab === "inbox"
      ? selectedInboxDetailQuery.data
      : selectedSentDetailQuery.data) ?? selectedEmail
  const canShowHtml = Boolean(selectedEmailDetail?.htmlContent?.trim())

  const currentMailboxRecord =
    mailboxes.find((mailbox) => mailbox.address === currentMailbox) ?? null

  const collapsedRail = (
    <div className="flex h-full min-h-0 flex-col items-center py-3">
      <div className="grid gap-2 px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTab === "inbox" ? "default" : "outline"}
              size="icon"
              className="rounded-xl"
              onClick={() => setActiveTab("inbox")}
            >
              <Inbox className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            收件箱
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTab === "sent" ? "default" : "outline"}
              size="icon"
              className="rounded-xl"
              onClick={() => setActiveTab("sent")}
            >
              <Send className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            发件箱
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={() => setMailboxDialogOpen(true)}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            邮箱设置
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="mt-3 h-px w-9 bg-border" />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-visible px-2 py-3">
        <div className="grid gap-2">
          {visibleMessages.map((message) => {
            const active = selectedEmail?.id === message.id
            const identity = getMailIdentity(message, activeTab)
            return (
              <div key={message.id} className="group relative flex justify-center">
                <button
                  type="button"
                  onClick={() => setSelectedEmailId(message.id)}
                  className={`flex size-11 items-center justify-center rounded-2xl transition ${
                    active
                      ? "bg-accent shadow-sm"
                      : "hover:bg-muted"
                  }`}
                >
                  <MailIdentityAvatar identity={identity} active={active} />
                </button>

                <div className="pointer-events-none absolute left-full top-1/2 z-20 ml-3 hidden w-72 -translate-y-1/2 translate-x-2 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 lg:block">
                  <div className="rounded-2xl border border-border bg-popover/96 p-3 text-popover-foreground shadow-[0_18px_40px_color-mix(in_oklab,var(--color-foreground)_14%,transparent)] backdrop-blur-xl">
                    <div className="flex items-start gap-3">
                      <MailIdentityAvatar identity={identity} active={active} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-foreground">
                              {identity}
                            </div>
                            <div className="mt-0.5 truncate text-xs text-muted-foreground">
                              {message.receivedAt}
                            </div>
                          </div>
                          <Badge variant="secondary" className="rounded-full">
                            {activeTab === "inbox" ? "收件" : "发件"}
                          </Badge>
                        </div>
                        <div className="mt-3 truncate text-sm font-medium text-foreground">
                          {message.subject}
                        </div>
                        <div className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">
                          {message.preview}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const handleCompose = async () => {
    if (!composeTo.trim() || !composeSubject.trim()) {
      return
    }

    try {
      await sendEmail({
        from: currentMailbox,
        to: composeTo.trim(),
        subject: composeSubject.trim(),
        text: composeBody.trim(),
      })
      setComposeOpen(false)
      setComposeTo("")
      setComposeSubject("")
      setComposeBody("")
      await queryClient.invalidateQueries({ queryKey: ["sent", currentMailbox] })
      setActiveTab("sent")
    } catch {
      // keep dialog open if sending fails
    }
  }

  const handleOpenCompose = () => {
    setComposeOpen(true)
  }

  const handleCopyMailbox = async () => {
    try {
      await copyMailbox()
      if (currentMailbox) {
        toast.success("邮箱地址已复制")
      } else {
        toast.error("请先选择邮箱")
      }
    } catch {
      toast.error("复制失败，请重试")
    }
  }

  const handleToggleFavorite = async () => {
    if (!currentMailboxRecord) {
      toast.error("请先选择邮箱")
      return
    }

    try {
      await toggleFavorite()
      toast.success(currentMailboxRecord.isFavorite ? "已取消喜欢" : "已加入喜欢")
    } catch {
      toast.error("操作失败，请重试")
    }
  }

  const handleSaveForward = async () => {
    if (!currentMailboxRecord) {
      toast.error("请先选择邮箱")
      return
    }

    try {
      await saveForward()
      toast.success(forwardAddress.trim() ? "转发设置已保存" : "已清除转发地址")
    } catch {
      toast.error("保存失败，请重试")
    }
  }

  const handleDeleteCurrentMessage = async () => {
    if (!selectedEmailDetail?.id) {
      toast.error("请先选择邮件")
      return
    }

    const confirmed = window.confirm(
      activeTab === "inbox" ? "确定删除这封邮件？" : "确定删除这条发送记录？",
    )
    if (!confirmed) {
      return
    }

    try {
      if (activeTab === "inbox") {
        await deleteInboxEmail(selectedEmailDetail.id)
      } else {
        await deleteSentEmail(selectedEmailDetail.id)
      }

      setSelectedEmailId(null)
      await queryClient.invalidateQueries({ queryKey: [activeTab, currentMailbox] })
      toast.success(activeTab === "inbox" ? "邮件已删除" : "发送记录已删除")
    } catch {
      toast.error("删除失败，请重试")
    }
  }

  const handleClearInbox = async () => {
    if (!currentMailbox) {
      toast.error("请先选择邮箱")
      return
    }

    const confirmed = window.confirm("确定清空当前邮箱的所有收件吗？")
    if (!confirmed) {
      return
    }

    try {
      await clearInboxEmails(currentMailbox)
      setSelectedEmailId(null)
      await queryClient.invalidateQueries({ queryKey: ["inbox", currentMailbox] })
      toast.success("收件箱已清空")
    } catch {
      toast.error("清空失败，请重试")
    }
  }

  const handleDownloadCurrent = () => {
    if (activeTab !== "inbox" || !selectedEmailDetail?.id) {
      toast.error("当前邮件不支持下载")
      return
    }

    window.open(
      selectedEmailDetail.downloadUrl ?? getInboxEmailDownloadUrl(selectedEmailDetail.id),
      "_blank",
      "noopener,noreferrer",
    )
    toast.success("已开始下载原始邮件")
  }

  const handleCopyVerificationCode = async () => {
    if (!selectedEmailDetail?.verificationCode) {
      toast.error("当前邮件没有验证码")
      return
    }

    try {
      await navigator.clipboard.writeText(selectedEmailDetail.verificationCode)
      toast.success(`验证码 ${selectedEmailDetail.verificationCode} 已复制`)
    } catch {
      toast.error("复制失败，请重试")
    }
  }

  const handleCreateCustomMailbox = async () => {
    if (!customLocalPart.trim()) {
      toast.error("请输入自定义邮箱名前缀")
      return
    }

    try {
      await createMailbox(customLocalPart)
      setCustomLocalPart("")
      toast.success("自定义邮箱已创建")
    } catch {
      toast.error("创建失败，请检查格式或权限")
    }
  }

  const listPane = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border p-3">
        <div className="grid gap-2">
          {activeTab === "inbox" ? (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <Select value={currentMailbox || undefined} onValueChange={selectMailbox}>
                <SelectTrigger className="h-10 w-full min-w-0 rounded-xl">
                  <SelectValue placeholder="选择邮箱" />
                </SelectTrigger>
                <SelectContent>
                  {mailboxes.map((mailbox) => (
                    <SelectItem key={mailbox.id} value={mailbox.address}>
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="truncate">{mailbox.address}</span>
                        {mailbox.isFavorite ? (
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        ) : null}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="rounded-xl"
                onClick={() => setMailboxDialogOpen(true)}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <Select value={currentMailbox || undefined} onValueChange={selectMailbox}>
                <SelectTrigger className="h-10 w-full min-w-0 rounded-xl">
                  <SelectValue placeholder="选择发件邮箱" />
                </SelectTrigger>
                <SelectContent>
                  {mailboxes.map((mailbox) => (
                    <SelectItem key={mailbox.id} value={mailbox.address}>
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="truncate">{mailbox.address}</span>
                        {mailbox.isFavorite ? (
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        ) : null}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setMailboxDialogOpen(true)}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <Tabs
          className="mt-3"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "inbox" | "sent")}
        >
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-secondary">
            <TabsTrigger value="inbox" className="rounded-lg">
              收件箱
            </TabsTrigger>
            <TabsTrigger value="sent" className="rounded-lg">
              发件箱
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "inbox" && !currentMailbox ? (
          <div className="mt-3 rounded-xl border border-border bg-muted">
            <div className="px-3 py-2.5 text-sm text-muted-foreground">
              请先选择一个邮箱以查看收件内容。
            </div>
          </div>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-1 p-2">
          {visibleMessages.map((message) => {
            const active = selectedEmail?.id === message.id
            return (
              <button
                key={message.id}
                type="button"
                onClick={() => {
                  setSelectedEmailId(message.id)
                  setMobileListOpen(false)
                }}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${
                  active
                    ? "border-border bg-accent shadow-sm"
                    : "border-transparent hover:border-border hover:bg-muted/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {activeTab === "inbox"
                        ? message.sender
                        : message.recipients ?? message.sender}
                    </div>
                    <div className="mt-1 truncate text-sm font-medium text-foreground">
                      {message.subject}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {message.receivedAt.slice(11)}
                  </div>
                </div>
                <div className="mt-2 truncate text-sm text-muted-foreground">
                  {message.preview}
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>

      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="truncate">
            {quota ? `${quota.used}/${quota.limit} mailboxes in use` : "Quota loading"}
          </span>
          <span className="shrink-0">{visibleMessages.length} items</span>
        </div>
      </div>
    </div>
  )

  return (
    <AppShell
      currentRoute="/app"
      headerLeading={
        <>
          <Button
            variant="outline"
            size="icon"
            className="hidden rounded-xl md:inline-flex"
            onClick={() => setDesktopListCollapsed((value) => !value)}
          >
            <MenuIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl md:hidden"
            onClick={() => setMobileListOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </>
      }
      headerContent={
        <div className="relative w-full md:max-w-[560px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search Email"
            className="h-10 rounded-2xl border-border bg-card pl-9"
          />
        </div>
      }
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div
          className={`grid min-h-0 flex-1 gap-0 transition-[grid-template-columns] duration-300 ease-out ${
            desktopListCollapsed
              ? "lg:grid-cols-[76px_minmax(0,1fr)]"
              : "lg:grid-cols-[300px_minmax(0,1fr)]"
          }`}
        >
          <div
            className={`hidden min-h-0 border-r border-border bg-card lg:block ${
              desktopListCollapsed ? "overflow-visible" : "overflow-hidden"
            }`}
          >
            {desktopListCollapsed ? (
              collapsedRail
            ) : (
              <div className="flex h-full min-h-0 flex-col animate-in fade-in-0 slide-in-from-left-2 duration-300">
                {listPane}
              </div>
            )}
          </div>

          <div className="min-w-0 overflow-hidden bg-background p-3">
            <div className={`${panelClassName()} flex h-full min-h-0 flex-col p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
                      <Mail className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">
                          {activeTab === "inbox"
                            ? selectedEmailDetail?.sender ?? "No sender"
                            : (selectedEmailDetail?.recipients ?? currentMailbox) || "No mailbox"}
                        </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {activeTab === "inbox"
                          ? `To: ${currentMailbox || "--"}`
                          : `From: ${currentMailbox || "--"}`}
                      </div>
                    </div>
                  </div>
                  <h2 className="mt-4 truncate text-2xl font-semibold tracking-[-0.04em] text-foreground">
                    {selectedEmailDetail?.subject ?? "Select a message"}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {activeTab === "inbox" ? (
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                      onClick={handleDownloadCurrent}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    onClick={() =>
                      queryClient.invalidateQueries({
                        queryKey: [activeTab, currentMailbox],
                      })
                    }
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    onClick={handleCopyMailbox}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl text-destructive hover:text-destructive"
                    onClick={handleDeleteCurrentMessage}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="min-h-0 flex-1">
                <div className="py-5">
                  {canShowHtml ? (
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <Tabs
                        value={detailView}
                        onValueChange={(value) => setDetailView(value as "text" | "html")}
                      >
                        <TabsList className="rounded-xl bg-secondary">
                          <TabsTrigger value="text" className="rounded-lg">
                            Text
                          </TabsTrigger>
                          <TabsTrigger value="html" className="rounded-lg">
                            HTML
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                      {selectedEmailDetail?.verificationCode ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={handleCopyVerificationCode}
                        >
                          <Copy className="h-4 w-4" />
                          复制验证码
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  {detailView === "html" && canShowHtml ? (
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                      <iframe
                        title={selectedEmailDetail?.subject ?? "email-preview"}
                        srcDoc={selectedEmailDetail?.htmlContent ?? ""}
                        className="min-h-[420px] w-full bg-white"
                      />
                    </div>
                  ) : (
                    <div className="whitespace-pre-line text-sm leading-7 text-foreground/80">
                      {selectedEmailDetail?.content ?? "当前没有可阅读的邮件内容。"}
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t border-border pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-full">
                      {activeTab === "inbox" ? "收件箱" : "发件箱"}
                    </Badge>
                  {selectedEmailDetail?.verificationCode ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground transition hover:bg-accent/80"
                        onClick={handleCopyVerificationCode}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Verification Code {selectedEmailDetail.verificationCode}
                      </button>
                    ) : null}
                    {currentMailboxRecord?.isFavorite ? (
                      <Badge className="rounded-full bg-secondary text-secondary-foreground">
                        Favorite mailbox
                      </Badge>
                    ) : null}
                  </div>
                  {activeTab === "sent" ? (
                    <Button
                      className="rounded-xl"
                      onClick={handleOpenCompose}
                    >
                      <Plus className="h-4 w-4" />
                      New Message
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={handleClearInbox}
                    >
                      <Eraser className="h-4 w-4" />
                      清空收件
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={mailboxDialogOpen} onOpenChange={setMailboxDialogOpen}>
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>邮箱管理</DialogTitle>
            <DialogDescription>这里集中处理切换、生成、转发和收藏。</DialogDescription>
          </DialogHeader>
          <div className="grid flex-1 gap-3 overflow-y-auto pr-1">
            <Select value={currentMailbox || undefined} onValueChange={selectMailbox}>
              <SelectTrigger className="h-10 w-full rounded-xl">
                <SelectValue placeholder="选择邮箱" />
              </SelectTrigger>
              <SelectContent>
                {mailboxes.map((mailbox) => (
                  <SelectItem key={mailbox.id} value={mailbox.address}>
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="truncate">{mailbox.address}</span>
                      {mailbox.isFavorite ? (
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger className="h-10 w-full rounded-xl">
                <SelectValue placeholder="选择域名" />
              </SelectTrigger>
              <SelectContent>
                {domains.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="rounded-xl bg-muted px-3 py-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Name length</span>
                <span>{mailboxLength[0]}</span>
              </div>
              <Slider
                className="mt-4"
                value={mailboxLength}
                min={8}
                max={16}
                step={1}
                onValueChange={setMailboxLength}
              />
            </div>
            <Input
              value={customLocalPart}
              onChange={(event) => setCustomLocalPart(event.target.value)}
              placeholder="Custom local part"
              className="h-10 rounded-xl"
            />
            <Input
              value={forwardAddress}
              onChange={(event) => setComposeForwardAddress(event.target.value)}
              placeholder="Forward address"
              className="h-10 rounded-xl"
            />
          </div>
          <DialogFooter className="block border-t border-border pt-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                className="rounded-xl"
                onClick={generateMailbox}
              >
                <Sparkles className="h-4 w-4" />
                Generate
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={handleCreateCustomMailbox}>
                Create
              </Button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <Button variant="outline" className="rounded-xl" onClick={handleCopyMailbox}>
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={handleToggleFavorite}>
                <Star className="h-4 w-4" />
                Favorite
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={handleSaveForward}>
                Save Forward
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
        <SheetContent side="left" className="w-[320px] border-r bg-popover p-0 text-popover-foreground">
          <SheetHeader className="border-b border-border">
            <SheetTitle>收发件箱</SheetTitle>
            <SheetDescription>移动端通过抽屉查看收件箱与发件箱</SheetDescription>
          </SheetHeader>
          {listPane}
        </SheetContent>
      </Sheet>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>新建邮件</DialogTitle>
            <DialogDescription>发件箱操作独立管理，不占用主阅读区。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              value={composeTo}
              onChange={(event) => setComposeTo(event.target.value)}
              placeholder="To"
              className="h-10 rounded-xl"
            />
            <Input
              value={composeSubject}
              onChange={(event) => setComposeSubject(event.target.value)}
              placeholder="Subject"
              className="h-10 rounded-xl"
            />
            <Textarea
              value={composeBody}
              onChange={(event) => setComposeBody(event.target.value)}
              placeholder="Write your message..."
              className="min-h-[180px] rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              onClick={handleCompose}
            >
              <Send className="h-4 w-4" />
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
