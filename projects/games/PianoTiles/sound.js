/**
 * SoundManager - Handles all audio functionality for PianoTiles game
 * Provides melody sequences, chord progressions, and dynamic sound patterns
 */
class SoundManager {
    constructor() {
        this.soundEnabled = true;
        this.currentMelodyIndex = 0;
        this.currentNoteIndex = 0;
        this.isInitialized = false;

        // Available sound files
        this.soundFiles = {
            'a6': './sound/a6.mp3',
            'b6': './sound/b6.mp3',
            'c6': './sound/c6.mp3',
            'd6': './sound/d6.mp3',
            'e6': './sound/e6.mp3',
            'f6': './sound/f6.mp3',
            'g6': './sound/g6.mp3'
        };

        // Melody patterns for different game states
        this.melodies = {
            happy: ['c6', 'e6', 'g6', 'e6', 'c6'],
            blues: ['c6', 'f6', 'g6', 'f6', 'c6'],
            classical: ['c6', 'd6', 'e6', 'd6', 'c6'],
            upbeat: ['c6', 'g6', 'e6', 'g6', 'c6'],
            mysterious: ['g6', 'f6', 'e6', 'f6', 'g6'],
            adventurous: ['c6', 'e6', 'g6', 'a6', 'g6', 'e6'],
            triumphant: ['c6', 'e6', 'g6', 'c6', 'g6', 'c6'],
            zen: ['c6', 'a6', 'f6', 'c6', 'a6', 'f6']
        };

        // Melody progression sequence (skill-based progression)
        this.melodySequence = ['happy', 'classical', 'upbeat', 'blues', 'mysterious', 'adventurous', 'triumphant', 'zen'];
        this.currentSequenceIndex = 0;

        // Current active melody
        this.currentMelody = this.melodies.happy;

        // Audio context for advanced features
        this.audioContext = null;
        this.gainNode = null;

        this.init();
    }

    /**
     * Initialize the sound system
     */
    init() {
        // Create audio context for advanced audio features
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = 0.8; // Default volume
        } catch (e) {
            console.warn('Web Audio API not supported');
        }

        // Preload audio files
        this.preloadSounds();

        // Unlock audio for mobile devices
        this.unlockMobileAudio();

