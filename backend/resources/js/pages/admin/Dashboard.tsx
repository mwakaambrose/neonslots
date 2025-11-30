

function formatSessionLength(seconds: number | undefined) {
    if (!seconds || seconds < 1) return '-';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds/60)}m ${Math.round(seconds%60)}s`;
    if (seconds < 86400) return `${Math.floor(seconds/3600)}h ${Math.floor((seconds%3600)/60)}m`;
    // If it's huge, just show hours
    return `${(seconds/3600).toFixed(1)}h`;
}
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

// Load Chart.js from CDN at runtime to avoid Vite import resolution issues when
// the package isn't installed in the environment. This keeps the dev experience
// resilient and matches the earlier blade-based placeholder approach.
function loadChartJs(): Promise<any> {
    // If Chart is already available globally, resolve immediately
    if (typeof (window as any).Chart !== 'undefined') {
        return Promise.resolve((window as any).Chart);
    }

    return new Promise((resolve, reject) => {
        const src =
            'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            existing.addEventListener('load', () =>
                resolve((window as any).Chart),
            );
            existing.addEventListener('error', () =>
                reject(new Error('Failed to load Chart.js')),
            );
            return;
        }

        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve((window as any).Chart);
        s.onerror = () => reject(new Error('Failed to load Chart.js'));
        document.head.appendChild(s);
    });
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Dashboard', href: '/admin/dashboard' },
];

export default function AdminDashboard() {
    const { props } = usePage();
    const {
        dau,
        mau,
        totalSpins,
        totalBets,
        totalPayouts,
        observedRtp,
        netRevenue,
        avgSessionLengthSeconds,
        avgSpinsPerSession,
        machineSummaries,
        ldwRecent,
        nearMissRecent,
        timeseries,
        config,
        providerBalances,
    } = props as any;

    const rtpRef = useRef<HTMLCanvasElement | null>(null);
    const dauRef = useRef<HTMLCanvasElement | null>(null);
    const revenueRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstances = useRef<any>({});
    const [saving, setSaving] = useState(false);
    const [targetRtp, setTargetRtp] = useState(config?.targetRtp ?? 0.96);
    const [maxMult, setMaxMult] = useState(config?.maxWinMultiplier ?? 50);
    const [revenueView, setRevenueView] = useState<'daily' | 'monthly'>('daily');

    function fmt(n: any) {
        if (n === null || typeof n === 'undefined') return '-';
        const parsed = Number(n);
        if (!Number.isNaN(parsed))
            return new Intl.NumberFormat().format(parsed);
        return String(n);
    }

    function fmtUGX(n: any) {
        if (n === null || typeof n === 'undefined') return '-';
        const parsed = Number(n);
        if (!Number.isNaN(parsed))
            return `UGX ${new Intl.NumberFormat().format(parsed)}`;
        return String(n);
    }

    function pctChange(arr: number[] | undefined) {
        if (!arr || arr.length < 2) return null;
        const first = Number(arr[0]) || 0;
        const last = Number(arr[arr.length - 1]) || 0;
        if (first === 0) return null;
        return ((last - first) / Math.abs(first)) * 100;
    }

    useEffect(() => {
        if (!timeseries) return;

        // Load Chart.js from CDN, then render charts. Keep instances so we can destroy on clean-up.
        let mounted = true;
        loadChartJs()
            .then((ChartLib) => {
                if (!mounted) return;
                try {
                    // Destroy previous charts if present
                    Object.values(chartInstances.current).forEach((c: any) => {
                        try {
                            c.destroy();
                        } catch (e) {
                            /* ignore */
                        }
                    });
                    chartInstances.current = {};

                    if (rtpRef.current) {
                        const rtpData = (timeseries.rtp || []).map(
                            (v: number) => Number((v * 100).toFixed(2)),
                        );
                        chartInstances.current.rtp = new ChartLib(
                            rtpRef.current,
                            {
                                type: 'line',
                                data: {
                                    labels: timeseries.days || [],
                                    datasets: [
                                        {
                                            label: 'Observed RTP (%)',
                                            data: rtpData,
                                            borderColor: '#4f46e5',
                                            backgroundColor:
                                                'rgba(79,70,229,0.08)',
                                            tension: 0.3,
                                        },
                                    ],
                                },
                                options: { maintainAspectRatio: false },
                            },
                        );
                    }

                    if (dauRef.current) {
                        chartInstances.current.dau = new ChartLib(
                            dauRef.current,
                            {
                                type: 'bar',
                                data: {
                                    labels: timeseries.days || [],
                                    datasets: [
                                        {
                                            label: 'DAU (players)',
                                            data: timeseries.dau || [],
                                            backgroundColor: '#059669',
                                        },
                                    ],
                                },
                                options: { maintainAspectRatio: false },
                            },
                        );
                    }

                    // Revenue: either provided or derived from bets - payouts
                    let revenueDaily: number[] | null = null;
                    if (Array.isArray(timeseries.revenue)) {
                        revenueDaily = timeseries.revenue;
                    } else if (
                        Array.isArray(timeseries.bets) &&
                        Array.isArray(timeseries.payouts)
                    ) {
                        revenueDaily = timeseries.bets.map(
                            (b: number, i: number) =>
                                b - (timeseries.payouts[i] || 0),
                        );
                    }

                    // Aggregate monthly for current year, daily for current month
                    function aggregateMonthly(values: number[], labels: string[]) {
                            function diffSeries(arr: number[]): number[] {
                                return arr.map((v, i) => i === 0 ? 0 : v - arr[i-1]);
                            }
                        const now = new Date();
                        const year = now.getFullYear();
                        const map: Record<string, number> = {};
                        values.forEach((v, i) => {
                            const d = new Date(labels[i]);
                            if (d.getFullYear() === year) {
                                const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; // YYYY-MM
                                map[m] = (map[m] || 0) + Number(v || 0);
                            }
                        });
                        // Fill all months of this year
                        const months: string[] = [];
                        for (let i = 0; i < 12; i++) {
                            const key = `${year}-${String(i+1).padStart(2,'0')}`;
                            months.push(key);
                            if (!(key in map)) map[key] = 0;
                        }
                        return {
                            labels: months.map(k => {
                                const [y, m] = k.split('-');
                                const yearNum = Number(y);
                                const monthNum = Number(m) - 1;
                                return `${new Date(yearNum, monthNum).toLocaleString('default', { month: 'short' })} ${yearNum}`;
                            }),
                            values: months.map((k) => map[k]),
                        };
                    }

                    function aggregateDaily(values: number[], labels: string[]) {
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = now.getMonth();
                        const map: Record<string, number> = {};
                        values.forEach((v, i) => {
                            const d = new Date(labels[i]);
                            if (d.getFullYear() === year && d.getMonth() === month) {
                                const key = `${d.getDate()}-${d.toLocaleString('default', { month: 'short' })}`;
                                map[key] = Number(v || 0);
                            }
                        });
                        // Fill all days of current month
                        const days: string[] = [];
                        const vals: number[] = [];
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        for (let i = 1; i <= daysInMonth; i++) {
                            const key = `${i}-${new Date(year, month, i).toLocaleString('default', { month: 'short' })}`;
                            days.push(key);
                            vals.push(map[key] ?? 0);
                        }
                        return { labels: days, values: vals };
                    }

                    if (revenueRef.current && revenueDaily) {
                        let labels = timeseries.days || [];
                        let data = revenueDaily;
                        if (revenueView === 'monthly') {
                            const agg = aggregateMonthly(revenueDaily, labels);
                            labels = agg.labels;
                            data = agg.values;
                        } else {
                            const agg = aggregateDaily(revenueDaily, labels);
                            labels = agg.labels;
                            data = agg.values;
                        }

                        chartInstances.current.revenue = new ChartLib(
                            revenueRef.current,
                            {
                                type: 'bar',
                                data: {
                                    labels,
                                    datasets: [
                                        {
                                            label:
                                                revenueView === 'daily'
                                                    ? 'Daily Revenue'
                                                    : 'Monthly Revenue',
                                            data,
                                            backgroundColor: '#f59e0b',
                                            borderColor: '#f59e0b',
                                            borderWidth: 1,
                                        },
                                    ],
                                },
                                options: {
                                    maintainAspectRatio: false,
                                    scales: {
                                        x: { grid: { display: false }, ticks: { maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 15 } },
                                        y: { grid: { color: '#222' } },
                                    },
                                },
                            },
                        );
                    }
                } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error('Chart init error', err);
                }
            })
            .catch((err) => {
                // eslint-disable-next-line no-console
                console.error('Failed to load Chart.js', err);
            });

        return () => {
            mounted = false;
            Object.values(chartInstances.current).forEach((c: any) => {
                try {
                    c.destroy();
                } catch (e) {
                    /* ignore */
                }
            });
            chartInstances.current = {};
        };
    }, [timeseries, revenueView]);

    async function submitConfig(e: any) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                    targetRtp: parseFloat(targetRtp),
                    maxWinMultiplier: parseInt(maxMult),
                }),
            });
            if (!res.ok) throw new Error('Failed');
            alert('Config saved');
        } catch (err) {
            alert('Save failed');
        } finally {
            setSaving(false);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 min-h-screen">
                {/* Header with gradient */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-4xl font-black bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                            🎰 Admin Dashboard
                        </h1>
                        <div className="text-sm font-bold bg-amber-100 dark:bg-amber-900/30 px-4 py-2 rounded-full border-2 border-amber-500/50">
                            RTP Target: <span className="text-amber-600 dark:text-amber-400">{(targetRtp * 100).toFixed(2)}%</span>
                        </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Monitor your slot machine operations in real-time</p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="flex items-start justify-between pb-2">
                            <CardTitle className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                Daily Active
                            </CardTitle>
                            <div className="text-xs font-bold bg-blue-500 text-white px-2 py-1 rounded-full">DAU</div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
                                    {fmt(dau)}
                                </div>
                                {timeseries?.dau ? (
                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50">
                                        {(
                                            pctChange(timeseries.dau) ?? 0
                                        ).toFixed(1)}
                                        %
                                    </Badge>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="flex items-start justify-between pb-2">
                            <CardTitle className="text-sm font-bold text-purple-700 dark:text-purple-400">
                                Monthly Active
                            </CardTitle>
                            <div className="text-xs font-bold bg-purple-500 text-white px-2 py-1 rounded-full">MAU</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
                                {fmt(mau)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex items-start justify-between">
                            <CardTitle className="text-sm">
                                Total Spins
                            </CardTitle>
                            <div className="text-xs text-muted">All-time</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">
                                {fmt(totalSpins)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex items-start justify-between">
                            <CardTitle className="text-sm">
                                Observed RTP
                            </CardTitle>
                            <div className="text-xs text-muted">7d</div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between gap-3">
                                <div className="text-2xl font-semibold">
                                    {(observedRtp * 100).toFixed(2)}%
                                </div>
                                <Badge variant="secondary">
                                    {((observedRtp - targetRtp) * 100).toFixed(
                                        2,
                                    )}
                                    %
                                </Badge>
                            </div>
                            <div className="mt-1 text-sm text-muted">
                                Compared to target
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">
                                Total Bets
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">
                                {fmtUGX(totalBets)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">
                                Total Payouts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">
                                {fmtUGX(totalPayouts)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">
                                Net Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">
                                {fmtUGX(netRevenue)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">
                                Avg Spins/Session
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">
                                {avgSpinsPerSession.toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional metrics row: Avg Session, LDW, Near-miss, placeholder */}
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex items-start justify-between">
                            <CardTitle className="text-sm">
                                Avg Session
                            </CardTitle>
                            <div className="text-xs text-muted">seconds</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">
                                {formatSessionLength(avgSessionLengthSeconds)}
                            </div>
                            <div className="mt-1 text-sm text-muted">
                                Average session length
                            </div>

                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex items-start justify-between">
                            <CardTitle className="text-sm">
                                LDW (recent 1000)
                            </CardTitle>
                            <div className="text-xs text-muted">losses</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">
                                {fmt(ldwRecent)}
                            </div>
                            <div className="mt-1 text-sm text-muted">
                                Losses disguised as wins
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex items-start justify-between">
                            <CardTitle className="text-sm">
                                Near-miss (recent 1000)
                            </CardTitle>
                            <div className="text-xs text-muted">events</div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">
                                {fmt(nearMissRecent)}
                            </div>
                            <div className="mt-1 text-sm text-muted">
                                Near-miss occurrences
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">
                                Provider Balances
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Relwox</span>
                                        {providerBalances?.relwox?.error && (
                                            <span className="text-xs text-red-500">Error</span>
                                        )}
                                    </div>
                                    <div className="text-sm font-semibold">
                                        {providerBalances?.relwox?.error ? (
                                            <span className="text-red-500">Failed</span>
                                        ) : providerBalances?.relwox?.balance !== null && providerBalances?.relwox?.balance !== undefined ? (
                                            fmtUGX(providerBalances.relwox.balance)
                                        ) : (
                                            <span className="text-muted">-</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">EazzyConnect</span>
                                        {providerBalances?.eazzyconnect?.error && (
                                            <span className="text-xs text-red-500">Error</span>
                                        )}
                                    </div>
                                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                        {providerBalances?.eazzyconnect?.error ? (
                                            <span className="text-red-500 text-base font-bold">❌ Failed to fetch</span>
                                        ) : providerBalances?.eazzyconnect?.balance !== null && providerBalances?.eazzyconnect?.balance !== undefined ? (
                                            <span>{String(providerBalances.eazzyconnect.balance)}</span>
                                        ) : (
                                            <span className="text-muted flex items-center gap-2">
                                                <span className="animate-spin">⏳</span> Loading...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <h3 className="text-sm font-medium">Observed RTP (7 days)</h3>
                                    <div className="mt-2"><canvas ref={rtpRef} /></div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium">Daily Active Players (7 days)</h3>
                                    <div className="mt-2"><canvas ref={dauRef} /></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Revenue chart in its own card below Activity */}
                <div className="mt-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-sm">
                                    {revenueView === 'daily'
                                        ? 'Daily Revenue (current month)'
                                        : 'Monthly Revenue (this year)'}
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant={revenueView === 'daily' ? 'default' : 'outline'} onClick={() => setRevenueView('daily')}>Daily</Button>
                                    <Button size="sm" variant={revenueView === 'monthly' ? 'default' : 'outline'} onClick={() => setRevenueView('monthly')}>Monthly</Button>
                                </div>
                            </div>
                            <div className="mt-2"><canvas ref={revenueRef} style={{ height: 220 }} /></div>
                        </CardContent>
                    </Card>
                </div>

                {/* Provider Wallet Balances */}
                <div className="mt-6">
                    <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 shadow-lg">
                        <CardHeader className="flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-yellow-500/10 dark:from-amber-900/20 dark:to-yellow-900/20 pb-4">
                            <div>
                                <CardTitle className="text-xl font-black text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                    💰 Payment Provider Balances
                                </CardTitle>
                                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 font-medium">
                                    Balances are cached for 5 minutes. Click refresh to update.
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white font-bold"
                                onClick={() => {
                                    // Clear cache and reload
                                    fetch('/api/admin/clear-balance-cache', { method: 'POST', credentials: 'same-origin' })
                                        .then(() => window.location.reload())
                                        .catch(() => window.location.reload());
                                }}
                            >
                                🔄 Refresh
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="p-4 border-2 border-blue-500/30 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">Relwox</span>
                                            {providerBalances?.relwox?.error && (
                                                <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Error</Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted">Mobile Money</span>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                        {providerBalances?.relwox?.error ? (
                                            <span className="text-red-500 text-base font-bold">❌ Failed to fetch</span>
                                        ) : providerBalances?.relwox?.balance !== null && providerBalances?.relwox?.balance !== undefined ? (
                                            fmtUGX(providerBalances.relwox.balance)
                                        ) : (
                                            <span className="text-muted flex items-center gap-2">
                                                <span className="animate-spin">⏳</span> Loading...
                                            </span>
                                        )}
                                    </div>
                                    {providerBalances?.relwox?.error && (
                                        <div className="mt-2 text-xs text-red-500">
                                            {providerBalances.relwox.error}
                                        </div>
                                    )}
                                    {providerBalances?.relwox?.currency && (
                                        <div className="mt-1 text-xs text-muted">
                                            Currency: {providerBalances.relwox.currency}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-2 border-green-500/30 rounded-lg bg-green-50 dark:bg-green-950/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-green-600 dark:text-green-400">EazzyConnect</span>
                                            {providerBalances?.eazzyconnect?.error && (
                                                <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Error</Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted">SMS Service</span>
                                    </div>
                                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                        {providerBalances?.eazzyconnect?.error ? (
                                            <span className="text-red-500 text-base">Failed to fetch</span>
                                        ) : providerBalances?.eazzyconnect?.balance !== null && providerBalances?.eazzyconnect?.balance !== undefined ? (
                                            fmtUGX(providerBalances.eazzyconnect.balance)
                                        ) : (
                                            <span className="text-muted">Loading...</span>
                                        )}
                                    </div>
                                    {providerBalances?.eazzyconnect?.error && (
                                        <div className="mt-2 text-xs text-red-500">
                                            {providerBalances.eazzyconnect.error}
                                        </div>
                                    )}
                                    {providerBalances?.eazzyconnect?.currency && (
                                        <div className="mt-1 text-xs text-muted">
                                            Currency: {providerBalances.eazzyconnect.currency}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>RNG Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted">
                                    Target RTP:{' '}
                                    <strong>
                                        {(targetRtp * 100).toFixed(2)}%
                                    </strong>
                                </div>
                                <a
                                    href="/admin/config"
                                    className="text-indigo-500 hover:underline"
                                >
                                    Open RNG Configuration
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
