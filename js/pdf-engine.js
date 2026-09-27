/* ==========================================================================
   PDF Engine - Mozilla PDF.js Parser & Renderer + Search & Outline Extractor
   ========================================================================== */

class PDFEngine {
    constructor() {
        // Configure PDF.js Worker
        if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
        }
        this.pdfDoc = null;
        this.pageCount = 0;
        this.aspectRatio = 0.75; // Default aspect ratio (Portrait 3:4)
        this.renderScale = Math.max(window.devicePixelRatio || 1, 1.75); // High DPI crisp scale
        this.cachedText = [];
    }

    /**
     * Load PDF document from ArrayBuffer, File, or URL
     */
    async loadPDF(source) {
        try {
            let loadingTask;
            if (source instanceof ArrayBuffer) {
                loadingTask = window.pdfjsLib.getDocument({ data: source });
            } else if (typeof source === 'string') {
                loadingTask = window.pdfjsLib.getDocument(source);
            } else {
                throw new Error('Unsupported PDF source format');
            }

            this.pdfDoc = await loadingTask.promise;
            this.pageCount = this.pdfDoc.numPages;
            this.cachedText = [];

            // Get Aspect Ratio of first page
            const firstPage = await this.pdfDoc.getPage(1);
            const viewport = firstPage.getViewport({ scale: 1.0 });
            this.aspectRatio = viewport.width / viewport.height;

            return {
                pageCount: this.pageCount,
                aspectRatio: this.aspectRatio,
                width: viewport.width,
                height: viewport.height,
                metadata: await this.pdfDoc.getMetadata().catch(() => null)
            };
        } catch (error) {
            console.error('Error loading PDF:', error);
            throw error;
        }
    }

    /**
     * Extract PDF Chapter Outlines / Table of Contents
     */
    async extractOutline() {
        if (!this.pdfDoc) return [];
        try {
            const outline = await this.pdfDoc.getOutline();
            if (!outline) return [];

            const processOutlineItem = async (item) => {
                let pageIndex = 0;
                if (item.dest) {
                    let dest = item.dest;
                    if (typeof dest === 'string') {
                        dest = await this.pdfDoc.getDestination(dest);
                    }
                    if (Array.isArray(dest)) {
                        pageIndex = await this.pdfDoc.getPageIndex(dest[0]);
                    }
                }
                return {
                    title: item.title,
                    pageIndex: pageIndex,
                    items: item.items ? await Promise.all(item.items.map(processOutlineItem)) : []
                };
            };

            return await Promise.all(outline.map(processOutlineItem));
        } catch (e) {
            console.warn('Could not extract PDF outline:', e);
            return [];
        }
    }

    /**
     * Perform In-Document Text Search across Demo Book or Uploaded PDF
     */
    async searchInDocument(query) {
        if (!query || query.trim() === '') return [];
        const cleanQuery = query.toLowerCase().trim();
        const results = [];

        for (let i = 1; i <= this.pageCount; i++) {
            let pageText = this.cachedText[i - 1];
            if (!pageText && this.pdfDoc) {
                try {
                    const page = await this.pdfDoc.getPage(i);
                    const textContent = await page.getTextContent();
                    pageText = textContent.items.map(item => item.str).join(' ').replace(/\s+/g, ' ');
                    this.cachedText[i - 1] = pageText;
                } catch (e) {
                    pageText = '';
                }
            }

            if (pageText) {
                const lowerText = pageText.toLowerCase();
                const matchPos = lowerText.indexOf(cleanQuery);
                if (matchPos !== -1) {
                    const start = Math.max(0, matchPos - 30);
                    const end = Math.min(pageText.length, matchPos + cleanQuery.length + 30);
                    const snippet = pageText.substring(start, end);

                    results.push({
                        pageIndex: i - 1, // 0-based index
                        pageNumber: i,    // 1-based display
                        snippet: `...${snippet}...`
                    });
                }
            }
        }
        return results;
    }

    /**
     * Render a single PDF page onto an HTML5 Canvas element
     */
    async renderPageToCanvas(pageNumber, customScale = null) {
        if (!this.pdfDoc) throw new Error('No PDF loaded');
        
        const page = await this.pdfDoc.getPage(pageNumber);
        const scale = customScale || this.renderScale;
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;
        return {
            canvas: canvas,
            width: viewport.width,
            height: viewport.height,
            aspectRatio: viewport.width / viewport.height
        };
    }

    /**
     * Get Data URL representation of a rendered page
     */
    async renderPageToDataURL(pageNumber, customScale = null) {
        const { canvas } = await this.renderPageToCanvas(pageNumber, customScale);
        return canvas.toDataURL('image/jpeg', 0.95);
    }

    /**
     * Create a solid white blank page data URL for odd-page padding
     */
    createBlankPageDataURL(width = 800, height = 1100) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        return canvas.toDataURL('image/jpeg', 0.95);
    }

    /**
     * Generate an 8-page built-in Demo Flipbook (Canvas-rendered brochure)
     */
    async generateDemoBook() {
        const demoPages = [];
        const totalDemoPages = 8;
        const width = 800;
        const height = 1100;
        this.aspectRatio = width / height;
        this.pdfDoc = null;
        this.cachedText = [];

        const titles = [
            "FLIPBOOK 3D",
            "EXQUISITE 3D PAGE TURNS",
            "PDF.JS ENGINE INTEGRATION",
            "TOUCH & SWIPE SUPPORT",
            "HIGH-DPI CANVAS RENDERING",
            "CUSTOM THEMES & AUDIO",
            "PRODUCTIVITY TOOLKIT",
            "GET STARTED TODAY"
        ];

        const colors = [
            ['#4f46e5', '#818cf8'],
            ['#059669', '#34d399'],
            ['#d97706', '#fbbf24'],
            ['#2563eb', '#60a5fa'],
            ['#7c3aed', '#a78bfa'],
            ['#db2777', '#f472b6'],
            ['#0891b2', '#22d3ee'],
            ['#4f46e5', '#818cf8']
        ];

        for (let i = 0; i < totalDemoPages; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Background Gradient
            const grad = ctx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, colors[i][0]);
            grad.addColorStop(1, colors[i][1]);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);

            // Subtle paper grid pattern
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            for (let x = 40; x < width; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }

            // Page Outer Frame
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 12;
            ctx.strokeRect(30, 30, width - 60, height - 60);

            // Title Header
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`PAGE ${i + 1}`, width / 2, 100);

            ctx.font = '800 40px "Outfit", sans-serif';
            ctx.fillText(titles[i], width / 2, 220);

            // Decorative Graphic Element
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, 180, 0, Math.PI * 2);
            ctx.fill();

            // Inner Icon / Illustration Text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 90px "Outfit", sans-serif';
            ctx.fillText(`0${i + 1}`, width / 2, height / 2 + 30);

            // Subtitle & Body text
            ctx.font = '400 22px "Inter", sans-serif';
            ctx.fillText("Interactive 3D Realistic Paper Physics", width / 2, height - 260);

            ctx.font = '300 18px "Inter", sans-serif';
            ctx.fillText("Built by Digi18 STUDIOS (HS)", width / 2, height - 220);

            // Footer
            ctx.font = '500 16px "Inter", sans-serif';
            ctx.fillText("3D Flip Book • Interactive PDF Engine", width / 2, height - 80);

            demoPages.push(canvas.toDataURL('image/jpeg', 0.95));

            // Cache Demo page text for search indexing
            this.cachedText[i] = `PAGE ${i + 1} ${titles[i]} Interactive 3D Realistic Paper Physics Built by Digi18 STUDIOS (HS) 3D Flip Book Interactive PDF Engine`;
        }

        this.pageCount = totalDemoPages;
        return demoPages;
    }
}

window.pdfEngine = new PDFEngine();
