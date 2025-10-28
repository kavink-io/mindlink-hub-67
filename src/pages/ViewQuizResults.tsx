// src/pages/ViewQuizResults.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';

const API_URL = "http://localhost:5000/api";

// --- Interfaces ---
interface Student {
    _id: string;
    name: string;
}
interface QuizResult {
    _id: string;
    student: Student;
    score: number;
    totalQuestions: number;
    submittedAt: string;
}
interface QuizWithResults {
    _id: string;
    title: string;
    createdAt: string;
    participantCount: number;
    results: QuizResult[];
}

const ViewQuizResults = () => {
    const [quizzes, setQuizzes] = useState<QuizWithResults[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuizResults = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('mindlinkToken');
                if (!token) throw new Error("Not authorized. Please log in.");

                const response = await fetch(`${API_URL}/quizzes/my-quizzes-with-results`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                
                const data: QuizWithResults[] = await response.json();
                setQuizzes(data);

            } catch (err: any) {
                setError(err.message || "Failed to load quiz results.");
                toast.error(err.message || "Failed to load quiz results.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuizResults();
    }, []);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                
                <Button variant="outline" size="sm" asChild className="mb-4">
                    <Link to="/teacher-dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>

                <Card className="shadow-soft">
                    <CardHeader>
                        <CardTitle>Quiz Results</CardTitle>
                        <CardDescription>
                            View student participation and scores for the quizzes you've created.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-14 w-full" />
                                <Skeleton className="h-14 w-full" />
                                <Skeleton className="h-14 w-full" />
                            </div>
                        ) : error ? (
                            <div className="text-center text-destructive py-4"><p>⚠️ {error}</p></div>
                        ) : quizzes.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <p className="mb-2">You haven't created any quizzes yet.</p>
                                <Button asChild>
                                    <Link to="/quiz/create">Create your first quiz</Link>
                                </Button>
                            </div>
                        ) : (
                            <Accordion type="single" collapsible className="w-full">
                                {quizzes.map((quiz) => (
                                    <AccordionItem value={quiz._id} key={quiz._id}>
                                        <AccordionTrigger className="text-left">
                                            <div className="flex-1">
                                                <p className="font-semibold text-lg">{quiz.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Created: {formatDate(quiz.createdAt)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground ml-4 pr-2">
                                                <Users className="h-4 w-4" />
                                                <span className="font-medium">{quiz.participantCount}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            {quiz.results.length === 0 ? (
                                                <p className="text-muted-foreground text-center py-4">
                                                    No students have taken this quiz yet.
                                                </p>
                                            ) : (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Student Name</TableHead>
                                                            <TableHead className="text-right">Score</TableHead>
                                                            <TableHead className="text-right">Submitted</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {quiz.results.map((result) => (
                                                            <TableRow key={result._id}>
                                                                <TableCell className="font-medium">
                                                                    {result.student?.name || "Unknown Student"}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {result.score} / {result.totalQuestions}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {formatDate(result.submittedAt)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ViewQuizResults;