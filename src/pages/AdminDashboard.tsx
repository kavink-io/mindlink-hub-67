import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, UserCheck, Trash2, Shield } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Manage users, content, and platform security</p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <UserCheck className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12</div>
              <p className="text-xs text-muted-foreground mt-1">New registrations</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">347</div>
              <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reported Content</CardTitle>
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">5</div>
              <p className="text-xs text-muted-foreground mt-1">Needs review</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Removed Content</CardTitle>
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">23</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals */}
        <Card className="shadow-soft mb-8">
          <CardHeader>
            <CardTitle>Pending User Approvals</CardTitle>
            <CardDescription>Review and approve new user registrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Sarah Johnson", email: "sarah.j@school.com", role: "Student", date: "2 hours ago" },
              { name: "Michael Chen", email: "m.chen@school.com", role: "Teacher", date: "5 hours ago" },
              { name: "Emily Davis", email: "emily.d@school.com", role: "Student", date: "1 day ago" },
            ].map((user, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{user.role}</Badge>
                  <span className="text-sm text-muted-foreground">{user.date}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default">Approve</Button>
                    <Button size="sm" variant="outline">Reject</Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Reported Content */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Reported Content</CardTitle>
            <CardDescription>Review and moderate reported questions and answers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { content: "Inappropriate language in answer", reporter: "🌸 Gentle Butterfly", reason: "Contains offensive words", type: "Answer" },
              { content: "Off-topic question about gaming", reporter: "🌟 Starry Fox", reason: "Not related to academics", type: "Question" },
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="destructive">{report.type}</Badge>
                    <h3 className="font-semibold">{report.content}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Reported by {report.reporter}</p>
                  <p className="text-sm"><span className="font-medium">Reason:</span> {report.reason}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive">Remove</Button>
                  <Button size="sm" variant="outline">Dismiss</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
