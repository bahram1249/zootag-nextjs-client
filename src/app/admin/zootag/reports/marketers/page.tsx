'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';

interface MarketerPerformance {
  marketerId: number;
  marketerName: string;
  devicesSold: number;
  totalSaleAmountIRR: number;
  totalGrossProfitIRR: number;
  totalCommissionIRR: number;
  totalNetProfitIRR: number;
  avgProfitPerDevice: number;
}

interface DeviceSale {
  id: number;
  marketerId: number;
  marketer?: { fullName: string };
  salePriceIRR: number;
  purchasePriceIRR: number;
  grossProfitIRR: number;
  commissionAmountIRR: number;
  netProfitIRR: number;
  device?: { serialNumber: string };
  saleDate: string;
}

export default function MarketerReportPage() {
  const [performances, setPerformances] = useState<MarketerPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { result: sales } = await apiClient.get<DeviceSale[]>('/v1/api/zootag/admin/deviceSales', {
          limit: 9999,
          offset: 0,
          ignorePaging: true,
        });

        const grouped: Record<number, DeviceSale[]> = {};
        for (const sale of sales) {
          const mid = sale.marketerId;
          if (!grouped[mid]) grouped[mid] = [];
          grouped[mid].push(sale);
        }

        const perfs: MarketerPerformance[] = Object.entries(grouped).map(([mid, mSales]) => {
          const totalSale = mSales.reduce((s, r) => s + Number(r.salePriceIRR), 0);
          const totalGross = mSales.reduce((s, r) => s + Number(r.grossProfitIRR), 0);
          const totalComm = mSales.reduce((s, r) => s + Number(r.commissionAmountIRR), 0);
          const totalNet = mSales.reduce((s, r) => s + Number(r.netProfitIRR), 0);
          const name = mSales[0]?.marketer?.fullName ?? `بازاریاب #${mid}`;
          return {
            marketerId: Number(mid),
            marketerName: name,
            devicesSold: mSales.length,
            totalSaleAmountIRR: totalSale,
            totalGrossProfitIRR: totalGross,
            totalCommissionIRR: totalComm,
            totalNetProfitIRR: totalNet,
            avgProfitPerDevice: mSales.length > 0 ? totalNet / mSales.length : 0,
          };
        });

        perfs.sort((a, b) => b.totalNetProfitIRR - a.totalNetProfitIRR);
        setPerformances(perfs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-muted p-4">در حال بارگذاری...</div>;

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-zinc-900 dark:text-zinc-100">گزارش عملکرد بازاریاب‌ها</h1>

      {performances.length === 0 ? (
        <p className="text-muted">هیچ داده‌ای موجود نیست</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-muted">
                <th className="px-4 py-3 text-right">بازاریاب</th>
                <th className="px-4 py-3 text-right">تعداد فروش</th>
                <th className="px-4 py-3 text-right">کل فروش (ریال)</th>
                <th className="px-4 py-3 text-right">سود ناخالص</th>
                <th className="px-4 py-3 text-right">کمیسیون</th>
                <th className="px-4 py-3 text-right">سود خالص</th>
                <th className="px-4 py-3 text-right">میانگین سود هر دستگاه</th>
              </tr>
            </thead>
            <tbody>
              {performances.map((p) => (
                <tr key={p.marketerId} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                  <td className="px-4 py-3 font-medium">{p.marketerName}</td>
                  <td className="px-4 py-3">
                    <Badge variant="info" size="sm">{p.devicesSold}</Badge>
                  </td>
                  <td className="px-4 py-3">{formatPrice(p.totalSaleAmountIRR)}</td>
                  <td className="px-4 py-3 text-success">{formatPrice(p.totalGrossProfitIRR)}</td>
                  <td className="px-4 py-3 text-danger">{formatPrice(p.totalCommissionIRR)}</td>
                  <td className="px-4 py-3 text-success font-bold">{formatPrice(p.totalNetProfitIRR)}</td>
                  <td className="px-4 py-3">{formatPrice(p.avgProfitPerDevice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
