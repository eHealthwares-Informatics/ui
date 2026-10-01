/// <reference types="vite/client" />

interface Window {
  /** Set to true by src/main.tsx once React mounts, consumed by the loading screen in index.html. */
  __REACT_READY__?: boolean;
}
