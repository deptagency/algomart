import AppFooterBottomNav from './sections/app-footer-bottom-nav'
import AppFooterTopNav from './sections/app-footer-top-nav'
export interface AppFooterProps {
  isBrand?: boolean // if isBrand, the nav is styled differently
}

export default function AppFooter() {
  return (
    <footer>
      <AppFooterTopNav />
      <AppFooterBottomNav />
    </footer>
  )
}
