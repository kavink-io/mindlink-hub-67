// src/pages/TakeQuiz.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

// Define the base URL for your backend API
const API_URL = "http://localhost:5000/api";

// --- Interfaces ---
interface QuizQuestion {
    _id: string;
    questionText: string;
    options: string[];
    correctAnswer: string; // Note: Student should NOT see this
}

interface Quiz {
    _id: string;
    title: string;
    questions: QuizQuestion[];
    createdBy: {
        _id: string;
        name: string;
    };
    createdAt: string;
}

// Interface for the quiz result
interface QuizResult {
    score: number;
    totalQuestions: number;
    percentage: number;
    quizTitle: string;
}

// Type for storing selected answers
type SelectedAnswers = Record<string, string>; // { questionId: "selectedOption" }

const TakeQuiz = () => {
    const { id: quizId } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});

    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<QuizResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Alert dialog state for confirming submission
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);


    // --- Fetch Quiz Details ---
    useEffect(() => {
        const fetchQuiz = async () => {
            if (!quizId) {
                setError("No quiz ID provided.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('mindlinkToken');
                if (!token) throw new Error("Not authorized. Please log in.");

                // *** THIS IS THE FIX for the 404 error ***
                // It now fetches from /api/quizzes/:id
                const response = await fetch(`${API_URL}/quizzes/${quizId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                const data: Quiz = await response.json();
                
                // CRITICAL: Remove correctAnswer before setting state
                // We don't want the correct answer available in the component's state
                const questionsWithoutAnswers = data.questions.map(q => ({
                    ...q,
                    correctAnswer: '' // Remove correct answer
                }));

                setQuiz({ ...data, questions: questionsWithoutAnswers });

            } catch (err: any) {
                setError(err.message || "Failed to load the quiz.");
                toast.error(err.message || "Failed to load the quiz.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuiz();
    }, [quizId]);


    // --- Answer Selection Handler ---
    const handleAnswerChange = (questionId: string, value: string) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: value,
        }));
    };

    // --- Navigation Handlers ---
    const handleNext = () => {
        if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    // --- Quiz Submission Handler ---
    const handleSubmit = async () => {
        setIsConfirmOpen(false); // Close the confirmation dialog
        if (!quiz) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('mindlinkToken');
            if (!token) throw new Error("Not authorized. Please log in.");

            // Format answers to match backend expectation
            const formattedAnswers = Object.entries(selectedAnswers).map(([questionId, selectedOption]) => ({
                questionId: questionId,
                selectedAnswer: selectedOption,
            }));

            const response = await fetch(`${API_URL}/quizzes/${quizId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ answers: formattedAnswers })
            });

             if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const resultData: QuizResult = await response.json();
            setResult(resultData);
            setShowResult(true);
            toast.success("Quiz submitted successfully!");

        } catch (err: any) {
             setError(err.message || "Failed to submit the quiz.");
             toast.error(err.message || "Failed to submit the quiz.");
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- Render Logic ---

    // Loading State
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Card className="w-[90%] max-w-2xl shadow-lg">
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-6 w-full mb-4" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-24" />
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-[90%] max-w-lg shadow-lg border-destructive">
                    <CardHeader className="items-center">
                         <AlertCircle className="w-12 h-12 text-destructive" />
                        <CardTitle className="text-destructive">Error Loading Quiz</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground mb-6">{error}</p>
                         <Button asChild variant="outline">
                            <Link to="/quizzes">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Quiz List
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Quiz Finished - Show Result State
    if (showResult && result) {
         return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-[90%] max-w-lg shadow-lg border-primary">
                    <CardHeader className="items-center">
                         <CheckCircle className="w-12 h-12 text-primary" />
                        <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
                        <CardDescription>{result.quizTitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-5xl font-bold">{result.percentage}%</p>
                        <p className="text-xl text-muted-foreground">
                            You scored <strong>{result.score}</strong> out of <strong>{result.totalQuestions}</strong>
                        </p>
                         <Progress value={result.percentage} className="w-full" />
                    </CardContent>
                    <CardFooter className="flex justify-center">
                         <Button asChild>
                            <Link to="/quizzes">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Quiz List
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Quiz In Progress State
    if (!quiz || !quiz.questions.length) {
         return (
             <div className="flex items-center justify-center min-h-screen bg-background">
                <p>Quiz data is missing or this quiz has no questions.</p>
            </div>
         );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isAnswerSelected = !!selectedAnswers[currentQuestion._id];
    const progressPercentage = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;


    return (
        <>
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-[90%] max-w-2xl shadow-lg">
                    <CardHeader>
                        <CardTitle className="truncate">{quiz.title}</CardTitle>
                        <CardDescription>
                            Question {currentQuestionIndex + 1} of {quiz.questions.length}
                        </CardDescription>
                         <Progress value={progressPercentage} className="w-full mt-2" />
                    </CardHeader>

                    {/* *** THIS IS THE FIX for the "select all" bug *** */}
                    {/* It uses RadioGroup for single selection */}
                    <CardContent>
  <h3 className="text-xl font-semibold mb-4">
    {currentQuestion.questionText}
  </h3>

  <RadioGroup
    value={selectedAnswers[currentQuestion._id] || ""}
    onValueChange={(value) =>
      handleAnswerChange(currentQuestion._id, value)
    }
    className="space-y-2"
  >
    {currentQuestion.options.map((option, index) => (
      <div
        key={index}
        className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors"
      >
        <RadioGroupItem
          value={option}
          id={`${currentQuestion._id}-${index}`}
        />
        <Label
          htmlFor={`${currentQuestion._id}-${index}`}
          className="flex-1 cursor-pointer"
        >
          {option}
        </Label>
      </div>
    ))}
  </RadioGroup>
</CardContent>

                    <CardFooter className="flex justify-between">
                        <Button 
                            variant="outline"
                            onClick={handleBack}
                            disabled={currentQuestionIndex === 0 || isSubmitting}
                        >
                            Back
                        </Button>

                        {isLastQuestion ? (
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => setIsConfirmOpen(true)} // Open confirmation dialog
                                disabled={!isAnswerSelected || isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Quiz"}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                disabled={!isAnswerSelected || isSubmitting}
                            >
                                Next
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>

            {/* Confirmation Dialog */}
             <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You cannot change your answers after submitting.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default TakeQuiz;