
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    AlertCircle,
    CalendarDays,
    ChartNoAxesCombined,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Droplet,
    Filter,
    HeartPulse,
    LayoutDashboard,
    LogOut,
    Pencil,
    Save,
    Settings,
    Trash2,
    X
} from "lucide-react";

import "./ReadingHistory.css";

const API_URL = "http://localhost:5000/api";

const TIME_SLOTS = [
    "Morning fasting",
    "After breakfast",
    "After lunch",
    "After dinner"
];

const PAGE_SIZE = 5;

function getTodayDate() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata"
    }).format(new Date());
}

function ReadingHistory() {
    const navigate = useNavigate();

    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchDate, setSearchDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("All");

    const [currentPage, setCurrentPage] = useState(1);

    const [editingReading, setEditingReading] = useState(null);
    const [editData, setEditData] = useState({
        reading_date: "",
        time_slot: "",
        glucose_value: ""
    });

    const [editError, setEditError] = useState("");
    const [saving, setSaving] = useState(false);

    const [deleteReadingId, setDeleteReadingId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const token = localStorage.getItem("token");

    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    // Fetch readings
    const fetchReadings = async () => {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/readings`,
                config
            );

            setReadings(response.data.readings || []);

        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login", { replace: true });
            } else {
                setError(
                    err.response?.data?.message ||
                    "Unable to load readings."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReadings();
        // Fetch once when the page opens.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
    };

    // Filter and sort readings
    const filteredReadings = useMemo(() => {
        return [...readings]
            .filter((reading) => {
                const matchesDate =
                    !searchDate ||
                    reading.reading_date === searchDate;

                const matchesSlot =
                    selectedSlot === "All" ||
                    reading.time_slot === selectedSlot;

                return matchesDate && matchesSlot;
            })
            .sort((a, b) => {
                const dateComparison =
                    b.reading_date.localeCompare(a.reading_date);

                if (dateComparison !== 0) {
                    return dateComparison;
                }

                return (
                    TIME_SLOTS.indexOf(a.time_slot) -
                    TIME_SLOTS.indexOf(b.time_slot)
                );
            });
    }, [readings, searchDate, selectedSlot]);

    // Pagination
    const totalPages = Math.max(
        1,
        Math.ceil(filteredReadings.length / PAGE_SIZE)
    );

    const safePage = Math.min(currentPage, totalPages);

    const paginatedReadings = filteredReadings.slice(
        (safePage - 1) * PAGE_SIZE,
        safePage * PAGE_SIZE
    );

    const handleEditOpen = (reading) => {
        setEditingReading(reading);

        setEditData({
            reading_date: reading.reading_date,
            time_slot: reading.time_slot,
            glucose_value: String(reading.glucose_value)
        });

        setEditError("");
    };

    const handleEditChange = (event) => {
        const { name, value } = event.target;

        setEditData((previous) => ({
            ...previous,
            [name]: value
        }));

        setEditError("");
    };

    // Update reading
    const handleUpdate = async (event) => {
        event.preventDefault();

        setEditError("");

        if (!editData.glucose_value.trim()) {
            setEditError("Please enter a glucose value.");
            return;
        }

        const glucoseValue = Number(editData.glucose_value);

        if (
            !Number.isInteger(glucoseValue) ||
            glucoseValue < 40 ||
            glucoseValue > 600
        ) {
            setEditError(
                "Value must be between 40 and 600 mg/dl."
            );
            return;
        }

        if (editData.reading_date > getTodayDate()) {
            setEditError("Date cannot be in the future.");
            return;
        }

        try {
            setSaving(true);

            await axios.put(
                `${API_URL}/readings/${editingReading.id}`,
                {
                    reading_date: editData.reading_date,
                    time_slot: editData.time_slot,
                    glucose_value: glucoseValue
                },
                config
            );

            setEditingReading(null);
            await fetchReadings();

        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login", { replace: true });
                return;
            }

            setEditError(
                err.response?.data?.message ||
                "Unable to update reading."
            );
        } finally {
            setSaving(false);
        }
    };

    // Delete reading
    const handleDelete = async () => {
        try {
            setDeleting(true);

            await axios.delete(
                `${API_URL}/readings/${deleteReadingId}`,
                config
            );

            setDeleteReadingId(null);

            await fetchReadings();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to delete reading."
            );
        } finally {
            setDeleting(false);
        }
    };

    // Reset pagination when filters change
    const handleDateFilter = (event) => {
        setSearchDate(event.target.value);
        setCurrentPage(1);
    };

    const handleSlotFilter = (event) => {
        setSelectedSlot(event.target.value);
        setCurrentPage(1);
    };

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    return (
        <div className="history-layout">

            {/* SIDEBAR */}
            <aside className="history-sidebar">

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

                    <button className="nav-item active">
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

            {/* MAIN CONTENT */}
            <main className="history-main">

                <header className="history-header">

                    <div>
                        <p className="header-greeting">
                            Welcome, {user.name || "there"} 👋
                        </p>

                        <h1>Reading History</h1>

                        <p className="header-subtitle">
                            View and manage all your glucose readings.
                        </p>
                    </div>

                    <button
                        className="history-add-btn"
                        onClick={() => navigate("/readings/add")}
                    >
                        <Droplet size={17} />
                        Add Reading
                    </button>

                </header>

                {/* SUMMARY */}
                <section className="history-summary">

                    <div className="history-summary-icon">
                        <ClipboardList size={23} />
                    </div>

                    <div>
                        <p>Total Recorded Readings</p>
                        <h2>{readings.length}</h2>
                    </div>

                    <div className="history-summary-note">
                        Your complete glucose record
                    </div>

                </section>

                {/* TABLE CARD */}
                <section className="history-card">

                    <div className="history-card-heading">

                        <div>
                            <h2>All Readings</h2>
                            <p>
                                Search, filter and manage your records.
                            </p>
                        </div>

                    </div>

                    {/* FILTERS */}
                    <div className="history-filters">

                        <div className="history-filter-group">

                            <label htmlFor="history-date">
                                <CalendarDays size={15} />
                                Filter by date
                            </label>

                            <input
                                type="date"
                                id="history-date"
                                value={searchDate}
                                onChange={handleDateFilter}
                            />

                        </div>

                        <div className="history-filter-group">

                            <label htmlFor="history-slot">
                                <Filter size={15} />
                                Filter by time slot
                            </label>

                            <select
                                id="history-slot"
                                value={selectedSlot}
                                onChange={handleSlotFilter}
                            >
                                <option value="All">
                                    All time slots
                                </option>

                                {TIME_SLOTS.map((slot) => (
                                    <option key={slot} value={slot}>
                                        {slot}
                                    </option>
                                ))}

                            </select>

                        </div>

                        <button
                            className="clear-filters-btn"
                            onClick={() => {
                                setSearchDate("");
                                setSelectedSlot("All");
                                setCurrentPage(1);
                            }}
                        >
                            Clear filters
                        </button>

                    </div>

                    {error && (
                        <div className="history-error">
                            <AlertCircle size={17} />
                            {error}
                        </div>
                    )}

                    {/* LOADING */}
                    {loading ? (

                        <div className="history-loading">
                            Loading your readings...
                        </div>

                    ) : filteredReadings.length === 0 ? (

                        <div className="history-empty">

                            <Droplet size={38} />

                            <h3>No readings found</h3>

                            <p>
                                Try changing your filters or add a new reading.
                            </p>

                            <button
                                onClick={() => navigate("/readings/add")}
                            >
                                Add Reading
                            </button>

                        </div>

                    ) : (

                        <>
                            <div className="history-table-wrapper">

                                <table className="history-table">

                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Time Slot</th>
                                            <th>Glucose Value</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        {paginatedReadings.map((reading) => (

                                            <tr key={reading.id}>

                                                <td>
                                                    {reading.reading_date}
                                                </td>

                                                <td>
                                                    <span className="history-slot">
                                                        {reading.time_slot}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="history-glucose">
                                                        {reading.glucose_value} mg/dl
                                                    </span>
                                                </td>

                                                <td>

                                                    <div className="history-actions">

                                                        <button
                                                            className="edit-action"
                                                            title="Edit reading"
                                                            onClick={() =>
                                                                handleEditOpen(reading)
                                                            }
                                                        >
                                                            <Pencil size={16} />
                                                        </button>

                                                        <button
                                                            className="delete-action"
                                                            title="Delete reading"
                                                            onClick={() =>
                                                                setDeleteReadingId(reading.id)
                                                            }
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                            {/* PAGINATION */}
                            <div className="history-pagination">

                                <p>
                                    Showing{" "}
                                    {(safePage - 1) * PAGE_SIZE + 1}
                                    {" "}to{" "}
                                    {Math.min(
                                        safePage * PAGE_SIZE,
                                        filteredReadings.length
                                    )}
                                    {" "}of {filteredReadings.length} readings
                                </p>

                                <div className="pagination-buttons">

                                    <button
                                        disabled={safePage === 1}
                                        onClick={() =>
                                            setCurrentPage((page) => page - 1)
                                        }
                                    >
                                        <ChevronLeft size={17} />
                                    </button>

                                    <span>
                                        {safePage} / {totalPages}
                                    </span>

                                    <button
                                        disabled={safePage === totalPages}
                                        onClick={() =>
                                            setCurrentPage((page) => page + 1)
                                        }
                                    >
                                        <ChevronRight size={17} />
                                    </button>

                                </div>

                            </div>
                        </>

                    )}

                </section>

            </main>

            {/* EDIT MODAL */}
            {editingReading && (

                <div className="history-modal-overlay">

                    <section className="history-modal">

                        <div className="history-modal-heading">

                            <div>
                                <h2>Edit Reading</h2>
                                <p>Update your glucose record.</p>
                            </div>

                            <button
                                onClick={() => setEditingReading(null)}
                                aria-label="Close edit form"
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <form onSubmit={handleUpdate}>

                            <div className="history-modal-field">

                                <label htmlFor="edit-date">
                                    Reading Date
                                </label>

                                <input
                                    type="date"
                                    id="edit-date"
                                    name="reading_date"
                                    value={editData.reading_date}
                                    max={getTodayDate()}
                                    onChange={handleEditChange}
                                    required
                                />

                            </div>

                            <div className="history-modal-field">

                                <label htmlFor="edit-slot">
                                    Time Slot
                                </label>

                                <select
                                    id="edit-slot"
                                    name="time_slot"
                                    value={editData.time_slot}
                                    onChange={handleEditChange}
                                    required
                                >
                                    {TIME_SLOTS.map((slot) => (
                                        <option key={slot} value={slot}>
                                            {slot}
                                        </option>
                                    ))}
                                </select>

                            </div>

                            <div className="history-modal-field">

                                <label htmlFor="edit-value">
                                    Glucose Value (mg/dl)
                                </label>

                                <input
                                    type="number"
                                    id="edit-value"
                                    name="glucose_value"
                                    min="40"
                                    max="600"
                                    step="1"
                                    value={editData.glucose_value}
                                    onChange={handleEditChange}
                                    required
                                />

                            </div>

                            {editError && (
                                <div className="history-error">
                                    <AlertCircle size={17} />
                                    {editError}
                                </div>
                            )}

                            <div className="history-modal-actions">

                                <button
                                    type="button"
                                    className="modal-cancel-btn"
                                    onClick={() => setEditingReading(null)}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="modal-save-btn"
                                    disabled={saving}
                                >
                                    <Save size={16} />
                                    {saving ? "Updating..." : "Save Changes"}
                                </button>

                            </div>

                        </form>

                    </section>

                </div>

            )}

            {/* DELETE CONFIRMATION */}
            {deleteReadingId !== null && (

                <div className="history-modal-overlay">

                    <section className="history-modal delete-modal">

                        <div className="delete-modal-icon">
                            <Trash2 size={25} />
                        </div>

                        <h2>Delete Reading?</h2>

                        <p>
                            Are you sure you want to delete this glucose
                            reading? This action cannot be undone.
                        </p>

                        <div className="history-modal-actions">

                            <button
                                className="modal-cancel-btn"
                                onClick={() => setDeleteReadingId(null)}
                                disabled={deleting}
                            >
                                Cancel
                            </button>

                            <button
                                className="modal-delete-btn"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>

                        </div>

                    </section>

                </div>

            )}

        </div>
    );
}

export default ReadingHistory;
