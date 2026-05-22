import type { Column } from '@/components/ui/data-table';

export interface PageConfig {
  slug: string[];
  title: string;
  description: string;
  apiEndpoint: string;
  columns: Column<Record<string, unknown>>[];
}

export const adminPages: PageConfig[] = [
  {
    slug: ['zootag', 'manufacturers'],
    title: 'سازنده‌ها',
    description: 'مدیریت سازنده‌های دستگاه',
    apiEndpoint: '/v1/api/zootag/admin/manufacturers',
    columns: [
      { key: 'id', header: 'شناسه' },
      { key: 'manufacturerName', header: 'نام سازنده' },
      { key: 'description', header: 'توضیحات' },
      {
        key: 'isActive',
        header: 'فعال',
        render: (v) =>
          v ? (
            <span className="text-success font-medium">فعال</span>
          ) : (
            <span className="text-muted">غیرفعال</span>
          ),
      },
    ],
  },
  {
    slug: ['zootag', 'devicetypes'],
    title: 'انواع دستگاه',
    description: 'مدیریت انواع دستگاه',
    apiEndpoint: '/v1/api/zootag/admin/deviceTypes',
    columns: [
      { key: 'id', header: 'شناسه' },
      { key: 'typeName', header: 'نام نوع' },
      { key: 'modelCode', header: 'کد مدل' },
      { key: 'description', header: 'توضیحات' },
      {
        key: 'isActive',
        header: 'فعال',
        render: (v) =>
          v ? (
            <span className="text-success font-medium">فعال</span>
          ) : (
            <span className="text-muted">غیرفعال</span>
          ),
      },
    ],
  },
  {
    slug: ['zootag', 'currencies'],
    title: 'ارزها',
    description: 'مدیریت ارزها',
    apiEndpoint: '/v1/api/zootag/admin/currencies',
    columns: [
      { key: 'id', header: 'شناسه' },
      { key: 'code', header: 'کد' },
      { key: 'name', header: 'نام' },
      { key: 'symbol', header: 'نماد' },
      {
        key: 'isActive',
        header: 'فعال',
        render: (v) =>
          v ? (
            <span className="text-success font-medium">فعال</span>
          ) : (
            <span className="text-muted">غیرفعال</span>
          ),
      },
    ],
  },
  {
    slug: ['zootag', 'companies'],
    title: 'شرکت‌ها',
    description: 'مدیریت شرکت‌ها',
    apiEndpoint: '/v1/api/zootag/admin/companies',
    columns: [
      { key: 'id', header: 'شناسه' },
      { key: 'companyName', header: 'نام شرکت' },
      { key: 'legalName', header: 'نام حقوقی' },
      { key: 'email', header: 'ایمیل' },
      { key: 'phone', header: 'تلفن' },
      {
        key: 'isActive',
        header: 'فعال',
        render: (v) =>
          v ? (
            <span className="text-success font-medium">فعال</span>
          ) : (
            <span className="text-muted">غیرفعال</span>
          ),
      },
    ],
  },
  {
    slug: ['zootag', 'contracts'],
    title: 'قراردادها',
    description: 'مدیریت قراردادها',
    apiEndpoint: '/v1/api/zootag/admin/contracts',
    columns: [
      { key: 'id', header: 'شناسه' },
      { key: 'contractNumber', header: 'شماره قرارداد' },
      { key: 'title', header: 'عنوان' },
      { key: 'startDate', header: 'تاریخ شروع' },
      { key: 'endDate', header: 'تاریخ پایان' },
      {
        key: 'isActive',
        header: 'فعال',
        render: (v) =>
          v ? (
            <span className="text-success font-medium">فعال</span>
          ) : (
            <span className="text-muted">غیرفعال</span>
          ),
      },
    ],
  },
  {
    slug: ['zootag', 'devices'],
    title: 'دستگاه‌ها',
    description: 'مدیریت دستگاه‌ها',
    apiEndpoint: '/v1/api/zootag/admin/devices',
    columns: [
      { key: 'id', header: 'شناسه' },
      { key: 'serialNumber', header: 'سریال نمبر' },
      { key: 'imei', header: 'IMEI' },
      { key: 'macAddress', header: 'MAC Address' },
      {
        key: 'isActive',
        header: 'فعال',
        render: (v) =>
          v ? (
            <span className="text-success font-medium">فعال</span>
          ) : (
            <span className="text-muted">غیرفعال</span>
          ),
      },
    ],
  },
  {
    slug: ['core', 'admin', 'users'],
    title: 'کاربران',
    description: 'مدیریت کاربران سیستم',
    apiEndpoint: '/v1/api/core/admin/users',
    columns: [
      { key: 'id', header: 'شناسه' },
      { key: 'username', header: 'نام کاربری' },
      { key: 'firstname', header: 'نام' },
      { key: 'lastname', header: 'نام خانوادگی' },
      { key: 'email', header: 'ایمیل' },
      { key: 'phoneNumber', header: 'تلفن' },
    ],
  },
  {
    slug: ['core', 'admin', 'roles'],
    title: 'نقش‌ها',
    description: 'مدیریت نقش‌های کاربری',
    apiEndpoint: '/v1/api/core/admin/roles',
    columns: [
      { key: 'id', header: 'شناسه' },
      { key: 'roleName', header: 'نام نقش' },
    ],
  },
  {
    slug: ['core', 'admin', 'permissions'],
    title: 'دسترسی‌ها',
    description: 'مدیریت دسترسی‌ها',
    apiEndpoint: '/v1/api/core/admin/permissions',
    columns: [
      { key: 'id', header: 'شناسه' },
      { key: 'permissionSymbol', header: 'سمبل دسترسی' },
      { key: 'permissionName', header: 'نام دسترسی' },
      { key: 'permissionUrl', header: 'URL' },
    ],
  },
  {
    slug: ['core', 'admin', 'menus'],
    title: 'منوها',
    description: 'مدیریت منوهای سیستم',
    apiEndpoint: '/v1/api/core/admin/menus',
    columns: [
      { key: 'id', header: 'شناسه' },
      { key: 'title', header: 'عنوان' },
      { key: 'url', header: 'URL' },
      { key: 'order', header: 'ترتیب' },
    ],
  },
  {
    slug: ['core', 'admin', 'permissionGroups'],
    title: 'گروه‌های دسترسی',
    description: 'مدیریت گروه‌های دسترسی',
    apiEndpoint: '/v1/api/core/admin/permissionGroups',
    columns: [
      { key: 'id', header: 'شناسه' },
      { key: 'permissionGroupName', header: 'نام گروه' },
      { key: 'order', header: 'ترتیب' },
    ],
  },
];

export function findPageConfig(slug: string[]): PageConfig | undefined {
  return adminPages.find(
    (p) => p.slug.length === slug.length && p.slug.every((s, i) => s === slug[i]),
  );
}
