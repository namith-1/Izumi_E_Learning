import React, { useState, useEffect, useRef } from 'react';
import { Video, Clock, Loader2, CheckCircle } from 'lucide-react';

const VideoModule = ({ module, enrollmentStatus, onProgressUpdate, isCompleted, isProcessing }) => {
    const [currentTime, setCurrentTime] = useState(enrollmentStatus?.timeSpent || 0);
    const [duration, setDuration] = useState(0); // Store actual video duration
    
    const playerRef = useRef(null);
    const timerRef = useRef(null);
    const iframeId = `Youtubeer-${module.id}`; // Unique ID for the iframe

    // 1. Calculate 70% threshold based on REAL duration
    const completionThreshold = duration > 0 ? duration * 0.70 : Infinity;
    
    // Calculate progress percentage (safe against divide by zero)
    const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
    
    // 2. Check completion condition
    const needsCompletion = currentTime >= completionThreshold && !isCompleted && duration > 0;

    // Helper: Construct Embed URL with API enabled
    const getEmbedUrl = (url) => {
        if (!url) return `https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1`;
        const separator = url.includes('?') ? '&' : '?';
        // enablejsapi=1 is REQUIRED for the API to control the iframe
        return `${url}${separator}enablejsapi=1`;
    };

    // Effect: Initialize YouTube Player and Sync
    useEffect(() => {
        const checkYT = setInterval(() => {
            if (window.YT && window.YT.Player) {
                clearInterval(checkYT);
                
                // Initialize Player
                playerRef.current = new window.YT.Player(iframeId, {
                    events: {
                        onReady: (event) => {
                            // Get real duration once video loads
                            const realDuration = event.target.getDuration();
                            setDuration(realDuration);
                        },
                        onStateChange: (event) => {
                            // 1 = PLAYING
                            if (event.data === window.YT.PlayerState.PLAYING) {
                                startPolling();
                            } else {
                                stopPolling();
                            }
                        }
                    }
                });
            }
        }, 500); // Check every 500ms if API is ready

        return () => {
            clearInterval(checkYT);
            stopPolling();
            // Note: We avoid destroying the player here to prevent iframe flickering on re-renders,
            // but in a production app you might want to handle cleanup strictly.
        };
    }, [module.id]);

    // Polling logic to sync Time Bar with Video
    const startPolling = () => {
        stopPolling(); // Ensure no duplicates
        timerRef.current = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                const time = playerRef.current.getCurrentTime();
                const dur = playerRef.current.getDuration();
                
                // Sync state with video
                setCurrentTime(time);
                if (dur > 0) setDuration(dur);

                // Update backend periodically (every ~10 seconds)
                if (Math.floor(time) > 0 && Math.floor(time) % 10 === 0) {
                    onProgressUpdate(module.id, { timeSpent: Math.floor(time) });
                }
            }
        }, 1000);
    };

    const stopPolling = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    // 3. Mark as complete if condition is met
    useEffect(() => {
        if (needsCompletion) {
             if (!isProcessing) {
                onProgressUpdate(module.id, { 
                    completed: true, 
                    timeSpent: currentTime 
                });
             }
        }
    }, [needsCompletion, onProgressUpdate, module.id, currentTime, isProcessing]);

    const formatTime = (seconds) => {
        if (!seconds) return "0m 00s";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
    };

    return (
        <div className="content-module-card">
            <h3 className="module-content-header"><Video size={20} /> {module.title}</h3>
            
            <p className="description-text">{module.description}</p>
            
            <div className="video-wrapper">
                <iframe
                    id={iframeId}
                    title={module.title}
                    src={getEmbedUrl(module.videoLink)}
                    allowFullScreen
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
            </div>

            <div className="module-progress-bar-container">
                <div className="module-progress-bar" style={{ width: `${progressPercent}%` }}></div>
                <span className="progress-text">
                    {/* Display Real Video Time / Real Duration */}
                    {formatTime(currentTime)} / {formatTime(duration)} Watched 
                    ({progressPercent.toFixed(0)}%)
                </span>
            </div>
            
            <div className="module-action-footer">
                <p className="completion-rule">
                    Rule: Module completes automatically after watching 70% of the video 
                    {duration > 0 ? ` (${formatTime(completionThreshold)})` : ''}.
                </p>
                {isCompleted ? (
                    <button disabled className="btn-complete-module completed">
                        <CheckCircle size={18} /> Completed Automatically
                    </button>
                ) : (
                    <button disabled className="btn-complete-module disabled-btn">
                        {isProcessing ? <Loader2 className="animate-spin" size={18} /> : 'Watching...'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default VideoModule;