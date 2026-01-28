import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type Environment = 'SANDBOX' | 'PRODUCTION';

interface EnvironmentContextType {
    environment: Environment;
    setEnvironment: (env: Environment) => void;
    toggleEnvironment: () => void;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export const EnvironmentProvider = ({ children }: { children: ReactNode }) => {
    const [environment, setEnvironment] = useState<Environment>(() => {
        // Persist choice in localStorage
        return (localStorage.getItem('vulx_environment') as Environment) || 'PRODUCTION';
    });

    useEffect(() => {
        localStorage.setItem('vulx_environment', environment);
    }, [environment]);

    const toggleEnvironment = () => {
        setEnvironment((prev) => (prev === 'PRODUCTION' ? 'SANDBOX' : 'PRODUCTION'));
    };

    return (
        <EnvironmentContext.Provider value={{ environment, setEnvironment, toggleEnvironment }}>
            {children}
        </EnvironmentContext.Provider>
    );
};

export const useEnvironment = () => {
    const context = useContext(EnvironmentContext);
    if (!context) {
        throw new Error('useEnvironment must be used within an EnvironmentProvider');
    }
    return context;
};
