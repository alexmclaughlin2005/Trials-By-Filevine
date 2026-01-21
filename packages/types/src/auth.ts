// Authentication and authorization types

export interface JWTPayload {
  sub: string; // User ID
  email: string;
  orgId: string; // Organization ID
  role: UserRole;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export type UserRole = 'admin' | 'attorney' | 'paralegal' | 'consultant';

export interface User {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: UserRole;
  authProviderId?: string;
  lastLoginAt?: Date;
  settings?: Record<string, unknown>;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings?: Record<string, unknown>;
  subscriptionTier: string;
}

// Permissions
export enum Permission {
  // Case permissions
  CASES_READ = 'cases:read',
  CASES_WRITE = 'cases:write',
  CASES_DELETE = 'cases:delete',

  // Juror permissions
  JURORS_READ = 'jurors:read',
  JURORS_WRITE = 'jurors:write',
  JURORS_RESEARCH = 'jurors:research',

  // Persona permissions
  PERSONAS_READ = 'personas:read',
  PERSONAS_WRITE = 'personas:write',

  // Trial permissions
  TRIAL_MODE = 'trial:mode',
  TRIAL_RECORD = 'trial:record',

  // Focus group permissions
  FOCUS_GROUPS_RUN = 'focus_groups:run',
  FOCUS_GROUPS_VIEW = 'focus_groups:view',

  // Admin permissions
  ADMIN_USERS = 'admin:users',
  ADMIN_SETTINGS = 'admin:settings',
  ADMIN_BILLING = 'admin:billing',
}

// Role-based permission mapping
export const RolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    Permission.CASES_READ,
    Permission.CASES_WRITE,
    Permission.CASES_DELETE,
    Permission.JURORS_READ,
    Permission.JURORS_WRITE,
    Permission.JURORS_RESEARCH,
    Permission.PERSONAS_READ,
    Permission.PERSONAS_WRITE,
    Permission.TRIAL_MODE,
    Permission.TRIAL_RECORD,
    Permission.FOCUS_GROUPS_RUN,
    Permission.FOCUS_GROUPS_VIEW,
    Permission.ADMIN_USERS,
    Permission.ADMIN_SETTINGS,
    Permission.ADMIN_BILLING,
  ],
  attorney: [
    Permission.CASES_READ,
    Permission.CASES_WRITE,
    Permission.JURORS_READ,
    Permission.JURORS_WRITE,
    Permission.JURORS_RESEARCH,
    Permission.PERSONAS_READ,
    Permission.PERSONAS_WRITE,
    Permission.TRIAL_MODE,
    Permission.TRIAL_RECORD,
    Permission.FOCUS_GROUPS_RUN,
    Permission.FOCUS_GROUPS_VIEW,
  ],
  paralegal: [
    Permission.CASES_READ,
    Permission.JURORS_READ,
    Permission.JURORS_WRITE,
    Permission.JURORS_RESEARCH,
    Permission.PERSONAS_READ,
    Permission.FOCUS_GROUPS_VIEW,
  ],
  consultant: [
    Permission.CASES_READ,
    Permission.JURORS_READ,
    Permission.PERSONAS_READ,
    Permission.PERSONAS_WRITE,
    Permission.FOCUS_GROUPS_RUN,
    Permission.FOCUS_GROUPS_VIEW,
  ],
};

export interface AuthContext {
  user: User;
  organization: Organization;
  token: string;
  permissions: Permission[];
}
