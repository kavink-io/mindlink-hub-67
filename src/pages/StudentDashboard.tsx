// src/pages/StudentDashboard.tsx
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Timer, Sparkles, Award, TrendingUp, MessageSquare, LogOut, BrainCircuit, Star, Search, X, Download, File, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input"; 
// Import Pagination Components
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";

// Define the base URL for your backend API
const API_URL = "http://localhost:5000/api";

// --- Interfaces ---
interface Author {
    _id: string; name: string; email?: string; role?: string;
}
interface Question {
    _id: string; title: string; body?: string; author: Author; tags: string[]; isAnswered: boolean; createdAt: string; updatedAt: string; answerCount?: number; likes?: number;
}
interface UserStats {
    _id: string; user: string; questionsAsked: number; answersGiven: number; earnedBadges: string[]; currentStreak: number; longestStreak: number; lastActivityDate?: string;
}
interface Note {
    _id: string; title: string; description?: string; fileName: string; fileType: string; uploadedBy: Author; createdAt: string; updatedAt: string;
}

// --- Badge Definitions ---
const badgeMap: Record<string, { name: string; icon?: React.ReactNode; description: string }> = {
    'first_question': { name: "Question Starter", icon: <MessageSquare className="w-3 h-3 inline mr-1"/>, description: "Asked your first question!" },
    'first_answer': { name: "Helper", icon: <Star className="w-3 h-3 inline mr-1"/>, description: "Provided your first answer!" },
    'helpful_answer_10': { name: "Super Helper", icon: <Star className="w-3 h-3 inline mr-1 text-yellow-500"/>, description: "Provided 10 helpful answers." },
    'streak_3_days': { name: "Consistent Learner", icon: <TrendingUp className="w-3 h-3 inline mr-1"/>, description: "Maintained a 3-day activity streak." },
    'streak_7_days': { name: "Dedicated Learner", icon: <TrendingUp className="w-3 h-3 inline mr-1 text-orange-500"/>, description: "Maintained a 7-day activity streak!" },
};

const QUESTIONS_PER_PAGE = 5; // Define how many questions per page

