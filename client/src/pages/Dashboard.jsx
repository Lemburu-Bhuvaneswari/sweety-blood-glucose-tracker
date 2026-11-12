
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Activity,
    CalendarDays,
    ChartNoAxesCombined,
    ClipboardList,
    Droplet,
    HeartPulse,
    LayoutDashboard,
    LogOut,
    Plus,
    Settings,
    TrendingDown,
    TrendingUp
} from "lucide-react";

import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import "./Dashboard.css";

const API_URL = "http://localhost:5000/api";

const SLOT_ORDER = [
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

function Dashboard() {
    const navigate = useNavigate();

    const [readings, setReadings] = useState([]);

    const [summary, setSummary] = useState({
        total_readings: 0,
        average_value: null,
        highest_value: null,
        lowest_value: null
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const today = getTodayDate();

    const token = localStorage.getItem("token");

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!token) {
                navigate("/login", { replace: true });
                return;
            }

            try {
                setLoading(true);
                setError("");

                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                };

                const [
                    readingsResponse,
                    reportResponse
                ] = await Promise.all([
                    axios.get(
                        `${API_URL}/readings`,
                        config
                    ),

                    axios.get(
                        `${API_URL}/reports/daily?date=${today}`,
                        config
                    )
                ]);

                setReadings(
                    readingsResponse.data.readings || []
                );

                setSummary(
                    reportResponse.data.summary || {
                        total_readings: 0,
                        average_value: null,
                        highest_value: null,
                        lowest_value: null
                    }
                );

            } catch (err) {
                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");

                    navigate("/login", { replace: true });
                } else {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load dashboard data. Please try again."
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();

    }, [token, today, navigate]);

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", { replace: true });
    };

    // Arrange today's readings in the correct order
    const chartData = [...readings]
        .filter(
            (reading) => reading.reading_date === today
        )
        .sort(
            (a, b) =>
                SLOT_ORDER.indexOf(a.time_slot) -
                SLOT_ORDER.indexOf(b.time_slot)
        )
        .map((reading) => ({
            slot: reading.time_slot,
            glucose: Number(reading.glucose_value)
        }));

    // Calculate progress percentage
    const progressPercentage = Math.min(
        (Number(summary.total_readings || 0) / 4) * 100,
        100
    );

    // KPI cards
    const stats = [
        {
            title: "Today's Readings",
            value: summary.total_readings,
            unit: "/ 4",
            icon: Droplet,
            description: "Daily progress"
        },
        {
            title: "Average Glucose",
            value: summary.average_value ?? "--",
            unit: "mg/dl",
            icon: Activity,
            description: "Today's average"
        },
        {
            title: "Highest Reading",
            value: summary.highest_value ?? "--",
            unit: "mg/dl",
            icon: TrendingUp,
            description: "Today's maximum"
        },
        {
            title: "Lowest Reading",
            value: summary.lowest_value ?? "--",
            unit: "mg/dl",
            icon: TrendingDown,
            description: "Today's minimum"
        }
    ];

    // Format today's date
    const formattedDate = new Date(
        `${today}T12:00:00`
    ).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    return (
        <div className="dashboard-layout">

            {/* SIDEBAR */}
            <aside className="dashboard-sidebar">

                <div className="sidebar-brand">
                    <div className="brand-icon">
                        <HeartPulse size={25} />
                    </div>

                    <span>Sweety</span>
                </div>

                <p className="sidebar-label">
                    MENU
                </p>

                <nav className="sidebar-nav">

                    <button
                        className="nav-item active"
                        onClick={() => navigate("/dashboard")}
                    >
                        <LayoutDashboard size={19} />
                        <span>Dashboard</span>
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate("/readings")}
                    >
                        <ClipboardList size={19} />
                        <span>Reading History</span>
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate("/reports")}
                    >
                        <ChartNoAxesCombined size={19} />
                        <span>Reports</span>
                    </button>

                </nav>

                <div className="sidebar-bottom">

                    <button className="nav-item">
                        <Settings size={19} />
                        <span>Settings</span>
                    </button>

                    <button
                        className="nav-item logout-item"
                        onClick={handleLogout}
                    >
                        <LogOut size={19} />
                        <span>Logout</span>
                    </button>

                </div>

            </aside>

            {/* MAIN DASHBOARD */}
            <main className="dashboard-main">

                {/* HEADER */}
                <header className="dashboard-header">

                    <div>
                        <p className="header-greeting">
                            Welcome back 👋
                        </p>

                        <h1>
                            Hello, {user.name || "there"}!
                        </h1>

                        <p className="header-subtitle">
                            Here's your blood glucose overview.
                        </p>
                    </div>

                    <div className="header-date">
                        <CalendarDays size={18} />
                        <span>{formattedDate}</span>
                    </div>

                </header>

                {/* WELCOME CARD */}
                <section className="dashboard-welcome-card">

                    <div>
                        <span className="welcome-tag">
                            YOUR HEALTH MATTERS
                        </span>

                        <h2>
                            Every reading brings you closer to better health.
                        </h2>

                        <p>
                            Keep track of your glucose levels and stay
                            informed about your daily progress.
                        </p>
                    </div>

                    <button
                        className="add-reading-btn"
                        onClick={() => navigate("/readings/add")}
                    >
                        <Plus size={19} />
                        Add Reading
                    </button>

                </section>

                {/* ERROR MESSAGE */}
                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}

                {/* LOADING STATE */}
                {loading ? (

                    <div className="dashboard-loading">
                        Loading your health dashboard...
                    </div>

                ) : (

                    <>

                        {/* KPI CARDS */}
                        <section className="stats-grid">

                            {stats.map((stat, index) => {

                                const Icon = stat.icon;

                                return (
                                    <div
                                        className="stat-card"
                                        key={stat.title}
                                    >

                                        <div
                                            className={`stat-icon stat-icon-${index}`}
                                        >
                                            <Icon size={22} />
                                        </div>

                                        <p className="stat-title">
                                            {stat.title}
                                        </p>

                                        <div className="stat-value">
                                            {stat.value}

                                            <span>
                                                {stat.unit}
                                            </span>
                                        </div>

                                        <p className="stat-description">
                                            {stat.description}
                                        </p>

                                    </div>
                                );
                            })}

                        </section>

                        {/* CHART AND DAILY PROGRESS */}
                        <section className="dashboard-content-grid">

                            {/* GLUCOSE CHART */}
                            <div className="dashboard-card chart-card">

                                <div className="card-heading">

                                    <div>
                                        <h3>
                                            Glucose Overview
                                        </h3>

                                        <p>
                                            Your readings throughout today
                                        </p>
                                    </div>

                                    <span className="today-badge">
                                        Today
                                    </span>

                                </div>

                                {chartData.length === 0 ? (

                                    <div className="chart-empty">

                                        <Activity size={35} />

                                        <p>
                                            No readings recorded today.
                                        </p>

                                        <span>
                                            Add your first reading to see
                                            your glucose trend.
                                        </span>

                                    </div>

                                ) : (

                                    <div className="chart-container">

                                        <ResponsiveContainer
                                            width="100%"
                                            height={280}
                                        >

                                            <LineChart
                                                data={chartData}
                                                margin={{
                                                    top: 10,
                                                    right: 15,
                                                    left: 0,
                                                    bottom: 10
                                                }}
                                            >

                                                <CartesianGrid
                                                    strokeDasharray="4 4"
                                                    vertical={false}
                                                    stroke="#eeeaf8"
                                                />

                                                <XAxis
                                                    dataKey="slot"
                                                    tick={{
                                                        fontSize: 11,
                                                        fill: "#89839c"
                                                    }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    interval={0}
                                                />

                                                <YAxis
                                                    domain={["auto", "auto"]}
                                                    tick={{
                                                        fontSize: 11,
                                                        fill: "#89839c"
                                                    }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />

                                                <Tooltip />

                                                <Line
                                                    type="monotone"
                                                    dataKey="glucose"
                                                    name="Glucose"
                                                    stroke="#7047eb"
                                                    strokeWidth={3}
                                                    dot={{
                                                        r: 5,
                                                        fill: "#7047eb"
                                                    }}
                                                    activeDot={{
                                                        r: 7
                                                    }}
                                                />

                                            </LineChart>

                                        </ResponsiveContainer>

                                    </div>

                                )}

                            </div>

                            {/* DAILY PROGRESS */}
                            <div className="dashboard-card progress-card">

                                <div className="card-heading">

                                    <div>
                                        <h3>
                                            Daily Progress
                                        </h3>

                                        <p>
                                            Reading completion
                                        </p>
                                    </div>

                                </div>

                                <div
                                    className="progress-circle"
                                    style={{
                                        "--progress": progressPercentage
                                    }}
                                >

                                    <div>
                                        <strong>
                                            {summary.total_readings}/4
                                        </strong>

                                        <span>
                                            Readings
                                        </span>
                                    </div>

                                </div>

                                <p className="progress-message">

                                    {summary.total_readings === 4
                                        ? "Great! All four readings recorded."
                                        : `You have recorded ${summary.total_readings} of 4 daily readings.`}

                                </p>

                            </div>

                        </section>

                        {/* RECENT READINGS */}
                        <section className="dashboard-card recent-card">

                            <div className="card-heading">

                                <div>
                                    <h3>
                                        Recent Readings
                                    </h3>

                                    <p>
                                        Your latest glucose records
                                    </p>
                                </div>

                                <button
                                    className="view-all-btn"
                                    onClick={() => navigate("/readings")}
                                >
                                    View all
                                </button>

                            </div>

                            {readings.length === 0 ? (

                                <div className="readings-empty">

                                    <Droplet size={30} />

                                    <p>
                                        No readings available yet.
                                    </p>

                                </div>

                            ) : (

                                <div className="table-wrapper">

                                    <table className="readings-table">

                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Time Slot</th>
                                                <th>Glucose Level</th>
                                            </tr>
                                        </thead>

                                        <tbody>

                                            {[...readings]
                                                .sort((a, b) => {

                                                    const dateComparison =
                                                        b.reading_date.localeCompare(
                                                            a.reading_date
                                                        );

                                                    if (dateComparison !== 0) {
                                                        return dateComparison;
                                                    }

                                                    return (
                                                        SLOT_ORDER.indexOf(a.time_slot) -
                                                        SLOT_ORDER.indexOf(b.time_slot)
                                                    );
                                                })
                                                .slice(0, 5)
                                                .map((reading) => (

                                                    <tr key={reading.id}>

                                                        <td>
                                                            {reading.reading_date}
                                                        </td>

                                                        <td>
                                                            {reading.time_slot}
                                                        </td>

                                                        <td>
                                                            <span className="glucose-value">
                                                                {reading.glucose_value} mg/dl
                                                            </span>
                                                        </td>

                                                    </tr>

                                                ))}

                                        </tbody>

                                    </table>

                                </div>

                            )}

                        </section>

                    </>

                )}

            </main>

        </div>
    );
}

export default Dashboard;
