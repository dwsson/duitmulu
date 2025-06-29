document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const calculateButton = document.getElementById('calculate-button');
    const jumlahPinjamanInput = document.getElementById('jumlah-pinjaman');
    const tenorBulanInput = document.getElementById('tenor-bulan');
    const resultsDisplay = document.getElementById('results-display');
    const articlesFeed = document.getElementById('articles-feed'); 

    // Create archive button dynamically (since it's not in HTML)
    const loadArchiveBtn = document.createElement('button');
    loadArchiveBtn.textContent = 'Lihat Arsip Artikel';
    loadArchiveBtn.classList.add('load-archive-btn');
    loadArchiveBtn.id = 'load-archive-btn';
    articlesFeed.insertAdjacentElement('afterend', loadArchiveBtn); 

    let activeLoanType = 'pinjol';
    let allLenderData = {}; 

    const BACKEND_URL = 'https://sandy-adaptable-pomelo.glitch.me'; 

    // Tab functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            // Update active loan type
            activeLoanType = button.dataset.tab;
            // Clear previous results
            resultsDisplay.innerHTML = '<p>Masukkan data di atas untuk melihat perbandingan pinjaman.</p>';
            console.log('Active loan type:', activeLoanType);
        });
    });

    // Function to fetch lender data
    async function fetchAllLenderData() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/lenders`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allLenderData = data;
            return data;
        } catch (error) {
            console.error('Error fetching lender data:', error);
            return {};
        }
    }

    // Helper function to render a single article card
    function renderArticleCard(article, targetElement) {
        const articleCard = document.createElement('div');
        articleCard.classList.add('article-card');

        // Safely handle article content
        const content = article.content || '';
        const title = article.title || 'Untitled';
        const date = article.date || new Date().toISOString();
        const tags = article.tags || [];

        // Replace newlines with <br> tags for proper paragraph breaks in HTML
        const formattedContentWithBr = content.replace(/\n/g, '<br>'); 
        
        // Check if marked.js is available, otherwise use plain text
        let finalHtmlContent;
        if (typeof marked !== 'undefined' && marked.parse) {
            try {
                finalHtmlContent = marked.parse(content);
            } catch (error) {
                console.error('Error parsing markdown:', error);
                finalHtmlContent = formattedContentWithBr;
            }
        } else {
            finalHtmlContent = formattedContentWithBr;
        }

        let displaySnippet = '';
        let showReadMore = false;

        // Check if there's more content than the snippet
        if (content.length > 200) {
            displaySnippet = content.substring(0, 200).replace(/\n/g, '<br>');
            showReadMore = true;
        } else {
            displaySnippet = finalHtmlContent;
            showReadMore = false;
        }

        // Add Date and Categories (Tags)
        const tagsHtml = tags.map(tag => `<span class="article-tag">${tag}</span>`).join(' ');
        const formattedDate = new Date(date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

        articleCard.innerHTML = `
            <h3>${title}</h3>
            <p class="article-meta">
                <span class="article-date">${formattedDate}</span>
                <span class="article-categories">${tagsHtml}</span>
            </p>
            <div class="article-content-wrapper">
                <div class="article-snippet">${displaySnippet}</div>
                ${showReadMore ? `<div class="article-full" style="display: none;">${finalHtmlContent}</div>` : ''}
                ${showReadMore ? '<div class="article-ellipsis">...</div>' : ''}
            </div>
            ${showReadMore ? '<button class="read-more-btn" type="button">Baca Selengkapnya</button>' : ''}
        `;
        targetElement.appendChild(articleCard); 

        // Add event listener only if the button exists
        if (showReadMore) {
            const readMoreBtn = articleCard.querySelector('.read-more-btn');
            if (readMoreBtn) {
                readMoreBtn.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    const contentWrapper = articleCard.querySelector('.article-content-wrapper');
                    const snippetDiv = contentWrapper.querySelector('.article-snippet');
                    const ellipsisDiv = contentWrapper.querySelector('.article-ellipsis');
                    const fullDiv = contentWrapper.querySelector('.article-full');

                    // Add safety checks to prevent null errors
                    if (!snippetDiv || !fullDiv) {
                        console.error('Could not find required elements for read more functionality');
                        console.log('Available elements:', { snippetDiv, ellipsisDiv, fullDiv });
                        return;
                    }

                    const isExpanded = fullDiv.style.display !== 'none';

                    if (!isExpanded) {
                        // Show full content
                        snippetDiv.style.display = 'none';
                        if (ellipsisDiv) ellipsisDiv.style.display = 'none';
                        fullDiv.style.display = 'block'; 
                        readMoreBtn.textContent = 'Sembunyikan'; 
                    } else {
                        // Show snippet
                        snippetDiv.style.display = 'block'; 
                        if (ellipsisDiv) ellipsisDiv.style.display = 'block';
                        fullDiv.style.display = 'none';
                        readMoreBtn.textContent = 'Baca Selengkapnya'; 
                    }
                });
            }
        }
    }

    // Function to fetch articles
    async function fetchArticles() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/articles?count=3`); 
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const responseData = await response.json(); 
            const articles = responseData.data;

            if (!articles || articles.length === 0) {
                 articlesFeed.innerHTML = '<p>Gagal memuat artikel. Tidak ada data.</p>';
                 return;
            }

            articlesFeed.innerHTML = '';
            articles.forEach(article => {
                renderArticleCard(article, articlesFeed);
            });

        } catch (error) {
            console.error('Error fetching articles:', error);
            articlesFeed.innerHTML = '<p>Gagal memuat artikel dari backend. (Pastikan backend berjalan dan URL benar).</p>';
        }
    }

    // Function to fetch archived articles
    async function fetchArchivedArticles() {
        try {
            if (loadArchiveBtn) {
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
            if (!archiveContainer) {
                archiveContainer = document.createElement('div');
                archiveContainer.id = 'archive-articles-feed';
                archiveContainer.style.marginTop = '30px';
                archiveContainer.style.borderTop = '1px solid var(--light-purple)';
                archiveContainer.style.paddingTop = '20px';
                articlesFeed.parentNode.appendChild(archiveContainer);
            }
            
            archiveContainer.innerHTML = '<h3>Arsip Artikel</h3>';

            if (!archivedArticles || archivedArticles.length === 0) {
                archiveContainer.innerHTML += '<p>Tidak ada artikel dalam arsip.</p>';
            } else {
                archivedArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
                archivedArticles.forEach(article => {
                    renderArticleCard(article, archiveContainer);
                });
            }
            
            if (loadArchiveBtn) {
                loadArchiveBtn.style.display = 'none'; 
            }

        } catch (error) {
            console.error('Error fetching archived articles:', error);
            const archiveContainer = document.getElementById('archive-articles-feed') || document.createElement('div');
            archiveContainer.id = 'archive-articles-feed';
            archiveContainer.innerHTML = '<p>Gagal memuat arsip artikel.</p>';
        }
    }

    // Function to render loan calculation results
    function renderResults() {
        const jumlahPinjaman = parseFloat(jumlahPinjamanInput.value) || 0;
        const tenorBulan = parseInt(tenorBulanInput.value) || 0;
        
        console.log('Calculate button clicked:', { jumlahPinjaman, tenorBulan, activeLoanType });
        
        if (jumlahPinjaman <= 0 || tenorBulan <= 0) {
            resultsDisplay.innerHTML = '<div class="error-message"><p>⚠️ Masukkan jumlah pinjaman dan tenor yang valid.</p><p>Jumlah pinjaman harus lebih dari 0 dan tenor harus minimal 1 bulan.</p></div>';
            return;
        }

        resultsDisplay.innerHTML = '<div class="loading-message"><p>🔄 Menghitung opsi pinjaman...</p></div>';

        // Calculate directly without waiting for API (since we're doing basic calculation)
        try {
            const results = calculateLoanOptions(jumlahPinjaman, tenorBulan, activeLoanType);
            displayResults(results);
        } catch (error) {
            console.error('Error in renderResults:', error);
            resultsDisplay.innerHTML = '<div class="error-message"><p>❌ Terjadi kesalahan saat menghitung pinjaman.</p></div>';
        }
    }

    // Function to calculate loan options
    function calculateLoanOptions(principal, tenure, loanType) {
        console.log('Calculating loan options:', { principal, tenure, loanType });
        
        const results = [];
        
        // Different rates and configurations for different loan types
        let loanConfigs = [];
        
        switch(loanType) {
            case 'pinjol':
                loanConfigs = [
                    { name: 'Pinjol A (Rendah)', rate: 0.12, processingFee: 0.02 },
                    { name: 'Pinjol B (Sedang)', rate: 0.18, processingFee: 0.03 },
                    { name: 'Pinjol C (Tinggi)', rate: 0.24, processingFee: 0.05 }
                ];
                break;
            case 'kpr':
                loanConfigs = [
                    { name: 'Bank A (Fixed)', rate: 0.075, processingFee: 0.01 },
                    { name: 'Bank B (Floating)', rate: 0.085, processingFee: 0.015 },
                    { name: 'Bank C (Syariah)', rate: 0.08, processingFee: 0.012 }
                ];
                break;
            case 'kmg':
                loanConfigs = [
                    { name: 'Multifinance A', rate: 0.10, processingFee: 0.02 },
                    { name: 'Multifinance B', rate: 0.12, processingFee: 0.025 },
                    { name: 'Bank Kredit', rate: 0.095, processingFee: 0.018 }
                ];
                break;
            default:
                loanConfigs = [
                    { name: 'Standard Loan', rate: 0.12, processingFee: 0.02 }
                ];
        }

        loanConfigs.forEach(config => {
            // Calculate monthly payment using compound interest formula
            const monthlyRate = config.rate / 12;
            const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
            const totalPayment = monthlyPayment * tenure;
            const totalInterest = totalPayment - principal;
            const processingFee = principal * config.processingFee;

            results.push({
                lender: config.name,
                monthlyPayment: monthlyPayment,
                totalPayment: totalPayment + processingFee,
                totalInterest: totalInterest,
                processingFee: processingFee,
                interestRate: config.rate * 100,
                principal: principal,
                tenure: tenure
            });
        });

        // Sort by total payment (cheapest first)
        results.sort((a, b) => a.totalPayment - b.totalPayment);
        
        console.log('Calculated results:', results);
        return results;
    }

    // Function to display calculation results
    function displayResults(results) {
        console.log('Displaying results:', results);
        
        if (results.length === 0) {
            resultsDisplay.innerHTML = '<div class="error-message"><p>❌ Tidak ada data pemberi pinjaman yang tersedia.</p></div>';
            return;
        }

        let resultHTML = `
            <div class="loan-results">
                <div class="results-header">
                    <h4>📊 Perbandingan ${activeLoanType.toUpperCase()}</h4>
                    <p>Menampilkan ${results.length} opsi pinjaman (diurutkan dari termurah)</p>
                </div>
        `;
        
        results.forEach((result, index) => {
            const isBest = index === 0;
            resultHTML += `
                <div class="loan-option ${isBest ? 'best-option' : ''}">
                    ${isBest ? '<div class="best-badge">💎 Pilihan Terbaik</div>' : ''}
                    <h5>${result.lender}</h5>
                    <div class="loan-details">
                        <div class="detail-row">
                            <span class="label">💰 Cicilan Bulanan:</span>
                            <span class="value">Rp ${Math.round(result.monthlyPayment).toLocaleString('id-ID')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">💸 Total Pembayaran:</span>
                            <span class="value">Rp ${Math.round(result.totalPayment).toLocaleString('id-ID')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">📈 Total Bunga:</span>
                            <span class="value">Rp ${Math.round(result.totalInterest).toLocaleString('id-ID')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">📋 Biaya Admin:</span>
                            <span class="value">Rp ${Math.round(result.processingFee).toLocaleString('id-ID')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">📊 Suku Bunga:</span>
                            <span class="value">${result.interestRate.toFixed(2)}% per tahun</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        resultHTML += '</div>';
        resultsDisplay.innerHTML = resultHTML;
    }

    // Event listeners
    if (calculateButton) {
        calculateButton.addEventListener('click', renderResults);
    }

    if (loadArchiveBtn) {
        loadArchiveBtn.addEventListener('click', fetchArchivedArticles);
    }

    // Initialize the application
    fetchArticles();
    fetchAllLenderData();
});
