// src/pages/AskQuestion.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react'; // For back button
import { toast } from "sonner";

// Define the base URL for your backend API
const API_URL = "http://localhost:5000/api"; // Adjust port/host if needed

const AskQuestion = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState(''); // Optional body/description
    const [tags, setTags] = useState(''); // Simple comma-separated tags for now
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const token = localStorage.getItem('mindlinkToken');
        if (!token) {
            toast.error("You must be logged in to ask a question.");
            setIsLoading(false);
            navigate('/auth'); // Redirect to login
            return;
        }

        // Basic tag processing (split by comma, trim whitespace)
        const processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

        try {
            const response = await fetch(`${API_URL}/questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Include auth token
                },
                body: JSON.stringify({
                    title,
                    body,
                    tags: processedTags,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            toast.success("Question posted successfully!");
            // Navigate back to the student dashboard (or potentially a new question page)
            navigate('/dashboard/student'); // Adjust if needed

        } catch (error: any) {
            console.error("Failed to post question:", error);
            toast.error(error.message || "Failed to post question. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-lg"> {/* Increased max-width */}
                <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                         <CardTitle className="text-2xl font-bold">Ask a New Question</CardTitle>
                         <Button variant="ghost" size="sm" onClick={() => navigate(-1)}> {/* Back button */}
                             <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                         </Button>
                    </div>
                    <CardDescription>
                        Clearly formulate your question. Be specific and provide context if necessary.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6"> {/* Increased spacing */}
                        <div className="space-y-2">
                            <Label htmlFor="question-title" className="font-semibold">Question Title</Label>
                            <Input
                                id="question-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., How do I calculate derivatives in calculus?"
                                required
                                className="text-base" // Slightly larger text
                            />
                            <p className="text-xs text-muted-foreground">Keep it short and descriptive.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="question-body" className="font-semibold">Body (Optional)</Label>
                            <Textarea
                                id="question-body"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Add more details, code examples, or context here..."
                                rows={6} // Increased rows
                                className="text-sm"
                            />
                             <p className="text-xs text-muted-foreground">Explain your problem in detail.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="question-tags" className="font-semibold">Tags (Optional)</Label>
                            <Input
                                id="question-tags"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="e.g., calculus, math, derivatives"
                            />
                            <p className="text-xs text-muted-foreground">Separate tags with commas.</p>
                        </div>

                        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                            {isLoading ? "Posting..." : "Post Question"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AskQuestion;