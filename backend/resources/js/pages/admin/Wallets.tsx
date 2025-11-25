import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
// ...existing code...
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function Wallets({ wallets }: any) {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const filteredWallets = wallets.data?.filter((w: any) => {
        const name = w.player?.display_name?.toLowerCase() ?? '';
        const phone = w.player?.phone?.toLowerCase() ?? '';
        return name.includes(search.toLowerCase()) || phone.includes(search.toLowerCase());
    }) ?? [];

    function toggleSelect(id: string) {
        setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
    }

    function selectAll() {
        if (selected.length === filteredWallets.length) setSelected([]);
        else setSelected(filteredWallets.map((w: any) => w.id));
    }

    return (
        <AppLayout>
            <Head title="Wallets" />
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Wallets & Balances</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-4 gap-2">
                            <Input
                                placeholder="Search by player or phone..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="max-w-sm"
                            />
                            <Button variant="outline" size="sm" disabled={selected.length === 0}>
                                Bulk Action
                            </Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <Checkbox
                                            checked={selected.length === filteredWallets.length && filteredWallets.length > 0}
                                            onCheckedChange={selectAll}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                    <TableHead>Player</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Balance</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredWallets.map((w: any) => {
                                    const balance = Number(w.balance_credits);
                                    let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
                                    if (balance > 100000) badgeVariant = 'default';
                                    else if (balance > 10000) badgeVariant = 'secondary';
                                    else if (balance > 0) badgeVariant = 'outline';
                                    else badgeVariant = 'destructive';
                                    return (
                                        <TableRow key={w.id} className={selected.includes(w.id) ? 'bg-gray-50' : ''}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selected.includes(w.id)}
                                                    onCheckedChange={() => toggleSelect(w.id)}
                                                    aria-label={`Select wallet for ${w.player?.display_name}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{w.player?.display_name ?? 'Player'}</TableCell>
                                            <TableCell className="text-muted-foreground">{w.player?.phone}</TableCell>
                                            <TableCell>
                                                <Badge variant={badgeVariant} className="text-base px-3 py-1">
                                                    UGX {balance.toLocaleString()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="default" asChild>
                                                    <Link href={`/admin/wallets/${w.id}`}>View</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        {filteredWallets.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">No wallets found.</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
