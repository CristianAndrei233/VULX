import { useAuth } from '../context/AuthContext';
import { Shield, User as UserIcon, Building, Mail, Edit2 } from 'lucide-react';
import { Card, CardHeader, Button, Badge } from '../components/ui';


export const Profile = () => {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
                <p className="text-slate-500 mt-1">Manage your account settings</p>
            </div>

            {/* Profile Card */}
            <Card>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-100">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-900">{user.name || 'User'}</h2>
                        <p className="text-slate-500">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant={user.role === 'ADMIN' ? 'primary' : 'success'}>
                                {user.role}
                            </Badge>
                        </div>
                    </div>
                    <Button variant="secondary" leftIcon={<Edit2 className="w-4 h-4" />}>
                        Edit Profile
                    </Button>
                </div>

                {/* Details */}
                <div className="pt-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Full Name</p>
                                <p className="text-sm font-semibold text-slate-900 mt-0.5">{user.name || 'Not set'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <Mail className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Email Address</p>
                                <p className="text-sm font-semibold text-slate-900 mt-0.5">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Role</p>
                                <p className="text-sm font-semibold text-slate-900 mt-0.5">{user.role}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                <Building className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Organization</p>
                                <p className="text-sm font-semibold text-slate-900 mt-0.5 font-mono text-xs">
                                    {user.organizationId || 'None'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Security Section */}
            <Card>
                <CardHeader title="Security" />
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Password</p>
                            <p className="text-xs text-slate-500 mt-0.5">Last changed 30 days ago</p>
                        </div>
                        <Button variant="secondary" size="sm">Change Password</Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Two-Factor Authentication</p>
                            <p className="text-xs text-slate-500 mt-0.5">Add an extra layer of security</p>
                        </div>
                        <Button variant="secondary" size="sm">Enable 2FA</Button>
                    </div>
                </div>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 bg-red-50/30">
                <CardHeader title="Danger Zone" />
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-red-800">Delete Account</p>
                        <p className="text-xs text-red-600 mt-0.5">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="danger" size="sm">Delete Account</Button>
                </div>
            </Card>
        </div>
    );
};
