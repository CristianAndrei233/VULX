import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User as UserIcon, Building, Mail, Edit2, X, Check, Lock, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, Button, Badge, Input } from '../components/ui';
import { updateProfile, changePassword, deleteAccount } from '../services/api';


export const Profile = () => {
    const { user, login, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [isLoading, setIsLoading] = useState(false);

    // Password Change State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Delete Account State
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEditToggle = () => {
        if (!isEditing && user) {
            setFormData({ name: user.name || '', email: user.email });
        }
        setIsEditing(!isEditing);
    };

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            const updatedUser = await updateProfile(formData);
            // Update local user state via context login method (hacky but works if token same)
            // Ideally context exposes a specific updateUser method, but login works
            const token = localStorage.getItem('vulx_token');
            if (token) login(token, updatedUser);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Failed to update information.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        setIsLoading(true);

        try {
            await changePassword(passwordData);
            setPasswordSuccess('Password updated successfully');
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordData({ currentPassword: '', newPassword: '' });
                setPasswordSuccess('');
            }, 2000);
        } catch (error: any) {
            setPasswordError(error.response?.data?.error || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you absolutely sure? This cannot be undone.')) return;
        setIsDeleting(true);
        try {
            await deleteAccount();
            logout();
        } catch (error) {
            console.error(error);
            alert('Failed to delete account');
            setIsDeleting(false);
        }
    };

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
                    {!isEditing ? (
                        <Button variant="secondary" onClick={handleEditToggle} leftIcon={<Edit2 className="w-4 h-4" />}>
                            Edit Profile
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={handleEditToggle} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleSaveProfile} isLoading={isLoading} leftIcon={<Check className="w-4 h-4" />}>
                                Save
                            </Button>
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="pt-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl relative">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-slate-500 uppercase">Full Name</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="mt-1 w-full px-2 py-1 text-sm border rounded"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{user.name || 'Not set'}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <Mail className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-slate-500 uppercase">Email Address</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="mt-1 w-full px-2 py-1 text-sm border rounded"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{user.email}</p>
                                )}
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
                                    {user.organization?.name || user.organizationId || 'None'}
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
                        <Button variant="secondary" size="sm" onClick={() => setShowPasswordModal(true)}>
                            Change Password
                        </Button>
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
                    <Button variant="danger" size="sm" onClick={handleDeleteAccount} isLoading={isDeleting}>
                        Delete Account
                    </Button>
                </div>
            </Card>

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Change Password</h3>
                            <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            {passwordError && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    {passwordError}
                                </div>
                            )}
                            {passwordSuccess && (
                                <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg flex items-center gap-2">
                                    <Check className="w-4 h-4" />
                                    {passwordSuccess}
                                </div>
                            )}

                            <Input
                                label="Current Password"
                                type="password"
                                required
                                value={passwordData.currentPassword}
                                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            />
                            <Input
                                label="New Password"
                                type="password"
                                required
                                value={passwordData.newPassword}
                                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                hint="At least 8 characters"
                            />

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="ghost" type="button" onClick={() => setShowPasswordModal(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" type="submit" isLoading={isLoading}>
                                    Update Password
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
