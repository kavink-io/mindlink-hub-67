// src/pages/QuizList.tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BrainCircuit, Trash2 } from 'lucide-react'; // Added Trash2 icon
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton"; // For loading

// Define the base URL for your backend API
const API_URL = "http://localhost:5000/api"; // Adjust port/host if needed

// Interface for Quiz metadata from backend
interface Author {
    _id: string;
    name: string;
}
interface QuizMetadata {
    _id: string;
    title: string;
    description?: string;
    createdBy: Author; // Populated field
    createdAt: string; // Or Date
    // Add question count later if backend provides it
    questionCount?: number;
}


const QuizList = () => {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<QuizMetadata[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Determine if current user is a teacher/admin for delete button ---
    const userRole = JSON.parse(localStorage.getItem('mindlinkUser') || '{}')?.role;
    const canDelete = userRole === 'teacher' || userRole === 'admin';


    // --- Fetch Quizzes Function (to be called on mount and refresh) ---
    const fetchQuizzes = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('mindlinkToken');
            if (!token) throw new Error("Not authorized. Please log in.");

            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Assumes quiz list is protected
            };

            const response = await fetch(`${API_URL}/quizzes`, { headers });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data: QuizMetadata[] = await response.json();
            setQuizzes(data);

        } catch (err: any) {
            console.error("Failed to fetch quizzes:", err);
            setError(err.message || "Failed to load quizzes.");
            toast.error(err.message || "Failed to load quizzes.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Handle Quiz Deletion ---
     const handleDeleteQuiz = async (quizId: string, quizTitle: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete the quiz: "${quizTitle}"? All questions and student results will be lost.`)) {
            return;
        }

        try {
             const token = localStorage.getItem('mindlinkToken');
             if (!token) throw new Error("Not authorized.");

            const response = await fetch(`${API_URL}/quizzes/${quizId}`, {
                 method: 'DELETE',
                 headers: {
                     'Authorization': `Bearer ${token}`,
                 },
            });

             if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
             }

            toast.success(`Quiz "${quizTitle}" deleted successfully.`);
            fetchQuizzes(); // Refresh the quiz list

        } catch (err: any) {
            console.error(`Failed to delete quiz ${quizId}:`, err);
            toast.error(err.message || `Failed to delete quiz "${quizTitle}".`);
        }
     };


    useEffect(() => {
        fetchQuizzes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


     const formatDate = (dateString: string): string => {
         try {
            return new Date(dateString).toLocaleDateString();
        } catch {
             return "Invalid date";
        }
    };


    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="container mx-auto max-w-3xl">
                 <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
                     <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                 </Button>

                 <div className="mb-6 text-center">
                    <h1 className="text-3xl font-bold mb-2">Available Quizzes</h1>
                    <p className="text-muted-foreground">Test your knowledge!</p>
                 </div>

                <div className="space-y-4">
                     {isLoading ? (
                        // Show skeleton loaders while fetching
                        <>
                            <Skeleton className="h-28 w-full rounded-lg" />
                            <Skeleton className="h-28 w-full rounded-lg" />
                            <Skeleton className="h-28 w-full rounded-lg" />
                        </>
                    ) : error ? (
                        // Show error message if fetching failed
                        <Card className="bg-destructive/10 border-destructive/30">
                            <CardContent className="pt-6">
                                <p className="text-center text-destructive">⚠️ Error: {error}</p>
                            </CardContent>
                        </Card>
                    ) : quizzes.length === 0 ? (
                        // Show message if no quizzes are found
                        <Card>
                             <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">No quizzes available at the moment.</p>
                             </CardContent>
                        </Card>
                    ) : (
                        // Map over fetched quizzes
                        quizzes.map((quiz) => (
                             <Card key={quiz._id} className="shadow-sm hover:shadow-md transition-shadow relative group">
                                <CardHeader>
                                     <CardTitle className="text-xl">{quiz.title}</CardTitle>
                                     <CardDescription>
                                        Created by {quiz.createdBy?.name || 'Unknown'} on {formatDate(quiz.createdAt)}
                                    </CardDescription>
                                     {quiz.description && (
                                        <p className="text-sm text-muted-foreground pt-1">{quiz.description}</p>
                                     )}
                                </CardHeader>
                                <CardContent className="flex justify-between items-center">
                                     <p className="text-sm text-muted-foreground">
                                         {/* Optional: Add question count later */}
                                         {quiz.questionCount ? `${quiz.questionCount} Questions` : ''}
                                     </p>

                                     <div className="flex gap-3 items-center">
                                         {/* Delete Button (visible to Teacher/Admin) */}
                                         {canDelete && (
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                  onClick={() => handleDeleteQuiz(quiz._id, quiz.title)}
                                                  title="Delete Quiz"
                                              >
                                                  <Trash2 className="h-4 w-4" />
                                                  <span className="sr-only">Delete Quiz</span>
                                              </Button>
                                         )}

                                         {/* Start Quiz Button (visible to all logged in users) */}
                                         <Button asChild>
                                            <Link to={`/quiz/${quiz._id}`}>
                                                <BrainCircuit className="mr-2 h-4 w-4" /> Start Quiz
                                            </Link>
                                        </Button>
                                    </div>

                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizList;