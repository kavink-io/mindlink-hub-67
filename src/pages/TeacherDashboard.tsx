// src/pages/TeacherDashboard.tsx
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, MessageSquare, FileUp, ClipboardCheck, LogOut, Download, File, Trash2 } from "lucide-react"; // Added Download, File, Trash2 icons
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Define the base URL for your backend API
const API_URL = "http://localhost:5000/api";

// Interfaces matching backend models
interface Author {
    _id: string;
    name: string;
    email?: string;
    role?: string;
}
interface Question {
    _id: string;
    title: string;
    body?: string;
    author: Author;
    tags: string[];
    isAnswered: boolean;
    createdAt: string;
    updatedAt: string;
}
// Interface for Note data from backend
interface Note {
    _id: string;
    title: string;
    description?: string;
    fileName: string;
    fileType: string;
    uploadedBy: Author; // Populated field
    createdAt: string;
    updatedAt: string;
}


const TeacherDashboard = () => {
    const navigate = useNavigate();

    // State for questions
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
    const [questionsError, setQuestionsError] = useState<string | null>(null);

    // State for notes
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoadingNotes, setIsLoadingNotes] = useState(true);
    const [notesError, setNotesError] = useState<string | null>(null);


    // --- Client-Side Logout Handler ---
    const handleLogout = () => {
       localStorage.removeItem('mindlinkToken');
       localStorage.removeItem('mindlinkUser');
       toast.success("Successfully logged out!");
       navigate("/");
    };

    // --- Fetch questions ---
    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoadingQuestions(true);
            setQuestionsError(null);
            try {
                const headers: HeadersInit = { 'Content-Type': 'application/json' };
                // Fetch all questions, limit to 3 for dashboard preview
                const response = await fetch(`${API_URL}/questions?limit=3`, { headers });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                const data: { questions: Question[] } = await response.json();
                setQuestions(data.questions);
            } catch (err: any) {
                setQuestionsError(err.message || "Failed to load recent questions.");
            } finally {
                setIsLoadingQuestions(false);
            }
        };
        fetchQuestions();
    }, []);

    // --- Fetch Notes Function ---
    const fetchNotes = async () => {
         setIsLoadingNotes(true);
         setNotesError(null);
        try {
             const token = localStorage.getItem('mindlinkToken');
             if (!token) throw new Error("Not authorized. Please log in.");

            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

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

    useEffect(() => {
        fetchNotes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // --- Handle Note Download ---
     const handleDownloadNote = async (noteId: string, fileName: string) => {
         try {
             const token = localStorage.getItem('mindlinkToken');
             if (!token) throw new Error("Not authorized. Please log in.");

            const response = await fetch(`${API_URL}/notes/download/${noteId}`, {
                 headers: {
                     'Authorization': `Bearer ${token}`
                 }
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

     // --- Handle Note Deletion ---
      const handleDeleteNote = async (noteId: string, noteTitle: string) => {
          if (!window.confirm(`Are you sure you want to delete the note: "${noteTitle}"? This will permanently delete the file.`)) {
              return;
          }
         try {
             const token = localStorage.getItem('mindlinkToken');
             if (!token) throw new Error("Not authorized.");

            const response = await fetch(`${API_URL}/notes/${noteId}`, {
                 method: 'DELETE',
                 headers: {
                     'Authorization': `Bearer ${token}`
                 }
            });

             if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
             }

             toast.success(`Note "${noteTitle}" deleted successfully.`);
             fetchNotes(); // Refresh the list of notes

         } catch (err: any) {
             console.error(`Failed to delete note ${noteId}:`, err);
             toast.error(err.message || `Failed to delete note "${noteTitle}".`);
         }
      };


    // --- Helper function to format author display ---
    const getAuthorDisplayName = (author: Author | null | undefined): string => {
        return author?.name || "Unknown User";
    };

    // --- Helper function to format date/time difference ---
     const formatTimeAgo = (dateString: string): string => {
          try {
            const date = new Date(dateString);
            const now = new Date();
            const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
            const diffMinutes = Math.round(diffSeconds / 60);
            const diffHours = Math.round(diffMinutes / 60);
            const diffDays = Math.round(diffHours / 24);

            if (diffSeconds < 60) return `${diffSeconds} sec ago`;
            if (diffMinutes < 60) return `${diffMinutes} min ago`;
            if (diffHours < 24) return `${diffHours} hours ago`;
            if (diffDays === 1) return `1 day ago`;
            if (diffDays < 7) return `${diffDays} days ago`;
            return date.toLocaleDateString();
        } catch {
            return "Invalid date";
        }
    };

    // --- Helper function for file type icon (basic) ---
    const getFileTypeIcon = (fileType: string): React.ReactNode => {
        if (fileType.includes('pdf')) return <FileText className="text-red-500 h-5 w-5 flex-shrink-0" />;
        if (fileType.includes('word')) return <FileText className="text-blue-500 h-5 w-5 flex-shrink-0" />;
        if (fileType.includes('presentation')) return <FileText className="text-orange-500 h-5 w-5 flex-shrink-0" />;
        return <File className="text-gray-500 h-5 w-5 flex-shrink-0" />; // Default icon
    }


    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Teacher Dashboard</h1>
                        <p className="text-muted-foreground">Manage your students and share knowledge</p>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-6 md:grid-cols-3 mb-8">
                    <Card className="shadow-soft">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                            <Users className="w-4 h-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">124</div> {/* Placeholder */}
                            <p className="text-xs text-muted-foreground mt-1">Across all classes</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-soft">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Questions This Week</CardTitle>
                            <MessageSquare className="w-4 h-4 text-secondary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">87</div> {/* Placeholder */}
                            <p className="text-xs text-muted-foreground mt-1">+12 from last week</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-soft">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Notes Shared</CardTitle>
                            <FileText className="w-4 h-4 text-accent" />
                        </CardHeader>
                        <CardContent>
                            {/* Dynamic count for notes */}
                            <div className="text-3xl font-bold">{isLoadingNotes ? '...' : notes.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">PDF, PPTX, DOCX</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                    {/* Link to Upload Note Page */}
                    <Link to="/notes/upload" className="block">
                        <Card className="h-full shadow-soft hover:shadow-hover transition-all hover:scale-105 cursor-pointer bg-gradient-primary text-white">
                        <CardHeader>
                            <FileUp className="w-12 h-12 mb-4" />
                            <CardTitle>Share Notes</CardTitle>
                            <CardDescription className="text-white/80">
                            Upload PDF, DOCX, or PPTX files
                            </CardDescription>
                        </CardHeader>
                        </Card>
                    </Link>

                     {/* Link to Create Quiz Page */}
                    <Link to="/quiz/create" className="block">
                        <Card className="h-full shadow-soft hover:shadow-hover transition-all hover:scale-105 cursor-pointer bg-gradient-secondary text-white">
                        <CardHeader>
                            <ClipboardCheck className="w-12 h-12 mb-4" />
                            <CardTitle>Create Quiz</CardTitle>
                            <CardDescription className="text-white/80">
                            Test your students' knowledge
                            </CardDescription>
                        </CardHeader>
                        </Card>
                    </Link>

                     {/* Placeholder Link for Viewing/Answering Questions */}
                    <Link to="#" className="block">
                        <Card className="h-full shadow-soft hover:shadow-hover transition-all hover:scale-105 cursor-pointer border-2 border-primary">
                        <CardHeader>
                            <MessageSquare className="w-12 h-12 mb-4 text-primary" />
                            <CardTitle>Answer Questions</CardTitle>
                            <CardDescription>
                            Help students with their queries
                            </CardDescription>
                        </CardHeader>
                        </Card>
                    </Link>
                </div>

                {/* Shared Notes List - UPDATED */}
                <Card className="shadow-soft mb-8">
                     <CardHeader>
                        <CardTitle>Shared Notes</CardTitle>
                        <CardDescription>Notes you have uploaded for students.</CardDescription>
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
                                <p>You haven't uploaded any notes yet.</p>
                                <Button size="sm" variant="link" asChild className="mt-2">
                                    <Link to="/notes/upload">Upload your first note</Link>
                                </Button>
                            </div>
                         ) : (
                             notes.map((note) => (
                                <div key={note._id} className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted rounded-lg group">
                                    <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                        {getFileTypeIcon(note.fileType)}
                                        <div className="overflow-hidden">
                                            <p className="font-semibold truncate" title={note.title}>{note.title}</p>
                                            <p className="text-sm text-muted-foreground truncate" title={note.fileName}>{note.fileName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                                        <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline">
                                            {formatTimeAgo(note.createdAt)}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDownloadNote(note._id, note.fileName)}
                                        >
                                            <Download className="mr-2 h-4 w-4" /> Download
                                        </Button>
                                         <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => handleDeleteNote(note._id, note.title)}
                                            title="Delete Note"
                                         >
                                             <Trash2 className="h-4 w-4" />
                                         </Button>
                                    </div>
                                </div>
                             ))
                         )}
                    </CardContent>
                </Card>


                {/* Recent Student Questions */}
                <Card className="shadow-soft">
                     <CardHeader>
                        <CardTitle>Recent Student Questions</CardTitle>
                        <CardDescription>Help your students by answering their questions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {isLoadingQuestions ? (
                            <>
                                <Skeleton className="h-16 w-full rounded-lg" />
                                <Skeleton className="h-16 w-full rounded-lg" />
                                <Skeleton className="h-16 w-full rounded-lg" />
                            </>
                        ) : questionsError ? (
                             <div className="text-center text-destructive py-4"><p>⚠️ {questionsError}</p></div>
                        ) : questions.length === 0 ? (
                             <div className="text-center text-muted-foreground py-4"><p>No questions found.</p></div>
                        ) : (
                            questions.map((question) => (
                                <div key={question._id} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                                    <div className="flex-1 mr-4">
                                         <Link to={`/questions/${question._id}`} className="hover:underline">
                                             <h3 className="font-semibold mb-1 line-clamp-2">{question.title}</h3>
                                        </Link>
                                        <p className="text-sm text-muted-foreground">
                                            Asked by {getAuthorDisplayName(question.author)} • {formatTimeAgo(question.createdAt)}
                                        </p>
                                    </div>
                                    <Button size="sm" asChild className="flex-shrink-0">
                                        <Link to={`/questions/${question._id}`}>Answer</Link>
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TeacherDashboard;