// src/pages/CreateQuiz.tsx
import { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // For marking correct answer
import { ArrowLeft, PlusCircle, Trash2 } from 'lucide-react'; // Icons
import { toast } from "sonner";

// Define the base URL for your backend API
const API_URL = "http://localhost:5000/api"; // Adjust port/host if needed

// Interfaces for quiz structure
interface Option {
    text: string;
    isCorrect: boolean;
}

interface QuestionData {
    questionText: string;
    options: Option[];
}

const CreateQuiz = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<QuestionData[]>([
        // Start with one empty question
        { questionText: '', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    // --- Question Handling ---
    const addQuestion = () => {
        setQuestions([
            ...questions,
            // Add a new question structure with 2 default options, first marked correct
            { questionText: '', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }
        ]);
    };

    const removeQuestion = (questionIndex: number) => {
        // Prevent removing the last question
        if (questions.length <= 1) {
            toast.warning("A quiz must have at least one question.");
            return;
        }
        setQuestions(questions.filter((_, index) => index !== questionIndex));
    };

    const handleQuestionTextChange = (questionIndex: number, value: string) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].questionText = value;
        setQuestions(updatedQuestions);
    };

    // --- Option Handling ---
    const addOption = (questionIndex: number) => {
        const updatedQuestions = [...questions];
        // Limit options if desired (e.g., max 4-5)
        if (updatedQuestions[questionIndex].options.length >= 5) {
             toast.info("Maximum of 5 options per question reached.");
             return;
        }
        updatedQuestions[questionIndex].options.push({ text: '', isCorrect: false });
        setQuestions(updatedQuestions);
    };

    const removeOption = (questionIndex: number, optionIndex: number) => {
        const updatedQuestions = [...questions];
        // Prevent removing below 2 options
        if (updatedQuestions[questionIndex].options.length <= 2) {
             toast.warning("A question must have at least two options.");
            return;
        }
         // If removing the currently correct option, mark the first one as correct
         if (updatedQuestions[questionIndex].options[optionIndex].isCorrect) {
             updatedQuestions[questionIndex].options[0].isCorrect = true;
         }
        updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter((_, index) => index !== optionIndex);
        setQuestions(updatedQuestions);
    };

    const handleOptionTextChange = (questionIndex: number, optionIndex: number, value: string) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].options[optionIndex].text = value;
        setQuestions(updatedQuestions);
    };

    const handleCorrectOptionChange = (questionIndex: number, correctOptionIndex: number) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].options.forEach((option, index) => {
            option.isCorrect = (index === correctOptionIndex);
        });
        setQuestions(updatedQuestions);
    };

    // --- Form Submission ---
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);

        // --- Frontend Validation ---
        if (!title.trim()) {
            toast.error("Quiz title cannot be empty.");
            setIsLoading(false);
            return;
        }
        if (questions.length === 0) {
            toast.error("Quiz must have at least one question.");
            setIsLoading(false);
            return;
        }
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.questionText.trim()) {
                toast.error(`Question ${i + 1} text cannot be empty.`);
                setIsLoading(false);
                return;
            }
            if (q.options.length < 2) {
                 toast.error(`Question ${i + 1} must have at least two options.`);
                 setIsLoading(false);
                 return;
            }
            if (!q.options.some(opt => opt.isCorrect)) {
                 toast.error(`Question ${i + 1} must have a correct answer selected.`);
                 setIsLoading(false);
                 return;
            }
             for (let j = 0; j < q.options.length; j++) {
                if(!q.options[j].text.trim()){
                     toast.error(`Option ${j + 1} in Question ${i + 1} cannot be empty.`);
                     setIsLoading(false);
                     return;
                }
             }
        }
        // --- End Validation ---


        const token = localStorage.getItem('mindlinkToken');
        if (!token) {
            toast.error("You must be logged in to create a quiz.");
            setIsLoading(false);
            navigate('/auth');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/quizzes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    description,
                    questions, // Send the array of questions
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            toast.success("Quiz created successfully!");
            navigate('/dashboard/teacher'); // Navigate back after creation

        } catch (error: any) {
            console.error("Failed to create quiz:", error);
            toast.error(error.message || "Failed to create quiz. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="container mx-auto max-w-3xl"> {/* Wider container */}
                 <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4" disabled={isLoading}>
                     <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                 </Button>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Create New Quiz</CardTitle>
                        <CardDescription>
                            Define the quiz details and add your questions below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8"> {/* Increased spacing */}
                            {/* Quiz Details */}
                            <div className="space-y-4 rounded-md border p-4">
                                <h3 className="text-lg font-semibold mb-2">Quiz Details</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="quiz-title" className="font-medium">Quiz Title *</Label>
                                    <Input
                                        id="quiz-title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., Chapter 1 Review"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quiz-description" className="font-medium">Description (Optional)</Label>
                                    <Textarea
                                        id="quiz-description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Briefly describe what this quiz covers..."
                                        rows={2}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Questions Section */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold">Questions</h3>
                                {questions.map((question, qIndex) => (
                                    <Card key={qIndex} className="p-4 bg-muted/50 relative"> {/* Use Card for each question */}
                                        <CardHeader className="p-0 pb-4"> {/* Adjust padding */}
                                             <Label htmlFor={`question-text-${qIndex}`} className="font-medium">Question {qIndex + 1}</Label>
                                             <Textarea
                                                id={`question-text-${qIndex}`}
                                                value={question.questionText}
                                                onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                                                placeholder={`Enter question ${qIndex + 1} text`}
                                                rows={2}
                                                required
                                                disabled={isLoading}
                                                className="bg-background" // Ensure textarea has background
                                             />
                                        </CardHeader>
                                        <CardContent className="p-0 space-y-3">
                                            <Label className="text-sm font-medium">Options (Select Correct Answer)</Label>
                                             <RadioGroup
                                                value={question.options.findIndex(opt => opt.isCorrect).toString()} // Value is the index of the correct option
                                                onValueChange={(value) => handleCorrectOptionChange(qIndex, parseInt(value))}
                                                className="space-y-2"
                                             >
                                                {question.options.map((option, oIndex) => (
                                                    <div key={oIndex} className="flex items-center space-x-2">
                                                         <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-opt${oIndex}`} disabled={isLoading} />
                                                        <Input
                                                            id={`q${qIndex}-opt${oIndex}-text`}
                                                            value={option.text}
                                                            onChange={(e) => handleOptionTextChange(qIndex, oIndex, e.target.value)}
                                                            placeholder={`Option ${oIndex + 1}`}
                                                            required
                                                            disabled={isLoading}
                                                            className="flex-1 h-9" // Adjust height
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                                            onClick={() => removeOption(qIndex, oIndex)}
                                                            disabled={isLoading || question.options.length <= 2}
                                                            aria-label="Remove Option"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                             </RadioGroup>
                                             <Button
                                                 type="button"
                                                 variant="outline"
                                                 size="sm"
                                                 onClick={() => addOption(qIndex)}
                                                 disabled={isLoading || question.options.length >= 5}
                                                 className="mt-2"
                                             >
                                                <PlusCircle className="mr-2 h-4 w-4" /> Add Option
                                            </Button>
                                        </CardContent>
                                        {/* Remove Question Button */}
                                         <Button
                                             type="button"
                                             variant="ghost"
                                             size="icon"
                                             className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
                                             onClick={() => removeQuestion(qIndex)}
                                             disabled={isLoading || questions.length <= 1}
                                             aria-label="Remove Question"
                                         >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </Card>
                                ))}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={addQuestion}
                                    disabled={isLoading}
                                    className="w-full sm:w-auto"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Question
                                </Button>
                            </div>

                            <Separator />

                            <div className="flex justify-end">
                                <Button type="submit" size="lg" disabled={isLoading}>
                                    {isLoading ? "Saving Quiz..." : "Create Quiz"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CreateQuiz;