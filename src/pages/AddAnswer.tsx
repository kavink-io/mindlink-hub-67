// src/pages/AddAnswer.tsx
import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send } from 'lucide-react'; // For back button and send icon
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Define the base URL for your backend API
const API_URL = "http://localhost:5000/api"; // Adjust port/host if needed

// Interfaces (Consider moving to a shared types file)
interface Author {
    _id: string;
    name: string;
}
interface Question {
    _id: string;
    title: string;
    body?: string;
    author: Author;
    createdAt: string;
}

const AddAnswer = () => {
    const { id: questionId } = useParams<{ id: string }>(); // Get question ID from URL
    const navigate = useNavigate();
    const [question, setQuestion] = useState<Question | null>(null);
    const [answerBody, setAnswerBody] = useState('');
    const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const token = localStorage.getItem('mindlinkToken');
    const isLoggedIn = !!token;

    // --- Fetch Question Details ---
    useEffect(() => {
        const fetchQuestion = async () => {
            if (!questionId) {
                setError("Question ID not found in URL.");
                setIsLoadingQuestion(false);
                return;
            }
            if (!isLoggedIn) {
                toast.error("Please log in to answer a question.");
                navigate('/auth');
                return;
            }

            setIsLoadingQuestion(true);
            setError(null);
            try {
                // No token needed to fetch question details based on questionRoutes.js
                const response = await fetch(`${API_URL}/questions/${questionId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                const data: Question = await response.json();
                setQuestion(data);
            } catch (err: any) {
                console.error("Failed to fetch question:", err);
                setError(err.message || "Failed to load question details.");
                toast.error(err.message || "Failed to load question details.");
            } finally {
                setIsLoadingQuestion(false);
            }
        };
        fetchQuestion();
    }, [questionId, navigate, isLoggedIn]);

    // --- Handle Posting Answer ---
    const handlePostAnswer = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!answerBody.trim()) {
            toast.warning("Answer cannot be empty.");
            return;
        }
        if (!token) { // Double-check token just before submitting
            toast.error("You must be logged in to post an answer.");
            navigate('/auth');
            return;
        }
        if (!questionId) {
            toast.error("Cannot post answer: Question ID is missing.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/questions/${questionId}/answers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Include auth token
                },
                body: JSON.stringify({ body: answerBody }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            toast.success("Answer posted successfully!");
            // Navigate back to the question detail page after posting
            navigate(`/questions/${questionId}`);

        } catch (error: any) {
            console.error("Failed to post answer:", error);
            toast.error(error.message || "Failed to post answer. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Helper Functions ---
     const formatDate = (dateString: string): string => {
         try {
            return new Date(dateString).toLocaleDateString();
        } catch {
             return "Invalid date";
        }
    };


    // --- Render Loading/Error States ---
    if (isLoadingQuestion) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl shadow-lg">
                    <CardHeader>
                        <Skeleton className="h-8 w-1/4 mb-4" />
                        <Skeleton className="h-10 w-3/4 mb-2" />
                        <Skeleton className="h-5 w-1/2 mb-6" />
                    </CardHeader>
                     <CardContent>
                        <Skeleton className="h-40 w-full" /> {/* Placeholder for form */}
                    </CardContent>
                </Card>
             </div>
        );
    }

    if (error) {
         return (
             <div className="min-h-screen bg-background flex items-center justify-center p-4 text-center">
                 <Card className="w-full max-w-lg p-6">
                    <p className="text-destructive mb-4">⚠️ Error: {error}</p>
                    <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
                </Card>
             </div>
            );
    }

    if (!question) {
        return (
             <div className="min-h-screen bg-background flex items-center justify-center p-4 text-center">
                 <Card className="w-full max-w-lg p-6">
                    <p className="text-muted-foreground mb-4">Question not found.</p>
                    <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
                 </Card>
            </div>
        );
    }


    // --- Render Main Content ---
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                         <CardTitle className="text-2xl font-bold">Provide an Answer</CardTitle>
                         {/* Navigate back to the specific question detail page */}
                         <Button variant="ghost" size="sm" onClick={() => navigate(`/questions/${questionId}`)} disabled={isSubmitting}>
                             <ArrowLeft className="mr-2 h-4 w-4" /> Back to Question
                         </Button>
                    </div>
                    {/* Display the question being answered */}
                     <Card className="bg-muted p-4 mt-4">
                        <p className="text-sm font-semibold text-muted-foreground">Replying to:</p>
                        <p className="font-medium mt-1">{question.title}</p>
                        {question.body && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{question.body}</p>}
                        <p className="text-xs text-muted-foreground mt-2">Asked by {question.author.name} on {formatDate(question.createdAt)}</p>
                    </Card>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePostAnswer} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="answer-body" className="font-semibold">Your Answer</Label>
                            <Textarea
                                id="answer-body"
                                value={answerBody}
                                onChange={(e) => setAnswerBody(e.target.value)}
                                placeholder="Share your knowledge, explanation, or solution here..."
                                rows={8} // Increased rows for more space
                                required
                                disabled={isSubmitting}
                                className="text-sm"
                            />
                             <p className="text-xs text-muted-foreground">Be clear and provide details if possible.</p>
                        </div>

                        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || !answerBody.trim()}>
                             {isSubmitting ? "Posting..." : <> <Send className="mr-2 h-4 w-4" /> Post Your Answer </>}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AddAnswer;