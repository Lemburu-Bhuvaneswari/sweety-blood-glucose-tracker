import axios from "axios";
import {
    Eye,
    EyeOff,
    HeartPulse,
    Lock,
    Mail,
    User
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        setLoading(true);

        try {
            await axios.post(
                "http://localhost:5000/api/auth/register",
                {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                }
            );

            setSuccess("Account created successfully! Redirecting to login...");

            setTimeout(() => {
                navigate("/login");
            }, 3500);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create account. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">

            <div className="register-brand">
                <div className="register-brand-icon">
                    <HeartPulse size={27} />
                </div>
                <span>Sweety</span>
            </div>

            <div className="register-container">

                {/* Left panel */}

                <div className="register-left">

                    <div className="register-decoration">
                        <HeartPulse size={48} />
                    </div>

                    <h1>Begin your journey<br />to better health.</h1>

                    <p>
                        Create your personal account and take
                        control of your glucose tracking journey.
                        Small steps today, healthier tomorrows.
                    </p>

                    <div className="register-bottom-text">
                        Your wellness matters. Every single day.
                    </div>

                </div>

                {/* Right panel */}

                <div className="register-right">

                    <div className="register-heading">

                        <span className="register-label">
                            JOIN SWEETY
                        </span>

                        <h2>Create your account</h2>

                        <p>
                            Fill in your details to get started.
                        </p>

                    </div>

                    <form onSubmit={handleSubmit}>

                        {/* Full name */}

                        <div className="register-form-group">

                            <label>Full Name</label>

                            <div className="register-input-wrapper">
                                <User size={19} />

                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    maxLength={100}
                                    autoComplete="name"
                                    required
                                />
                            </div>

                        </div>

                        {/* Email */}

                        <div className="register-form-group">

                            <label>Email Address</label>

                            <div className="register-input-wrapper">
                                <Mail size={19} />

                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    required
                                />
                            </div>

                        </div>

                        {/* Password */}

                        <div className="register-form-group">

                            <label>Password</label>

                            <div className="register-input-wrapper">
                                <Lock size={19} />

                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Minimum 8 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="register-password-toggle"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword
                                        ? <EyeOff size={19} />
                                        : <Eye size={19} />
                                    }
                                </button>
                            </div>

                        </div>

                        {/* Confirm password */}

                        <div className="register-form-group">

                            <label>Confirm Password</label>

                            <div className="register-input-wrapper">
                                <Lock size={19} />

                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    placeholder="Re-enter your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="register-password-toggle"
                                    onClick={() =>
                                        setShowConfirmPassword(!showConfirmPassword)
                                    }
                                    aria-label="Toggle confirm password visibility"
                                >
                                    {showConfirmPassword
                                        ? <EyeOff size={19} />
                                        : <Eye size={19} />
                                    }
                                </button>
                            </div>

                        </div>

                        {/* Messages */}

                        {error && (
                            <div className="register-error">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="register-success">
                                {success}
                            </div>
                        )}

                        {/* Submit */}

                        <button
                            type="submit"
                            className="register-button"
                            disabled={loading || !!success}
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>

                    </form>

                    <p className="register-login-text">
                        Already have an account?
                        {" "}
                        <Link to="/login">Sign in</Link>
                    </p>

                    <div className="register-footer">
                        Made with care for your health 💜
                    </div>

                </div>

            </div>

        </div>
    );
}

export default Register;