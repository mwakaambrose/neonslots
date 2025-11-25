import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Deposits({ transactions }: any) {
    return (
        <AppLayout>
            <Head title="Deposits & Cashouts" />
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Deposits & Cashouts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-2">
                            {transactions.data?.map((t: any) => (
                                <div key={t.id} className="flex items-center justify-between p-3 border rounded">
                                    <div>
                                        <div className="font-medium">{t.type.toUpperCase()}</div>
                                        <div className="text-sm text-muted-foreground">Player: {t.player?.display_name ?? t.player_id}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">{t.amount_credits}</div>
                                        <div className="text-sm text-muted-foreground">{t.status}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
