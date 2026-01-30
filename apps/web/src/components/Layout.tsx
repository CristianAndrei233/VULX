import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout = () => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-bg-secondary text-text-primary font-sans">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <Header collapsed={collapsed} />

            <main className={`
                transition-all duration-300 pt-20 px-8 pb-8
                ${collapsed ? 'ml-[72px]' : 'ml-[240px]'}
            `}>
                <div className="max-w-[1600px] mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

