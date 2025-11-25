import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/dashboard' },
    { title: 'Config', href: '/admin/config' },
];

export default function AdminConfig() {
    const { props } = usePage();
    const { config } = props as any;
    const [targetRtp, setTargetRtp] = useState(config?.target_rtp ?? 0.96);
    const [maxMult, setMaxMult] = useState(config?.max_win_multiplier ?? 50);
    const [saving, setSaving] = useState(false);

    async function save(e: any) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ targetRtp: Number(targetRtp), maxWinMultiplier: Number(maxMult) }),
            });
            if (!res.ok) throw new Error('Save failed');
            alert('Saved');
        } catch (err) {
            alert('Save failed');
        } finally {
            setSaving(false);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="RNG Configuration" />
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>RNG Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Target RTP</Label>
                                <Input type="number" step="0.001" value={targetRtp} onChange={(e) => setTargetRtp(Number(e.target.value))} />
                            </div>
                            <div>
                                <Label>Max Win Multiplier</Label>
                                <Input type="number" value={maxMult} onChange={(e) => setMaxMult(Number(e.target.value))} />
                            </div>
                            <div className="flex items-end">
                                <Button type="submit">{saving ? 'Saving...' : 'Save'}</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
