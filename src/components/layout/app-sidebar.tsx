"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Home, 
  CheckSquare, 
  Mail, 
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  Webhook,
  UserCheck
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Clientes",
    href: "/clients",
    icon: UserCheck,
  },
  {
    name: "Tarefas",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    name: "Webmail",
    href: "/webmail",
    icon: Mail,
  },
  {
    name: "Configurações",
    icon: Settings,
    children: [
      { name: "Colaboradores", href: "/employees" },
      { name: "Grupos Hierárquicos", href: "/organization/groups" },
      { name: "Grupos de Permissão", href: "/administration/permission-groups" },
      { name: "Webhooks", href: "/webhooks" },
      { name: "Sistema", href: "/settings" },
    ]
  },
  {
    name: "Documentação API",
    href: "/api-docs",
    icon: FileText,
  },
]

interface AppSidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function AppSidebar({ open, setOpen }: AppSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name)
        : [...prev, name]
    )
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-semibold text-gray-900">CRM MVP</h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User info */}
        {session?.user && (
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">
                    {session.user.name?.charAt(0)?.toUpperCase() || session.user.email?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.user.name || session.user.email}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              if (item.children) {
                const isOpen = openGroups.includes(item.name)
                return (
                  <div key={item.name}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => toggleGroup(item.name)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Button>
                    {isOpen && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link key={child.href} href={child.href}>
                            <Button
                              variant={pathname === child.href ? "secondary" : "ghost"}
                              className="w-full justify-start text-sm"
                            >
                              {child.name}
                            </Button>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </>
  )
}