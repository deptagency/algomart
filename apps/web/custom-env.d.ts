declare global {
  interface Window {
    __PUBLIC_CONFIG__: Record<string, string>
  }
}

// This is needed to ensure the type definition above is not ignored
export {}
