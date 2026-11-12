import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Activity,
    AlertCircle,
    CalendarDays,
    ChartNoAxesCombined,
    ClipboardList,
    Download,
    Droplet,
    FileBarChart,
    HeartPulse,
    LayoutDashboard,
    LogOut,
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

import "./Reports.css";

const API_URL = "http://localhost:5000/api";

const REPORT_TYPES = [
    { label: "Daily Report", value: "daily" },
    { label: "Month-to-Date", value: "month-to-date" },
    { label: "Previous Month", value: "previous-month" }
];

// Get current date in India
function getTodayDate() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata"
    }).format(new Date());
}

// Format YYYY-MM-DD into readable date
function formatDate(date) {
    if (!date) return "--";

    const [year, month, day] = date.split("-");

    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    ).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Calculate reporting period independently of backend response
function calculateReportingPeriod(reportType, selectedDate) {
    if (!selectedDate) {
        return {
            start_date: "",
            end_date: ""
        };
    }

    const [year, month, day] = selectedDate
        .split("-")
        .map(Number);

    const formatLocalDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");

        return `${y}-${m}-${d}`;
    };

    if (reportType === "daily") {
        return {
            start_date: selectedDate,
            end_date: selectedDate
        };
    }

    if (reportType === "month-to-date") {
        return {
            start_date: `${year}-${String(month).padStart(2, "0")}-01`,
            end_date: selectedDate
        };
    }

    if (reportType === "previous-month") {
        const firstDay = new Date(year, month - 2, 1);
        const lastDay = new Date(year, month - 1, 0);

        return {
            start_date: formatLocalDate(firstDay),
            end_date: formatLocalDate(lastDay)
        };
    }

    return {
        start_date: "",
        end_date: ""
    };
}

