import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Shield,
    Lock,
    Eye,
    EyeOff,
    Cpu,
    ShieldCheck
} from 'lucide-react';
import WorldMap from '../assets/world-map.png';

interface AuthProps {
    initialView?: 'login' | 'register';
}

const Auth: React.FC<AuthProps> = ({ initialView = 'login' }) => {
    const [view, setView] = useState<'login' | 'register'>(initialView);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const navigate = useNavigate();
    const { login } = useAuth();

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        organizationName: '',
        confirmPassword: ''
    });

    const toggleView = () => {
        setView(prev => prev === 'login' ? 'register' : 'login');
        setError('');
        setShowPassword(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (view === 'login') {
                const { data } = await api.post('/auth/login', {
                    email: formData.email,
                    password: formData.password
                });
                login(data.token, data.user);
                navigate('/');
            } else {
                if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    setIsLoading(false);
                    return;
                }
                await api.post('/auth/register', {
                    name: formData.name,
                    email: formData.email,
                    organizationName: formData.organizationName,
                    password: formData.password
                });
                setView('login');
                alert('Registration successful. Please log in.');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Canvas Animation: Arcs over the map
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth * 0.7; // Approx 70% width coverage
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Simulated attack lines (Bezier curves)
        const arcs: any[] = [];

        // Generate random arcs occasionally
        const createArc = () => {
            const startX = Math.random() * canvas.width;
            const startY = Math.random() * canvas.height;
            const endX = Math.random() * canvas.width;
            const endY = Math.random() * canvas.height;
            const controlX = (startX + endX) / 2 + (Math.random() - 0.5) * 200;
            const controlY = (startY + endY) / 2 - 200; // Curve upwards

            return {
                startX, startY, endX, endY, controlX, controlY,
                progress: 0,
                speed: 0.005 + Math.random() * 0.01,
                color: Math.random() > 0.5 ? '#0071E3' : '#A855F7' // Blue or Purple
            };
        };

        // Initial population
        for (let i = 0; i < 5; i++) arcs.push(createArc());

        let animationFrameId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Randomly add new arcs
            if (Math.random() < 0.05 && arcs.length < 15) {
                arcs.push(createArc());
            }

            for (let i = arcs.length - 1; i >= 0; i--) {
                const arc = arcs[i];
                arc.progress += arc.speed;

                if (arc.progress > 1) {
                    arcs.splice(i, 1);
                    continue;
                }

                // Draw the full path faintly
                ctx.beginPath();
                ctx.moveTo(arc.startX, arc.startY);
                ctx.quadraticCurveTo(arc.controlX, arc.controlY, arc.endX, arc.endY);
                ctx.strokeStyle = `${arc.color}10`; // Very faint trail
                ctx.lineWidth = 1;
                ctx.stroke();

                // Draw the "packet" moving along the path
                const t = arc.progress;
                const x = (1 - t) * (1 - t) * arc.startX + 2 * (1 - t) * t * arc.controlX + t * t * arc.endX;
                const y = (1 - t) * (1 - t) * arc.startY + 2 * (1 - t) * t * arc.controlY + t * t * arc.endY;

                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.shadowBlur = 8;
                ctx.shadowColor = arc.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();
        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="min-h-screen w-full bg-[#020408] overflow-hidden flex font-sans text-white relative">

            {/* Background Map Image (Cover) */}
            <div className="absolute inset-0 z-0">
                <img
                    src={WorldMap}
                    alt="World Map"
                    className="w-full h-full object-cover object-left opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020408] via-[#020408]/80 to-transparent"></div>
            </div>

            {/* Canvas Layer for Animations */}
            <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />

            {/* Main Container */}
            <div className="relative z-20 w-full max-w-[1600px] mx-auto px-8 lg:px-16 h-screen flex flex-col lg:flex-row items-center justify-between">

                {/* Left Content */}
                <div className="w-full lg:w-1/2 pt-20 lg:pt-0">
                    <div className="flex items-center gap-3 mb-8">
                        <Shield size={28} className="text-[#0071E3]" fill="#0071E3" />
                        <span className="text-2xl font-bold tracking-tight">VULX</span>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                        Security for the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#ffffff80]">Modern Web.</span>
                    </h1>

                    <p className="text-[#9CA3AF] text-lg lg:text-xl max-w-lg leading-relaxed mb-12">
                        Monitor, audit, and secure your API infrastructure with enterprise-grade precision.
                    </p>

                    <div className="flex items-center gap-2 text-white/80 font-medium">
                        <ShieldCheck className="text-white" size={20} />
                        <span>SOC2 <span className="text-xs opacity-70 block -mt-1 font-normal">Type II Certified</span></span>
                    </div>

                    {/* Live Map Label Tooltip style */}
                    <div className="hidden lg:flex absolute top-1/2 left-[40%] bg-[#111827]/80 backdrop-blur border border-white/10 px-3 py-1.5 rounded-lg text-xs items-center gap-2 animate-pulse">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Live Threat Map
                    </div>
                </div>

                {/* Right Content - Glass Card */}
                <div className="w-full lg:w-[480px] lg:mr-12 mt-12 lg:mt-0 relative">
                    <div className="relative backdrop-blur-2xl bg-white/[0.08] border border-white/10 rounded-3xl p-10 shadow-2xl">

                        <div className="mb-10">
                            <h2 className="text-3xl font-bold mb-2">
                                {view === 'login' ? 'Welcome Back,' : 'Get Started,'}
                            </h2>
                            <p className="text-[#9CA3AF]">
                                {view === 'login' ? 'Sign in to access your dashboard.' : 'Create an account to verify APIs.'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-center gap-2">
                                <Lock size={14} /> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {view === 'register' && (
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider pl-1">Name</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 focus:border-[#0071E3] rounded-xl px-4 py-3.5 text-white outline-none transition-all placeholder:text-white/20"
                                        placeholder="John Doe"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider pl-1">Work Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 focus:border-[#0071E3] rounded-xl px-4 py-3.5 text-white outline-none transition-all placeholder:text-white/20"
                                    placeholder="name@company.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center pl-1 pr-1">
                                    <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Password</label>
                                    {view === 'login' && <Link to="/forgot-pass" className="text-xs text-[#9CA3AF] hover:text-white transition-colors">Forgot password?</Link>}
                                </div>
                                <div className="relative">
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 focus:border-[#0071E3] rounded-xl px-4 py-3.5 text-white outline-none transition-all placeholder:text-white/20 pr-10"
                                        placeholder="••••••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {view === 'register' && (
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider pl-1">Confirm Password</label>
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 focus:border-[#0071E3] rounded-xl px-4 py-3.5 text-white outline-none transition-all placeholder:text-white/20"
                                        placeholder="••••••••••••"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Cpu className="animate-spin" size={20} /> : (view === 'login' ? 'Sign In' : 'Create Account')}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <button
                                onClick={toggleView}
                                className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
                            >
                                {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                                <span className="text-[#0071E3] font-semibold hover:underline">
                                    {view === 'login' ? 'Create one now' : 'Sign in'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Decorative shine on card corner */}
                    <div className="absolute -bottom-10 -right-10 text-white/5">
                        <Cpu size={120} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
