/* ==========================================================================
   Main Application Controller - 3D Flip Book by Digi18 STUDIOS (HS)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // DOM Element References
    const elements = {
        pdfInput: document.getElementById('pdf-file-input'),
        btnUpload: document.getElementById('btn-upload'),
        btnDemoWelcome: document.getElementById('btn-demo-welcome'),
        btnSound: document.getElementById('btn-sound'),
        btnAmbient: document.getElementById('btn-ambient'),
        btnTheme: document.getElementById('btn-theme'),
        btnFullscreen: document.getElementById('btn-fullscreen'),
        selectEnvironment: document.getElementById('select-environment'),
        btnToggleSidebar: document.getElementById('btn-toggle-sidebar'),
        btnCloseSidebar: document.getElementById('btn-close-sidebar'),
        sidebar: document.getElementById('sidebar'),
        sidebarTabs: document.querySelectorAll('.sidebar-tab'),
        tabPanels: document.querySelectorAll('.tab-panel'),
        thumbnailsList: document.getElementById('thumbnails-list'),
        chaptersList: document.getElementById('chapters-list'),
        bookmarksList: document.getElementById('bookmarks-list'),
        welcomeState: document.getElementById('welcome-state'),
        loadingState: document.getElementById('loading-state'),
        loadingTitle: document.getElementById('loading-title'),
        loadingSubtitle: document.getElementById('loading-subtitle'),
        progressBar: document.getElementById('progress-bar'),
        bookWrapper: document.getElementById('book-wrapper'),
        flipbook: document.getElementById('flipbook'),
        toolbar: document.getElementById('toolbar'),
        btnMinimizeToolbar: document.getElementById('btn-minimize-toolbar'),
        btnExpandToolbar: document.getElementById('btn-expand-toolbar'),
        dropzone: document.getElementById('dropzone'),
        docTitle: document.getElementById('doc-title'),
        btnFirst: document.getElementById('btn-first'),
        btnPrev: document.getElementById('btn-prev'),
        btnNext: document.getElementById('btn-next'),
        btnLast: document.getElementById('btn-last'),
        inputPageNum: document.getElementById('input-page-num'),
        totalPagesCount: document.getElementById('total-pages-count'),
        btnZoomIn: document.getElementById('btn-zoom-in'),
        btnZoomOut: document.getElementById('btn-zoom-out'),
        btnZoomReset: document.getElementById('btn-zoom-reset'),
        zoomLevelText: document.getElementById('zoom-level-text'),
        btnOpenSearch: document.getElementById('btn-open-search'),
        btnCloseSearch: document.getElementById('btn-close-search'),
        btnClearSearch: document.getElementById('btn-clear-search'),
        searchModal: document.getElementById('search-modal'),
        inputSearchQuery: document.getElementById('input-search-query'),
        searchResultsList: document.getElementById('search-results-list'),
        btnSlideshow: document.getElementById('btn-slideshow'),
        selectSlideshowSpeed: document.getElementById('select-slideshow-speed'),
        btnBookmark: document.getElementById('btn-bookmark'),
        btnExportPng: document.getElementById('btn-export-png')
    };

    // Application State
    let currentZoom = 1.0;
    let pageDataURLs = [];
    let currentAspect = 0.75;
    let slideshowTimer = null;
    let isSlideshowPlaying = false;
    let savedBookmarks = new Set();
    let currentDocKey = 'default';

    // --- 3D Background Environment Selector ---
    elements.selectEnvironment.addEventListener('change', (e) => {
        document.documentElement.setAttribute('data-env', e.target.value);
    });

    // --- Audio Sound & Rain Ambience Toggles ---
    elements.btnSound.addEventListener('click', () => {
        const isEnabled = window.pageFlipAudio.toggleSound();
        elements.btnSound.innerHTML = `<i data-lucide="${isEnabled ? 'volume-2' : 'volume-x'}"></i>`;
        elements.btnSound.setAttribute('title', isEnabled ? 'Mute Sound Effects' : 'Unmute Sound Effects');
        if (window.lucide) window.lucide.createIcons();
    });

    elements.btnAmbient.addEventListener('click', () => {
        const isRainActive = window.pageFlipAudio.toggleAmbientSound();
        elements.btnAmbient.classList.toggle('active', isRainActive);
        elements.btnAmbient.setAttribute('title', isRainActive ? 'Stop Rain Ambience' : 'Start Focus Rain Ambience');
    });

    // --- Theme Toggle (Dark Blue / Light White) ---
    elements.btnTheme.addEventListener('click', () => {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        elements.btnTheme.innerHTML = `<i data-lucide="${newTheme === 'dark' ? 'sun' : 'moon'}"></i>`;
        if (window.lucide) window.lucide.createIcons();
    });

    // --- Fullscreen Toggle ---
    elements.btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.warn(err));
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    });

    // --- Sidebar Multi-Tab Drawer ---
    elements.btnToggleSidebar.addEventListener('click', () => {
        elements.sidebar.classList.toggle('collapsed');
    });

    elements.btnCloseSidebar.addEventListener('click', () => {
        elements.sidebar.classList.add('collapsed');
    });

    elements.sidebarTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.sidebarTabs.forEach(t => t.classList.remove('active'));
            elements.tabPanels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panelId = `panel-${tab.getAttribute('data-tab')}`;
            const targetPanel = document.getElementById(panelId);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });

    // --- Toolbar Minimize / Expand ---
    elements.btnMinimizeToolbar.addEventListener('click', () => {
        elements.toolbar.classList.add('minimized');
        elements.btnExpandToolbar.classList.remove('hidden');
    });

    elements.btnExpandToolbar.addEventListener('click', () => {
        elements.toolbar.classList.remove('minimized');
        elements.btnExpandToolbar.classList.add('hidden');
    });

    // --- Search Modal Handlers ---
    elements.btnOpenSearch.addEventListener('click', () => {
        elements.searchModal.classList.remove('hidden');
        elements.inputSearchQuery.focus();
    });

    elements.btnCloseSearch.addEventListener('click', () => {
        elements.searchModal.classList.add('hidden');
    });

    elements.btnClearSearch.addEventListener('click', () => {
        elements.inputSearchQuery.value = '';
        elements.searchResultsList.innerHTML = '<p class="search-hint">Type a word or phrase above to search this PDF document.</p>';
    });

    let searchDebounce = null;
    elements.inputSearchQuery.addEventListener('input', (e) => {
        clearTimeout(searchDebounce);
        const query = e.target.value;
        if (!query || query.trim() === '') {
            elements.searchResultsList.innerHTML = '<p class="search-hint">Type a word or phrase above to search this PDF document.</p>';
            return;
        }

        searchDebounce = setTimeout(async () => {
            elements.searchResultsList.innerHTML = '<p class="search-hint">Searching text content...</p>';
            const results = await window.pdfEngine.searchInDocument(query);
            renderSearchResults(results);
        }, 300);
    });

    function renderSearchResults(results) {
        elements.searchResultsList.innerHTML = '';
        if (results.length === 0) {
            elements.searchResultsList.innerHTML = '<p class="search-hint">No matching text found in this document.</p>';
            return;
        }

        results.forEach(res => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <div class="search-result-page">Page ${res.pageNumber}</div>
                <div class="search-result-snippet">${res.snippet}</div>
            `;
            item.addEventListener('click', () => {
                window.flipBookEngine.turnToPage(res.pageIndex);
                elements.searchModal.classList.add('hidden');
            });
            elements.searchResultsList.appendChild(item);
        });
    }

    // --- Slideshow Auto-Play ---
    elements.btnSlideshow.addEventListener('click', () => {
        isSlideshowPlaying = !isSlideshowPlaying;
        elements.btnSlideshow.innerHTML = `<i data-lucide="${isSlideshowPlaying ? 'pause' : 'play'}"></i>`;
        elements.btnSlideshow.classList.toggle('active', isSlideshowPlaying);
        if (window.lucide) window.lucide.createIcons();

        if (isSlideshowPlaying) {
            const delay = parseInt(elements.selectSlideshowSpeed.value, 10) || 5000;
            slideshowTimer = setInterval(() => {
                if (window.flipBookEngine.currentPage >= pageDataURLs.length - 1) {
                    elements.btnSlideshow.click();
                } else {
                    window.flipBookEngine.flipNext();
                }
            }, delay);
        } else {
            if (slideshowTimer) {
                clearInterval(slideshowTimer);
                slideshowTimer = null;
            }
        }
    });

    // --- Bookmarks Management ---
    elements.btnBookmark.addEventListener('click', () => {
        const pageIdx = window.flipBookEngine.currentPage;
        if (savedBookmarks.has(pageIdx)) {
            savedBookmarks.delete(pageIdx);
        } else {
            savedBookmarks.add(pageIdx);
        }
        saveBookmarksToStorage();
        updateBookmarkUI();
    });

    function saveBookmarksToStorage() {
        try {
            localStorage.setItem(`bookmarks_${currentDocKey}`, JSON.stringify(Array.from(savedBookmarks)));
        } catch (e) {}
    }

    function loadBookmarksFromStorage() {
        try {
            const stored = localStorage.getItem(`bookmarks_${currentDocKey}`);
            savedBookmarks = stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (e) {
            savedBookmarks = new Set();
        }
        updateBookmarkUI();
    }

    function updateBookmarkUI() {
        const isCurrentBookmarked = savedBookmarks.has(window.flipBookEngine.currentPage);
        elements.btnBookmark.classList.toggle('active', isCurrentBookmarked);

        elements.bookmarksList.innerHTML = '';
        if (savedBookmarks.size === 0) {
            elements.bookmarksList.innerHTML = '<p class="empty-state-text">No bookmarks saved yet. Click the bookmark icon on the toolbar to add one.</p>';
            return;
        }

        Array.from(savedBookmarks).sort((a, b) => a - b).forEach(pageIdx => {
            const item = document.createElement('div');
            item.className = 'chapter-item';
            item.innerHTML = `
                <span>Bookmark on Page ${pageIdx + 1}</span>
                <span class="chapter-page-badge">Jump</span>
            `;
            item.addEventListener('click', () => {
                window.flipBookEngine.turnToPage(pageIdx);
            });
            elements.bookmarksList.appendChild(item);
        });
    }

    // --- Export Active Page / Spread as High-Res PNG ---
    elements.btnExportPng.addEventListener('click', () => {
        const activeIdx = window.flipBookEngine.currentPage;
        if (pageDataURLs[activeIdx]) {
            const link = document.createElement('a');
            link.download = `flipbook-page-${activeIdx + 1}.png`;
            link.href = pageDataURLs[activeIdx];
            link.click();
        }
    });

    // --- PDF Upload Trigger ---
    elements.btnUpload.addEventListener('click', () => {
        elements.pdfInput.value = '';
        elements.pdfInput.click();
    });

    elements.pdfInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            loadUserPDF(file);
        } else if (file) {
            alert('Please select a valid PDF file.');
        }
    });

    // --- Load Demo Book ---
    if (elements.btnDemoWelcome) {
        elements.btnDemoWelcome.addEventListener('click', loadDemoBook);
    }

    // --- Drag and Drop PDF ---
    window.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.dropzone.classList.remove('hidden');
    });

    elements.dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        elements.dropzone.classList.add('hidden');
    });

    elements.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.dropzone.classList.add('hidden');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/pdf') {
                loadUserPDF(file);
            } else {
                alert('Please drop a valid PDF file.');
            }
        }
    });

    // --- Navigation Controls ---
    elements.btnNext.addEventListener('click', () => window.flipBookEngine.flipNext());
    elements.btnPrev.addEventListener('click', () => window.flipBookEngine.flipPrev());

    elements.btnFirst.addEventListener('click', () => window.flipBookEngine.turnToPage(0));
    elements.btnLast.addEventListener('click', () => {
        if (pageDataURLs.length > 0) {
            window.flipBookEngine.turnToPage(pageDataURLs.length - 1);
        }
    });

    elements.inputPageNum.addEventListener('change', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > pageDataURLs.length) val = pageDataURLs.length;
        window.flipBookEngine.turnToPage(val - 1);
    });

    // --- Zoom Controls ---
    elements.btnZoomIn.addEventListener('click', () => setZoom(currentZoom + 0.15));
    elements.btnZoomOut.addEventListener('click', () => setZoom(currentZoom - 0.15));
    elements.btnZoomReset.addEventListener('click', () => setZoom(1.0));

    function setZoom(zoom) {
        currentZoom = Math.min(Math.max(zoom, 0.6), 2.0);
        elements.bookWrapper.style.setProperty('--book-zoom', currentZoom);
        elements.zoomLevelText.textContent = `${Math.round(currentZoom * 100)}%`;
    }

    // --- Keyboard Shortcuts ---
    window.addEventListener('keydown', (e) => {
        if (elements.bookWrapper.classList.contains('hidden')) return;
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
            window.flipBookEngine.flipNext();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            window.flipBookEngine.flipPrev();
        } else if (e.key === 'Home') {
            window.flipBookEngine.turnToPage(0);
        } else if (e.key === 'End') {
            window.flipBookEngine.turnToPage(pageDataURLs.length - 1);
        }
    });

    // --- Load User Uploaded PDF ---
    async function loadUserPDF(file) {
        currentDocKey = file.name.replace(/[^a-zA-Z0-9]/g, '_');
        elements.docTitle.textContent = file.name;
        showLoading(true, 'Parsing PDF File...', 'Extracting high-res document pages & outlines');

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfData = await window.pdfEngine.loadPDF(arrayBuffer);
            currentAspect = pdfData.aspectRatio || 0.75;
            
            pageDataURLs = [];
            const total = pdfData.pageCount;

            for (let i = 1; i <= total; i++) {
                updateProgress((i / total) * 100, `Rendering Page ${i} of ${total}`);
                const dataUrl = await window.pdfEngine.renderPageToDataURL(i);
                pageDataURLs.push(dataUrl);
            }

            // Guarantee even page count for perfect 2-page spread pairing
            if (pageDataURLs.length % 2 !== 0) {
                pageDataURLs.push(window.pdfEngine.createBlankPageDataURL());
            }

            // Extract Chapter Outline
            const outline = await window.pdfEngine.extractOutline();
            renderChaptersOutline(outline);

            loadBookmarksFromStorage();
            await initFlipbook(pageDataURLs, currentAspect);
        } catch (error) {
            console.error('Failed to parse PDF:', error);
            alert('Could not render PDF. Please ensure the file is valid and not password-protected.');
            showLoading(false);
        }
    }

    // --- Load Demo Flipbook ---
    async function loadDemoBook() {
        currentDocKey = 'demo_brochure';
        elements.docTitle.textContent = 'Demo 3D Brochure';
        showLoading(true, 'Generating Demo Book...', 'Creating 3D vector pages');
        
        try {
            updateProgress(50, 'Rendering sample brochure pages');
            pageDataURLs = await window.pdfEngine.generateDemoBook();
            currentAspect = window.pdfEngine.aspectRatio;

            if (pageDataURLs.length % 2 !== 0) {
                pageDataURLs.push(window.pdfEngine.createBlankPageDataURL());
            }

            renderDemoChapters();
            loadBookmarksFromStorage();
            updateProgress(100, 'Ready');
            await initFlipbook(pageDataURLs, currentAspect);
        } catch (error) {
            console.error('Error generating demo book:', error);
            showLoading(false);
        }
    }

    // --- Render Chapters Tree ---
    function renderChaptersOutline(outline) {
        elements.chaptersList.innerHTML = '';
        if (!outline || outline.length === 0) {
            elements.chaptersList.innerHTML = '<p class="empty-state-text">No chapter outline detected in this PDF.</p>';
            return;
        }

        outline.forEach(ch => {
            const item = document.createElement('div');
            item.className = 'chapter-item';
            item.innerHTML = `
                <span>${ch.title}</span>
                <span class="chapter-page-badge">Page ${ch.pageIndex + 1}</span>
            `;
            item.addEventListener('click', () => {
                window.flipBookEngine.turnToPage(ch.pageIndex);
            });
            elements.chaptersList.appendChild(item);
        });
    }

    function renderDemoChapters() {
        const demoOutline = [
            { title: "01. Introduction", pageIndex: 0 },
            { title: "02. 3D Page Turn Physics", pageIndex: 1 },
            { title: "03. PDF.js Engine", pageIndex: 2 },
            { title: "04. Touch & Swipe Support", pageIndex: 3 },
            { title: "05. High-DPI Rendering", pageIndex: 4 },
            { title: "06. Custom Themes & Audio", pageIndex: 5 }
        ];
        renderChaptersOutline(demoOutline);
    }

    // --- Center Book Viewport on Closed Cover vs Open Pages ---
    function updateBookCentering(pageNum, totalPages) {
        if (window.flipBookEngine.isSinglePageMode || window.innerWidth <= 768) {
            elements.bookWrapper.className = 'book-wrapper center-normal';
            return;
        }

        if (pageNum === 0) {
            elements.bookWrapper.className = 'book-wrapper center-cover';
        } else if (pageNum === totalPages - 1) {
            elements.bookWrapper.className = 'book-wrapper center-back-cover';
        } else {
            elements.bookWrapper.className = 'book-wrapper center-normal';
        }
    }

    // --- Initialize 3D FlipBook View ---
    async function initFlipbook(images, aspectRatio) {
        showLoading(false);
        elements.welcomeState.classList.add('hidden');
        elements.bookWrapper.classList.remove('hidden');
        elements.toolbar.classList.remove('hidden');
        elements.toolbar.classList.remove('minimized');
        elements.btnExpandToolbar.classList.add('hidden');

        elements.totalPagesCount.textContent = images.length;
        elements.inputPageNum.value = 1;
        elements.inputPageNum.max = images.length;

        // Render Thumbnails
        renderThumbnails(images);

        // Bind FlipBook engine callbacks
        window.flipBookEngine.onPageChangeCallback = (pageNum, total) => {
            elements.inputPageNum.value = pageNum + 1;
            highlightActiveThumbnail(pageNum);
            updateBookCentering(pageNum, total);
            updateBookmarkUI();
        };

        window.flipBookEngine.onOrientationChangeCallback = () => {
            updateBookCentering(window.flipBookEngine.currentPage, images.length);
        };

        // Replace #flipbook with a fresh DOM element to clear any previous StPageFlip wrappers
        const oldFlipbook = document.getElementById('flipbook');
        const newFlipbook = document.createElement('div');
        newFlipbook.id = 'flipbook';
        newFlipbook.className = 'flipbook';
        if (oldFlipbook && oldFlipbook.parentNode) {
            oldFlipbook.parentNode.replaceChild(newFlipbook, oldFlipbook);
        }
        elements.flipbook = newFlipbook;

        // Wait 50ms for DOM layout reflow calculation
        await new Promise(resolve => setTimeout(resolve, 50));

        // Init 3D Flip Engine with exact PDF aspect ratio
        await window.flipBookEngine.init(elements.flipbook, images, { aspectRatio: aspectRatio });
        
        updateBookCentering(0, images.length);
        setZoom(1.0);
    }

    // --- Render Thumbnails Grid ---
    function renderThumbnails(images) {
        elements.thumbnailsList.innerHTML = '';
        images.forEach((imgUrl, idx) => {
            const item = document.createElement('div');
            item.className = `thumbnail-item ${idx === 0 ? 'active' : ''}`;
            item.setAttribute('data-page', idx);

            const img = document.createElement('img');
            img.src = imgUrl;
            img.alt = `Page ${idx + 1}`;

            const label = document.createElement('div');
            label.className = 'thumbnail-label';
            label.textContent = `Page ${idx + 1}`;

            item.appendChild(img);
            item.appendChild(label);

            item.addEventListener('click', () => {
                window.flipBookEngine.turnToPage(idx);
                highlightActiveThumbnail(idx);
            });

            elements.thumbnailsList.appendChild(item);
        });
    }

    function highlightActiveThumbnail(pageIndex) {
        const items = elements.thumbnailsList.querySelectorAll('.thumbnail-item');
        items.forEach((item, idx) => {
            if (idx === pageIndex) {
                item.classList.add('active');
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    }

    // --- Loading UI Helpers ---
    function showLoading(show, title = '', subtitle = '') {
        if (show) {
            elements.loadingState.classList.remove('hidden');
            elements.loadingTitle.textContent = title;
            elements.loadingSubtitle.textContent = subtitle;
            elements.progressBar.style.width = '0%';
        } else {
            elements.loadingState.classList.add('hidden');
        }
    }

    function updateProgress(percent, subtitleText) {
        elements.progressBar.style.width = `${percent}%`;
        if (subtitleText) {
            elements.loadingSubtitle.textContent = subtitleText;
        }
    }
});
