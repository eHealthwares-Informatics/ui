import { Box, Group, NavLink, ScrollArea, Text, Title, Tooltip, ActionIcon } from '@mantine/core';
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import {
  BarChart3,
  Users,
  MessageCircle,
  ArrowLeft,
  Map,
  Footprints,
  HeartHandshake,
  Activity,
  Route,
  FileText,
  Radio,
  UserCheck,
  Vote,
  Shield,
  Bell,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const adminNavItems = [
  { label: 'Dashboard', path: '/apm/admin/conversion', icon: BarChart3 },
  { label: 'LGAs', path: '/apm/admin/lgas', icon: Map },
  { label: 'Stakeholders', path: '/apm/admin/stakeholders', icon: Users },
  { label: 'Tours', path: '/apm/admin/tours', icon: Route },
  { label: 'Canvassing', path: '/apm/admin/canvassing', icon: Footprints },
  { label: 'Content', path: '/apm/admin/content', icon: FileText },
  { label: 'Listening', path: '/apm/admin/listening', icon: Radio },
  { label: 'Sentiment', path: '/apm/admin/sentiment', icon: Activity },
  { label: 'Volunteers', path: '/apm/admin/volunteers', icon: HeartHandshake },
  { label: 'WhatsApp', path: '/apm/admin/whatsapp', icon: MessageCircle },
  { label: 'Agents', path: '/apm/admin/agents', icon: UserCheck },
  { label: 'Results', path: '/apm/admin/results', icon: Vote },
  { label: 'Protection', path: '/apm/admin/incidents', icon: Shield },
  { label: 'GOTV', path: '/apm/admin/gotv', icon: Bell },
];

const sidebarBg = '#002D5A';
const sidebarActive = 'rgba(255,255,255,0.12)';
const sidebarHover = 'rgba(255,255,255,0.06)';
const sidebarText = '#94A3B8';
const sidebarTextActive = '#fff';

export function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navWidth = collapsed ? 60 : 220;

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', background: '#F8FAFC' }}>
      {/* ── Sidebar ── */}
      <Box
        style={{
          width: navWidth,
          background: sidebarBg,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        {/* Header */}
        <Box
          style={{
            padding: collapsed ? '12px 0' : '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Group justify={collapsed ? 'center' : 'space-between'} wrap="nowrap">
            {!collapsed && (
              <Box style={{ lineHeight: 1.2 }}>
                <Title order={5} style={{ color: '#fff', fontSize: 14, whiteSpace: 'nowrap' }}>
                  APM Campaign
                </Title>
                <Text size="xs" style={{ color: sidebarText, fontSize: 10, whiteSpace: 'nowrap' }}>
                  Oyo 2027
                </Text>
              </Box>
            )}
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              style={{ color: sidebarText, flexShrink: 0 }}
            >
              {collapsed ? <Menu size={16} /> : <X size={16} />}
            </ActionIcon>
          </Group>
        </Box>

        {/* Nav items */}
        <ScrollArea style={{ flex: 1 }} px={collapsed ? 4 : 8} py={8}>
          {adminNavItems.map((item) => {
            const active = pathname === item.path;
            const link = (
              <NavLink
                key={item.path}
                label={collapsed ? undefined : item.label}
                leftSection={<item.icon size={collapsed ? 18 : 16} />}
                active={active}
                onClick={() => navigate({ to: item.path })}
                styles={{
                  root: {
                    borderRadius: 6,
                    marginBottom: 2,
                    padding: collapsed ? '8px 0' : '8px 12px',
                    color: active ? sidebarTextActive : sidebarText,
                    background: active ? sidebarActive : 'transparent',
                    '&:hover': { background: active ? sidebarActive : sidebarHover },
                    justifyContent: collapsed ? 'center' : undefined,
                  },
                  label: { fontSize: 13, fontWeight: active ? 600 : 400 },
                  section: { marginRight: collapsed ? 0 : 10 },
                  body: { flex: collapsed ? 0 : undefined },
                }}
              />
            );

            if (collapsed) {
              return (
                <Box
                  key={item.path}
                  style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}
                >
                  <Tooltip label={item.label} position="right" withArrow>
                    {link}
                  </Tooltip>
                </Box>
              );
            }
            return link;
          })}
        </ScrollArea>

        {/* Back to site */}
        <Box
          style={{
            padding: collapsed ? 8 : '8px 12px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <NavLink
            label={collapsed ? undefined : 'Back to Site'}
            leftSection={<ArrowLeft size={collapsed ? 18 : 16} />}
            onClick={() => navigate({ to: '/apm' })}
            styles={{
              root: {
                borderRadius: 6,
                color: sidebarText,
                '&:hover': { background: sidebarHover },
                padding: collapsed ? '8px 0' : '8px 12px',
                justifyContent: collapsed ? 'center' : undefined,
              },
              section: { marginRight: collapsed ? 0 : 10 },
              body: { flex: collapsed ? 0 : undefined },
            }}
          />
        </Box>
      </Box>

      {/* ── Main Content ── */}
      <Box style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Box py="sm" px="lg" style={{ background: '#fff', borderBottom: '1px solid #E2E8F0' }}>
          <Group>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => setCollapsed(!collapsed)}
              size="sm"
              style={{ color: '#64748B' }}
            >
              <Menu size={18} />
            </ActionIcon>
            <Text size="sm" style={{ color: '#64748B' }}>
              APM Campaign Management — Oyo State 2027
            </Text>
          </Group>
        </Box>
        <Box p="lg" style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
