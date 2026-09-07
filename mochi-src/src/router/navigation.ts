import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  Bot,
  CircuitBoard,
  Code2,
  Gamepad2,
  Gauge,
  LayoutDashboard,
  Package,
  Settings,
  Stethoscope,
  TerminalSquare,
  Workflow,
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Phase in which the screen becomes real. 1 means it works today. */
  phase: number;
  group: 'build' | 'device' | 'system';
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, phase: 1, group: 'build' },
  { path: '/robot', label: 'Robot', icon: Bot, phase: 1, group: 'build' },
  { path: '/components', label: 'Components', icon: Boxes, phase: 1, group: 'build' },
  { path: '/electronics', label: 'Electronics', icon: CircuitBoard, phase: 1, group: 'build' },
  { path: '/firmware', label: 'Firmware', icon: Code2, phase: 8, group: 'build' },
  { path: '/behavior', label: 'Behavior', icon: Workflow, phase: 12, group: 'build' },

  { path: '/control', label: 'Control', icon: Gamepad2, phase: 9, group: 'device' },
  { path: '/serial', label: 'Serial monitor', icon: TerminalSquare, phase: 7, group: 'device' },
  { path: '/sensors', label: 'Sensors', icon: Gauge, phase: 10, group: 'device' },
  { path: '/diagnostics', label: 'Diagnostics', icon: Stethoscope, phase: 11, group: 'device' },

  { path: '/assets', label: 'Assets', icon: Package, phase: 13, group: 'system' },
  { path: '/settings', label: 'Settings', icon: Settings, phase: 1, group: 'system' },
];

export const NAV_GROUPS: Array<{ id: NavItem['group']; label: string }> = [
  { id: 'build', label: 'Build' },
  { id: 'device', label: 'Device' },
  { id: 'system', label: 'Project' },
];
