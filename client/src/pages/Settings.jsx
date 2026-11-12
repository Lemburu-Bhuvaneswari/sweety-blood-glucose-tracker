import axios from "axios";
import {
    Bell,
    ClipboardList,
    Eye,
    EyeOff,
    FileText,
    LayoutDashboard,
    LockKeyhole,
    LogOut,
    Save,
    ShieldCheck,
    Target,
    UserRound
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Settings.css";

const API_URL = "http://localhost:5000/api";

function Settings() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [profile, setProfile] = useState({
        name: "",
        email: ""
    });

    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showPasswords, setShowPasswords] = useState(false);

    const [dailyGoal, setDailyGoal] = useState(
        localStorage.getItem("dailyReadingGoal") || "4"
    );

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/auth/profile`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setProfile({
                name: response.data.user.name,
                email: response.data.user.email
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load profile details."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");
        setSaving(true);

        try {
            const response = await axios.put(
                `${API_URL}/auth/profile`,
                profile,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setProfile({
                name: response.data.user.name,
                email: response.data.user.email
            });

            const storedUser = localStorage.getItem("user");

            if (storedUser) {
                const user = JSON.parse(storedUser);

                localStorage.setItem(
                    "user",
                    JSON.stringify({
                        ...user,
                        name: response.data.user.name,
                        email: response.data.user.email
                    })
                );
            }

            setMessage("Profile updated successfully!");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update profile."
            );
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = (e) => {
        setPasswords({
            ...passwords,
            [e.target.name]: e.target.value
        });
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }

        if (passwords.newPassword.length < 8) {
            setError("New password must contain at least 8 characters.");
            return;
        }

        setSaving(true);

        try {
            const response = await axios.put(
                `${API_URL}/auth/change-password`,
                passwords,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(
                response.data.message || "Password changed successfully!"
            );

            setPasswords({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to change password."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleGoalSave = () => {
        localStorage.setItem("dailyReadingGoal", dailyGoal);

        setMessage("Daily reading goal saved on this device!");
        setError("");
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };

    const changeTab = (tab) => {
        setActiveTab(tab);
        setMessage("");
        setError("");
    };

    if (loading) {
        return (
            <div className="settings-loading">
                Loading your settings...
            </div>
        );
    }

    return (
        <div className="settings-layout">

            <aside className="settings-sidebar">

                <div className="settings-brand">
                    <div className="settings-brand-icon">S</div>
                    <div>
                        <h2>Sweety</h2>
                        <span>Glucose Tracker</span>
                    </div>
                </div>

                <div className="settings-nav-label">
                    MAIN MENU
                </div>

                <button
                    className="settings-nav-item"
                    onClick={() => navigate("/dashboard")}
                >
                    <LayoutDashboard size={19} />
                    Dashboard
                </button>

                <button
                    className="settings-nav-item"
                    onClick={() => navigate("/readings")}
                >
                    <ClipboardList size={19} />
                    Reading History
                </button>

                <button
                    className="settings-nav-item"
                    onClick={() => navigate("/reports")}
                >
                    <FileText size={19} />
                    Reports
                </button>

                <button className="settings-nav-item active">
                    <UserRound size={19} />
                    Settings
                </button>
                <button
                    className="settings-logout"
                    onClick={handleLogout}
                >
                    <LogOut size={19} />
                    Logout
                </button>

                <div className="settings-sidebar-footer">
                    <ShieldCheck size={18} />
                    <span>Your health data is private.</span>
                </div>

            </aside>

            <main className="settings-main">

                <header className="settings-header">
                    <div>
                        <span className="settings-breadcrumb">
                            Account / Settings
                        </span>
                        <h1>Settings</h1>
                        <p>Manage your account and preferences.</p>
                    </div>

                    <div className="settings-avatar">
                        {profile.name?.charAt(0).toUpperCase()}
                    </div>
                </header>

                <section className="settings-welcome">
                    <div>
                        <h2>Account Settings</h2>
                        <p>
                            Hello, {profile.name}! Keep your account
                            information up to date.
                        </p>
                    </div>

                    <div className="settings-welcome-icon">
                        <UserRound size={35} />
                    </div>
                </section>

                <div className="settings-content">

                    <aside className="settings-tabs">

                        <button
                            className={activeTab === "profile" ? "selected" : ""}
                            onClick={() => changeTab("profile")}
                        >
                            <UserRound size={19} />
                            My Profile
                        </button>

                        <button
                            className={activeTab === "security" ? "selected" : ""}
                            onClick={() => changeTab("security")}
                        >
                            <LockKeyhole size={19} />
                            Account Security
                        </button>

                        <button
                            className={activeTab === "preferences" ? "selected" : ""}
                            onClick={() => changeTab("preferences")}
                        >
                            <Target size={19} />
                            Glucose Preferences
                        </button>

                        <button
                            className={activeTab === "notifications" ? "selected" : ""}
                            onClick={() => changeTab("notifications")}
                        >
                            <Bell size={19} />
                            Notifications
                        </button>

                    </aside>

                    <section className="settings-panel">

                        {message && (
                            <div className="settings-success">
                                {message}
                            </div>
                        )}

                        {error && (
                            <div className="settings-error">
                                {error}
                            </div>
                        )}

                        {activeTab === "profile" && (
                            <>
                                <div className="settings-section-heading">
                                    <h2>My Profile</h2>
                                    <p>
                                        Update your personal account information.
                                    </p>
                                </div>

                                <form onSubmit={handleProfileSubmit}>

                                    <div className="settings-profile-avatar">
                                        {profile.name?.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="settings-field">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={profile.name}
                                            onChange={handleProfileChange}
                                            placeholder="Enter your name"
                                            required
                                            maxLength={100}
                                        />
                                    </div>

                                    <div className="settings-field">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={profile.email}
                                            onChange={handleProfileChange}
                                            placeholder="Enter your email"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="settings-save-button"
                                        disabled={saving}
                                    >
                                        <Save size={17} />
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>

                                </form>
                            </>
                        )}

                        {activeTab === "security" && (
                            <>
                                <div className="settings-section-heading">
                                    <h2>Account Security</h2>
                                    <p>
                                        Change your password to keep your
                                        account secure.
                                    </p>
                                </div>

                                <form onSubmit={handlePasswordSubmit}>

                                    {[
                                        {
                                            name: "currentPassword",
                                            label: "Current Password",
                                            placeholder: "Enter current password"
                                        },
                                        {
                                            name: "newPassword",
                                            label: "New Password",
                                            placeholder: "Enter new password"
                                        },
                                        {
                                            name: "confirmPassword",
                                            label: "Confirm New Password",
                                            placeholder: "Confirm new password"
                                        }
                                    ].map((field) => (
                                        <div
                                            className="settings-field"
                                            key={field.name}
                                        >
                                            <label>{field.label}</label>

                                            <div className="settings-password-input">
                                                <input
                                                    type={
                                                        showPasswords
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    name={field.name}
                                                    value={passwords[field.name]}
                                                    onChange={handlePasswordChange}
                                                    placeholder={field.placeholder}
                                                    required
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPasswords(!showPasswords)
                                                    }
                                                    aria-label="Toggle password visibility"
                                                >
                                                    {showPasswords
                                                        ? <EyeOff size={18} />
                                                        : <Eye size={18} />
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <p className="settings-password-hint">
                                        Your new password must contain at
                                        least 8 characters.
                                    </p>

                                    <button
                                        type="submit"
                                        className="settings-save-button"
                                        disabled={saving}
                                    >
                                        <LockKeyhole size={17} />
                                        {saving ? "Updating..." : "Update Password"}
                                    </button>

                                </form>
                            </>
                        )}

                        {activeTab === "preferences" && (
                            <>
                                <div className="settings-section-heading">
                                    <h2>Glucose Preferences</h2>
                                    <p>
                                        Personalize your daily glucose tracking.
                                    </p>
                                </div>

                                <div className="settings-field">
                                    <label>Glucose Measurement Unit</label>

                                    <input
                                        type="text"
                                        value="mg/dl"
                                        disabled
                                    />

                                    <small>
                                        Sweety currently records glucose
                                        values in mg/dl.
                                    </small>
                                </div>

                                <div className="settings-field">
                                    <label>Daily Reading Goal</label>

                                    <select
                                        value={dailyGoal}
                                        onChange={(e) =>
                                            setDailyGoal(e.target.value)
                                        }
                                    >
                                        <option value="1">1 reading per day</option>
                                        <option value="2">2 readings per day</option>
                                        <option value="3">3 readings per day</option>
                                        <option value="4">4 readings per day</option>
                                    </select>

                                    <small>
                                        Choose your preferred daily tracking
                                        goal. This preference is currently
                                        saved on this device.
                                    </small>
                                </div>

                                <button
                                    className="settings-save-button"
                                    onClick={handleGoalSave}
                                >
                                    <Save size={17} />
                                    Save Preferences
                                </button>
                            </>
                        )}

                        {activeTab === "notifications" && (
                            <>
                                <div className="settings-section-heading">
                                    <h2>Notifications</h2>
                                    <p>
                                        Stay informed about your glucose
                                        tracking routine.
                                    </p>
                                </div>

                                <div className="settings-coming-soon">
                                    <div className="settings-coming-icon">
                                        <Bell size={30} />
                                    </div>

                                    <h3>Reminders coming soon!</h3>

                                    <p>
                                        Daily reading reminders and
                                        notification scheduling are planned
                                        for a future update.
                                    </p>

                                    <span>Coming Soon</span>
                                </div>
                            </>
                        )}

                    </section>

                </div>

                <footer className="settings-footer">
                    Sweety Glucose Tracker · Manage your health journey
                </footer>

            </main>
        </div>
    );
}

export default Settings;