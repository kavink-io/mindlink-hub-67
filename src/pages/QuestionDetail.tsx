// src/pages/QuestionDetail.tsx
import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // For author display
// Import AlertDialog components and Flag icon
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// UPDATED imports: Remove Send, Add MessageSquarePlus
import { ArrowLeft, Flag, MessageSquarePlus } from 'lucide-react';
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
// import { Progress } from "@/components/ui/progress"; // Keep if used elsewhere

// Define the base URL for your backend API
const API_URL = "http://localhost:5000/api"; // Adjust port/host if needed

// --- Interfaces --- (Keep as they are)
interface Author {
    _id: string;
    name: string;
    email?: string; // Optional
    role?: string;  // Optional
}
interface Answer {
    _id: string;
    body: string;
    author: Author;
    question: string; // Question ID
    isAccepted?: boolean;
    createdAt: string;
    updatedAt: string;
}
interface Question {
    _id: string;
    title: string;
    body?: string;
    author: Author;
    tags: string[];
    isAnswered?: boolean;
    createdAt: string;
    updatedAt: string;
}

// New Interface/Type for Report Dialog
interface ReportDetails {
    contentType: 'question' | 'answer';
    contentId: string;
    // Optional: snippet for display in dialog
    contentSnippet?: string;
}


const QuestionDetail = () => {
    const { id: questionId } = useParams<{ id: string }>(); // Get question ID from URL
    const navigate = useNavigate();
    const [question, setQuestion] = useState<Question | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    // REMOVED state for direct answer input
    // const [newAnswerBody, setNewAnswerBody] = useState('');
    const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
    const [isLoadingAnswers, setIsLoadingAnswers] = useState(true);
    // REMOVED state for direct answer submission
    // const [isPostingAnswer, setIsPostingAnswer] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- State for Report Dialog ---
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [reportDetails, setReportDetails] = useState<ReportDetails | null>(null);
    const [reportReason, setReportReason] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);


    const token = localStorage.getItem('mindlinkToken');
    const isLoggedIn = !!token; // Simple check if token exists

    // --- Fetch Question Details ---
    useEffect(() => {
        const fetchQuestion = async () => {
            if (!questionId) {
                setError("Question ID not found in URL.");
                setIsLoadingQuestion(false);
                return;
            }
            setIsLoadingQuestion(true);
            setError(null);
            try {
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
    }, [questionId]); // Refetch if questionId changes

    // --- Fetch Answers ---
    useEffect(() => {
        const fetchAnswers = async () => {
             if (!questionId) return; // Don't fetch if no question ID
            setIsLoadingAnswers(true);
            // Don't reset main error, maybe answers fail but question loaded
            try {
                const response = await fetch(`${API_URL}/questions/${questionId}/answers`);
                if (!response.ok) {
                     const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                const data: Answer[] = await response.json();
                setAnswers(data);
            } catch (err: any) {
                console.error("Failed to fetch answers:", err);
                // Set a specific error or show toast for answers failing
                toast.error(err.message || "Failed to load answers.");
            } finally {
                setIsLoadingAnswers(false);
            }
        };
        // Fetch answers only if the question was loaded successfully
        if (question && !isLoadingQuestion) {
             fetchAnswers();
        }
    }, [questionId, question, isLoadingQuestion]); // Refetch if questionId changes or question loads

    // --- REMOVED handlePostAnswer function ---

     // --- Handle Opening Report Dialog ---
    const openReportDialog = (contentType: 'question' | 'answer', contentId: string, snippet?: string) => {
        if (!isLoggedIn) {
            toast.error("You must be logged in to report content.");
            navigate('/auth');
            return;
        }
        setReportDetails({ contentType, contentId, contentSnippet: snippet?.substring(0, 100) + (snippet && snippet.length > 100 ? '...' : '') }); // Limit snippet length
        setReportReason(''); // Clear previous reason
        setIsReportDialogOpen(true);
    };

    // --- Handle Submitting Report ---
     const handleReportSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent default dialog form submission if applicable
         if (!reportDetails || !reportReason.trim()) {
            toast.warning("Please provide a reason for the report.");
            return;
        }
         if (!token) { // Double check token
             toast.error("Authentication error. Please log in again.");
             setIsReportDialogOpen(false);
             navigate('/auth');
             return;
         }

        setIsSubmittingReport(true);
        try {
            const response = await fetch(`${API_URL}/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    contentType: reportDetails.contentType,
                    contentId: reportDetails.contentId,
                    reason: reportReason,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific backend message for duplicate reports
                if (response.status === 400 && data.message?.includes('already reported')) {
                     toast.info(data.message);
                } else {
                    throw new Error(data.message || `HTTP error! status: ${response.status}`);
                }
            } else {
                 toast.success("Content reported successfully. An admin will review it.");
            }

            setIsReportDialogOpen(false); // Close dialog on success or handled error

        } catch (error: any) {
            console.error("Failed to submit report:", error);
            toast.error(error.message || "Failed to submit report. Please try again.");
            // Keep dialog open on unexpected errors? Or close? User decision.
            // setIsReportDialogOpen(false);
        } finally {
            setIsSubmittingReport(false);
        }
     };


    // --- Helper Functions ---
    const getAuthorDisplayName = (author: Author | null | undefined): string => {
        // TODO: Implement anonymous name logic if required
        return author?.name || "Unknown User";
    };

    const formatDate = (dateString: string): string => {
         try {
            return new Date(dateString).toLocaleString(undefined, {
                 dateStyle: 'medium',
                 timeStyle: 'short'
             });
        } catch {
             return "Invalid date";
        }
    };

    // --- Render Loading/Error States ---
    if (isLoadingQuestion) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                 <Skeleton className="h-8 w-1/4 mb-4" /> {/* Back button placeholder */}
                 <Skeleton className="h-10 w-3/4 mb-2" /> {/* Title */}
                 <Skeleton className="h-5 w-1/2 mb-6" /> {/* Author line */}
                 <Skeleton className="h-24 w-full mb-8" /> {/* Body */}
                 <Skeleton className="h-6 w-1/4 mb-4" /> {/* Answers title */}
                 <Skeleton className="h-32 w-full mb-6" /> {/* Answer card */}
                 <Skeleton className="h-32 w-full" /> {/* Answer card */}
            </div>
        );
    }

    if (error) {
         return (
             <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
                <p className="text-destructive">⚠️ Error: {error}</p>
                 <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
                     Go Back
                 </Button>
             </div>
            );
    }

    if (!question) {
        return (
             <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
                 <p className="text-muted-foreground">Question not found.</p>
                  <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
                     Go Back
                 </Button>
            </div>
        );
    }

    // --- Render Main Content ---
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl"> {/* Centered content */}
            {/* Back Button */}
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                 <ArrowLeft className="mr-2 h-4 w-4" /> Back to Questions
            </Button>

            {/* Question Card - Added Report Button */}
            <Card className="mb-8 shadow-md">
                <CardHeader>
                     {/* Flex container for Title and Report Button */}
                     <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-2xl font-bold flex-1 mr-2">{question.title}</CardTitle>
                         {/* Report Question Button Trigger */}
                         {isLoggedIn && ( // Only show report if logged in
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-destructive flex-shrink-0 h-8 px-2"
                                    onClick={() => openReportDialog('question', question._id, question.title)}
                                    title="Report this question"
                                >
                                    <Flag className="h-4 w-4" />
                                    <span className="sr-only sm:ml-1 sm:not-sr-only">Report</span>
                                </Button>
                            </AlertDialogTrigger>
                         )}
                     </div>
                    <CardDescription className="flex items-center gap-2 text-sm pt-1">
                         <Avatar className="h-6 w-6">
                            {/* TODO: Add Avatar Image Source if available */}
                            {/* <AvatarImage src={question.author.avatarUrl} alt={getAuthorDisplayName(question.author)} /> */}
                            <AvatarFallback className="text-xs">
                                {getAuthorDisplayName(question.author).substring(0, 1).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        Asked by {getAuthorDisplayName(question.author)} on {formatDate(question.createdAt)}
                    </CardDescription>
                </CardHeader>
                {question.body && (
                    <CardContent>
                        {/* Use pre-wrap to respect newlines and spacing in the body */}
                        <p className="text-base whitespace-pre-wrap">{question.body}</p>
                    </CardContent>
                )}
                 {/* TODO: Add Tags display if needed */}
                 {question.tags && question.tags.length > 0 && (
                     <CardContent className="flex flex-wrap gap-2 pt-4">
                        {question.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                     </CardContent>
                 )}
            </Card>

            <Separator className="my-6" />

            {/* Answers Section - Added Report Button */}
            <h2 className="text-xl font-semibold mb-4">{answers.length} Answer{answers.length !== 1 ? 's' : ''}</h2>
            <div className="space-y-6 mb-8">
                {isLoadingAnswers ? (
                     <Skeleton className="h-24 w-full" />
                ) : answers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No answers yet.</p> // Modified message
                ) : (
                    answers.map(answer => (
                        <Card key={answer._id} className="shadow-sm relative group"> {/* Added relative group */}
                            <CardContent className="pt-6">
                                <p className="text-base whitespace-pre-wrap mb-4">{answer.body}</p>
                                <div className="flex items-center justify-end text-sm text-muted-foreground gap-2">
                                     <Avatar className="h-5 w-5">
                                         {/* <AvatarImage src={answer.author.avatarUrl} alt={getAuthorDisplayName(answer.author)} /> */}
                                        <AvatarFallback className="text-xs">
                                             {getAuthorDisplayName(answer.author).substring(0, 1).toUpperCase()}
                                         </AvatarFallback>
                                     </Avatar>
                                    Answered by {getAuthorDisplayName(answer.author)} on {formatDate(answer.createdAt)}
                                </div>
                            </CardContent>
                             {/* Report Answer Button Trigger - positioned absolute */}
                             {isLoggedIn && ( // Only show report if logged in
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-7 px-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" // Show on focus too
                                        onClick={() => openReportDialog('answer', answer._id, answer.body)} // Pass full body snippet
                                        title="Report this answer"
                                    >
                                        <Flag className="h-4 w-4" />
                                        <span className="sr-only">Report</span>
                                    </Button>
                                </AlertDialogTrigger>
                             )}
                        </Card>
                    ))
                )}
            </div>

             <Separator className="my-6" />

            {/* *** MODIFIED SECTION: Button to Add Answer Page *** */}
            <div className="mt-8 flex justify-center">
                 {isLoggedIn ? (
                     <Button size="lg" asChild>
                         {/* Link to the dedicated answer page for this question */}
                         <Link to={`/questions/${questionId}/answer`}>
                            <MessageSquarePlus className="mr-2 h-5 w-5" /> Add Your Answer
                         </Link>
                     </Button>
                 ) : (
                     <div className="text-center p-4 border rounded-md bg-muted w-full max-w-lg">
                        <p className="text-muted-foreground">
                            You need to be <Link to="/auth" className="text-primary underline">logged in</Link> to post an answer.
                        </p>
                    </div>
                 )}
            </div>
            {/* *** END MODIFIED SECTION *** */}


            {/* Report Content Dialog */}
            <AlertDialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <AlertDialogContent>
                    <form onSubmit={handleReportSubmit}> {/* Wrap in form */}
                        <AlertDialogHeader>
                            <AlertDialogTitle>Report Content</AlertDialogTitle>
                            <AlertDialogDescription>
                                Please provide a reason for reporting this {reportDetails?.contentType || 'content'}.
                                Your report will be reviewed by an administrator.
                            </AlertDialogDescription>
                            {/* Optional: Display snippet */}
                             {reportDetails?.contentSnippet && (
                                <p className="text-sm bg-muted p-2 rounded border italic mt-2 line-clamp-3"> {/* Use line-clamp */}
                                    Reporting: "{reportDetails.contentSnippet}"
                                </p>
                             )}
                        </AlertDialogHeader>

                        {/* Reason Input */}
                        <div className="my-4 space-y-2">
                             <Label htmlFor="report-reason" className="font-medium">Reason *</Label>
                             <Textarea
                                id="report-reason"
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                placeholder="Explain why this content is inappropriate or violates guidelines..."
                                rows={4}
                                required
                                maxLength={500} // Match backend limit
                                disabled={isSubmittingReport}
                            />
                             <p className="text-xs text-muted-foreground text-right">{reportReason.length} / 500</p>
                        </div>

                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmittingReport}>Cancel</AlertDialogCancel>
                            {/* Change AlertDialogAction type to submit */}
                            <Button type="submit" variant="destructive" disabled={isSubmittingReport || !reportReason.trim()}>
                                {isSubmittingReport ? "Submitting..." : "Submit Report"}
                            </Button>
                        </AlertDialogFooter>
                    </form>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
};

export default QuestionDetail;