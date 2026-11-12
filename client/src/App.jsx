
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import AddReading from "./pages/AddReading";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ReadingHistory from "./pages/ReadingHistory";
import Register from "./pages/Register";
import Reports from "./pages/Reports";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                <Route
                    path="/readings/add"
                    element={<AddReading />}
                />

                <Route
                    path="/readings"
                    element={<ReadingHistory />}
                />

                <Route
                    path="/reports"
                    element={<Reports />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;
