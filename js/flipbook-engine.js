/* ==========================================================================
   FlipBook Engine - StPageFlip Integration & 3D Physics Controller
   ========================================================================== */

class FlipBookEngine {
    constructor() {
        this.pageFlip = null;
        this.currentPage = 0;
        this.totalPages = 0;
        this.onPageChangeCallback = null;
        this.onOrientationChangeCallback = null;
        this.isSinglePageMode = false;
        this.isFlippingSequence = false;
        this.sequenceInterval = null;
    }

    /**
     * Preload image element promise helper
     */
    preloadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(img);
            img.src = url;
        });
    }

    /**
     * Initialize StPageFlip instance inside container element
     */
    async init(containerEl, pageImages, options = {}) {
        if (this.pageFlip) {
            this.destroy();
        }

        // Clear existing interval or DOM elements
        if (this.sequenceInterval) {
            clearInterval(this.sequenceInterval);
            this.sequenceInterval = null;
        }
        this.isFlippingSequence = false;

        containerEl.innerHTML = '';

        this.totalPages = pageImages.length;
        this.currentPage = 0;

        // Preload all page images to prevent main canvas blank render bug
        await Promise.all(pageImages.map(url => this.preloadImage(url)));

        // Calculate responsive page dimensions based on actual PDF Aspect Ratio
        const aspectRatio = options.aspectRatio || 0.75;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let pageHeight = Math.min(viewportHeight * 0.78, 850);
        let pageWidth = pageHeight * aspectRatio;

        // Ensure page width fits nicely inside half viewport width on desktop
        if (pageWidth > viewportWidth * 0.45) {
            pageWidth = viewportWidth * 0.42;
            pageHeight = pageWidth / aspectRatio;
        }

        if (viewportWidth <= 768) {
            pageWidth = Math.min(viewportWidth * 0.88, 480);
            pageHeight = pageWidth / aspectRatio;
        }

        pageWidth = Math.round(pageWidth);
        pageHeight = Math.round(pageHeight);

        // Build DOM structure for StPageFlip
        pageImages.forEach((imgUrl, index) => {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            pageDiv.style.backgroundColor = '#ffffff';

            // Mark Front Cover (0) and Back Cover (last) as hard density
            pageDiv.setAttribute('data-density', index === 0 || index === pageImages.length - 1 ? 'hard' : 'soft');

            const pageContent = document.createElement('div');
            pageContent.className = 'page-content';
            pageContent.style.backgroundColor = '#ffffff';

            const img = document.createElement('img');
            img.src = imgUrl;
            img.alt = `Page ${index + 1}`;
            img.loading = 'eager';
            img.style.backgroundColor = '#ffffff';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'fill';

            pageContent.appendChild(img);
            pageDiv.appendChild(pageContent);
            containerEl.appendChild(pageDiv);
        });

        // Instantiate StPageFlip
        if (!window.St || !window.St.PageFlip) {
            throw new Error('StPageFlip library not loaded');
        }

        this.pageFlip = new window.St.PageFlip(containerEl, {
            width: pageWidth,
            height: pageHeight,
            size: 'fixed',
            minWidth: 250,
            maxWidth: 1200,
            minHeight: 350,
            maxHeight: 1400,
            maxShadowOpacity: 0.85, // Crisp 3D paper fold shadow opacity
            showCover: true, // 1st & Last page rendered as single cover view
            usePortrait: false, // Middle pages rendered in 2-page spread view on landscape screens
            mobileScrollSupport: false,
            drawShadow: true, // Enable native 3D shadow engine
            flippingTime: 550,
            startPage: 0,
            ...options
        });

        // Load pages into engine
        const pageNodes = containerEl.querySelectorAll('.page');
        this.pageFlip.loadFromHTML(pageNodes);
        
        // Force layout update and initial page render to prevent blank canvas bug
        try {
            this.pageFlip.update();
            this.pageFlip.turnToPage(0);
        } catch (e) {}

        // Event listeners
        this.pageFlip.on('flip', (e) => {
            this.currentPage = e.data;
            
            // Play paper turn sound effect
            if (window.pageFlipAudio && !this.isFlippingSequence) {
                window.pageFlipAudio.playPageTurnSound();
            }

            if (this.onPageChangeCallback) {
                this.onPageChangeCallback(this.currentPage, this.totalPages);
            }
        });

        this.pageFlip.on('changeState', (e) => {
            // Trigger sound on user corner drag flip start
            if (e.data === 'user_fold' && window.pageFlipAudio && !this.isFlippingSequence) {
                window.pageFlipAudio.playPageTurnSound();
            }
        });

        this.pageFlip.on('changeOrientation', (e) => {
            this.isSinglePageMode = e.data === 'portrait';
            if (this.onOrientationChangeCallback) {
                this.onOrientationChangeCallback(this.isSinglePageMode);
            }
        });

        return this.pageFlip;
    }

    /**
     * Animated 3D Page Turn to target Page Index (0-based) with realistic corner flip
     */
    turnToPage(pageIndex) {
        if (!this.pageFlip) return;
        pageIndex = Math.max(0, Math.min(pageIndex, this.totalPages - 1));
        if (this.currentPage === pageIndex) return;

        const corner = pageIndex > this.currentPage ? 'top-right' : 'top-left';
        
        try {
            // Trigger StPageFlip 3D animated corner flip
            this.pageFlip.flip(pageIndex, corner);
        } catch (e) {
            // Fallback to turnToPage if flip API is not supported for target
            this.pageFlip.turnToPage(pageIndex);
        }
    }

    /**
     * Flip Next
     */
    flipNext() {
        if (this.pageFlip) {
            this.pageFlip.flipNext();
        }
    }

    /**
     * Flip Prev
     */
    flipPrev() {
        if (this.pageFlip) {
            this.pageFlip.flipPrev();
        }
    }

    /**
     * Clean up and destroy StPageFlip instance
     */
    destroy() {
        if (this.sequenceInterval) {
            clearInterval(this.sequenceInterval);
            this.sequenceInterval = null;
        }
        if (this.pageFlip) {
            try {
                this.pageFlip.destroy();
            } catch (e) {
                console.warn('Error destroying pageFlip:', e);
            }
            this.pageFlip = null;
        }
    }
}

window.flipBookEngine = new FlipBookEngine();
