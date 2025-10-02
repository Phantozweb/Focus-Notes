
'use client';

import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Eye, LogOut, LayoutDashboard, ListChecks, Settings } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');
  
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, view: null },
    { path: '/dashboard?view=cases', label: 'Case Records', icon: ListChecks, view: 'cases' },
  ];

  const getIsActive = (item: typeof menuItems[0]) => {
    if (item.path === '/dashboard' && !item.view) {
        return pathname === '/dashboard' && !currentView;
    }
    return item.view === currentView;
  };

  return (
     <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="flex h-screen w-full flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
                <div className="flex items-center gap-2 mr-auto">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                        <Eye className="h-7 w-7 text-primary" />
                        <h1 className="text-2xl font-bold font-logo hidden sm:block">
                        <span className="text-primary">Focus Case</span>
                        <span className="text-foreground">X</span>
                        </h1>
                    </div>
                </div>
                <Avatar>
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
            </header>
            <div className="flex flex-1 overflow-hidden">
                <Sidebar>
                    <SidebarContent>
                    <div className="flex items-center justify-end p-2">
                      <SidebarTrigger className="text-primary" />
                    </div>
                    <SidebarMenu>
                        {menuItems.map((item) => (
                        <SidebarMenuItem key={item.path}>
                            <SidebarMenuButton
                            onClick={() => router.push(item.path)}
                            isActive={getIsActive(item)}
                            tooltip={item.label}
                            >
                            <item.icon />
                            <span>{item.label}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                    </SidebarContent>
                    <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={() => alert('Settings clicked!')} tooltip="Settings">
                                <Settings />
                                <span>Settings</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={() => router.push('/')} tooltip="Logout">
                                <LogOut />
                                <span>Logout</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    </SidebarProvider>
  );
}
