"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface AppHeaderProps {
  onMenuClick: () => void
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Breadcrumb ou título da página atual pode ser adicionado aqui */}
        </div>

        <div className="flex items-center space-x-4">
          {/* Notificações, perfil, etc. podem ser adicionados aqui */}
        </div>
      </div>
    </header>
  )
}