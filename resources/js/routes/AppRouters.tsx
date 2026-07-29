import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import PlayerFlowPage from "../Pages/GameFlowPlayer/GameFlowPage";
import AdminFlowPage from "../Pages/GameFlowAdmin/GameFlowPage";
import AdminMonitorPage from "../Pages/GameFlowAdmin/AdminMonitorPage";

import AppLayout from "@/Layouts/AppLayout";

export default function AppRouter() {
    return (
        <BrowserRouter>
         <AppLayout>
            <Routes>
                <Route path="/" element={<Navigate to="/player/lobby" replace />} />

                <Route
                    path="/player"
                    element={<Navigate to="/player/lobby" replace />}
                />

                <Route
                    path="/admin"
                    element={<Navigate to="/admin/lobby" replace />}
                />

                <Route path="/player/:stepId" element={<PlayerFlowPage />} />
                <Route path="/admin/:stepId" element={<AdminFlowPage />} />
                <Route path="/monitor" element={<AdminMonitorPage />} />
            </Routes>
            </AppLayout>
        </BrowserRouter>
    );
}