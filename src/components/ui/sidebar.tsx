import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cn } from "cn"
import { HugeiconsIcon } from "@hugeicons/react"
import { SidebarLeftIcon } from "@hugeicons/core-free-icons"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  isMobile: boolean
  setOpen: (open: boolean) => void
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context)
    throw new Error("useSidebar must be used within a SidebarProvider.")
  return context
}

function SidebarProvider({
  open: openProp,
  onOpenChange,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  open?: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const open = openProp ?? !isMobile
  const toggleSidebar = () => onOpenChange(!open)

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  return (
    <SidebarContext.Provider
      value={{
        state: open ? "expanded" : "collapsed",
        open,
        isMobile,
        setOpen: onOpenChange,
        toggleSidebar,
      }}
    >
      <div
        data-slot="sidebar-wrapper"
        className={cn("flex min-h-svh w-full", className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile, state, open, setOpen } = useSidebar()
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          data-slot="sidebar"
          className={cn("group w-66! gap-0 p-0", className)}
          {...props}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Clinic navigation</SheetTitle>
            <SheetDescription>
              Navigate between clinic sections.
            </SheetDescription>
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    )
  }
  return (
    <div
      className="group peer hidden md:block"
      data-slot="sidebar"
      data-state={state}
      data-collapsible={state === "collapsed" ? "icon" : ""}
    >
      <div
        data-slot="sidebar-gap"
        className="w-66 transition-[width] duration-200 ease-out group-data-[collapsible=icon]:w-18 motion-reduce:transition-none"
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 flex w-66 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out group-data-[collapsible=icon]:w-18 motion-reduce:transition-none",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { open, toggleSidebar } = useSidebar()
  return (
    <Button
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-lg"
      className={className}
      aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      aria-expanded={open}
      aria-controls="clinic-sidebar"
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <HugeiconsIcon icon={SidebarLeftIcon} aria-hidden="true" />
    </Button>
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex flex-col gap-4 p-4", className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-4",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      className={cn("flex w-full min-w-0 flex-col gap-2", className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        "px-2 py-2 text-xs font-semibold text-muted-foreground group-data-[collapsible=icon]:sr-only",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn("flex w-full min-w-0 flex-col gap-2", className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" className={className} {...props} />
}

function SidebarMenuButton({
  render,
  isActive = false,
  tooltip,
  className,
  ...props
}: useRender.ComponentProps<"button"> & {
  isActive?: boolean
  tooltip?: string
}) {
  const { isMobile, state } = useSidebar()
  const comp = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "flex h-10 w-full items-center gap-2 overflow-hidden rounded-2xl px-2 text-left text-base font-medium whitespace-nowrap outline-none group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&>img]:shrink-0 [&>span]:truncate group-data-[collapsible=icon]:[&>span]:sr-only [&>svg]:size-6 [&>svg]:shrink-0",
          className
        ),
      },
      props
    ),
    render: tooltip ? <TooltipTrigger render={render} /> : render,
    state: { slot: "sidebar-menu-button", active: isActive },
  })
  return tooltip ? (
    <Tooltip>
      {comp}
      <TooltipContent side="right" hidden={state !== "collapsed" || isMobile}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  ) : (
    comp
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
}
