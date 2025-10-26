// src/pages/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, UserCheck, Trash2, Shield, LogOut, Check, X } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Define the base URL for your backend API
const API_URL = "http://localhost:5000/api";

// --- Interfaces ---
interface PendingUser {
    _id: string;
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    createdAt: string;
}

interface Reporter {
    _id: string;
    name: string;
    email?: string;
}
interface Report {
    _id: string;
    contentType: 'question' | 'answer';
    contentId: string;
    reportedBy: Reporter;
    reason: string;
    status: 'pending' | 'reviewed_dismissed' | 'reviewed_action_taken';
    createdAt: string;
}


const AdminDashboard = () => {
    const navigate = useNavigate();
    // --- States ---
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [pendingReports, setPendingReports] = useState<Report[]>([]);
    const [isLoadingReports, setIsLoadingReports] = useState(true);
    const [reportsError, setReportsError] = useState<string | null>(null);

     // --- Client-Side Logout Handler ---
    const handleLogout = () => {
       localStorage.removeItem('mindlinkToken');
       localStorage.removeItem('mindlinkUser');
       toast.success("Successfully logged out!");
       navigate("/");
    };

    // --- Helper to format date ---
    const formatDate = (dateString: string): string => {
         try {
            const date = new Date(dateString);
            const now = new Date();
            const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
            const diffMinutes = Math.round(diffSeconds / 60);
            const diffHours = Math.round(diffMinutes / 60);
            const diffDays = Math.round(diffHours / 24);
            if (diffSeconds < 60) return `${diffSeconds}s ago`;
            if (diffMinutes < 60) return `${diffMinutes}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays <= 7) return `${diffDays}d ago`;
            return date.toLocaleDateString();
        } catch { return "Invalid date"; }
    };


    // --- Function to fetch pending users ---
    const fetchPendingUsers = async () => {
        setIsLoadingUsers(true);
        setUsersError(null);
        try {
            const token = localStorage.getItem('mindlinkToken');
            if (!token) throw new Error("Not authorized. Please log in.");

            const response = await fetch(`${API_URL}/users/pending`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch pending users');
            const data: PendingUser[] = await response.json();
            setPendingUsers(data);
        } catch (err: any) {
            setUsersError(err.message || "Failed to load pending users.");
        } finally {
            setIsLoadingUsers(false);
        }
    };

     // --- Function to fetch pending reports ---
    const fetchPendingReports = async () => {
        setIsLoadingReports(true);
        setReportsError(null);
        try {
            const token = localStorage.getItem('mindlinkToken');
            if (!token) throw new Error("Not authorized.");

            const response = await fetch(`${API_URL}/reports/pending`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch reports');
            const data: Report[] = await response.json();
            setPendingReports(data);
        } catch (err: any) {
            setReportsError(err.message || "Failed to load reports.");
        } finally {
            setIsLoadingReports(false);
        }
    };

    // --- Fetch data on component mount ---
    useEffect(() => {
        Promise.all([fetchPendingUsers(), fetchPendingReports()]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    // --- Handler to approve a user ---
    const handleApprove = async (userId: string, userName: string) => {
       try {
            const token = localStorage.getItem('mindlinkToken');
            if (!token) throw new Error("Not authorized.");
            const response = await fetch(`${API_URL}/users/${userId}/approve`, {
                 method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Approval failed');
            toast.success(data.message || `User ${userName} approved.`);
            fetchPendingUsers(); // Refresh user list
       } catch (err: any) {
            toast.error(err.message || `Failed to approve user ${userName}.`);
       }
    };

    // --- Handler to reject (delete) a user ---
     const handleReject = async (userId: string, userName: string) => {
        if (!window.confirm(`Are you sure you want to reject and remove user ${userName}?`)) return;
       try {
            const token = localStorage.getItem('mindlinkToken');
            if (!token) throw new Error("Not authorized.");
            const response = await fetch(`${API_URL}/users/${userId}`, {
                 method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Rejection failed');
            toast.success(data.message || `User ${userName} rejected and removed.`);
            fetchPendingUsers(); // Refresh user list
       } catch (err: any) {
            toast.error(err.message || `Failed to reject user ${userName}.`);
       }
    };

    // --- NEW: Function to delete reported content ---
     const handleDeleteContent = async (contentType: 'question' | 'answer', contentId: string, reportIdToUpdate?: string): Promise<boolean> => {
         if (!window.confirm(`Are you sure you want to permanently DELETE this ${contentType} (ID: ${contentId})? This cannot be undone.`)) {
             return false; // Indicate deletion was cancelled
         }
        try {
            const token = localStorage.getItem('mindlinkToken');
            if (!token) throw new Error("Not authorized.");
            // Determine the correct API endpoint
            const deleteUrl = contentType === 'question'
                ? `${API_URL}/questions/${contentId}`
                : `${API_URL}/questions/answers/${contentId}`; // Use the correct answer delete route
            const response = await fetch(deleteUrl, {
                 method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || `Failed to delete ${contentType}`);
            toast.success(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} deleted successfully.`);
            return true; // Indicate deletion was successful
        } catch (err: any) {
             console.error(`Failed to delete ${contentType} ${contentId}:`, err);
             toast.error(err.message || `Failed to delete ${contentType}.`);
             if(reportIdToUpdate) {
                 toast.warning(`Report ${reportIdToUpdate} marked for action, but content deletion failed. Please check manually.`);
             }
             return false; // Indicate deletion failed
        }
     };


    // --- Modified Handler to review/update a report ---
    const handleReviewReport = async (reportId: string, newStatus: 'reviewed_dismissed' | 'reviewed_action_taken') => {
         let deletionSuccessful = true; // Assume success unless deletion is attempted and fails
         try {
            const token = localStorage.getItem('mindlinkToken');
            if (!token) throw new Error("Not authorized.");

            // Find the report details *before* making the PATCH call
            const reviewedReport = pendingReports.find(r => r._id === reportId);
            if (!reviewedReport) {
                 toast.error("Could not find report details to proceed.");
                 return;
            }

            // If action_taken, attempt deletion *first* (more robust)
            if (newStatus === 'reviewed_action_taken') {
                deletionSuccessful = await handleDeleteContent(reviewedReport.contentType, reviewedReport.contentId, reportId);
                // If deletion was cancelled or failed, don't update the report status
                if (deletionSuccessful === false) return;
            }

            // Proceed to update report status if dismissed OR if action was taken successfully
            const response = await fetch(`${API_URL}/reports/${reportId}/review`, {
                 method: 'PATCH',
                 headers: {
                     'Authorization': `Bearer ${token}`,
                     'Content-Type': 'application/json',
                 },
                 body: JSON.stringify({ status: newStatus }) // adminNotes could be added here
            });
             const data = await response.json();
            if (!response.ok) throw new Error(data.message || `Failed to update report status`);

            toast.success(`Report status updated to ${newStatus.replace('reviewed_', '')}.`);
            fetchPendingReports(); // Refresh the list

            // If status update fails after successful deletion, admin might need to fix manually
             if (newStatus === 'reviewed_action_taken' && deletionSuccessful) {
                 // Deletion was successful, but report status update failed. Warn admin.
                 // This toast is handled by the inner catch now.
             }

       } catch (err: any) {
            console.error(`Failed to update report ${reportId}:`, err);
            toast.error(err.message || `Failed to update report.`);
       }
    };


    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                     <div>
                        <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-8 h-8 text-primary" />
                        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                        </div>
                        <p className="text-muted-foreground">Manage users, content, and platform security</p>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-6 md:grid-cols-4 mb-8">
                    <Card className="shadow-soft">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                            <UserCheck className="w-4 h-4 text-accent" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-3xl font-bold">{isLoadingUsers ? '...' : pendingUsers.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">New registrations</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-soft">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="w-4 h-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">...</div> {/* Placeholder */}
                            <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-soft">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Reported Content</CardTitle>
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{isLoadingReports ? '...' : pendingReports.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Needs review</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-soft">
                         <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Removed Content</CardTitle>
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">...</div> {/* Placeholder */}
                            <p className="text-xs text-muted-foreground mt-1">This month</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Pending Approvals Section */}
                <Card className="shadow-soft mb-8">
                     <CardHeader>
                        <CardTitle>Pending User Approvals</CardTitle>
                        <CardDescription>Review and approve new user registrations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {isLoadingUsers ? (
                            <>
                                <Skeleton className="h-16 w-full rounded-lg" />
                                <Skeleton className="h-16 w-full rounded-lg" />
                            </>
                       ) : usersError ? (
                           <div className="text-center text-destructive py-4"><p>⚠️ {usersError}</p></div>
                       ) : pendingUsers.length === 0 ? (
                           <div className="text-center text-muted-foreground py-4"><p>No pending approvals.</p></div>
                       ) : (
                           pendingUsers.map((user) => (
                                <div key={user._id} className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted rounded-lg">
                                    {/* User details */}
                                    <div className="flex-1 min-w-[200px]">
                                        <h3 className="font-semibold mb-1">{user.name}</h3>
                                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                                        <Badge variant="outline" className="capitalize">{user.role}</Badge>
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(user.createdAt)}</span>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="default" onClick={() => handleApprove(user._id, user.name)}> Approve </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleReject(user._id, user.name)}> Reject </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Reported Content Section */}
                <Card className="shadow-soft">
                    <CardHeader>
                        <CardTitle>Reported Content</CardTitle>
                        <CardDescription>Review and moderate reported questions and answers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {isLoadingReports ? (
                             <>
                                <Skeleton className="h-24 w-full rounded-lg" />
                                <Skeleton className="h-24 w-full rounded-lg" />
                             </>
                         ) : reportsError ? (
                            <div className="text-center text-destructive py-4"><p>⚠️ {reportsError}</p></div>
                         ) : pendingReports.length === 0 ? (
                            <div className="text-center text-muted-foreground py-4"><p>No pending reports.</p></div>
                         ) : (
                            pendingReports.map((report) => (
                                <div key={report._id} className="flex flex-wrap items-start justify-between gap-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                                    {/* Report Details */}
                                    <div className="flex-1 min-w-[250px]">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <Badge variant="destructive" className="capitalize flex-shrink-0">{report.contentType}</Badge>
                                            {/* Link needs adjustment for answers */}
                                            {report.contentType === 'question' ? (
                                                <Link
                                                    to={`/questions/${report.contentId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-medium hover:underline text-primary truncate"
                                                    title={`View Question (opens new tab)`}
                                                >
                                                    Content ID: {report.contentId}
                                                </Link>
                                            ) : (
                                                <span className="text-sm font-medium text-muted-foreground truncate" title="Answer ID">
                                                    Content ID: {report.contentId} (Answer)
                                                </span>
                                            )}
                                        </div>
                                         <p className="text-sm font-semibold mb-1">Reason:</p>
                                         <p className="text-sm bg-muted p-2 rounded border whitespace-pre-wrap mb-2 break-words">{report.reason}</p>
                                         <p className="text-xs text-muted-foreground">
                                            Reported by {report.reportedBy?.name || 'Unknown'} ({report.reportedBy?.email || 'N/A'}) • {formatDate(report.createdAt)}
                                        </p>
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 pt-1 items-start sm:items-center">
                                         <Button
                                             size="sm"
                                             variant="outline"
                                             onClick={() => handleReviewReport(report._id, 'reviewed_dismissed')}
                                             title="Mark as reviewed, dismiss report"
                                             className="bg-background hover:bg-accent"
                                         >
                                             <Check className="mr-1 h-4 w-4 text-green-600"/> Dismiss
                                        </Button>
                                         <Button
                                             size="sm"
                                             variant="destructive"
                                             onClick={() => handleReviewReport(report._id, 'reviewed_action_taken')}
                                             title="Mark as reviewed & remove content"
                                         >
                                             <Trash2 className="mr-1 h-4 w-4" /> Remove Content
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;