import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User as UserIcon, Building, Mail, Edit2, X, Check, Lock, AlertTriangle } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
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
            // Update local user state via context login method
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
                <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">Profile & Settings</h1>
                <p className="text-text-secondary mt-1">Manage your account preferences and security configuration.</p>
            </div>

            {/* Profile Card */}
            <Card className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-border-primary">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-bg-primary text-3xl font-bold shadow-lg shadow-accent-primary/20">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-text-primary">{user.name || 'User'}</h2>
                        <p className="text-text-secondary">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant={user.role === 'ADMIN' ? 'primary' : 'success'}>
                                {user.role}
                            </Badge>
                        </div>
                    </div>
                    {!isEditing ? (
                        <Button variant="secondary" onClick={handleEditToggle} icon={Edit2}>
                            Edit Profile
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={handleEditToggle} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleSaveProfile} disabled={isLoading} icon={Check}>
                                {isLoading ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="pt-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-4 p-4 bg-bg-tertiary rounded-xl border border-border-primary transition-colors hover:border-accent-primary/30">
                            <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center text-text-secondary shadow-sm">
                                <UserIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Full Name</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="w-full px-3 py-1.5 text-sm bg-bg-elevated border border-border-primary rounded text-text-primary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-text-primary truncate">{user.name || 'Not set'}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-bg-tertiary rounded-xl border border-border-primary transition-colors hover:border-accent-primary/30">
                            <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center text-accent-primary shadow-sm">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Email Address</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="w-full px-3 py-1.5 text-sm bg-bg-elevated border border-border-primary rounded text-text-primary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-text-primary truncate">{user.email}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-bg-tertiary rounded-xl border border-border-primary">
                            <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center text-text-primary shadow-sm">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Role</p>
                                <p className="text-sm font-semibold text-text-primary">{user.role}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-bg-tertiary rounded-xl border border-border-primary">
                            <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center text-severity-medium shadow-sm">
                                <Building className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Organization</p>
                                <p className="text-sm font-semibold text-text-primary font-mono text-xs">
                                    {user.organization?.name || user.organizationId || 'None'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Security Section */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Security</h2>
                        <p className="text-sm text-text-secondary">Password and authentication settings</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-xl border border-border-primary">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-bg-elevated rounded-lg text-text-secondary">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-text-primary">Password</p>
                                <p className="text-xs text-text-secondary mt-0.5">Last changed 30 days ago</p>
                            </div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setShowPasswordModal(true)}>
                            Change Password
                        </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-xl border border-border-primary opacity-60">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-bg-elevated rounded-lg text-text-secondary">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-text-primary">Two-Factor Authentication</p>
                                <p className="text-xs text-text-secondary mt-0.5">Add an extra layer of security</p>
                            </div>
                        </div>
                        <Button variant="secondary" size="sm" disabled>Enable 2FA</Button>
                    </div>
                </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-severity-critical/30 bg-severity-critical-bg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-severity-critical">Delete Account</h3>
                        <p className="text-sm text-severity-critical/80 mt-1">Permanently delete your account and all data</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="bg-severity-critical/10 text-severity-critical hover:bg-severity-critical hover:text-white border border-severity-critical/20"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </Button>
                </div>
            </Card>

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <Card className="w-full max-w-md bg-bg-card border-border-primary shadow-2xl p-0 overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-border-primary bg-bg-tertiary">
                            <h3 className="text-lg font-bold text-text-primary">Change Password</h3>
                            <button onClick={() => setShowPasswordModal(false)} className="text-text-secondary hover:text-text-primary transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleChangePassword} className="p-6 space-y-5">
                            {passwordError && (
                                <div className="p-3 bg-severity-critical-bg text-severity-critical text-sm rounded-lg flex items-center gap-2 border border-severity-critical/20">
                                    <AlertTriangle className="w-4 h-4" />
                                    {passwordError}
                                </div>
                            )}
                            {passwordSuccess && (
                                <div className="p-3 bg-accent-primary-muted text-accent-primary text-sm rounded-lg flex items-center gap-2 border border-accent-primary/20">
                                    <Check className="w-4 h-4" />
                                    {passwordSuccess}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-text-secondary uppercase tracking-wider">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordData.currentPassword}
                                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-text-secondary uppercase tracking-wider">New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordData.newPassword}
                                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all"
                                />
                                <p className="text-xs text-text-muted">At least 8 characters</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="ghost" type="button" onClick={() => setShowPasswordModal(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" type="submit" disabled={isLoading}>
                                    {isLoading ? 'Updating...' : 'Update Password'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};
