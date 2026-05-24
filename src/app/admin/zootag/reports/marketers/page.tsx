'use client';

import { useState, useEffect } from 'react';
import { Badge, PersianDatePicker, LookupDialog } from '@/components/ui';
import type { LookupConfig } from '@/components/ui';
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

const marketerLookupConfig: LookupConfig = {
  endpoint: '/v1/api/zootag/admin/marketers',
  labelKey: 'fullName',
  valueKey: 'id',
  title: 'بازاریاب',
  columns: [
    { key: 'id', header: 'شناسه' },
    { key: 'fullName', header: 'نام کامل' },
    { key: 'mobile', header: 'موبایل' },
  ],
  formFields: [],
};

export default function MarketerReportPage() {
  const [performances, setPerformances] = useState<MarketerPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedMarketerId, setSelectedMarketerId] = useState<number | null>(null);
  const [selectedMarketerName, setSelectedMarketerName] = useState('');
  const [marketerLookupOpen, setMarketerLookupOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = {
          limit: 100,
          offset: 0,
          ignorePaging: true,
        };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (selectedMarketerId) params.marketerId = selectedMarketerId;

        const { result: sales } = await apiClient.get<DeviceSale[]>('/v1/api/zootag/admin/deviceSales', params);

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
    };

    fetchData();
  }, [startDate, endDate, selectedMarketerId]);

  if (loading && performances.length === 0) return <div className="text-muted p-4">در حال بارگذاری...</div>;

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-zinc-900 dark:text-zinc-100">گزارش عملکرد بازاریاب‌ها</h1>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="w-48">
          <PersianDatePicker
            label="از تاریخ"
            value={startDate ? new Date(startDate) : null}
            onChange={(v) => setStartDate(v.isoDate)}
          />
        </div>
        <div className="w-48">
          <PersianDatePicker
            label="تا تاریخ"
            value={endDate ? new Date(endDate) : null}
            onChange={(v) => setEndDate(v.isoDate)}
          />
        </div>
        <div className="min-w-48 flex-1">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            بازاریاب
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={selectedMarketerName || 'همه بازاریاب‌ها'}
              className="flex h-10 w-full rounded-[var(--radius-input)] border border-border bg-white px-3 text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              onClick={() => setMarketerLookupOpen(true)}
              className="flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              انتخاب
            </button>
            {selectedMarketerId && (
              <button
                onClick={() => {
                  setSelectedMarketerId(null);
                  setSelectedMarketerName('');
                }}
                className="flex h-10 items-center rounded-lg bg-surface-secondary px-3 text-sm text-muted transition-colors hover:bg-border"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      <LookupDialog
        open={marketerLookupOpen}
        config={marketerLookupConfig}
        selectedValue={selectedMarketerId}
        onSelect={(value, label) => {
          setSelectedMarketerId(value as number);
          setSelectedMarketerName(label);
        }}
        onClose={() => setMarketerLookupOpen(false)}
      />

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
