import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Players({ players }: any) {
    const list = players?.data ?? [];

    return (
        <AppLayout>
            <Head title="Players" />

            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Players</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto text-sm">
                                <thead>
                                    <tr className="text-left text-muted-foreground">
                                        <th className="px-3 py-2">Name</th>
                                        <th className="px-3 py-2">Phone</th>
                                        <th className="px-3 py-2">Balance</th>
                                        <th className="px-3 py-2">Joined</th>
                                        <th className="px-3 py-2" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.map((p: any) => (
                                        <tr key={p.id} className="border-t">
                                            <td className="px-3 py-2">{p.display_name ?? `#${p.id}`}</td>
                                            <td className="px-3 py-2">{p.phone}</td>
                                            <td className="px-3 py-2">{p.wallet?.balance_credits ?? '-'}</td>
                                            <td className="px-3 py-2">{new Date(p.created_at).toLocaleString()}</td>
                                            <td className="px-3 py-2 text-right">
                                                <Link href={`/admin/players/${p.id}`} className="inline-block">
                                                    <Button size="sm" variant="outline">View</Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4">
                            {players?.links ? (
                                <div className="flex gap-2">
                                    {players.links.map((l: any, idx: number) => (
                                        <span key={idx} dangerouslySetInnerHTML={{ __html: l }} />
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