const StudentDashboard = () => {
    const [userName, setUserName] = useState("User");
    const navigate = useNavigate();

    // State for questions & pagination
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
    const [questionsError, setQuestionsError] = useState<string | null>(null);

    // State for notes
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoadingNotes, setIsLoadingNotes] = useState(true);
    const [notesError, setNotesError] = useState<string | null>(null);

    // State for search functionality
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // State for user stats
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);


     // --- Client-Side Logout Handler ---
     const handleLogout = () => {
       localStorage.removeItem('mindlinkToken');
       localStorage.removeItem('mindlinkUser');
       toast.success("Successfully logged out!");
       navigate("/");
     };

    // --- Helper: Format Date ---
    const formatDate = (dateString: string): string => {
         try {
            const date = new Date(dateString);
            const now = new Date();
            const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
            if (diffSeconds < 60) return `${diffSeconds}s ago`;
            if (Math.round(diffSeconds / 60) < 60) return `${Math.round(diffSeconds / 60)}m ago`;
            if (Math.round(diffSeconds / 3600) < 24) return `${Math.round(diffSeconds / 3600)}h ago`;
            return date.toLocaleDateString();
        } catch { return "Invalid date"; }
    };

    // --- Helper: File Type Icon ---
    const getFileTypeIcon = (fileType: string): React.ReactNode => {
        if (fileType.includes('pdf')) return <FileText className="text-red-500 h-5 w-5 flex-shrink-0" />;
        if (fileType.includes('word')) return <FileText className="text-blue-500 h-5 w-5 flex-shrink-0" />;
        if (fileType.includes('presentation')) return <FileText className="text-orange-500 h-5 w-5 flex-shrink-0" />;
        return <File className="text-gray-500 h-5 w-5 flex-shrink-0" />;
    }

    // --- Fetch user data ---
    useEffect(() => {
        const storedUser = localStorage.getItem('mindlinkUser');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUserName(userData.name || "User");
            } catch (e) { console.error("Error parsing user data", e); }
        } else {
             toast.error("Please log in to view your dashboard.");
             navigate('/auth');
        }
    }, [navigate]);

    // --- Debounce Hook for Search Input ---
    useEffect(() => {
        const timerId = setTimeout(() => { setDebouncedSearchTerm(searchTerm); }, 500);
        return () => { clearTimeout(timerId); };
    }, [searchTerm]);

    // --- Fetch Questions (Modified for Search/Pagination) ---
    const fetchQuestions = useCallback(async (page = 1, search = '') => {
        setIsLoadingQuestions(true);
        setQuestionsError(null);
        try {
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            let url = `${API_URL}/questions?page=${page}&limit=${QUESTIONS_PER_PAGE}`;
            if (search) {
                url += `&search=${encodeURIComponent(search)}`;
            }

            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch questions');
            const data: { questions: Question[], currentPage: number, totalPages: number, totalQuestions: number } = await response.json();

            setQuestions(data.questions);
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
            setTotalQuestions(data.totalQuestions);

        } catch (err: any) {
            setQuestionsError(err.message || "Failed to load questions.");
        } finally {
            setIsLoadingQuestions(false);
        }
    }, []);

    // Effect to trigger fetching whenever debouncedSearchTerm changes
    useEffect(() => {
        fetchQuestions(1, debouncedSearchTerm);
    }, [debouncedSearchTerm, fetchQuestions]);


    // --- Fetch Notes Function ---
    const fetchNotes = async () => {
         setIsLoadingNotes(true);
         setNotesError(null);
        try {
             const token = localStorage.getItem('mindlinkToken');
             if (!token) {
                 setNotesError("Authentication required to view notes.");
                 setIsLoadingNotes(false);
                 return;
             }

            const headers: HeadersInit = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
            const response = await fetch(`${API_URL}/notes`, { headers });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data: Note[] = await response.json();
            setNotes(data);

        } catch (err: any) {
             setNotesError(err.message || "Failed to load notes.");
        } finally {
             setIsLoadingNotes(false);
        }
    };

    // --- Handle Note Download ---
     const handleDownloadNote = async (noteId: string, fileName: string) => {
         try {
             const token = localStorage.getItem('mindlinkToken');
             if (!token) throw new Error("Not authorized. Please log in.");

            const response = await fetch(`${API_URL}/notes/download/${noteId}`, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });

             if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
             }

             // Trigger browser download using Blob
             const blob = await response.blob();
             const downloadUrl = window.URL.createObjectURL(blob);
             const link = document.createElement('a');
             link.href = downloadUrl;
             link.setAttribute('download', fileName);
             document.body.appendChild(link);
             link.click();
             link.parentNode?.removeChild(link);
             window.URL.revokeObjectURL(downloadUrl);

             toast.success(`Downloading ${fileName}...`);

         } catch (err: any) {
             toast.error(err.message || `Failed to download ${fileName}.`);
         }
     };

    // --- Fetch User Stats ---
    useEffect(() => {
        const fetchStats = async () => {
            setIsLoadingStats(true);
            setStatsError(null);
             const token = localStorage.getItem('mindlinkToken');
             if (!token) {
                 setStatsError("Not Logged In"); setIsLoadingStats(false);
                 if (!localStorage.getItem('mindlinkUser')) navigate('/auth');
                 return;
             }
            try {
                 const headers: HeadersInit = { 'Authorization': `Bearer ${token}` };
                const response = await fetch(`${API_URL}/users/stats/me`, { headers });
                if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch stats');
                const data: UserStats = await response.json();
                setUserStats(data);
            } catch (err: any) {
                setStatsError(err.message || "Failed to load stats.");
                toast.error(err.message || "Failed to load your stats.");
            } finally {
                setIsLoadingStats(false);
            }
        };
        // Fetch on mount
        fetchStats();
        fetchNotes(); 
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);


     // --- Pagination Handler ---
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
            fetchQuestions(newPage, debouncedSearchTerm);
        }
    };


    // --- Helper functions ---
    const getAuthorDisplayName = (author: Author | null | undefined): string => author?.name || "Unknown User";
    const getBadgeInfo = (badgeId: string) => badgeMap[badgeId] || { name: badgeId, description: "An achievement" };

    // --- Render Pagination Controls --- (Helper component)
    const renderPagination = () => {
        if (totalPages <= 1 && !questionsError && !isLoadingQuestions) return null;

        const pageNumbers = [];
        const maxPagesToShow = 5;
        const halfMaxPages = Math.floor(maxPagesToShow / 2);

        let startPage = Math.max(1, currentPage - halfMaxPages);
        let endPage = Math.min(totalPages, currentPage + halfMaxPages);

        if (currentPage <= halfMaxPages) {
            endPage = Math.min(totalPages, maxPagesToShow);
        }
        if (currentPage + halfMaxPages >= totalPages) {
            startPage = Math.max(1, totalPages - maxPagesToShow + 1);
        }

        if (startPage > 1) {
             pageNumbers.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
        }
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(<PaginationItem key={i}><PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={i === currentPage}>{i}</PaginationLink></PaginationItem>);
        }
        if (endPage < totalPages) {
             pageNumbers.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
        }

        if (totalPages <= 1) return null;

        return (
             <Pagination className="mt-6">
                <PaginationContent>
                    <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} aria-disabled={currentPage <= 1} className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
                    {pageNumbers}
                    <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} aria-disabled={currentPage >= totalPages} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
                </PaginationContent>
            </Pagination>
        );
    };


    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                     <div>
                        <h1 className="text-4xl font-bold mb-2">Welcome back, {userName}!</h1>
                        <p className="text-muted-foreground">Keep learning and growing every day</p>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                     <Card className="shadow-soft hover:shadow-hover transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                            <Award className="w-4 h-4 text-accent" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{isLoadingStats ? <Skeleton className="h-8 w-12 inline-block"/> : (userStats?.currentStreak ?? 0)} days</div>
                            <p className="text-xs text-muted-foreground mt-1">{isLoadingStats ? <Skeleton className="h-3 w-20"/> : `Longest: ${userStats?.longestStreak ?? 0} days ✨`}</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-soft hover:shadow-hover transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Questions Asked</CardTitle>
                            <MessageSquare className="w-4 h-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-3xl font-bold">{isLoadingStats ? <Skeleton className="h-8 w-10 inline-block"/> : (userStats?.questionsAsked ?? 0)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Keep asking!</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-soft hover:shadow-hover transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Answers Provided</CardTitle>
                            <TrendingUp className="w-4 h-4 text-secondary" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-3xl font-bold">{isLoadingStats ? <Skeleton className="h-8 w-10 inline-block"/> : (userStats?.answersGiven ?? 0)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Helping others!</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-soft hover:shadow-hover transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
                            <Award className="w-4 h-4 text-accent animate-pulse-glow" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-3xl font-bold">{isLoadingStats ? <Skeleton className="h-8 w-8 inline-block"/> : (userStats?.earnedBadges?.length ?? 0)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Collect them all!</p>
                            {!isLoadingStats && userStats && userStats.earnedBadges.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {userStats.earnedBadges.map(badgeId => {
                                         const badgeInfo = getBadgeInfo(badgeId);
                                         return (
                                             <Tooltip key={badgeId}>
                                                 <TooltipTrigger asChild>
                                                      <Badge variant="secondary" className="cursor-default text-xs">
                                                         {badgeInfo.icon}
                                                         {badgeInfo.name}
                                                     </Badge>
                                                 </TooltipTrigger>
                                                 <TooltipContent>
                                                     <p>{badgeInfo.description}</p>
                                                 </TooltipContent>
                                             </Tooltip>
                                        );
                                     })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Main Actions */}
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Link to="/ask" className="block"> 
                        <Card className="h-full shadow-soft hover:shadow-hover transition-all hover:scale-105 cursor-pointer bg-gradient-primary text-white">
                        <CardHeader>
                            <BookOpen className="w-12 h-12 mb-4" />
                            <CardTitle>Ask a Question</CardTitle>
                            <CardDescription className="text-white/80">
                            Get help from peers & teachers
                            </CardDescription>
                        </CardHeader>
                        </Card>
                    </Link>
                    <Link to="/timer" className="block"> 
                        <Card className="h-full shadow-soft hover:shadow-hover transition-all hover:scale-105 cursor-pointer bg-gradient-secondary text-white">
                        <CardHeader>
                            <Timer className="w-12 h-12 mb-4" />
                            <CardTitle>Focus Timer</CardTitle>
                            <CardDescription className="text-white/80">
                            Stay productive
                            </CardDescription>
                        </CardHeader>
                        </Card>
                    </Link>
                    <Link to="/relax" className="block"> 
                        <Card className="h-full shadow-soft hover:shadow-hover transition-all hover:scale-105 cursor-pointer bg-gradient-relax text-white">
                        <CardHeader>
                            <Sparkles className="w-12 h-12 mb-4" />
                            <CardTitle>Relax Room</CardTitle>
                            <CardDescription className="text-white/80">
                            Take a break
                            </CardDescription>
                        </CardHeader>
                        </Card>
                    </Link>
                    <Link to="/quizzes" className="block"> 
                        <Card className="h-full shadow-soft hover:shadow-hover transition-all hover:scale-105 cursor-pointer border-2 border-accent">
                        <CardHeader>
                            <BrainCircuit className="w-12 h-12 mb-4 text-accent" />
                            <CardTitle>Take a Quiz</CardTitle>
                            <CardDescription>
                                Test your knowledge
                            </CardDescription>
                        </CardHeader>
                        </Card>
                    </Link>
                </div>

                 {/* Shared Notes Section */}
                 <Card className="shadow-soft mb-8">
                     <CardHeader>
                        <CardTitle>Class Notes</CardTitle>
                        <CardDescription>Download notes shared by your teachers.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {isLoadingNotes ? (
                            <>
                                <Skeleton className="h-16 w-full rounded-lg" />
                                <Skeleton className="h-16 w-full rounded-lg" />
                            </>
                         ) : notesError ? (
                            <div className="text-center text-destructive py-4"><p>⚠️ {notesError}</p></div>
                         ) : notes.length === 0 ? (
                            <div className="text-center text-muted-foreground py-4">
                                <p>No notes have been shared yet.</p>
                            </div>
                         ) : (
                             notes.map((note) => (
                                <div key={note._id} className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted rounded-lg group">
                                    <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                        {getFileTypeIcon(note.fileType)}
                                        <div className="overflow-hidden">
                                            <p className="font-semibold truncate" title={note.title}>{note.title}</p>
                                            <p className="text-sm text-muted-foreground truncate" title={note.fileName}>Shared by {note.uploadedBy.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                                        <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline">
                                            {formatDate(note.createdAt)}
                                        </span>
                                        <Button
                                            size="sm"
                                            onClick={() => handleDownloadNote(note._id, note.fileName)}
                                        >
                                            <Download className="mr-2 h-4 w-4" /> Download
                                        </Button>
                                    </div>
                                </div>
                             ))
                         )}
                    </CardContent>
                </Card>

                {/* Search Bar */}
                 <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search questions by title or keywords..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={isLoadingQuestions}
                    />
                     {searchTerm && (
                         <Button
                            variant="ghost" size="sm" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                            onClick={() => setSearchTerm('')}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                     )}
                </div>

                {/* Recent Activity */}
                <Card className="shadow-soft">
                    <CardHeader>
                        <CardTitle>Recent Questions</CardTitle>
                        <CardDescription>
                            {debouncedSearchTerm ?
                                `Showing results for "${debouncedSearchTerm}" (${totalQuestions} questions found).` :
                                `Browse and answer questions from your peers. Showing ${questions.length} of ${totalQuestions} total questions.`
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoadingQuestions ? (
                            <>
                                {[...Array(QUESTIONS_PER_PAGE)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                            </>
                        ) : questionsError ? (
                            <div className="text-center text-destructive py-4"><p>⚠️ {questionsError}</p></div>
                        ) : questions.length === 0 ? (
                             <div className="text-center text-muted-foreground py-4">
                                <p>No questions found{debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}.</p>
                             </div>
                        ) : (
                            questions.map((question) => (
                                <div key={question._id} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                                    <div className="flex-1 mr-4">
                                        <Link to={`/questions/${question._id}`} className="hover:underline">
                                            <h3 className="font-semibold mb-1 cursor-pointer line-clamp-2">{question.title}</h3>
                                        </Link>
                                        <p className="text-sm text-muted-foreground">Asked by {getAuthorDisplayName(question.author)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-4 text-sm text-muted-foreground flex-shrink-0">
                                        <Button size="sm" variant="outline" asChild><Link to={`/questions/${question._id}`}>Answer</Link></Button>
                                    </div>
                                </div>
                            ))
                        )}
                        {/* Display Stats Loading/Error */}
                        {isLoadingStats && (<p className="text-xs text-muted-foreground text-center pt-2">Loading stats...</p>)}
                        {statsError && !isLoadingStats && (<p className="text-xs text-destructive text-center pt-2">⚠️ Could not load stats: {statsError}</p>)}
                    </CardContent>

                    {/* Pagination Controls */}
                     {renderPagination()}

                </Card>
            </div>
        </div>
    );
};

export default StudentDashboard;