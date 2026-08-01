'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { ThemeProvider } from 'next-themes';
import LandingPage from '@/components/landing/LandingPage';
import AuthModals from '@/components/auth/AuthModals';
import AppHeader from '@/components/layout/AppHeader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { AppOnboarding } from '@/components/onboarding/AppOnboarding';

// Client components
import ClientDashboard from '@/components/client/ClientDashboard';
import ClientShopList from '@/components/client/ClientShopList';
import ClientShopView from '@/components/client/ClientShopView';
import ClientCart from '@/components/client/ClientCart';
import ClientOrders from '@/components/client/ClientOrders';
import ClientMessages from '@/components/client/ClientMessages';
import ClientProfile from '@/components/client/ClientProfile';
import ClientFavorites from '@/components/client/ClientFavorites';
import ClientFollowedShops from '@/components/client/ClientFollowedShops';
import ClientNotifications from '@/components/client/ClientNotifications';

// Vendor components
import VendorDashboard from '@/components/vendor/VendorDashboard';
import VendorProducts from '@/components/vendor/VendorProducts';
import VendorAddProduct from '@/components/vendor/VendorAddProduct';
import VendorOrders from '@/components/vendor/VendorOrders';
import VendorMessages from '@/components/vendor/VendorMessages';
import VendorShopSettings from '@/components/vendor/VendorShopSettings';
import VendorInvoices from '@/components/vendor/VendorInvoices';
import VendorPromotions from '@/components/vendor/VendorPromotions';
import VendorSubscription from '@/components/vendor/VendorSubscription';

// Admin components
import AdminAccess from '@/components/admin/AdminAccess';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminVendors from '@/components/admin/AdminVendors';
import AdminClients from '@/components/admin/AdminClients';
import AdminShops from '@/components/admin/AdminShops';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminMessages from '@/components/admin/AdminMessages';
import AdminRecommendations from '@/components/admin/AdminRecommendations';
import AdminPasswordResets from '@/components/admin/AdminPasswordResets';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminActivity from '@/components/admin/AdminActivity';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminInvoices from '@/components/admin/AdminInvoices';
import AdminSecurity from '@/components/admin/AdminSecurity';
import AdminStatistics from '@/components/admin/AdminStatistics';
import AdminNotifications from '@/components/admin/AdminNotifications';
import AdminSubscriptions from '@/components/admin/AdminSubscriptions';
import AdminPayments from '@/components/admin/AdminPayments';
import AdminReports from '@/components/admin/AdminReports';
import AdminVerification from '@/components/admin/AdminVerification';

// Onboarding trigger
const ONBOARDING_FLAG = 'ecordc_onboarding_v1_seen';

function shouldShowOnboarding(user: { id: string; role: string }): boolean {
  if (user.role !== 'CLIENT' && user.role !== 'VENDOR') return false;
  const key = `${ONBOARDING_FLAG}_${user.role}`;
  try {
    return !localStorage.getItem(key);
  } catch {
    return true;
  }
}

