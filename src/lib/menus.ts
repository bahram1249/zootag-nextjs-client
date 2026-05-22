import { apiClient } from './api-client';
import type { MenuNode } from './auth-types';

export async function fetchMenus(): Promise<MenuNode[]> {
  const { result } = await apiClient.get<MenuNode[]>('/v1/api/core/user/menus', {
    onlyParent: true,
    ignorePaging: true,
    orderBy: 'order',
    sortOrder: 'ASC',
  });
  return result;
}
