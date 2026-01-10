// src/lib/audio/sounds.ts
"use client";

type SoundType = "hit" | "double" | "triple" | "bull" | "miss" | "win" | "bust" | "change-turn" | "click";

class SoundManager {
    private static instance: SoundManager;
    private sounds: Map<SoundType, HTMLAudioElement>;
    private enabled: boolean = true;
    private initialized: boolean = false;

    private constructor() {
        this.sounds = new Map();
        if (typeof window !== "undefined") {
            this.preloadSounds();
        }
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private preloadSounds() {
        const soundFiles: Record<SoundType, string> = {
            hit: "/sounds/hit.mp3",
            double: "/sounds/double.mp3",
            triple: "/sounds/triple.mp3",
            bull: "/sounds/bull.mp3",
            miss: "/sounds/miss.mp3",
            win: "/sounds/win.mp3",
            bust: "/sounds/bust.mp3",
            "change-turn": "/sounds/change.mp3",
            click: "/sounds/click.mp3",
        };

        Object.entries(soundFiles).forEach(([key, path]) => {
            const audio = new Audio(path);
            audio.preload = "auto";
            this.sounds.set(key as SoundType, audio);
        });
    }

    public async play(type: SoundType) {
        if (!this.enabled) return;

        // Unlock audio context/interaction Requirement
        // Modern browsers usually require user interaction event at least once
        // but simple Audio elements often work if initiated in event handlers.

        const audio = this.sounds.get(type);
        if (audio) {
            try {
                audio.currentTime = 0;
                await audio.play();
            } catch (error) {
                // Ignoring autoplay policy errors which might happen initially
                console.warn(`Could not play sound ${type}:`, error);
            }
        }
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Call this on the first user interaction (e.g. initial game click)
     * to unlock audio on stricter browsers (iOS Safari)
     */
    public unlock() {
        if (this.initialized) return;

        // Play and immediately pause a silent sound or all sounds to unlock cache
        // Currently just a placeholder for future Web Audio API implementation if needed.
        // For HTML5 Audio, standard play() inside click handler is usually enough.
        this.initialized = true;
    }
}

export const soundManager = SoundManager.getInstance();
export type { SoundType };