// PWA install prompt
function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [showPrompt, setShowPrompt] = React.useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-card border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-xl p-4 z-50 lg:bottom-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Installer EcoRDC</p>
          <p className="text-xs text-muted-foreground mt-0.5">Accédez rapidement depuis votre écran d&apos;accueil</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={async () => {
                deferredPrompt?.prompt();
                const result = await deferredPrompt?.userChoice;
                if (result?.outcome === 'accepted') setShowPrompt(false);
                setDeferredPrompt(null);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Installer
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Footer for non-landing views
function AppFooter() {
  const { currentView } = useAppStore();
  
  // Don't show on landing page (it has its own footer)
  if (currentView === 'landing' || currentView === 'login' || currentView === 'register') {
    return null;
  }

  // Don't show on admin views (they have sidebar)
  if (currentView.startsWith('admin-')) {
    return null;
  }

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <img src="/ecordc-logo.png" alt="EcoRDC" className="h-6 w-6 object-contain" />
          <span className="text-sm font-medium text-emerald-600">EcoRDC</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Copyright © {new Date().getFullYear()} HenoBuild. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}

function AppContent() {
  const { currentView, user, setUser, setCurrentView, refreshUser, showOnboarding, setShowOnboarding } = useAppStore();
  const { touchAdminActivity, isAdminSessionExpired, adminLogout } = useAppStore();

  // Handle payment redirect from GeniusPay checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const paymentRef = params.get('reference');

    if (paymentStatus === 'return' && paymentRef) {
      // Clean URL
      window.history.replaceState({}, '', '/');
      // The vendor's subscription page will poll for status automatically
      // Just show a friendly message
      if (user?.role === 'VENDOR') {
        setCurrentView('vendor-subscription');
      }
    } else if (paymentStatus === 'error') {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('ecordc_token');
    const savedUser = localStorage.getItem('ecordc_user');

    if (savedToken && savedUser && !user) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser, savedToken);

        // Navigate to appropriate dashboard
        if (parsedUser.role === 'ADMIN') setCurrentView('admin-dashboard');
        else if (parsedUser.role === 'VENDOR') setCurrentView('vendor-dashboard');
        else setCurrentView('client-dashboard');

        // Refresh user data from server to sync subscription status
        // (deferred so it doesn't block initial render)
        setTimeout(() => {
          useAppStore.getState().refreshUser();
        }, 500);
      } catch {
        localStorage.removeItem('ecordc_token');
        localStorage.removeItem('ecordc_user');
      }
    }
  }, []);

  // Auto-open onboarding for CLIENT/VENDOR accounts that haven't seen it yet.
  // Covers new accounts (right after registration) and existing accounts (once).
  // The flag is set at trigger time so it can only ever auto-open a single time,
  // even if the user closes the tab or navigates away while it is displayed.
  useEffect(() => {
    if (!user) return;
    if (user.role !== 'CLIENT' && user.role !== 'VENDOR') return;
    if (showOnboarding) return;
    if (currentView === 'landing' || currentView === 'login' || currentView === 'register') return;
    if (!shouldShowOnboarding(user)) return;
    try { localStorage.setItem(`${ONBOARDING_FLAG}_${user.role}`, '1'); } catch {}
    // Small delay so the dashboard renders behind the dialog
    const t = setTimeout(() => setShowOnboarding(true), 700);
    return () => clearTimeout(t);
  }, [user?.id, user?.role, currentView, showOnboarding, setShowOnboarding]);

  // Admin inactivity auto-logout: track activity and check for expiry
  const isAdminView = currentView.startsWith('admin-');

  // Track user activity (mouse/keyboard) while in admin views
  useEffect(() => {
    if (!isAdminView) return;
    const handleActivity = () => touchAdminActivity();
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
    };
  }, [isAdminView, touchAdminActivity]);

  // Periodically check for admin session expiry
  useEffect(() => {
    if (!isAdminView) return;
    const interval = setInterval(() => {
      if (isAdminSessionExpired()) {
        adminLogout();
      }
    }, 30 * 1000); // check every 30 seconds
    return () => clearInterval(interval);
  }, [isAdminView, isAdminSessionExpired, adminLogout]);

  // Determine if mobile bottom nav is showing (to add bottom padding)
  const showBottomNav = user &&
    currentView !== 'landing' &&
    currentView !== 'login' &&
    currentView !== 'register' &&
    !currentView.startsWith('admin-');

  // Render based on current view
  const renderView = () => {
    // Landing & Auth views
    if (currentView === 'landing' || currentView === 'login' || currentView === 'register') {
      return <LandingPage />;
    }

    // Client views
    if (currentView === 'client-dashboard') return <ClientDashboard />;
    if (currentView === 'client-shop') return <ClientShopList />;
    if (currentView === 'client-product') return <ClientShopView />;
    if (currentView === 'client-cart') return <ClientCart />;
    if (currentView === 'client-orders') return <ClientOrders />;
    if (currentView === 'client-messages') return <ClientMessages />;
    if (currentView === 'client-profile') return <ClientProfile />;
    if (currentView === 'client-favorites') return <ClientFavorites />;
    if (currentView === 'client-followed-shops') return <ClientFollowedShops />;
    if (currentView === 'client-notifications') return <ClientNotifications />;

    // Vendor views — access control: require active subscription
    // Vendors without active/trial subscription are redirected to subscription page
    // (except for vendor-subscription and vendor-messages which remain accessible)
    // Both ACTIVE (paid) and TRIAL (admin-granted free period) vendors can access their dashboard.
    const vendorSubscriptionActive =
      user?.role === 'VENDOR' &&
      (user.subscription?.status === 'ACTIVE' || user.subscription?.status === 'TRIAL');
    const vendorViewsRequiringSubscription = [
      'vendor-dashboard',
      'vendor-products',
      'vendor-add-product',
      'vendor-edit-product',
      'vendor-orders',
      'vendor-shop-settings',
      'vendor-invoices',
      'vendor-promotions',
    ];
    if (user?.role === 'VENDOR' && vendorViewsRequiringSubscription.includes(currentView) && !vendorSubscriptionActive) {
      return <VendorSubscription />;
    }
    if (currentView === 'vendor-dashboard') return <VendorDashboard />;
    if (currentView === 'vendor-products') return <VendorProducts />;
    if (currentView === 'vendor-add-product') return <VendorAddProduct />;
    if (currentView === 'vendor-edit-product') return <VendorAddProduct />;
    if (currentView === 'vendor-orders') return <VendorOrders />;
    if (currentView === 'vendor-messages') return <VendorMessages />;
    if (currentView === 'vendor-shop-settings') return <VendorShopSettings />;
    if (currentView === 'vendor-invoices') return <VendorInvoices />;
    if (currentView === 'vendor-promotions') return <VendorPromotions />;
    if (currentView === 'vendor-subscription') return <VendorSubscription />;

    // Admin views (wrapped with sidebar)
    const adminView = () => {
      if (currentView === 'admin-dashboard') return <AdminDashboard />;
      if (currentView === 'admin-vendors') return <AdminVendors />;
      if (currentView === 'admin-clients') return <AdminClients />;
      if (currentView === 'admin-shops') return <AdminShops />;
      if (currentView === 'admin-orders') return <AdminOrders />;
      if (currentView === 'admin-messages') return <AdminMessages />;
      if (currentView === 'admin-recommendations') return <AdminRecommendations />;
      if (currentView === 'admin-password-resets') return <AdminPasswordResets />;
      if (currentView === 'admin-settings') return <AdminSettings />;
      if (currentView === 'admin-activity') return <AdminActivity />;
      if (currentView === 'admin-products') return <AdminProducts />;
      if (currentView === 'admin-invoices') return <AdminInvoices />;
      if (currentView === 'admin-security') return <AdminSecurity />;
      if (currentView === 'admin-statistics') return <AdminStatistics />;
      if (currentView === 'admin-notifications') return <AdminNotifications />;
      if (currentView === 'admin-subscriptions') return <AdminSubscriptions />;
      if (currentView === 'admin-payments') return <AdminPayments />;
      if (currentView === 'admin-reports') return <AdminReports />;
      if (currentView === 'admin-verifications') return <AdminVerification />;
      return <AdminDashboard />;
    };

    if (currentView.startsWith('admin-')) {
      // Admin components wrap themselves in <AdminSidebar>{content}</AdminSidebar>
      // so we just render the component directly here.
      return adminView();
    }

    return <LandingPage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className={`flex-1 ${showBottomNav ? 'pb-16 lg:pb-0' : ''}`}>
        {renderView()}
      </main>
      <AppFooter />
      <MobileBottomNav />
      <AuthModals />
      <AdminAccess />
      <AppOnboarding />
      <PWAInstallPrompt />
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AppContent />
    </ThemeProvider>
  );
}
