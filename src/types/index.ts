export type Role = 'owner' | 'manager' | 'staff' | 'superadmin';

export type TenantStatus = 'active' | 'trial' | 'suspended';

export type SubscriptionPlan = 'starter' | 'growth' | 'saas';

export type TransactionType = 'STAMP_ADD' | 'CORRECTION' | 'REDEEM' | 'EXPIRY';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo: string;
  primaryColor: string;
  accentColor: string;
  category: 'cafe' | 'barbershop' | 'carwash' | 'laundry' | 'retail' | 'fnb';
  status: TenantStatus;
  plan: SubscriptionPlan;
  createdAt: string;
}

export interface Outlet {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  timezone: string;
  active: boolean;
}

export interface UserStaff {
  id: string;
  tenantId: string;
  outletId?: string;
  name: string;
  role: Role;
  pinHash: string; // SHA-256 of 4-6 digit PIN
  pinPlain?: string; // For demo/sandbox convenience
  active: boolean;
}

export interface Program {
  id: string;
  tenantId: string;
  name: string;
  stampTarget: number; // e.g. 9
  rewardName: string; // e.g. "Gratis 1 Kopi Pilihan"
  validityDays: number; // e.g. 180
  minTransactionRp?: number; // e.g. 30000
  ruleVersion: number;
  active: boolean;
  terms: string[];
}

export interface Member {
  id: string;
  tenantId: string;
  name: string;
  whatsapp: string; // formatted +62...
  consentAt: string;
  consentSource: 'qr_poster' | 'staff_enroll' | 'web';
  tokenQr: string; // cryptographically secure random token (e.g. stp_xxx)
  isGuest: boolean;
  createdAt: string;
}

export interface StampCard {
  id: string;
  tenantId: string;
  memberId: string;
  programId: string;
  saldoStamp: number;
  cycleCount: number; // Siklus ke-1, 2, dst
  status: 'active' | 'completed' | 'expired';
  walletSerial: string;
  createdAt: string;
  updatedAt: string;
}

export interface StampTransaction {
  id: string;
  tenantId: string;
  cardId: string;
  memberId: string;
  outletId: string;
  staffId: string;
  staffName: string;
  outletName: string;
  type: TransactionType;
  amount: number; // +1, -1, etc.
  transactionValue?: number; // e.g. Rp 35.000
  reason?: string;
  createdAt: string;
}

export interface Redemption {
  id: string;
  tenantId: string;
  cardId: string;
  memberId: string;
  memberName: string;
  programId: string;
  outletId: string;
  staffId: string;
  rewardName: string;
  redeemedAt: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  entity: string;
  details: string;
  createdAt: string;
}
