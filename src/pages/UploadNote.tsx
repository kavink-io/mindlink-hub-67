// src/pages/UploadNote.tsx
import { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UploadCloud, FileCheck2, X } from 'lucide-react'; // Icons
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress"; // For upload progress indication

// Define the base URL for your backend API
const API_URL = "http://localhost:5000/api"; // Adjust port/host if needed

const UploadNote = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // Optional: for progress bar

    // Handle file selection
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            // Optional: Client-side validation for file type/size
            const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
            if (!allowedTypes.includes(file.type)) {
                toast.error("Invalid file type. Only PDF, DOCX, and PPTX are allowed.");
                setSelectedFile(null);
                event.target.value = ''; // Reset file input
                return;
            }
             if (file.size > 10 * 1024 * 1024) { // 10MB limit (matching backend)
                 toast.error("File is too large. Maximum size is 10MB.");
                 setSelectedFile(null);
                 event.target.value = ''; // Reset file input
                 return;
             }
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
        }
    };

    // Handle form submission
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedFile || !title.trim()) {
            toast.warning("Please provide a title and select a file.");
            return;
        }

        const token = localStorage.getItem('mindlinkToken');
        if (!token) {
            toast.error("You must be logged in to upload notes.");
            navigate('/auth');
            return;
        }

        setIsLoading(true);
        setUploadProgress(0); // Reset progress

        // Use FormData to send file and text data
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('noteFile', selectedFile); // 'noteFile' must match the name used in multer upload.single()

        try {
            // Use XMLHttpRequest for progress tracking (fetch doesn't easily support upload progress)
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                 setIsLoading(false);
                if (xhr.status >= 200 && xhr.status < 300) {
                    toast.success("Note uploaded successfully!");
                    // Navigate back to the teacher dashboard after successful upload
                    navigate('/dashboard/teacher');
                } else {
                     try {
                        const errorData = JSON.parse(xhr.responseText);
                        throw new Error(errorData.message || `Upload failed with status: ${xhr.status}`);
                    } catch (parseError) {
                         throw new Error(`Upload failed with status: ${xhr.status}`);
                    }
                }
            });

             xhr.addEventListener('error', () => {
                 setIsLoading(false);
                 console.error("Upload failed:", xhr.statusText);
                 toast.error("Upload failed. Network error or server issue.");
            });

             xhr.open('POST', `${API_URL}/notes/upload`);
             xhr.setRequestHeader('Authorization', `Bearer ${token}`);
             // Don't set Content-Type header when using FormData; the browser sets it correctly with boundary
             xhr.send(formData);


        } catch (error: any) { // Catch errors during setup, though XHR handles its own network errors
            setIsLoading(false);
            console.error("Failed to initiate upload:", error);
            toast.error(error.message || "Failed to initiate upload. Please try again.");
        }
        // NOTE: We don't set isLoading false here because XHR handles it in 'load'/'error' events
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                         <CardTitle className="text-2xl font-bold">Upload New Note</CardTitle>
                         <Button variant="ghost" size="sm" onClick={() => navigate(-1)} disabled={isLoading}>
                             <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                         </Button>
                    </div>
                    <CardDescription>
                        Share helpful notes (PDF, DOCX, PPTX) with your students. Max 10MB.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="note-title" className="font-semibold">Note Title *</Label>
                            <Input
                                id="note-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Chapter 5: Calculus Basics"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="note-description" className="font-semibold">Description (Optional)</Label>
                            <Textarea
                                id="note-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Briefly describe the content of the note..."
                                rows={3}
                                disabled={isLoading}
                            />
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="note-file" className="font-semibold">File *</Label>
                            {!selectedFile ? (
                                <Label
                                    htmlFor="note-file"
                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80"
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">PDF, DOCX, PPTX (MAX. 10MB)</p>
                                    </div>
                                    <Input
                                        id="note-file"
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                                        required
                                        disabled={isLoading}
                                    />
                                </Label>
                             ) : (
                                // Show selected file info
                                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileCheck2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                        <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                                        <span className="text-xs text-muted-foreground flex-shrink-0">
                                            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                        </span>
                                    </div>
                                    <Button
                                        type="button" // Prevent form submission
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => {
                                             setSelectedFile(null);
                                             // Reset the actual input element value if needed
                                             const fileInput = document.getElementById('note-file') as HTMLInputElement;
                                             if (fileInput) fileInput.value = '';
                                        }}
                                        disabled={isLoading}
                                    >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Remove file</span>
                                    </Button>
                                </div>
                             )}
                        </div>

                         {/* Optional Upload Progress Bar */}
                         {isLoading && uploadProgress > 0 && (
                            <div className="space-y-1">
                                <Progress value={uploadProgress} className="w-full h-2" />
                                <p className="text-xs text-muted-foreground text-center">{uploadProgress}% uploaded</p>
                            </div>
                         )}


                        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || !selectedFile || !title.trim()}>
                            {isLoading ? "Uploading..." : "Upload Note"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default UploadNote;