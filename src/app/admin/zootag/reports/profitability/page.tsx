'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';

interface DeviceSaleSummary {
  totalDevices: number;
  totalSales: number;
  totalPurchaseCostIRR: number;
  totalSaleAmountIRR: number;
  totalGrossProfitIRR: number;
  totalCommissionIRR: number;
  totalNetProfitIRR: number;
  profitMarginPercent: number;
}

interface RecentSale {
  id: number;
  salePrice: number;
  salePriceIRR: number;
  purchasePriceIRR: number;
  grossProfitIRR: number;
  commissionAmountIRR: number;
  netProfitIRR: number;
  saleDate: string;
  device?: { serialNumber: string };
  marketer?: { fullName: string };
}

export default function ProfitabilityReportPage() {
  useEffect(() => {
    document.title = 'گزارش سودآوری | زوتگ';
  }, []);
  const [summary, setSummary] = useState<DeviceSaleSummary | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { result: sales } = await apiClient.get<RecentSale[]>('/v1/api/zootag/admin/deviceSales', {
          limit: 50,
          offset: 0,
          ignorePaging: true,
          orderBy: 'id',
          sortOrder: 'DESC',
        });

        const totalCount = sales.length;
        const totalSaleIRR = sales.reduce((s, r) => s + Number(r.salePriceIRR), 0);
        const totalPurchaseIRR = sales.reduce((s, r) => s + Number(r.purchasePriceIRR), 0);
        const totalGross = sales.reduce((s, r) => s + Number(r.grossProfitIRR), 0);
        const totalComm = sales.reduce((s, r) => s + Number(r.commissionAmountIRR), 0);
        const totalNet = sales.reduce((s, r) => s + Number(r.netProfitIRR), 0);
        const margin = totalSaleIRR > 0 ? (totalGross / totalSaleIRR) * 100 : 0;

        setSummary({
          totalDevices: totalCount,
          totalSales: totalSaleIRR,
          totalPurchaseCostIRR: totalPurchaseIRR,
          totalSaleAmountIRR: totalSaleIRR,
          totalGrossProfitIRR: totalGross,
          totalCommissionIRR: totalComm,
          totalNetProfitIRR: totalNet,
          profitMarginPercent: margin,
        });

        setRecentSales(sales.slice(0, 20));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-muted p-4">در حال بارگذاری...</div>;

  const cards = summary
    ? [
        { label: 'تعداد فروش', value: String(summary.totalDevices), color: 'text-info' },
        { label: 'کل فروش (ریال)', value: formatPrice(summary.totalSaleAmountIRR), color: 'text-primary' },
        { label: 'کل بهای تمام شده', value: formatPrice(summary.totalPurchaseCostIRR), color: 'text-warning' },
        { label: 'سود ناخالص', value: formatPrice(summary.totalGrossProfitIRR), color: 'text-success' },
        { label: 'کمیسیون کل', value: formatPrice(summary.totalCommissionIRR), color: 'text-danger' },
        { label: 'سود خالص', value: formatPrice(summary.totalNetProfitIRR), color: 'text-success' },
        { label: 'حاشیه سود', value: `${summary.profitMarginPercent.toFixed(1)}%`, color: 'text-info' },
      ]
    : [];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-zinc-900 dark:text-zinc-100">گزارش سودآوری</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-muted">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">فروش‌های اخیر</h2>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-secondary text-muted">
              <th className="px-4 py-3 text-right">شناسه</th>
              <th className="px-4 py-3 text-right">دستگاه</th>
              <th className="px-4 py-3 text-right">بازاریاب</th>
              <th className="px-4 py-3 text-right">قیمت فروش</th>
              <th className="px-4 py-3 text-right">بهای تمام شده</th>
              <th className="px-4 py-3 text-right">سود ناخالص</th>
              <th className="px-4 py-3 text-right">کمیسیون</th>
              <th className="px-4 py-3 text-right">سود خالص</th>
            </tr>
          </thead>
          <tbody>
            {recentSales.map((sale) => (
              <tr key={sale.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                <td className="px-4 py-3">{sale.id}</td>
                <td className="px-4 py-3">{sale.device?.serialNumber ?? '—'}</td>
                <td className="px-4 py-3">{sale.marketer?.fullName ?? '—'}</td>
                <td className="px-4 py-3 font-medium">{formatPrice(sale.salePriceIRR)}</td>
                <td className="px-4 py-3">{formatPrice(sale.purchasePriceIRR)}</td>
                <td className="px-4 py-3 text-success font-medium">{formatPrice(sale.grossProfitIRR)}</td>
                <td className="px-4 py-3 text-danger">{formatPrice(sale.commissionAmountIRR)}</td>
                <td className="px-4 py-3 text-success font-bold">{formatPrice(sale.netProfitIRR)}</td>
              </tr>
            ))}
            {recentSales.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">هیچ فروشی ثبت نشده است</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
