import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import PlayerFlowPage from "../Pages/GameFlowPlayer/GameFlowPage";
import AdminFlowPage from "../Pages/GameFlowAdmin/GameFlowPage";

import AppLayout from "@/Layouts/AppLayout";

export default function AppRouter() {
    return (
        <BrowserRouter>
         <AppLayout>
            <Routes>
                <Route path="/" element={<Navigate to="/player/join-room" replace />} />

                <Route
                    path="/player"
                    element={<Navigate to="/player/join-room" replace />}
                />

                <Route
                    path="/admin"
                    element={<Navigate to="/admin/waiting-room" replace />}
                />

                <Route path="/player/:stepId" element={<PlayerFlowPage />} />
                <Route path="/admin/:stepId" element={<AdminFlowPage />} />
            </Routes>
            </AppLayout>
        </BrowserRouter>
    );
}