        this.isInitialized = true;
    }

    /**
     * Preload all sound files to reduce latency
     */
    preloadSounds() {
        this.preloadedSounds = {};
        Object.keys(this.soundFiles).forEach(note => {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.src = this.soundFiles[note];
            this.preloadedSounds[note] = audio;
        });
    }

    /**
     * Unlock audio on mobile devices (required by some browsers)
     */
    unlockMobileAudio() {
        const unlock = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            // Play a silent audio to unlock
            const silentAudio = new Audio();
            silentAudio.play().then(() => silentAudio.pause()).catch(() => {});
            document.removeEventListener('touchstart', unlock);
            document.removeEventListener('click', unlock);
        };

        document.addEventListener('touchstart', unlock, { once: true });
        document.addEventListener('click', unlock, { once: true });
    }

    /**
     * Play a single note
     * @param {string} note - Note to play (e.g., 'c6')
     * @param {number} volume - Volume level (0-1)
     */
    playNote(note, volume = 1.0) {
        if (!this.soundEnabled || !this.preloadedSounds[note]) return;

        try {
            const audio = this.preloadedSounds[note].cloneNode();
            audio.volume = volume;

            // Reset to beginning in case it was played recently
            audio.currentTime = 0;
            audio.play().catch(e => console.warn('Audio play failed:', e));
        } catch (e) {
            console.warn('Error playing note:', e);
        }
    }

    /**
     * Play the next note in the current melody sequence
     */
    playMelodyNote() {
        if (!this.soundEnabled) return;

        const note = this.currentMelody[this.currentNoteIndex];
        this.playNote(note);

        // Move to next note in melody
        this.currentNoteIndex = (this.currentNoteIndex + 1) % this.currentMelody.length;
    }

    /**
     * Play a chord (multiple notes simultaneously)
     * @param {Array} notes - Array of note names
     * @param {number} duration - How long to play (ms)
     */
    playChord(notes, duration = 300) {
        if (!this.soundEnabled) return;

        notes.forEach((note, index) => {
            // Slight delay for each note to create a richer sound
            setTimeout(() => {
                this.playNote(note, 0.4); // Lower volume for chords
            }, index * 50);
        });
    }

    /**
     * Play a rhythmic pattern
     * @param {Array} pattern - Array of {note, delay} objects
     */
    playRhythm(pattern) {
        if (!this.soundEnabled) return;

        pattern.forEach(({note, delay}) => {
            setTimeout(() => {
                this.playNote(note);
            }, delay);
        });
    }

    /**
     * Change the current melody pattern
     * @param {string} melodyName - Name of the melody pattern
     */
    setMelody(melodyName) {
        if (this.melodies[melodyName]) {
            this.currentMelody = this.melodies[melodyName];
            this.currentNoteIndex = 0; // Reset to beginning
        }
    }

    /**
     * Switch to the next melody in the sequence
     */
    nextMelodyInSequence() {
        this.currentSequenceIndex = (this.currentSequenceIndex + 1) % this.melodySequence.length;
        const nextMelodyName = this.melodySequence[this.currentSequenceIndex];
        this.musicalTransitionToMelody(nextMelodyName);
    }

    /**
     * Switch to the previous melody in the sequence
     */
    previousMelodyInSequence() {
        this.currentSequenceIndex = this.currentSequenceIndex === 0 ?
            this.melodySequence.length - 1 : this.currentSequenceIndex - 1;
        const prevMelodyName = this.melodySequence[this.currentSequenceIndex];
        this.transitionToMelody(prevMelodyName, 500); // 500ms smooth transition
    }

    /**
     * Check if current melody has completed a full cycle
     */
    isMelodyComplete() {
        return this.currentNoteIndex === 0;
    }

    /**
     * Get melody progression info for UI feedback
     */
    getMelodyProgress() {
        return {
            current: this.melodySequence[this.currentSequenceIndex],
            next: this.melodySequence[(this.currentSequenceIndex + 1) % this.melodySequence.length],
            progress: `${this.currentSequenceIndex + 1}/${this.melodySequence.length}`
        };
    }

    /**
     * Create a musical bridge transition between melodies
     * @param {string} fromMelody - Current melody name
     * @param {string} toMelody - Target melody name
     * @returns {Array} Array of transition notes
     */
    createMusicalBridge(fromMelody, toMelody) {
        const bridges = {
            // From upbeat to calm
            'upbeat': {
                'calm': ['e6', 'd6', 'c6'],
                'mystical': ['f6', 'e6', 'd6'],
                'dreamy': ['g6', 'f6', 'e6'],
                'energetic': ['a6', 'g6', 'f6'],
                'playful': ['b6', 'a6', 'g6'],
                'heroic': ['c6', 'b6', 'a6'],
                'melancholic': ['d6', 'c6', 'b6']
            },
            // From calm to upbeat
            'calm': {
                'upbeat': ['c6', 'd6', 'e6'],
                'mystical': ['d6', 'e6', 'f6'],
                'dreamy': ['e6', 'f6', 'g6'],
                'energetic': ['f6', 'g6', 'a6'],
                'playful': ['g6', 'a6', 'b6'],
                'heroic': ['a6', 'b6', 'c6'],
                'melancholic': ['b6', 'c6', 'd6']
            },
            // From mystical to other moods
            'mystical': {
                'upbeat': ['f6', 'e6', 'd6'],
                'calm': ['e6', 'd6', 'c6'],
                'dreamy': ['g6', 'f6', 'e6'],
                'energetic': ['a6', 'g6', 'f6'],
                'playful': ['b6', 'a6', 'g6'],
                'heroic': ['c6', 'b6', 'a6'],
                'melancholic': ['d6', 'c6', 'b6']
            },
            // From dreamy to other moods
            'dreamy': {
                'upbeat': ['g6', 'f6', 'e6'],
                'calm': ['f6', 'e6', 'd6'],
                'mystical': ['e6', 'd6', 'c6'],
                'energetic': ['a6', 'g6', 'f6'],
                'playful': ['b6', 'a6', 'g6'],
                'heroic': ['c6', 'b6', 'a6'],
                'melancholic': ['d6', 'c6', 'b6']
            },
            // From energetic to calmer moods
            'energetic': {
                'upbeat': ['a6', 'g6', 'f6'],
                'calm': ['g6', 'f6', 'e6'],
                'mystical': ['f6', 'e6', 'd6'],
                'dreamy': ['e6', 'd6', 'c6'],
                'playful': ['b6', 'a6', 'g6'],
                'heroic': ['c6', 'b6', 'a6'],
                'melancholic': ['d6', 'c6', 'b6']
            },
            // From playful to other moods
            'playful': {
                'upbeat': ['b6', 'a6', 'g6'],
                'calm': ['a6', 'g6', 'f6'],
                'mystical': ['g6', 'f6', 'e6'],
                'dreamy': ['f6', 'e6', 'd6'],
                'energetic': ['c6', 'b6', 'a6'],
                'heroic': ['d6', 'c6', 'b6'],
                'melancholic': ['e6', 'd6', 'c6']
            },
            // From heroic to other moods
            'heroic': {
                'upbeat': ['c6', 'b6', 'a6'],
                'calm': ['b6', 'a6', 'g6'],
                'mystical': ['a6', 'g6', 'f6'],
                'dreamy': ['g6', 'f6', 'e6'],
                'energetic': ['d6', 'c6', 'b6'],
                'playful': ['e6', 'd6', 'c6'],
                'melancholic': ['f6', 'e6', 'd6']
            },
            // From melancholic to other moods
            'melancholic': {
                'upbeat': ['d6', 'c6', 'b6'],
                'calm': ['c6', 'b6', 'a6'],
                'mystical': ['b6', 'a6', 'g6'],
                'dreamy': ['a6', 'g6', 'f6'],
                'energetic': ['e6', 'd6', 'c6'],
                'playful': ['f6', 'e6', 'd6'],
                'heroic': ['g6', 'f6', 'e6']
            }
        };

        // Return bridge sequence or default if not found
        return bridges[fromMelody]?.[toMelody] || ['c6', 'd6', 'e6'];
    }

    /**
     * Enhanced musical transition with bridge notes
     * @param {string} melodyName - Name of the melody to transition to
     */
    musicalTransitionToMelody(melodyName) {
        if (!this.soundEnabled || !this.melodies[melodyName]) return;

        const currentMelodyName = this.melodySequence[this.currentSequenceIndex === 0 ?
            this.melodySequence.length - 1 : this.currentSequenceIndex - 1];

        // Add atmospheric transition effects
        this.addAtmosphericTransition(currentMelodyName, melodyName);

        // Create musical bridge using the new structure
        const bridgeNotes = this.createMusicalBridge(currentMelodyName, melodyName);

        // Play bridge notes with rhythm and varying volumes for musicality
        bridgeNotes.forEach((note, index) => {
            const volume = index === bridgeNotes.length - 1 ? 0.5 : 0.3; // Last note louder
            const delay = index * 180 + (index > 0 ? Math.random() * 50 : 0); // Slight timing variation

            setTimeout(() => {
                this.playNote(note, volume);
            }, delay);
        });

        // After bridge, do smooth transition to new melody
        const bridgeDuration = bridgeNotes.length * 180 + 200;
        setTimeout(() => {
            this.transitionToMelody(melodyName, 1000); // Even smoother transition
        }, bridgeDuration);
    }

    /**
     * Add atmospheric transition effects
     * @param {string} fromMelody - Current melody name
     * @param {string} toMelody - Target melody name
     */
    addAtmosphericTransition(fromMelody, toMelody) {
        if (!this.soundEnabled) return;

        // Add subtle atmospheric notes during transition
        const atmosphericNotes = {
            'upbeat': ['g6', 'a6'],
            'calm': ['c6', 'e6'],
            'mystical': ['f6', 'b6'],
            'dreamy': ['d6', 'g6'],
            'energetic': ['a6', 'c6'],
            'playful': ['e6', 'b6'],
            'heroic': ['c6', 'g6'],
            'melancholic': ['d6', 'f6']
        };

        const fromNotes = atmosphericNotes[fromMelody] || ['c6'];
        const toNotes = atmosphericNotes[toMelody] || ['e6'];

        // Play subtle atmospheric notes
        [...fromNotes, ...toNotes].forEach((note, index) => {
            setTimeout(() => {
                this.playNote(note, 0.1); // Very quiet atmospheric notes
            }, index * 300 + Math.random() * 100);
        });
    }

    /**
     * Transition to a new melody with smooth fade effect
     * @param {string} melodyName - Name of the melody to transition to
     * @param {number} transitionDuration - Duration of transition in ms
     */
    transitionToMelody(melodyName, transitionDuration = 800) {
        if (!this.soundEnabled || !this.melodies[melodyName]) return;

        // If we have Web Audio API, use smooth volume transition
        if (this.gainNode) {
            // Fade out current melody
            const originalVolume = this.gainNode.gain.value;
            this.gainNode.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + transitionDuration / 1000);

            setTimeout(() => {
                // Change melody
                this.setMelody(melodyName);

                // Add a subtle transition note
                this.playNote('c6', 0.2);

                // Fade back in with a smoother curve
                setTimeout(() => {
                    this.gainNode.gain.exponentialRampToValueAtTime(originalVolume, this.audioContext.currentTime + transitionDuration / 2000);
                }, 50);
            }, transitionDuration);
        } else {
            // Fallback: simple delay without volume transition
            setTimeout(() => {
                this.setMelody(melodyName);
            }, transitionDuration / 2);
        }
    }

    /**
     * Set volume level
     * @param {number} volume - Volume level (0-1)
     */
    setVolume(volume) {
        if (this.gainNode) {
            this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Toggle sound on/off
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    /**
     * Get current sound state
     */
    isSoundEnabled() {
        return this.soundEnabled;
    }

    /**
     * Play a special effect for achievements or milestones
     * @param {string} type - Type of effect ('success', 'fail', 'milestone')
     */
    playEffect(type) {
        if (!this.soundEnabled) return;

        switch (type) {
            case 'success':
                this.playChord(['c6', 'e6', 'g6']);
                break;
            case 'fail':
                this.playRhythm([
                    {note: 'g6', delay: 0},
                    {note: 'f6', delay: 100},
                    {note: 'e6', delay: 200}
                ]);
                break;
            case 'milestone':
                this.playRhythm([
                    {note: 'c6', delay: 0},
                    {note: 'd6', delay: 100},
                    {note: 'e6', delay: 200},
                    {note: 'c6', delay: 300},
                    {note: 'd6', delay: 400},
                    {note: 'e6', delay: 500}
                ]);
                break;
        }
    }

    /**
     * Start background music loop
     * @param {number} interval - Interval between notes (ms)
     */
    startBackgroundMusic(interval = 2000) {
        if (this.backgroundInterval) {
            clearInterval(this.backgroundInterval);
        }

        this.backgroundInterval = setInterval(() => {
            if (this.soundEnabled) {
                const backgroundNotes = ['c6', 'g6', 'e6'];
                const randomNote = backgroundNotes[Math.floor(Math.random() * backgroundNotes.length)];
                this.playNote(randomNote, 0.2); // Very quiet background
            }
        }, interval);
    }

    /**
     * Stop background music
     */
    stopBackgroundMusic() {
        if (this.backgroundInterval) {
            clearInterval(this.backgroundInterval);
            this.backgroundInterval = null;
        }
    }
}

// Create global sound manager instance
const soundManager = new SoundManager();

// Export for use in other files
window.SoundManager = SoundManager;
window.soundManager = soundManager;

/*
SIMPLIFIED SOUND SYSTEM:

🎵 MELODY CHANGES: Every 25 tiles with smooth transitions (silent)
🎯 BASIC SOUND EFFECTS: Simple notes for hits, fail sounds for misses
🌊 ATMOSPHERIC SOUNDS: Subtle background notes during gameplay
🎼 PROGRESSION INDICATORS: Sounds when new tile waves appear

SOUND FEATURES:
- Simple melody note on successful tile hit
- Fail sound effect on missed tiles
- Melody progression every 25 tiles (silent transitions)
- Atmospheric background notes (2% chance per frame)
- Progression sounds when new tile waves generate

USAGE EXAMPLES:

// The system now provides:
// - Simple, clean sound experience
// - Melody progression every 25 tiles
// - Basic hit/miss feedback
// - Atmospheric ambiance

// Manual controls still available:
soundManager.setMelody('triumphant');
soundManager.playEffect('success');
soundManager.toggleSound();

AVAILABLE MELODIES:
- happy: Simple, cheerful pattern
- classical: Traditional scale progression
- upbeat: Energetic bounce pattern
- blues: Soulful minor progression
- mysterious: Atmospheric, suspenseful
- adventurous: Heroic, expansive
- triumphant: Victorious celebration
- zen: Calm, meditative pattern
*/
