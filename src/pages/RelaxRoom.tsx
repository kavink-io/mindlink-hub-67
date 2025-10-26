// src/pages/RelaxRoom.tsx
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX, ArrowLeft, Sparkles } from 'lucide-react';
// Local fallback for notifications (avoids dependency on 'react-hot-toast')
const toast = { error: (msg: string) => { window.alert(msg); } };
import { useNavigate } from 'react-router-dom';
import relaxBg from '@/assets/relax-bg.jpg'; // Import the background image

// Placeholder audio URL - replace with your actual calming music URL
const MUSIC_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'; // Example MP3

const RelaxRoom = () => {
    const navigate = useNavigate();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize Audio on mount
    useEffect(() => {
        audioRef.current = new Audio(MUSIC_URL);
        audioRef.current.loop = true; // Loop the music
        audioRef.current.preload = 'auto';

        // Cleanup audio element on unmount
        return () => {
            audioRef.current?.pause();
            audioRef.current = null;
        };
    }, []);

    // Toggle Play/Pause
    const togglePlayPause = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            // Attempt to play, handle potential browser restrictions
            audioRef.current.play().catch(error => {
                console.error("Audio play failed:", error);
                // Browsers often require user interaction to play audio.
                // You might need an initial "Click to start" button if autoplay fails.
                toast.error("Could not play audio. Please interact with the page first.");
                setIsPlaying(false); // Ensure state reflects reality
            });
        }
        setIsPlaying(!isPlaying);
    };

    // Toggle Mute
    const toggleMute = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
            style={{ backgroundImage: `url(${relaxBg})` }} // Set background image
        >
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

            <Card className="w-full max-w-md shadow-lg text-center bg-background/80 relative z-10"> {/* Make card slightly transparent */}
                <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-2xl font-bold">Relax Room</CardTitle>
                         <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-foreground hover:bg-white/20">
                             <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                         </Button>
                    </div>
                     <CardDescription>
                         Take a moment to unwind with some calming music.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6">
                    {/* Placeholder for visualizer or animation if desired */}
                    <div className="w-48 h-48 bg-gradient-relax rounded-full flex items-center justify-center shadow-inner animate-pulse-slow">
                        <Sparkles className="w-16 h-16 text-white/70" /> {/* Placeholder icon */}
                    </div>


                    <div className="flex items-center justify-center space-x-4 w-full">
                        {/* Play/Pause Button */}
                        <Button
                            size="lg"
                            onClick={togglePlayPause}
                            className={`w-28 ${isPlaying ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary hover:bg-primary/90'}`}
                        >
                            {isPlaying ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                            {isPlaying ? 'Pause' : 'Play'}
                        </Button>

                         {/* Mute/Unmute Button */}
                         <Button variant="outline" size="icon" onClick={toggleMute}>
                            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                             <span className="sr-only">{isMuted ? 'Unmute' : 'Mute'}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
            {/* Simple CSS animation for pulsing effect */}
             <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.8; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.03); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
             `}</style>
        </div>
    );
};

export default RelaxRoom;