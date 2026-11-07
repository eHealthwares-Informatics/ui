import {
  Badge,
  Button,
  Card,
  InputWrapper,
  Menu,
  Modal,
  Pagination,
  Popover,
  Table,
  Tabs,
  Tooltip,
  createTheme,
  rem,
} from '@mantine/core';

/**
 * App-wide design language.
 *
 * Mirrors the visual system introduced on the module landing page and sidebar:
 * a soft canvas, deep-navy headings, muted secondary copy, rounded surfaces and
 * a single brand blue (#2879e8) used for primary actions and active states.
 *
 * Colours are read from the `--app-*` tokens in `src/styles/global.css` where a
 * component needs to match a custom surface, so dark mode keeps working.
 */
export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 5 },
  colors: {
    brand: [
      '#eef5ff',
      '#dbe9ff',
      '#b7d3ff',
      '#8fbcfd',
      '#67a4f9',
      '#4a92f2',
      '#2879e8',
      '#1e66cd',
      '#1a53a6',
      '#12345b',
    ],
  },
  defaultRadius: 10,
  headings: {
    fontWeight: '700',
    sizes: {
      h1: { fontSize: rem(32), lineHeight: '1.2' },
      h2: { fontSize: rem(26), lineHeight: '1.25' },
      h3: { fontSize: rem(21), lineHeight: '1.3' },
      h4: { fontSize: rem(18), lineHeight: '1.35' },
      h5: { fontSize: rem(16), lineHeight: '1.4' },
      h6: { fontSize: rem(14), lineHeight: '1.4' },
    },
  },
  components: {
    Card: Card.extend({
      defaultProps: { radius: 'lg', withBorder: true },
      styles: {
        root: { borderColor: 'var(--app-line)' },
      },
    }),
    Button: Button.extend({
      styles: { root: { fontWeight: 600 } },
    }),
    Badge: Badge.extend({
      defaultProps: { radius: 'xl' },
      styles: { root: { fontWeight: 600, letterSpacing: '0.01em' } },
    }),
    Table: Table.extend({
      defaultProps: { horizontalSpacing: 'md', verticalSpacing: 'sm' },
      styles: {
        table: { borderColor: 'var(--app-line)' },
        th: {
          paddingTop: rem(10),
          paddingBottom: rem(10),
          color: 'var(--app-muted)',
          fontWeight: 600,
          fontSize: rem(11),
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          backgroundColor: 'var(--app-table-head)',
        },
        td: { borderColor: 'var(--app-line)' },
      },
    }),
    Modal: Modal.extend({ defaultProps: { radius: 'lg' } }),
    Menu: Menu.extend({
      styles: {
        dropdown: {
          padding: 6,
          borderRadius: 14,
          border: '1px solid var(--app-line)',
          backgroundColor: 'var(--app-surface)',
          boxShadow: '0 18px 40px -28px rgb(18 52 91 / 45%)',
        },
        item: { borderRadius: 8 },
        label: {
          color: 'var(--app-muted)',
          fontSize: rem(11),
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        },
      },
    }),
    Popover: Popover.extend({
      styles: {
        dropdown: {
          borderRadius: 14,
          border: '1px solid var(--app-line)',
          boxShadow: '0 18px 40px -28px rgb(18 52 91 / 45%)',
        },
      },
    }),
    Tooltip: Tooltip.extend({ defaultProps: { radius: 'sm' } }),
    Tabs: Tabs.extend({ defaultProps: { radius: 'md' } }),
    Pagination: Pagination.extend({ defaultProps: { radius: 'md' } }),
    InputWrapper: InputWrapper.extend({
      styles: {
        label: {
          marginBottom: rem(4),
          color: 'var(--app-navy)',
          fontWeight: 600,
        },
        description: { color: 'var(--app-muted)' },
      },
    }),
  },
});
