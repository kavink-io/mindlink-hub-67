// src/pages/FocusTimer.tsx
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Coffee, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK_DURATION = 5 * 60; // 5 minutes in seconds
const LONG_BREAK_DURATION = 15 * 60; // 15 minutes in seconds
const SESSIONS_BEFORE_LONG_BREAK = 4;

const FocusTimer = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<TimerMode>('work');
    const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
    const [isActive, setIsActive] = useState(false);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null); // For completion sound

    // --- Timer Logic ---
    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) {
                        clearInterval(intervalRef.current!);
                        handleTimerEnd();
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // Cleanup interval on component unmount or when isActive changes
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive]); // Rerun effect when isActive changes

     // --- Preload audio ---
     useEffect(() => {
        // Simple ding sound - replace with a better URL if you have one
        audioRef.current = new Audio('https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.wav');
        audioRef.current.preload = 'auto';
     }, []);


    // --- Handle Timer Completion ---
    const handleTimerEnd = () => {
        setIsActive(false);
        // Play sound
        audioRef.current?.play().catch(e => console.error("Audio play failed:", e));

        let nextMode: TimerMode;
        let nextTime: number;
        let sessions = sessionsCompleted;

        if (mode === 'work') {
            sessions++;
            setSessionsCompleted(sessions);
            toast.success("Work session complete! Time for a break. 🎉");
            if (sessions % SESSIONS_BEFORE_LONG_BREAK === 0) {
                nextMode = 'longBreak';
                nextTime = LONG_BREAK_DURATION;
            } else {
                nextMode = 'shortBreak';
                nextTime = SHORT_BREAK_DURATION;
            }
        } else { // It was a break
            toast.info("Break's over! Ready for the next session? 💪");
            nextMode = 'work';
            nextTime = WORK_DURATION;
        }

        setMode(nextMode);
        setTimeLeft(nextTime);
        // Optionally auto-start next timer: setIsActive(true);
    };

    // --- Control Handlers ---
    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        setIsActive(false);
        // Reset to the current mode's default duration
        let defaultTime;
        switch (mode) {
            case 'shortBreak': defaultTime = SHORT_BREAK_DURATION; break;
            case 'longBreak': defaultTime = LONG_BREAK_DURATION; break;
            default: defaultTime = WORK_DURATION; // 'work'
        }
        setTimeLeft(defaultTime);
        // Resetting doesn't change the mode or session count
    };

    // --- Skip to Next Mode ---
     const skipToNext = () => {
         if (intervalRef.current) clearInterval(intervalRef.current);
         handleTimerEnd(); // Trigger the end logic to switch mode
     };


    // --- Format Time ---
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // --- Calculate Progress ---
    const getDuration = (): number => {
        switch (mode) {
            case 'shortBreak': return SHORT_BREAK_DURATION;
            case 'longBreak': return LONG_BREAK_DURATION;
            default: return WORK_DURATION; // 'work'
        }
    };
    const progress = ((getDuration() - timeLeft) / getDuration()) * 100;

    // --- Get Mode Text ---
     const getModeText = (): string => {
        switch (mode) {
            case 'shortBreak': return 'Short Break';
            case 'longBreak': return 'Long Break';
            default: return 'Focus Session';
        }
     };

     // --- Update Title ---
      useEffect(() => {
        document.title = `${formatTime(timeLeft)} - ${getModeText()} | MindLink`;
      }, [timeLeft, mode]);


    return (
        <div className="min-h-screen bg-gradient-secondary flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg text-center">
                <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-2xl font-bold">{getModeText()}</CardTitle>
                         <Button variant="ghost" size="sm" onClick={() => navigate(-1)} disabled={isActive}>
                             <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                         </Button>
                    </div>
                     <CardDescription>
                         Session {mode === 'work' ? sessionsCompleted + 1 : sessionsCompleted} of {SESSIONS_BEFORE_LONG_BREAK}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6">
                    <div className="relative w-48 h-48"> {/* Container for circular progress/timer */}
                        {/* Basic Timer Display */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-6xl font-bold tabular-nums text-foreground">
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                        {/* TODO: Implement a circular progress bar here if desired */}
                         {/* Simple linear progress bar for now */}

                    </div>
                    <Progress value={progress} className="w-full h-2" />


                    <div className="flex items-center justify-center space-x-4 w-full">
                        <Button variant="outline" size="icon" onClick={resetTimer} disabled={isActive}>
                            <RotateCcw className="h-5 w-5" />
                             <span className="sr-only">Reset Timer</span>
                        </Button>
                        <Button
                            size="lg"
                            onClick={toggleTimer}
                            className={`w-28 ${isActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary hover:bg-primary/90'}`}
                        >
                            {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                            {isActive ? 'Pause' : 'Start'}
                        </Button>
                        <Button variant="outline" size="icon" onClick={skipToNext}>
                            {mode === 'work' ? <Coffee className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                             <span className="sr-only">Skip to {mode === 'work' ? 'Break' : 'Work'}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default FocusTimer;