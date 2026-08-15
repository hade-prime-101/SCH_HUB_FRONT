// types/super-admin.ts

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  schoolId?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface School {
  id: string;
  name: string;
  domain?: string;
  logoUrl?: string;
  createdAt: string;
}

export interface Faculty {
  id: string;
  name: string;
  schoolId: string;
}

export interface Department {
  id: string;
  name: string;
  shortCode: string;
  facultyId: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  details?: string;
  schoolId?: string;
  createdAt: string;
}

export interface PlatformStats {
  totalUsers: number;
  totalSchools: number;
  totalMaterials: number;
  totalQuizzes: number;
  // more as needed
}

export interface SchoolStats {
  totalUsers: number;
  totalMaterials: number;
  totalQuizzes: number;
}

export interface SchoolUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isBlocked: boolean;
  schoolId: string;
}

export interface Agent {
  userId: string;
  fullName: string;
  studentId: string;
  department: string;
  verified: boolean;
  status: 'PENDING' | 'ACTIVE' | 'REVOKED';
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
}

export interface MapFeature {
  id: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geometry: any; // GeoJSON geometry
  properties: {
    name: string;
    category: string;
    description?: string;
    imageUrl?: string;
  };
}

export interface MapEntrance {
  id: string;
  featureId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geometry: any;
  properties: { name: string };
}

// Payloads
export interface CreateAdminPayload {
  name: string;
  email: string;
  password: string;
  schoolId?: string;
  role?: string;
}

export interface ResetAdminPasswordPayload {
  password: string;
}

export interface CreateSchoolPayload {
  name: string;
  domain?: string;
}

export interface UpdateSchoolPayload {
  name?: string;
  domain?: string;
}

export interface CreateFacultyPayload {
  name: string;
  schoolId?: string;
}

export interface CreateDepartmentPayload {
  name: string;
  shortCode: string;
  facultyId?: string;
}

export interface ListAuditLogsQuery {
  page?: number;
  limit?: number;
  action?: string;
  from?: string;
  to?: string;
}

export interface UpsertMapFeaturePayload {
  id?: string;
  type: 'Feature';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geometry: any;
  properties: {
    name: string;
    category: string;
    description?: string;
    imageUrl?: string;
  };
}

export interface UpsertMapEntrancePayload {
  id?: string;
  featureId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geometry: any;
  properties: { name: string };
}

export interface ImportMapGeoJsonPayload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  features: any[]; // GeoJSON features
}