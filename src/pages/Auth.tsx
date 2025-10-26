// src/pages/Auth.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, GraduationCap, Shield, LogOut } from "lucide-react"; // Added LogOut for context, though button usually isn't here
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
// REMOVED: import { supabase } from "@/integrations/supabase/client";

// Define the base URL for your backend API
const API_URL = "http://localhost:5000/api"; // Adjust port/host if needed

type UserRole = "student" | "teacher" | "admin";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student"); // Used for Login role selection

  // State for login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // State for signup form
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState<UserRole>("student"); // Used for Signup role selection


  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: loginEmail,
            password: loginPassword,
            role: selectedRole // Send selected role for potential server-side check
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use message from backend if available, otherwise generic error
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // **IMPORTANT: Store the token securely (e.g., localStorage or sessionStorage)**
      localStorage.setItem('mindlinkToken', data.token);
      localStorage.setItem('mindlinkUser', JSON.stringify({ // Store basic user info
          id: data._id,
          name: data.name,
          email: data.email,
          role: data.role
      }));


      toast.success("Login successful!");
       // Redirect based on the role received from the backend
      navigate(`/dashboard/${data.role}`);

    } catch (error: any) {
      console.error("Login failed:", error);
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: signupName,
                email: signupEmail,
                password: signupPassword,
                role: signupRole,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
             throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        toast.success(data.message || "Signup successful! Account may require approval.");
         // Maybe reset form or redirect to login/confirmation page
         // Consider switching the tab to 'login' automatically

    } catch (error: any) {
         console.error("Signup failed:", error);
         toast.error(error.message || "Signup failed. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

   // --- Client-Side Logout Handler (Typically placed in dashboard components) ---
   const handleLogout = () => {
       localStorage.removeItem('mindlinkToken'); // Remove token
       localStorage.removeItem('mindlinkUser'); // Remove user info
       toast.success("Successfully logged out!");
       navigate("/"); // Redirect to home page
       // Optionally: Call a backend logout endpoint if needed
       // fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: { /* include auth token if needed */ } });
   };


  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "student":
        return <BookOpen className="w-5 h-5" />;
      case "teacher":
        return <GraduationCap className="w-5 h-5" />;
      case "admin":
        return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-hover animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Welcome to MindLink
          </CardTitle>
          <CardDescription>
            Learn, Connect, and Grow Together
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your.email@school.com"
                    required
                    value={loginEmail} // Bind state
                    onChange={(e) => setLoginEmail(e.target.value)} // Update state
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={loginPassword} // Bind state
                    onChange={(e) => setLoginPassword(e.target.value)} // Update state
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-role">I am a...</Label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                    <SelectTrigger id="login-role">
                      <SelectValue placeholder="Select your role" /> {/* Add placeholder */}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">
                        <div className="flex items-center gap-2">
                          {getRoleIcon("student")}
                          <span>Student</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="teacher">
                        <div className="flex items-center gap-2">
                          {getRoleIcon("teacher")}
                          <span>Teacher</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          {getRoleIcon("admin")}
                          <span>Admin</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={signupName} // Bind state
                    onChange={(e) => setSignupName(e.target.value)} // Update state
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@school.com"
                    required
                    value={signupEmail} // Bind state
                    onChange={(e) => setSignupEmail(e.target.value)} // Update state
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={signupPassword} // Bind state
                    onChange={(e) => setSignupPassword(e.target.value)} // Update state
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">I want to join as...</Label>
                  <Select value={signupRole} onValueChange={(value) => setSignupRole(value as UserRole)}> {/* Use signupRole state */}
                    <SelectTrigger id="signup-role">
                       <SelectValue placeholder="Select your role" /> {/* Add placeholder */}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">
                        <div className="flex items-center gap-2">
                          {getRoleIcon("student")}
                          <span>Student</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="teacher">
                        <div className="flex items-center gap-2">
                          {getRoleIcon("teacher")}
                          <span>Teacher</span>
                        </div>
                      </SelectItem>
                      {/* Consider hiding Admin signup for general users */}
                      {/* <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          {getRoleIcon("admin")}
                          <span>Admin</span>
                        </div>
                      </SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  ℹ️ New accounts may require admin approval before you can access the platform.
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;