import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
    errors?: {
        email?: string;
        password?: string;
        [key: string]: string | undefined;
    };
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
    errors: propErrors,
}: LoginProps) {
    const { errors: formErrors } = store.form();
    const errors = propErrors || formErrors || {};
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 relative overflow-hidden">
            {/* Animated slot machine background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                {/* Floating slot symbols */}
                {['🍌', '☕', '🌯', '🥁', '🛵', '🦩', '🦍', '🛡️'].map((symbol, i) => (
                    <div
                        key={i}
                        className="absolute text-6xl opacity-20 animate-float"
                        style={{
                            left: `${10 + i * 12}%`,
                            top: `${20 + (i % 3) * 30}%`,
                            animationDelay: `${i * 0.5}s`,
                            animationDuration: '3s',
                        }}
                    >
                        {symbol}
                    </div>
                ))}
            </div>

            <Head title="Log in - Neon Slots" />

            <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {/* Slot Machine Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-black mb-2">
                            <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                                NEON SLOTS
                            </span>
                        </h1>
                        <p className="text-slate-400 text-sm uppercase tracking-widest">Admin Portal</p>
                    </div>

                    {/* Slot Machine Card */}
                    <div className="bg-slate-900/80 backdrop-blur-md border-4 border-amber-600 rounded-2xl p-8 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                        {/* Mini slot display */}
                        <div className="grid grid-cols-3 gap-2 mb-6 bg-black rounded-lg p-3 border-2 border-amber-500">
                            {['🎰', '💰', '🎲'].map((symbol, i) => (
                                <div
                                    key={i}
                                    className="bg-slate-800 rounded p-2 text-2xl text-center animate-pulse"
                                    style={{ animationDelay: `${i * 0.2}s` }}
                                >
                                    {symbol}
                                </div>
                            ))}
                        </div>

                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="flex flex-col gap-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email" className="text-amber-400 font-bold">
                                                Email Address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="email"
                                                placeholder="admin@neonslots.site"
                                                className="bg-slate-950 border-amber-500/50 text-white focus:border-amber-500 focus:ring-amber-500"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid gap-2">
                                            <div className="flex items-center">
                                                <Label htmlFor="password" className="text-amber-400 font-bold">
                                                    Password
                                                </Label>
                                                {canResetPassword && (
                                                    <TextLink
                                                        href={request()}
                                                        className="ml-auto text-sm text-amber-400 hover:text-amber-300"
                                                        tabIndex={5}
                                                    >
                                                        Forgot password?
                                                    </TextLink>
                                                )}
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="••••••••"
                                                className="bg-slate-950 border-amber-500/50 text-white focus:border-amber-500 focus:ring-amber-500"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                tabIndex={3}
                                                className="border-amber-500"
                                            />
                                            <Label htmlFor="remember" className="text-slate-300">
                                                Remember me
                                            </Label>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="mt-4 w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-black text-lg py-6 shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                                            tabIndex={4}
                                            disabled={processing}
                                            data-test="login-button"
                                        >
                                            {processing ? (
                                                <>
                                                    <Spinner className="mr-2" />
                                                    Spinning...
                                                </>
                                            ) : (
                                                '🎰 LOG IN 🎰'
                                            )}
                                        </Button>
                                    </div>

                                    {canRegister && (
                                        <div className="text-center text-sm text-slate-400">
                                            Don&apos;t have an account?{' '}
                                            <TextLink href={register()} tabIndex={5} className="text-amber-400 hover:text-amber-300">
                                                Sign up
                                            </TextLink>
                                        </div>
                                    )}
                                </>
                            )}
                        </Form>

                        {/* Error Messages */}
                        {(errors.email || errors.password || Object.keys(errors).length > 0) && (
                            <div className="mt-4 bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                                <div className="text-red-400 font-bold text-sm mb-2">⚠️ Login Failed</div>
                                {errors.email && (
                                    <div className="text-red-300 text-xs mb-1">• {errors.email}</div>
                                )}
                                {errors.password && (
                                    <div className="text-red-300 text-xs mb-1">• {errors.password}</div>
                                )}
                                {Object.entries(errors).filter(([key]) => !['email', 'password'].includes(key)).map(([key, value]) => (
                                    <div key={key} className="text-red-300 text-xs mb-1">• {String(value)}</div>
                                ))}
                                <div className="text-red-400 text-xs mt-2">Please check your credentials and try again.</div>
                            </div>
                        )}

                        {status && (
                            <div className="mt-4 text-center text-sm font-bold text-green-400 bg-green-900/20 border border-green-500/50 rounded-lg p-3">
                                {status}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