function Reports() {
    const navigate = useNavigate();

    const [reportType, setReportType] = useState("daily");
    const [selectedDate, setSelectedDate] = useState(getTodayDate());

    const [summary, setSummary] = useState({
        total_readings: 0,
        highest_value: null,
        lowest_value: null,
        average_value: null
    });

    const [readings, setReadings] = useState([]);

    const [period, setPeriod] = useState(
        calculateReportingPeriod("daily", getTodayDate())
    );

    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    // Fetch report
    const fetchReport = async () => {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/reports/${reportType}`,
                {
                    params: {
                        date: selectedDate
                    },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSummary(response.data.summary || {
                total_readings: 0,
                highest_value: null,
                lowest_value: null,
                average_value: null
            });

            setReadings(response.data.readings || []);

            // Calculate dates locally instead of relying on API dates
            setPeriod(
                calculateReportingPeriod(reportType, selectedDate)
            );

        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                navigate("/login", { replace: true });
            } else {
                setError(
                    err.response?.data?.message ||
                    "Unable to generate the report. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reportType, selectedDate]);

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", { replace: true });
    };

    // Statistics
    const stats = [
        {
            title: "Total Readings",
            value: summary.total_readings ?? 0,
            unit: "records",
            icon: Droplet,
            color: "report-icon-purple"
        },
        {
            title: "Average Glucose",
            value: summary.average_value ?? "--",
            unit: "mg/dl",
            icon: Activity,
            color: "report-icon-blue"
        },
        {
            title: "Highest Reading",
            value: summary.highest_value ?? "--",
            unit: "mg/dl",
            icon: TrendingUp,
            color: "report-icon-orange"
        },
        {
            title: "Lowest Reading",
            value: summary.lowest_value ?? "--",
            unit: "mg/dl",
            icon: TrendingDown,
            color: "report-icon-green"
        }
    ];

    // Prepare chart data
    const chartData = (() => {
        if (reportType === "daily") {
            const slotOrder = [
                "Morning fasting",
                "After breakfast",
                "After lunch",
                "After dinner"
            ];

            return [...readings]
                .sort(
                    (a, b) =>
                        slotOrder.indexOf(a.time_slot) -
                        slotOrder.indexOf(b.time_slot)
                )
                .map((reading) => ({
                    label: reading.time_slot,
                    glucose: Number(reading.glucose_value)
                }));
        }

        const dailyGroups = {};

        readings.forEach((reading) => {
            const date = reading.reading_date;

            if (!dailyGroups[date]) {
                dailyGroups[date] = {
                    total: 0,
                    count: 0
                };
            }

            dailyGroups[date].total += Number(
                reading.glucose_value
            );

            dailyGroups[date].count += 1;
        });

        return Object.entries(dailyGroups)
            .sort(([dateA], [dateB]) =>
                dateA.localeCompare(dateB)
            )
            .map(([date, values]) => ({
                label: formatDate(date),
                glucose: Number(
                    (values.total / values.count).toFixed(1)
                )
            }));
    })();

    const reportTitle = REPORT_TYPES.find(
        (item) => item.value === reportType
    )?.label;

    // Download professional PDF
    const handleDownloadPDF = () => {
        if (downloading) return;

        try {
            setDownloading(true);

            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;

            // Header
            doc.setFillColor(112, 71, 235);
            doc.rect(0, 0, pageWidth, 42, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(23);
            doc.text("SWEETY", margin, 18);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(
                "BLOOD GLUCOSE TRACKING REPORT",
                margin,
                27
            );

            doc.setFontSize(8);
            doc.text(
                `Generated: ${new Date().toLocaleDateString("en-IN")}`,
                pageWidth - margin,
                18,
                { align: "right" }
            );

            // Report details
            doc.setTextColor(45, 39, 65);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text(reportTitle, margin, 55);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);

            doc.text(
                `Reporting Period: ${formatDate(period.start_date)} - ${formatDate(period.end_date)}`,
                margin,
                63
            );

            if (user.name) {
                doc.text(`Prepared for: ${user.name}`, margin, 69);
            }

            // KPI cards
            const cards = [
                {
                    label: "TOTAL READINGS",
                    value: summary.total_readings ?? 0,
                    unit: "Records"
                },
                {
                    label: "AVERAGE GLUCOSE",
                    value: summary.average_value ?? "N/A",
                    unit: "mg/dl"
                },
                {
                    label: "HIGHEST READING",
                    value: summary.highest_value ?? "N/A",
                    unit: "mg/dl"
                },
                {
                    label: "LOWEST READING",
                    value: summary.lowest_value ?? "N/A",
                    unit: "mg/dl"
                }
            ];

            const cardGap = 3;
            const cardWidth =
                (pageWidth - margin * 2 - cardGap * 3) / 4;

            cards.forEach((card, index) => {
                const x = margin + index * (cardWidth + cardGap);
                const y = 79;

                doc.setFillColor(246, 242, 255);
                doc.roundedRect(x, y, cardWidth, 29, 3, 3, "F");

                doc.setTextColor(112, 71, 235);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(6.5);
                doc.text(card.label, x + 3, y + 7);

                doc.setTextColor(45, 39, 65);
                doc.setFontSize(13);
                doc.text(String(card.value), x + 3, y + 17);

                doc.setTextColor(137, 131, 156);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7);
                doc.text(card.unit, x + 3, y + 24);
            });

            // Trend chart
            let contentY = 123;

            doc.setTextColor(45, 39, 65);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("Glucose Trend Analysis", margin, contentY);

            contentY += 8;

            if (chartData.length > 0) {
                const chartX = margin + 12;
                const chartY = contentY + 4;
                const chartWidth = pageWidth - margin * 2 - 18;
                const chartHeight = 38;

                const values = chartData.map(
                    (item) => item.glucose
                );

                const minValue = Math.min(...values);
                const maxValue = Math.max(...values);
                const range = Math.max(maxValue - minValue, 10);

                const lower = minValue - range * 0.2;
                const upper = maxValue + range * 0.2;

                doc.setDrawColor(232, 226, 244);
                doc.setLineWidth(0.2);

                for (let i = 0; i <= 3; i++) {
                    const y = chartY + (chartHeight / 3) * i;

                    doc.line(chartX, y, chartX + chartWidth, y);
                }

                const points = chartData.map((item, index) => {
                    const x = chartData.length === 1
                        ? chartX + chartWidth / 2
                        : chartX +
                          (index / (chartData.length - 1)) * chartWidth;

                    const y = chartY + chartHeight -
                        ((item.glucose - lower) / (upper - lower)) *
                        chartHeight;

                    return { x, y };
                });

                doc.setDrawColor(112, 71, 235);
                doc.setLineWidth(0.8);

                for (let i = 0; i < points.length - 1; i++) {
                    doc.line(
                        points[i].x,
                        points[i].y,
                        points[i + 1].x,
                        points[i + 1].y
                    );
                }

                points.forEach((point) => {
                    doc.setFillColor(112, 71, 235);
                    doc.circle(point.x, point.y, 1.4, "F");
                });

                doc.setFont("helvetica", "normal");
                doc.setFontSize(6.5);
                doc.setTextColor(100, 94, 118);

                chartData.forEach((item, index) => {
                    const label = item.label.length > 17
                        ? item.label.substring(0, 15) + "..."
                        : item.label;

                    doc.text(
                        label,
                        points[index].x,
                        chartY + chartHeight + 7,
                        { align: "center" }
                    );
                });

                contentY = chartY + chartHeight + 16;

            } else {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(140, 132, 158);

                doc.text(
                    "No glucose readings available for this period.",
                    margin,
                    contentY + 8
                );

                contentY += 20;
            }

            // Detailed readings table
            doc.setTextColor(45, 39, 65);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);

            doc.text(
                "Detailed Glucose Readings",
                margin,
                contentY
            );

            autoTable(doc, {
                startY: contentY + 6,

                head: [[
                    "Date",
                    "Time Slot",
                    "Glucose Value (mg/dl)"
                ]],

                body: readings.length > 0
                    ? readings.map((reading) => [
                        formatDate(reading.reading_date),
                        reading.time_slot,
                        String(reading.glucose_value)
                    ])
                    : [["--", "No readings available", "--"]],

                theme: "grid",

                headStyles: {
                    fillColor: [112, 71, 235],
                    textColor: [255, 255, 255],
                    fontSize: 8,
                    fontStyle: "bold"
                },

                bodyStyles: {
                    textColor: [65, 59, 82],
                    fontSize: 8,
                    cellPadding: 4
                },

                alternateRowStyles: {
                    fillColor: [248, 246, 253]
                },

                styles: {
                    lineColor: [235, 230, 245],
                    lineWidth: 0.2,
                    overflow: "linebreak"
                },

                margin: {
                    left: margin,
                    right: margin,
                    bottom: 22
                },

                didDrawPage: () => {
                    doc.setDrawColor(230, 225, 242);

                    doc.line(
                        margin,
                        pageHeight - 17,
                        pageWidth - margin,
                        pageHeight - 17
                    );

                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(8);
                    doc.setTextColor(140, 132, 158);

                    doc.text(
                        "Sweety | Your health matters.",
                        margin,
                        pageHeight - 10
                    );

                    doc.text(
                        `Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
                        pageWidth - margin,
                        pageHeight - 10,
                        { align: "right" }
                    );
                }
            });

            doc.save(
                `Sweety_${reportType}_${selectedDate}.pdf`
            );

        } catch (err) {
            console.error("PDF generation failed:", err);

            setError(
                "Unable to generate PDF. Please try again."
            );

        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="reports-layout">

            {/* SIDEBAR */}
            <aside className="reports-sidebar">

                <div className="sidebar-brand">
                    <div className="brand-icon">
                        <HeartPulse size={25} />
                    </div>
                    <span>Sweety</span>
                </div>

                <p className="sidebar-label">MENU</p>

                <nav className="sidebar-nav">

                    <button
                        className="nav-item"
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

                    <button className="nav-item active">
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

            {/* MAIN CONTENT */}
            <main className="reports-main">

                <header className="reports-header">

                    <div>
                        <p className="header-greeting">
                            Welcome, {user.name || "there"} 👋
                        </p>

                        <h1>Reports & Analytics</h1>

                        <p className="header-subtitle">
                            Understand your glucose readings
                            through meaningful insights.
                        </p>
                    </div>

                    <div className="reports-header-icon">
                        <FileBarChart size={25} />
                    </div>

                </header>

                {/* FILTERS */}
                <section className="report-filter-card">

                    <div className="report-filter-heading">
                        <h2>Generate Report</h2>
                        <p>Select a reporting period.</p>
                    </div>

                    <div className="report-filter-controls">

                        <div className="report-field">
                            <label htmlFor="report-type">
                                Report Type
                            </label>

                            <select
                                id="report-type"
                                value={reportType}
                                onChange={(event) =>
                                    setReportType(event.target.value)
                                }
                            >
                                {REPORT_TYPES.map((type) => (
                                    <option
                                        key={type.value}
                                        value={type.value}
                                    >
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="report-field">
                            <label htmlFor="report-date">
                                <CalendarDays size={15} />
                                Reference Date
                            </label>

                            <input
                                type="date"
                                id="report-date"
                                value={selectedDate}
                                max={getTodayDate()}
                                onChange={(event) =>
                                    setSelectedDate(event.target.value)
                                }
                            />
                        </div>

                    </div>

                </section>

                {/* ERROR */}
                {error && (
                    <div className="reports-error">
                        <AlertCircle size={17} />
                        {error}
                    </div>
                )}

                {loading ? (

                    <div className="reports-loading">
                        Generating your report...
                    </div>

                ) : (

                    <>

                        {/* REPORT PERIOD */}
                        <div className="report-period">

                            <div>
                                <span>GENERATED REPORT</span>
                                <h2>{reportTitle}</h2>
                            </div>

                            <div className="report-period-dates">
                                <span>Reporting Period</span>

                                <strong>
                                    {formatDate(period.start_date)}
                                    {" – "}
                                    {formatDate(period.end_date)}
                                </strong>
                            </div>

                            <button
                                className="download-report-btn"
                                onClick={handleDownloadPDF}
                                disabled={downloading}
                            >
                                <Download size={17} />

                                {downloading
                                    ? "Generating PDF..."
                                    : "Download PDF"}
                            </button>

                        </div>

                        {/* KPI CARDS */}
                        <section className="report-stats-grid">

                            {stats.map((stat) => {
                                const Icon = stat.icon;

                                return (
                                    <div
                                        className="report-stat-card"
                                        key={stat.title}
                                    >
                                        <div
                                            className={`report-stat-icon ${stat.color}`}
                                        >
                                            <Icon size={21} />
                                        </div>

                                        <p>{stat.title}</p>

                                        <div className="report-stat-value">
                                            {stat.value}
                                            <span>{stat.unit}</span>
                                        </div>
                                    </div>
                                );
                            })}

                        </section>

                        {/* LINE CHART */}
                        <section className="reports-card">

                            <div className="reports-card-heading">

                                <div>
                                    <h3>Glucose Trend Analysis</h3>

                                    <p>
                                        {reportType === "daily"
                                            ? "Glucose values across today's time slots."
                                            : "Daily average glucose levels throughout the selected period."}
                                    </p>
                                </div>

                                <span className="report-count-badge">
                                    {chartData.length} data points
                                </span>

                            </div>

                            {chartData.length === 0 ? (

                                <div className="reports-empty">
                                    <Activity size={38} />
                                    <h3>No readings available</h3>

                                    <p>
                                        There are no glucose records
                                        for this reporting period.
                                    </p>
                                </div>

                            ) : (

                                <div className="reports-chart">

                                    <ResponsiveContainer
                                        width="100%"
                                        height={300}
                                    >
                                        <LineChart
                                            data={chartData}
                                            margin={{
                                                top: 15,
                                                right: 20,
                                                left: 5,
                                                bottom: 10
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="4 4"
                                                vertical={false}
                                                stroke="#eeeaf8"
                                            />

                                            <XAxis
                                                dataKey="label"
                                                tick={{
                                                    fontSize: 10,
                                                    fill: "#89839c"
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                                interval="preserveStartEnd"
                                            />

                                            <YAxis
                                                tick={{
                                                    fontSize: 11,
                                                    fill: "#89839c"
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                                domain={["auto", "auto"]}
                                            />

                                            <Tooltip
                                                formatter={(value) => [
                                                    `${value} mg/dl`,
                                                    reportType === "daily"
                                                        ? "Glucose"
                                                        : "Daily Average"
                                                ]}
                                                contentStyle={{
                                                    borderRadius: "10px",
                                                    border: "1px solid #eeeaf8",
                                                    fontSize: "11px"
                                                }}
                                            />

                                            <Line
                                                type="monotone"
                                                dataKey="glucose"
                                                name="Glucose"
                                                stroke="#7047eb"
                                                strokeWidth={3}
                                                dot={{
                                                    r: 5,
                                                    fill: "#7047eb",
                                                    strokeWidth: 2,
                                                    stroke: "#ffffff"
                                                }}
                                                activeDot={{ r: 7 }}
                                            />

                                        </LineChart>
                                    </ResponsiveContainer>

                                </div>

                            )}

                        </section>

                        {/* DETAILED READINGS */}
                        <section className="reports-card report-table-card">

                            <div className="reports-card-heading">

                                <div>
                                    <h3>Detailed Readings</h3>

                                    <p>
                                        Individual glucose records
                                        for this period.
                                    </p>
                                </div>

                                <span className="report-count-badge">
                                    {readings.length} records
                                </span>

                            </div>

                            {readings.length === 0 ? (

                                <div className="reports-empty small-empty">
                                    No records found for this period.
                                </div>

                            ) : (

                                <div className="reports-table-wrapper">

                                    <table className="reports-table">

                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Time Slot</th>
                                                <th>Glucose Value</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {readings.map((reading) => (
                                                <tr key={reading.id}>
                                                    <td>
                                                        {formatDate(
                                                            reading.reading_date
                                                        )}
                                                    </td>

                                                    <td>
                                                        {reading.time_slot}
                                                    </td>

                                                    <td>
                                                        <span className="report-glucose-value">
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

export default Reports;