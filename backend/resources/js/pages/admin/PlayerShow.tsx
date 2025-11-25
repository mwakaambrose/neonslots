import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlayerShow({ wallet }: any) {
    const player = wallet.player || {};
    return (
        <AppLayout>
            <Head title={`Player: ${player.display_name ?? player.id}`} />
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Player Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3">
                            <div><strong>Name:</strong> {player.display_name}</div>
                            <div><strong>Phone:</strong> {player.phone}</div>
                            <div><strong>Balance:</strong> {wallet.balance_credits}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
