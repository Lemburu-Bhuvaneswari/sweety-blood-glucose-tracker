import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    AlertCircle,
    ArrowLeft,
    CalendarDays,
    CheckCircle,
    Clock,
    Droplet,
    HeartPulse
} from "lucide-react";

import "./AddReading.css";

const API_URL = "http://localhost:5000/api";

const TIME_SLOTS = [
    "Morning fasting",
    "After breakfast",
    "After lunch",
    "After dinner"
];

function getTodayDate() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata"
    }).format(new Date());
}

function AddReading() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        reading_date: getTodayDate(),
        time_slot: "",
        glucose_value: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        setError("");
        setSuccess("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        if (!formData.glucose_value.trim()) {
            setError("Please enter a glucose value.");
            return;
        }

        const glucoseValue = Number(formData.glucose_value);

        if (
            !Number.isInteger(glucoseValue) ||
            glucoseValue < 40 ||
            glucoseValue > 600
        ) {
            setError(
                "Value must be between 40 and 600 mg/dl."
            );
            return;
        }

        if (!formData.time_slot) {
            setError("Please select a time slot.");
            return;
        }

        if (formData.reading_date > getTodayDate()) {
            setError("Date cannot be in the future.");
            return;
        }

        try {
            setLoading(true);

            await axios.post(
                `${API_URL}/readings`,
                {
                    reading_date: formData.reading_date,
                    time_slot: formData.time_slot,
                    glucose_value: glucoseValue
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSuccess("Your glucose reading was saved successfully!");

            setTimeout(() => {
                navigate("/dashboard");
            }, 1200);

        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                navigate("/login", { replace: true });
                return;
            }

            setError(
                err.response?.data?.message ||
                "Unable to save your reading. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-reading-page">

            {/* Header */}
            <header className="add-reading-header">

                <div className="add-reading-brand">
                    <div className="add-reading-brand-icon">
                        <HeartPulse size={24} />
                    </div>

                    <span>Sweety</span>
                </div>

                <button
                    className="back-dashboard-btn"
                    onClick={() => navigate("/dashboard")}
                >
                    <ArrowLeft size={17} />
                    Back to Dashboard
                </button>

            </header>

            {/* Main Content */}
            <main className="add-reading-main">

                <div className="add-reading-intro">

                    <span className="add-reading-tag">
                        GLUCOSE TRACKER
                    </span>

                    <h1>Add Glucose Reading</h1>

                    <p>
                        Record your blood glucose level and keep
                        track of your daily health progress.
                    </p>

                </div>

                {/* Form Card */}
                <section className="add-reading-card">

                    <div className="add-reading-card-heading">

                        <div className="form-heading-icon">
                            <Droplet size={23} />
                        </div>

                        <div>
                            <h2>Reading Details</h2>

                            <p>
                                Enter your glucose measurement below.
                            </p>
                        </div>

                    </div>

                    <form onSubmit={handleSubmit}>

                        {/* Date */}
                        <div className="form-group">

                            <label htmlFor="reading_date">
                                <CalendarDays size={16} />
                                Reading Date
                            </label>

                            <input
                                type="date"
                                id="reading_date"
                                name="reading_date"
                                value={formData.reading_date}
                                max={getTodayDate()}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        {/* Time Slot */}
                        <div className="form-group">

                            <label htmlFor="time_slot">
                                <Clock size={16} />
                                Time Slot
                            </label>

                            <select
                                id="time_slot"
                                name="time_slot"
                                value={formData.time_slot}
                                onChange={handleChange}
                                required
                            >

                                <option value="">
                                    Select a time slot
                                </option>

                                {TIME_SLOTS.map((slot) => (
                                    <option
                                        key={slot}
                                        value={slot}
                                    >
                                        {slot}
                                    </option>
                                ))}

                            </select>

                            <small>
                                You can record one reading per time slot each day.
                            </small>

                        </div>

                        {/* Glucose Value */}
                        <div className="form-group">

                            <label htmlFor="glucose_value">
                                <Droplet size={16} />
                                Glucose Value
                            </label>

                            <div className="glucose-input-wrapper">

                                <input
                                    type="number"
                                    id="glucose_value"
                                    name="glucose_value"
                                    placeholder="Enter value (40–600)"
                                    value={formData.glucose_value}
                                    onChange={handleChange}
                                    min="40"
                                    max="600"
                                    step="1"
                                    required
                                />

                                <span>mg/dl</span>

                            </div>

                            <small>
                                Enter an integer between 40 and 600 mg/dl.
                            </small>

                        </div>

                        {/* Error */}
                        {error && (
                            <div className="form-message error-message">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Success */}
                        {success && (
                            <div className="form-message success-message">
                                <CheckCircle size={18} />
                                <span>{success}</span>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="add-reading-actions">

                            <button
                                type="button"
                                className="cancel-reading-btn"
                                onClick={() => navigate("/dashboard")}
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="save-reading-btn"
                                disabled={loading || !!success}
                            >
                                {loading
                                    ? "Saving..."
                                    : "Save Reading"}
                            </button>

                        </div>

                    </form>

                </section>

                <p className="add-reading-footer">
                    <HeartPulse size={15} />
                    Small steps towards better health, every day.
                </p>

            </main>

        </div>
    );
}

export default AddReading;