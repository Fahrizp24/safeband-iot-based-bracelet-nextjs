import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Customer Menu',
    items: [
      {
        title: 'Home',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        items: [],
        access: { role: 'customer' }
      },
      {
        title: 'Live Tracking',
        url: '/dashboard/tracking',
        icon: 'kanban', // map simulation
        isActive: false,
        items: [],
        access: { role: 'customer' }
      },
      {
        title: 'Activity Logs',
        url: '/dashboard/activity',
        icon: 'forms',
        isActive: false,
        items: [],
        access: { role: 'customer' }
      },
      {
        title: 'Emergency Setup',
        url: '/dashboard/emergency',
        icon: 'phone',
        isActive: false,
        items: [],
        access: { role: 'customer' }
      },
      {
        title: 'Notifications',
        url: '/dashboard/notifications',
        icon: 'notification',
        isActive: false,
        items: [],
        access: { role: 'customer' }
      },
      {
        title: 'Profile & Device',
        url: '/dashboard/profile',
        icon: 'user',
        isActive: false,
        items: [],
        access: { role: 'customer' }
      }
    ]
  },
  {
    label: 'Admin Menu',
    items: [
      {
        title: 'Overview',
        url: '/admin/overview',
        icon: 'dashboard',
        isActive: false,
        items: [],
        access: { role: 'admin' }
      },
      {
        title: 'Users Management',
        url: '/admin/users',
        icon: 'teams',
        isActive: false,
        items: [],
        access: { role: 'admin' }
      },
      {
        title: 'Device Manager',
        url: '/admin/devices',
        icon: 'laptop',
        isActive: false,
        items: [],
        access: { role: 'admin' }
      },
      {
        title: 'System Health',
        url: '/admin/health',
        icon: 'activity',
        isActive: false,
        items: [],
        access: { role: 'admin' }
      },
      {
        title: 'Incident Reports',
        url: '/admin/incidents',
        icon: 'post',
        isActive: false,
        items: [],
        access: { role: 'admin' }
      },
      {
        title: 'Broadcast News',
        url: '/admin/broadcast',
        icon: 'send',
        isActive: false,
        items: [],
        access: { role: 'admin' }
      }
    ]
  }
];
