import axios from "axios";
import { Eye, EyeOff, HeartPulse, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
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
        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5000/api/auth/login",
                formData
            );

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            navigate("/dashboard");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to log in. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            <div className="login-brand">
                <div className="brand-icon">
                    <HeartPulse size={30} />
                </div>
                <span>Sweety</span>
            </div>

            <div className="login-container">

                <div className="login-left">
                    <div className="login-decoration">
                        <HeartPulse size={55} />
                    </div>

                    <h1>Your health,<br />your happiness.</h1>

                    <p>
                        Stay connected with your health.
                        Track your glucose levels and
                        take a step towards better living.
                    </p>

                    <div className="login-bottom-text">
                        Your health journey starts here.
                    </div>
                </div>

                <div className="login-right">

                    <div className="login-heading">
                        <span className="welcome-label">WELCOME BACK</span>

                        <h2>Sign in to Sweety</h2>

                        <p>
                            Enter your details to access your account.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="form-group">
                            <label>Email Address</label>

                            <div className="input-wrapper">
                                <Mail size={19} />

                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Password</label>

                            <div className="input-wrapper">
                                <Lock size={19} />

                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword
                                        ? <EyeOff size={19} />
                                        : <Eye size={19} />
                                    }
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>

                    </form>

                    <p className="register-text">
                        Don't have an account?
                        {" "}
                        <Link to="/register">Create account</Link>
                    </p>

                    <div className="login-footer">
                        Made with care for your health 💜
                    </div>

                </div>
            </div>

        </div>
    );
}

export default Login;