import { create } from 'zustand';

export type AppView = 
  | 'landing'
  | 'login'
  | 'register'
  | 'client-dashboard'
  | 'client-orders'
  | 'client-messages'
  | 'client-profile'
  | 'client-cart'
  | 'client-shop'
  | 'client-product'
  | 'client-favorites'
  | 'client-followed-shops'
  | 'client-notifications'
  | 'vendor-dashboard'
  | 'vendor-products'
  | 'vendor-orders'
  | 'vendor-messages'
  | 'vendor-shop-settings'
  | 'vendor-add-product'
  | 'vendor-edit-product'
  | 'vendor-invoices'
  | 'vendor-promotions'
  | 'vendor-subscription'
  | 'admin-dashboard'
  | 'admin-vendors'
  | 'admin-clients'
  | 'admin-shops'
  | 'admin-orders'
  | 'admin-messages'
  | 'admin-recommendations'
  | 'admin-password-resets'
  | 'admin-settings'
  | 'admin-activity'
  | 'admin-products'
  | 'admin-invoices'
  | 'admin-security'
  | 'admin-statistics'
  | 'admin-notifications'
  | 'admin-subscriptions'
  | 'admin-payments'
  | 'admin-reports'
  | 'admin-verifications';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  address?: string;
  city?: string;
  country?: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  isSuspended?: boolean;
  shop?: Shop | null;
  subscription?: {
    id: string;
    status: 'INACTIVE' | 'ACTIVE' | 'EXPIRED' | 'TRIAL' | 'PERMANENT';
    startDate?: string | null;
    expiryDate?: string | null;
    amount: number;
    daysUntilExpiry?: number | null;
  } | null;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  category?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  commune?: string;
  hours?: string;
  socials?: string;
  currency?: string;
  ownerId?: string;
  isRecommended?: boolean;
  recommendationStatus?: string;
  isActive?: boolean;
  owner?: User;
  products?: Product[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  images: string;
  category?: string;
  stock: number;
  isActive: boolean;
  shopId: string;
  shop?: Shop;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product?: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  shopId: string;
  status: string;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  items?: OrderItem[];
  shop?: Shop;
  customer?: User;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachment?: string;
  isRead: boolean;
  createdAt: string;
  sender?: User;
  receiver?: User;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  shopId: string;
  customerId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product?: Product;
}

export interface FollowedShop {
  id: string;
  userId: string;
  shopId: string;
  createdAt: string;
  shop?: Shop;
}

export interface Promotion {
  id: string;
  shopId: string;
  title: string;
  description?: string;
  discount?: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Subscription {
  id: string;
  vendorId: string;
  status: 'INACTIVE' | 'ACTIVE' | 'EXPIRED' | 'TRIAL';
  startDate?: string;
  expiryDate?: string;
  amount: number;
  freeMonths: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  vendorId: string;
  amount: number;
  currency: string;
  type: 'REGISTRATION' | 'SUBSCRIPTION' | 'RENEWAL';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentMethod: 'PAWAPAY' | 'GENIUSPAY' | 'MANUAL' | 'ADMIN_GRANT';
  transactionRef?: string;
  pawapayStatus?: string;
  description?: string;
  createdAt: string;
}

interface AppState {
  // Navigation
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  
  // Auth
  user: User | null;
  token: string | null;
  setUser: (user: User | null, token?: string | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  
  // Selected items
  selectedShop: Shop | null;
  setSelectedShop: (shop: Shop | null) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
  chatPartner: User | null;
  setChatPartner: (user: User | null) => void;
  
  // UI
  darkMode: boolean;
  toggleDarkMode: () => void;
  showInstallPrompt: boolean;
  setShowInstallPrompt: (show: boolean) => void;
  
  // Admin secret
  logoTapCount: number;
  incrementLogoTap: () => boolean;
  resetLogoTap: () => void;
  isAdminAccessOpen: boolean;
  setIsAdminAccessOpen: (open: boolean) => void;

  // Onboarding
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;

  // Cart icon admin access
  cartIconTapCount: number;
  incrementCartIconTap: () => boolean;
  resetCartIconTap: () => void;

  // Admin session security (auto-logout on inactivity)
  adminLastActivity: number;
  touchAdminActivity: () => void;
  isAdminSessionExpired: () => boolean;
  adminLogout: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentView: 'landing',
  setCurrentView: (view) => set({ currentView: view }),
  
  // Auth
  user: null,
  token: null,
  setUser: (user, token) => {
    if (user && token) {
      localStorage.setItem('ecordc_token', token);
      localStorage.setItem('ecordc_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ecordc_token');
      localStorage.removeItem('ecordc_user');
    }
    set({ user, token: token ?? null });
  },
  refreshUser: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'me', token }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          localStorage.setItem('ecordc_user', JSON.stringify(data.user));
          set({ user: data.user });
        }
      }
    } catch {
      // Silent fail - user data stays as-is
    }
  },
  logout: () => {
    localStorage.removeItem('ecordc_token');
    localStorage.removeItem('ecordc_user');
    set({ user: null, token: null, currentView: 'landing' });
  },
  
  // Selected items
  selectedShop: null,
  setSelectedShop: (shop) => set({ selectedShop: shop }),
  selectedProduct: null,
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  selectedOrder: null,
  setSelectedOrder: (order) => set({ selectedOrder: order }),
  chatPartner: null,
  setChatPartner: (user) => set({ chatPartner: user }),
  
  // UI
  darkMode: false,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  showInstallPrompt: false,
  setShowInstallPrompt: (show) => set({ showInstallPrompt: show }),
  
  // Admin secret (effectively disabled - threshold set very high)
  logoTapCount: 0,
  incrementLogoTap: () => {
    const newCount = get().logoTapCount + 1;
    set({ logoTapCount: newCount });
    if (newCount >= 999) {
      set({ logoTapCount: 0, isAdminAccessOpen: true });
      return true;
    }
    setTimeout(() => set({ logoTapCount: 0 }), 1000);
    return false;
  },
  resetLogoTap: () => set({ logoTapCount: 0 }),
  isAdminAccessOpen: false,
  setIsAdminAccessOpen: (open) => set({ isAdminAccessOpen: open }),

  // Cart icon admin access (6 clicks within 4 seconds - looks decorative)
  cartIconTapCount: 0,
  incrementCartIconTap: () => {
    const newCount = get().cartIconTapCount + 1;
    set({ cartIconTapCount: newCount });
    if (newCount >= 6) {
      set({ cartIconTapCount: 0, isAdminAccessOpen: true });
      return true;
    }
    // Reset after 4 seconds of no clicks
    setTimeout(() => {
      if (get().cartIconTapCount === newCount) {
        set({ cartIconTapCount: 0 });
      }
    }, 4000);
    return false;
  },
  resetCartIconTap: () => set({ cartIconTapCount: 0 }),

  // Onboarding
  showOnboarding: false,
  setShowOnboarding: (show) => set({ showOnboarding: show }),

  // Admin session security - auto-logout after 15 minutes of inactivity
  adminLastActivity: Date.now(),
  touchAdminActivity: () => set({ adminLastActivity: Date.now() }),
  isAdminSessionExpired: () => {
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes
    return Date.now() - get().adminLastActivity > INACTIVITY_LIMIT;
  },
  adminLogout: () => {
    // Clear admin session (token + user) and return to landing
    localStorage.removeItem('ecordc_token');
    localStorage.removeItem('ecordc_user');
    set({
      user: null,
      token: null,
      currentView: 'landing',
      isAdminAccessOpen: false,
      adminLastActivity: Date.now(),
    });
  },
}));
