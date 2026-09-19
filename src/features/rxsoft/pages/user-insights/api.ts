import { identityApi } from '@/lib/identity-api';
import { rxsoftApi } from '@/lib/rxsoft-api';

export type MeProfile = {
  id: string;
  username: string;
  roles: string[];
  permissions: string[];
  modules: Array<{ code: string; name?: string }>;
};

export type MeActivity = {
  lastLoginAt: string | null;
  loginCount: number;
  refreshCount: number;
};

export type PosConfig = {
  storeId?: string | null;
  stockLocation?: { id: string; name: string } | null;
  allowPos?: boolean;
  allowA4Print?: boolean;
  loginTimeoutMinutes?: number | null;
  autoSelectLocation?: boolean;
};

export type RoleRequest = {
  id: string;
  userId: string;
  roleCode: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string | null;
  requestedBy: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
};

export async function getMe(): Promise<MeProfile> {
  const { data } = await identityApi.get('/auth/me');
  return data;
}

export async function getMeActivity(): Promise<MeActivity> {
  const { data } = await identityApi.get('/auth/me/activity');
  return data;
}

export async function listRoleCatalog(): Promise<Array<{ code: string; name: string }>> {
  const { data } = await identityApi.get('/roles/catalog');
  return data;
}

export async function listMyRoleRequests(): Promise<RoleRequest[]> {
  const { data } = await identityApi.get('/role-requests/my');
  return data;
}

export async function createRoleRequest(roleCode: string, reason?: string) {
  const { data } = await identityApi.post('/role-requests', { roleCode, reason });
  return data;
}

export async function getMyPosConfig(): Promise<PosConfig> {
  const { data } = await rxsoftApi.get('/user-pos-config/me');
  return data;
}

export async function getMyAudit(limit = 8) {
  const { data } = await rxsoftApi.get('/audit-logs/me', { params: { limit } });
  return data;
}

export async function listAllRoleRequests(): Promise<RoleRequest[]> {
  const { data } = await identityApi.get('/role-requests');
  return data;
}

export async function approveRoleRequest(id: string, roleCode?: string): Promise<RoleRequest> {
  const { data } = await identityApi.patch(`/role-requests/${id}/approve`, { roleCode });
  return data;
}

export async function rejectRoleRequest(id: string): Promise<RoleRequest> {
  const { data } = await identityApi.patch(`/role-requests/${id}/reject`);
  return data;
}