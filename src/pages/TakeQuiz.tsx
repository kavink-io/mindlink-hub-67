// src/pages/TakeQuiz.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator"; // Added Separator for results page
import { ArrowLeft, CheckCircle, XCircle, RefreshCw } from 'lucide-react'; // Added RefreshCw
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton"; // For loading
import { Progress } from "@/components/ui/progress"; // For quiz progress
import { cn } from "@/lib/utils"; // Import cn utility

// Define the base URL for your backend API
const API_URL = "http://localhost:5000/api"; // Adjust port/host if needed

// --- Interfaces ---
interface Author { _id: string; name: string; }
interface QuizOption { _id: string; text: string; }
interface QuizQuestionData { _id: string; questionText: string; options: QuizOption[]; }
interface QuizMetadata { _id: string; title: string; description?: string; }
type UserAnswers = Record<string, string>; // { questionId: selectedOptionId }
// Interface for Quiz Results from backend
interface QuizResults {
    quizId: string;
    userId: string;
    score: number;
    totalQuestions: number;
    submittedAnswers: UserAnswers;
    correctAnswers: Record<string, string>; // { questionId: correctOptionId }
    resultId: string;
}

const TakeQuiz = () => {
    const { id: quizId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [quizMetadata, setQuizMetadata] = useState<QuizMetadata | null>(null);
    const [questions, setQuestions] = useState<QuizQuestionData[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
    const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>(undefined);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // State for showing results
    const [results, setResults] = useState<QuizResults | null>(null);

    const token = localStorage.getItem('mindlinkToken');
    const isLoggedIn = !!token;

    // --- Fetch Quiz Metadata and Questions ---
    useEffect(() => {
        const fetchQuizData = async () => {
             if (!quizId) { setError("Quiz ID not found."); setIsLoading(false); return; }
             setIsLoading(true); setError(null);
             if (!token) { toast.error("Log in required."); navigate('/auth'); return; }
             const headers: HeadersInit = { 'Authorization': `Bearer ${token}` };

            try {
                const [metaResponse, questionsResponse] = await Promise.all([
                    fetch(`${API_URL}/quizzes/${quizId}`, { headers }),
                    fetch(`${API_URL}/quizzes/${quizId}/questions`, { headers }) // Fetches questions *without* correct answers
                ]);
                if (!metaResponse.ok) throw new Error((await metaResponse.json()).message || 'Failed to load quiz details');
                if (!questionsResponse.ok) throw new Error((await questionsResponse.json()).message || 'Failed to load quiz questions');
                const metaData: QuizMetadata = await metaResponse.json();
                const questionsData: QuizQuestionData[] = await questionsResponse.json();
                if (questionsData.length === 0) throw new Error("Quiz has no questions.");

                setQuizMetadata(metaData);
                setQuestions(questionsData);
                setUserAnswers({}); setSelectedOptionId(undefined); setCurrentQuestionIndex(0); setResults(null); // Reset state
            } catch (err: any) {
                console.error("Failed to fetch quiz data:", err);
                setError(err.message || "Failed to load quiz.");
                toast.error(err.message || "Failed to load quiz.");
            } finally { setIsLoading(false); }
        };
        fetchQuizData();
    }, [quizId, navigate, token]); // Added token dependency

    // --- Navigation Handlers ---
    const handleNextQuestion = () => {
        saveCurrentAnswer();
        if (currentQuestionIndex < questions.length - 1) {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            setSelectedOptionId(userAnswers[questions[nextIndex]?._id]); // Add null check
        } else {
             handleSubmitQuiz();
        }
    };
    const handlePreviousQuestion = () => {
        saveCurrentAnswer();
        if (currentQuestionIndex > 0) {
             const prevIndex = currentQuestionIndex - 1;
            setCurrentQuestionIndex(prevIndex);
            setSelectedOptionId(userAnswers[questions[prevIndex]?._id]); // Add null check
        }
    };

    // --- Answer Handling ---
     const handleOptionChange = (optionId: string) => { setSelectedOptionId(optionId); };
     const saveCurrentAnswer = () => {
         if (selectedOptionId && questions.length > currentQuestionIndex) { // Check index bounds
             const currentQuestionId = questions[currentQuestionIndex]._id;
             setUserAnswers(prev => ({ ...prev, [currentQuestionId]: selectedOptionId }));
         }
     };

    // --- Submit Quiz ---
     const handleSubmitQuiz = async () => {
         saveCurrentAnswer(); // Save the very last answer
         const finalAnswers = { ...userAnswers }; // Use the state *after* saving last answer
          // Ensure the currently selected option for the last question is included
         if (selectedOptionId && questions.length > currentQuestionIndex && currentQuestionIndex === questions.length - 1) {
            finalAnswers[questions[currentQuestionIndex]._id] = selectedOptionId;
         }

         const answeredCount = Object.keys(finalAnswers).length;
         if (answeredCount < questions.length) {
             if (!window.confirm(`You haven't answered all questions (${answeredCount}/${questions.length}). Submit anyway?`)) {
                 return;
             }
         }

        setIsSubmitting(true);
         if (!token) {
             toast.error("Authentication error. Please log in again.");
             setIsSubmitting(false);
             navigate('/auth');
             return;
         }

        try {
            const response = await fetch(`${API_URL}/quizzes/${quizId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ answers: finalAnswers }), // Send the final answers
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to submit quiz');
            }
            const resultData: QuizResults = await response.json(); // Expect QuizResults structure

            toast.success(`Quiz submitted! Your score: ${resultData.score} / ${resultData.totalQuestions}`);
            setResults(resultData); // Set results state to display feedback

        } catch (error: any) {
             console.error("Failed to submit quiz:", error);
            toast.error(error.message || "Failed to submit quiz.");
        } finally {
            setIsSubmitting(false);
        }
     };

     // --- Restart Quiz ---
     const restartQuiz = () => {
         setCurrentQuestionIndex(0);
         setUserAnswers({});
         setSelectedOptionId(undefined);
         setResults(null); // Clear results
         // Optional: refetch questions if they could have changed? Unlikely for a static quiz.
     };


    // --- Render Loading/Error States ---
    if (isLoading) {
       return (
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                 <Skeleton className="h-8 w-1/4 mb-4" /> {/* Back button placeholder */}
                 <Skeleton className="h-10 w-3/4 mb-2" /> {/* Title */}
                 <Skeleton className="h-5 w-1/2 mb-6" /> {/* Description */}
                 <Skeleton className="h-6 w-1/3 mb-8" /> {/* Progress */}
                 <Skeleton className="h-48 w-full mb-6" /> {/* Question + Options area */}
                 <Skeleton className="h-12 w-full" /> {/* Buttons */}
            </div>
        );
    }

    if (error) {
         return (
             <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
                <p className="text-destructive">⚠️ Error: {error}</p>
                 <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
                     Go Back
                 </Button>
             </div>
            );
    }

    if (!quizMetadata || questions.length === 0) {
        return (
             <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
                 <p className="text-muted-foreground">Quiz data could not be loaded or is empty.</p>
                  <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
                     Go Back
                 </Button>
            </div>
        );
    }

    // --- Current Question Data ---
    const currentQuestion = questions[currentQuestionIndex];
    const quizProgress = ((currentQuestionIndex + 1) / questions.length) * 100;


    // --- *** RENDER RESULTS *** ---
    if (results) {
        const scorePercentage = ((results.score / results.totalQuestions) * 100).toFixed(0);
        return (
            <div className="min-h-screen bg-background py-8 px-4">
                <div className="container mx-auto max-w-2xl">
                    <Card className="shadow-lg">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold">Quiz Results: {quizMetadata?.title}</CardTitle>
                            <CardDescription>
                                You scored {results.score} out of {results.totalQuestions} ({scorePercentage}%)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <h3 className="text-lg font-semibold mb-4">Review Your Answers:</h3>
                            {questions.map((q, index) => {
                                const userAnswerId = results.submittedAnswers[q._id];
                                const correctAnswerId = results.correctAnswers[q._id];
                                const isCorrect = userAnswerId === correctAnswerId;
                                return (
                                    <div key={q._id} className={cn("p-4 border rounded-md",
                                        isCorrect ? "border-green-300 bg-green-50/50" : "border-red-300 bg-red-50/50"
                                    )}>
                                        <p className="font-semibold mb-3">{index + 1}. {q.questionText}</p>
                                        <div className="space-y-2">
                                            {q.options.map(opt => {
                                                const isSelected = userAnswerId === opt._id;
                                                const isActualCorrect = correctAnswerId === opt._id;
                                                return (
                                                    <div key={opt._id} className={cn("flex items-center text-sm p-2 rounded",
                                                        // Highlight correct answer always
                                                        isActualCorrect ? "bg-green-100 font-medium" : "",
                                                        // If selected wrong, cross it out and show red background
                                                        isSelected && !isActualCorrect ? "bg-red-100 line-through" : ""
                                                    )}>
                                                        {/* Icon Logic */}
                                                        {isSelected ? ( // Icon for the selected answer
                                                             isCorrect ? <CheckCircle className="h-4 w-4 mr-2 text-green-700 flex-shrink-0"/> : <XCircle className="h-4 w-4 mr-2 text-red-700 flex-shrink-0"/>
                                                        ): ( // Show correct checkmark if this wasn't selected but *was* correct
                                                             isActualCorrect ? <CheckCircle className="h-4 w-4 mr-2 text-green-700 flex-shrink-0"/> : <span className="w-4 h-4 mr-2 flex-shrink-0"/> // Placeholder for alignment
                                                        )}
                                                        <span>{opt.text}</span>
                                                    </div>
                                                );
                                            })}
                                            {/* Show message if question was not answered */}
                                            {!userAnswerId && correctAnswerId && (
                                                <div className="flex items-center text-sm p-2 rounded bg-orange-100 text-orange-700 italic mt-1">
                                                     <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0"/> Correct answer was: {questions[index].options.find(o => o._id === correctAnswerId)?.text} (Not Answered)
                                                </div>
                                             )}
                                        </div>
                                    </div>
                                );
                            })}
                             <Separator className="my-4" />
                             <div className="flex justify-center gap-4">
                                <Button variant="outline" onClick={restartQuiz}>
                                     <RefreshCw className="mr-2 h-4 w-4"/> Retake Quiz
                                </Button>
                                <Button onClick={() => navigate('/dashboard/student')}> {/* Or navigate to quiz list /quizzes */}
                                     Back to Dashboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }


    // --- *** RENDER QUIZ TAKING UI *** ---
    return (
        <div className="min-h-screen bg-gradient-secondary flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader>
                     {/* Back Button */}
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="absolute top-4 left-4 h-8 w-8 p-0" disabled={isSubmitting}>
                         <ArrowLeft className="h-4 w-4" />
                         <span className="sr-only">Go Back</span>
                    </Button>
                    <CardTitle className="text-2xl font-bold text-center pt-2">{quizMetadata?.title}</CardTitle> {/* Added optional chaining */}
                    {quizMetadata?.description && (
                        <CardDescription className="text-center">{quizMetadata.description}</CardDescription>
                    )}
                     {/* Progress Bar */}
                     <div className="pt-4 space-y-1">
                        <Progress value={quizProgress} className="w-full h-2" />
                        <p className="text-xs text-muted-foreground text-center">
                            Question {currentQuestionIndex + 1} of {questions.length}
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Question Text - Check if currentQuestion exists */}
                    <div className="text-lg font-semibold text-center py-4 min-h-[60px]"> {/* Added min-height */}
                        {currentQuestion?.questionText ?? 'Loading question...'}
                    </div>

                    {/* Options - Check if currentQuestion exists */}
                    <RadioGroup
                        value={selectedOptionId}
                        onValueChange={handleOptionChange} // Update selection state
                        className="space-y-3"
                        key={currentQuestion?._id ?? currentQuestionIndex} // Use index as fallback key
                    >
                        {currentQuestion?.options.map((option, index) => (
                            <Label
                                key={option._id || index} // Use option._id if available from backend, otherwise index
                                htmlFor={`q${currentQuestionIndex}-opt${index}`}
                                className={cn(
                                    "flex items-center space-x-3 border rounded-md p-3 cursor-pointer transition-colors hover:bg-muted/60",
                                    selectedOptionId === option._id ? 'bg-muted border-primary ring-1 ring-primary' : 'border-input' // Use border-input for default
                                )}
                            >
                                <RadioGroupItem value={option._id} id={`q${currentQuestionIndex}-opt${index}`} />
                                <span>{option.text}</span>
                            </Label>
                        ))}
                         {/* Render skeleton options if question exists but options haven't loaded? Unlikely with Promise.all */}
                        {!currentQuestion?.options && isLoading && (
                            <>
                                <Skeleton className="h-12 w-full rounded-md" />
                                <Skeleton className="h-12 w-full rounded-md" />
                            </>
                        )}
                    </RadioGroup>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center pt-4">
                         <Button
                            variant="outline"
                            onClick={handlePreviousQuestion}
                            disabled={currentQuestionIndex === 0 || isSubmitting}
                        >
                            Previous
                        </Button>

                         {currentQuestionIndex === questions.length - 1 ? (
                            // Show Submit button on the last question
                            <Button
                                onClick={handleSubmitQuiz}
                                disabled={isSubmitting || !selectedOptionId} // Disable if no option selected on last Q
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Quiz"}
                            </Button>
                         ) : (
                             // Show Next button
                            <Button
                                onClick={handleNextQuestion}
                                disabled={isSubmitting || !selectedOptionId} // Disable if no option selected
                            >
                                Next
                            </Button>
                         )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TakeQuiz;