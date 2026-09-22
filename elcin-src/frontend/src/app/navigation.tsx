import type { ComponentType } from "react";
import {
  Brain,
  CalendarDays,
  Gift,
  Heart,
  Home,
  MessageCircle,
  Settings,
  Box,
  Smartphone,
  Terminal,
} from "lucide-react";
import type { RoutePath } from "./routePaths";

export interface NavItem {
  path: RoutePath;
  label: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  /** Yalnızca geliştirici rolünde görünür. */
  developerOnly?: boolean;
  /** Mobil alt çubukta yer alır. */
  mobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Ana Sayfa", icon: Home, mobile: true },
  { path: "/sohbet", label: "Sohbet", icon: MessageCircle, mobile: true },
  { path: "/hafiza", label: "Hafıza", icon: Brain, mobile: true },
  { path: "/duygular", label: "Duygular", icon: Heart, mobile: true },
  { path: "/takvim", label: "Takvim", icon: CalendarDays },
  { path: "/surprizler", label: "Sürprizler", icon: Gift },
  { path: "/cihaz", label: "Cihaz", icon: Smartphone },
  { path: "/govde", label: "Gövde", icon: Box },
  { path: "/ayarlar", label: "Ayarlar", icon: Settings, mobile: true },
  {
    path: "/gelistirici",
    label: "Geliştirici",
    icon: Terminal,
    developerOnly: true,
  },
];
