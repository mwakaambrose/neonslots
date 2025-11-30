import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Neon Slots - Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700,800,900"
                    rel="stylesheet"
                />
            </Head>
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 relative overflow-hidden">
                {/* Animated background effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
                </div>

                {/* Slot machine reels animation */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <div className="grid grid-cols-3 gap-4">
                        {['🍌', '☕', '🌯', '🥁', '🛵', '🦩', '🦍', '🛡️'].map((symbol, i) => (
                            <div
                                key={i}
                                className="text-8xl animate-bounce"
                                style={{ animationDelay: `${i * 0.2}s`, animationDuration: '2s' }}
                            >
                                {symbol}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6 lg:p-8">
                    <header className="mb-8 w-full max-w-6xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                    className="inline-block rounded-lg border-2 border-amber-500 bg-amber-500/10 px-6 py-2.5 text-sm font-bold text-amber-400 hover:bg-amber-500/20 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                        className="inline-block rounded-lg border border-amber-500/50 px-6 py-2.5 text-sm font-bold text-amber-400 hover:bg-amber-500/10 transition-all"
                                >
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                            className="inline-block rounded-lg border-2 border-amber-500 bg-amber-500/10 px-6 py-2.5 text-sm font-bold text-amber-400 hover:bg-amber-500/20 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                                    >
                                        Register
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>

                    <main className="flex w-full max-w-6xl flex-col items-center text-center">
                        {/* Main Hero */}
                        <div className="mb-12 animate-fade-in">
                            <h1 className="mb-6 text-7xl font-black tracking-tighter lg:text-9xl">
                                <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-pulse">
                                    NEON
                                </span>
                                <br />
                                <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                                    SLOTS
                                </span>
                            </h1>
                            <p className="text-2xl font-bold text-slate-300 mb-4 tracking-widest uppercase">
                                🎰 Uganda&apos;s #1 Mobile Casino 🎰
                            </p>
                            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                                Experience the thrill of Vegas-style slot machines right on your mobile device.
                                Spin, win, and cash out instantly with Mobile Money.
                            </p>
                        </div>

                        {/* Slot Machine Visual */}
                        <div className="mb-12 w-full max-w-2xl">
                            <div className="relative bg-black/50 backdrop-blur-md border-4 border-amber-600 rounded-2xl p-8 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    {['🦍', '🦍', '🦍'].map((symbol, i) => (
                                        <div
                                            key={i}
                                            className="bg-slate-900 border-2 border-amber-500 rounded-lg p-8 text-6xl flex items-center justify-center h-32 animate-pulse"
                                            style={{ animationDelay: `${i * 0.2}s` }}
                                        >
                                            {symbol}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-black text-green-400 mb-2 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]">
                                        BIG WIN!
                                    </div>
                                    <div className="text-2xl font-mono text-amber-400">+10,000 Credits</div>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-12">
                            <div className="bg-slate-900/50 backdrop-blur-md border border-amber-500/30 rounded-xl p-6 hover:border-amber-500 transition-all">
                                <div className="text-4xl mb-4">💰</div>
                                <h3 className="text-xl font-bold text-amber-400 mb-2">Instant Payouts</h3>
                                <p className="text-slate-400 text-sm">
                                    Win big and cash out instantly via Mobile Money. No waiting, no delays.
                                </p>
                            </div>
                            <div className="bg-slate-900/50 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 hover:border-purple-500 transition-all">
                                <div className="text-4xl mb-4">🎲</div>
                                <h3 className="text-xl font-bold text-purple-400 mb-2">Fair Play</h3>
                                <p className="text-slate-400 text-sm">
                                    96% RTP guaranteed. Transparent, provably fair gaming for everyone.
                                </p>
                            </div>
                            <div className="bg-slate-900/50 backdrop-blur-md border border-pink-500/30 rounded-xl p-6 hover:border-pink-500 transition-all">
                                <div className="text-4xl mb-4">📱</div>
                                <h3 className="text-xl font-bold text-pink-400 mb-2">Mobile First</h3>
                                <p className="text-slate-400 text-sm">
                                    Play anywhere, anytime. Optimized for mobile devices across Uganda.
                                </p>
                            </div>
                        </div>

                        {/* CTA */}
                        {!auth.user && (
                            <div className="flex gap-4">
                                <Link
                                    href={login()}
                                    className="inline-block rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-8 py-4 text-lg font-black text-black hover:from-amber-400 hover:to-yellow-500 transition-all shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:shadow-[0_0_40px_rgba(245,158,11,0.7)] transform hover:scale-105"
                                >
                                    🎰 PLAY NOW 🎰
                                </Link>
                        </div>
                        )}
                    </main>
                </div>

                <style>{`
                    @keyframes fade-in {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in {
                        animation: fade-in 1s ease-out;
                    }
                `}</style>
            </div>
        </>
    );
}
