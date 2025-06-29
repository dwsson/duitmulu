document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const calculateButton = document.getElementById('calculate-button');
    const jumlahPinjamanInput = document.getElementById('jumlah-pinjaman');
    const tenorBulanInput = document.getElementById('tenor-bulan');
    const resultsDisplay = document.getElementById('results-display');
    const articlesFeed = document.getElementById('articles-feed'); 

    // NEW: Add a button to load archived articles (you'll need to add this button to index.html if not already there,
    // though this script can create it dynamically for now)
    const loadArchiveBtn = document.createElement('button');
    loadArchiveBtn.textContent = 'Lihat Arsip Artikel';
    loadArchiveBtn.classList.add('load-archive-btn');
    // We add it after articlesFeed, you might want to adjust its exact position in HTML later
    articlesFeed.insertAdjacentElement('afterend', loadArchiveBtn); 

    let activeLoanType = 'pinjol';
    let allLenderData = {}; 

    const BACKEND_URL = 'https://sandy-adaptable-pomelo.glitch.me'; 

    // Helper function to render a single article card
    function renderArticleCard(article, targetElement) {
        const articleCard = document.createElement('div');
        articleCard.classList.add('article-card');

        // Replace newlines with <br> tags for proper paragraph breaks in HTML
        const formattedContentWithBr = article.content.replace(/\n/g, '<br>'); 
        // Convert Markdown to HTML using marked.js (ensure marked.min.js is linked in index.html)
        const finalHtmlContent = marked.parse(formattedContentWithBr); 

        const originalSnippetText = article.content.substring(0, 0); // Snippet starts from 0
        let displaySnippet = originalSnippetText;
        let showReadMore = false;

        // Check if there's more content than the snippet
        if (article.content.length > 200) { // If original content is longer than 200 chars
            displaySnippet = marked.parse(article.content.substring(0, 200)).replace(/\n/g, '<br>');
            showReadMore = true;
        } else {
            // If content is 200 chars or less, show all and hide read more
            displaySnippet = finalHtmlContent;
            showReadMore = false;
        }


        // Add Date and Categories (Tags)
        const tagsHtml = article.tags.map(tag => `<span class="article-tag">${tag}</span>`).join(' ');
        const formattedDate = new Date(article.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

        articleCard.innerHTML = `
            <h3>${article.title}</h3>
            <p class="article-meta">
                <span class="article-date">${formattedDate}</span>
                <span class="article-categories">${tagsHtml}</span>
            </p>
            <p class="article-content-wrapper">
                <span class="article-snippet">${displaySnippet}</span>
                ${showReadMore ? `<span class="article-ellipsis" style="display:inline;">...</span><span class="article-full" style="display: none;">${finalHtmlContent}</span>` : ''}
            </p>
            ${showReadMore ? '<a href="#" class="read-more-btn">Baca Selengkapnya</a>' : ''}
        `;
        targetElement.appendChild(articleCard); 

        // Add event listener only if the button exists
        if (showReadMore) {
            const readMoreBtn = articleCard.querySelector('.read-more-btn');
            if (readMoreBtn) { // Safety check
                readMoreBtn.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    const contentWrapper = readMoreBtn.previousElementSibling; 
                    const snippetSpan = contentWrapper.querySelector('.article-snippet');
                    const ellipsisSpan = contentWrapper.querySelector('.article-ellipsis');
                    const fullSpan = contentWrapper.querySelector('.article-full');

                    if (fullSpan.style.display === 'none') {
                        snippetSpan.style.display = 'none';
                        ellipsisSpan.style.display = 'none';
                        fullSpan.style.display = 'block'; 
                        readMoreBtn.textContent = 'Sembunyikan'; 
                    } else {
                        snippetSpan.style.display = 'inline'; 
                        ellipsisSpan.style.display = 'inline';
                        fullSpan.style.display = 'none';
                        readMoreBtn.textContent = 'Baca Selengkapnya'; 
                    }
                });
            }
        }
    }


    // Function to fetch articles (now fetches multiple new ones)
    async function fetchArticles() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/articles?count=3`); 
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const responseData = await response.json(); 
            const articles = responseData.data; // Access the array of articles

            if (!articles || articles.length === 0) {
                 articlesFeed.innerHTML = '<p>Gagal memuat artikel. Tidak ada data.</p>';
                 return;
            }

            articlesFeed.innerHTML = ''; // Clear previous articles BEFORE adding new ones
            articles.forEach(article => { // Loop and render each
                renderArticleCard(article, articlesFeed);
            });

        } catch (error) {
            console.error('Error fetching articles:', error);
            articlesFeed.innerHTML = '<p>Gagal memuat artikel dari backend. (Pastikan backend berjalan dan URL benar).</p>';
        }
    }

    // NEW: Function to fetch archived articles
    async function fetchArchivedArticles() {
        try {
            if (loadArchiveBtn) { // Safety check for button
                loadArchiveBtn.disabled = true; 
                loadArchiveBtn.textContent = 'Memuat Arsip...';
            }

            const response = await fetch(`${BACKEND_URL}/api/articles/archive`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const responseData = await response.json();
            const archivedArticles = responseData.data;

            let archiveContainer = document.getElementById('archive-articles-feed');
            if (!archiveContainer) { // Create if it doesn't exist
                archiveContainer = document.createElement('div');
                archiveContainer.id = 'archive-articles-feed';
                archiveContainer.style.marginTop = '30px';
                archiveContainer.style.borderTop = '1px solid var(--light-purple)';
                archiveContainer.style.paddingTop = '20px';
                articlesFeed.parentNode.appendChild(archiveContainer); // Append after articlesFeed
            }
            
            archiveContainer.innerHTML = '<h3>Arsip Artikel</h3>'; // Clear previous archive content


            if (!archivedArticles || archivedArticles.length === 0) {
                archiveContainer.innerHTML += '<p>Tidak ada artikel dalam arsip.</p>';
            } else {
                // Sort by date, newest first
                archivedArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
                archivedArticles.forEach(article => {
                    renderArticleCard(article, archiveContainer);
                });
            }
            
            if (loadArchiveBtn) { // Safety check
                loadArchiveBtn.style.display = 'none'; 
            }

        } catch (error) {
            console.error('Error fetching archived articles:', error);
            const archiveContainer = document.getElementById('archive-articles-feed') || document.createElement('div');
            archiveContainer.id = 'archive-articles
