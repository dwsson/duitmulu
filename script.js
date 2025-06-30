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
    loadArchiveBtn.id = 'load-archive-btn'; // Assign ID for easier access if it's placed in HTML
    // We add it after articlesFeed, you might want to adjust its exact position in HTML later
    articlesFeed.insertAdjacentElement('afterend', loadArchiveBtn); 

    let activeLoanType = 'pinjol';
    let allLenderData = {}; 

    const BACKEND_URL = 'https://sandy-adaptable-pomelo.glitch.me'; 

    // Add this function to your script.js file, preferably near the top after the variable declarations

async function fetchAllLenderData() {
    try {
        console.log('Fetching all lender data...');
        
        const endpoints = [
            { type: 'pinjol', url: `${BACKEND_URL}/api/lenders/pinjol` },
            { type: 'kpr', url: `${BACKEND_URL}/api/lenders/kpr` },
            { type: 'kmg', url: `${BACKEND_URL}/api/lenders/kmg` }
        ];

        // Fetch data from all endpoints
        const fetchPromises = endpoints.map(async (endpoint) => {
            try {
                console.log(`Fetching ${endpoint.type} data from: ${endpoint.url}`);
                const response = await fetch(endpoint.url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                return { type: endpoint.type, data: data };
            } catch (error) {
                console.error(`Error fetching ${endpoint.type} data:`, error);
                return { type: endpoint.type, data: [] }; // Return empty array on error
            }
        });

        // Wait for all requests to complete
        const results = await Promise.allSettled(fetchPromises);
        
        // Process results and populate allLenderData
        results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
                const { type, data } = result.value;
                allLenderData[type] = data;
                console.log(`Successfully loaded ${data.length} ${type} lenders`);
            }
        });

        console.log('All lender data loaded:', allLenderData);
        
    } catch (error) {
        console.error('Error fetching all lender data:', error);
        // Initialize with empty arrays to prevent further errors
        allLenderData = {
            pinjol: [],
            kpr: [],
            kmg: []
        };
    }
}
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
            ${showReadMore ? '<button class="read-more-btn" type="button">Baca Selengkapnya</button>' : ''}
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
                articlesFeed.parentNode.appendChild(archiveContainer); // Appends after the current articles feed
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
            archiveContainer.id = 'archive-articles-feed';
            archiveContainer.innerHTML = '<h3>Arsip Artikel</h3><p style="color: red;">Gagal memuat arsip artikel.</p>';
            articlesFeed.parentNode.appendChild(archiveContainer);
        } finally {
            if (loadArchiveBtn) { // Safety check
                loadArchiveBtn.disabled = false;
                loadArchiveBtn.textContent = 'Lihat Arsip Artikel';
            }
        }
    }


    // Function to calculate monthly installment (simplified)
    function calculateMonthlyPayment(principal, monthlyInterestRate, tenorMonths) {
        // --- CALCULATION DEBUG LOGS START HERE ---
        console.log("--- Calculation Debug ---");
        console.log("Principal (P):", principal);
        console.log("Monthly Interest Rate (i):", monthlyInterestRate);
        console.log("Tenor (n):", tenorMonths);
        // --- CALCULATION DEBUG LOGS END HERE ---

        if (monthlyInterestRate === 0) {
            return principal / tenorMonths;
        }
        const i = monthlyInterestRate;
        const n = tenorMonths;
        const numerator = principal * i * Math.pow((1 + i), n);
        const denominator = Math.pow((1 + i), n) - 1;

        // --- CALCULATION DEBUG LOGS START HERE ---
        console.log("(1 + i):", (1 + i));
        console.log("Math.pow((1 + i), n):", Math.pow((1 + i), n));
        console.log("Numerator:", numerator);
        console.log("Denominator:", denominator);
        console.log("Result:", numerator / denominator);
        console.log("-----------------------");
        // --- CALCULATION DEBUG LOGS END HERE ---

        return numerator / denominator;
    }

    // Function to render results
    function renderResults(loanAmount, tenorMonths) {
        resultsDisplay.innerHTML = ''; // Clear previous results

        if (isNaN(loanAmount) || loanAmount <= 0 || isNaN(tenorMonths) || tenorMonths <= 0) {
            resultsDisplay.innerHTML = '<p style="color: red;">Mohon masukkan jumlah pinjaman dan tenor yang valid.</p>';
            return;
        }

        if (Object.keys(allLenderData).length === 0 || !allLenderData[activeLoanType]) {
            resultsDisplay.innerHTML = '<p style="color: orange;">Memuat data pemberi pinjaman... Silakan coba lagi sebentar.</p>';
            fetchAllLenderData(); 
            return;
        }

        const lenders = allLenderData[activeLoanType];

        if (!lenders || lenders.length === 0) {
            resultsDisplay.innerHTML = `<p>Tidak ada data pemberi pinjaman untuk kategori ${activeLoanType}.</p>`;
            return;
        }

        const calculations = lenders.map(lender => {
            const monthlyRate = lender.interestRate; 
            const monthlyPayment = calculateMonthlyPayment(loanAmount, monthlyRate, tenorMonths);
            const totalPayment = monthlyPayment * tenorMonths;
            const totalInterest = totalPayment - loanAmount;
            
            const adminFeeAmount = loanAmount * (lender.adminFeePercentage / 100); 
            const receivedAmount = loanAmount - adminFeeAmount;

            return {
                lender: {
                    name: lender.name,
                    logo: lender.logo,
                    website: lender.website,
                    whatsapp: lender.whatsapp
                },
                calculation: {
                    monthly_payment: monthlyPayment,
                    total_payment: totalPayment,
                    total_interest: totalInterest,
                    received_amount: receivedAmount,
                    interest_rate_display: (lender.interestRate * 100).toFixed(2), 
                    admin_fee_percentage_value: lender.adminFeePercentage, 
                    admin_fee_amount_display: adminFeeAmount 
                }
            };
        }).sort((a, b) => a.calculation.monthly_payment - b.calculation.monthly_payment);


        calculations.forEach(item => {
            const lender = item.lender;
            const calc = item.calculation;

            const lenderCard = document.createElement('div');
            lenderCard.classList.add('lender-card');

            lenderCard.innerHTML = `
                <img src="${lender.logo}" alt="${lender.name} Logo" class="lender-logo">
                <div class="lender-info">
                    <p class="lender-name">${lender.name}</p>
                    <div class="lender-details">
                        <p>Cicilan/Bulan: <span class="highlight">Rp ${Math.round(calc.monthly_payment).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span></p>
                        <p>Pinjaman Diterima: <span class="highlight">Rp ${Math.round(calc.received_amount).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span></p>
                        <p>Suku Bunga: ${ calc.interest_rate_display }% per bulan</p> 
                        <p>Biaya Admin: ${ Math.round(calc.admin_fee_amount_display).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                    <div class="lender-contact">
                        <a href="${lender.website}" target="_blank"><i class="fas fa-globe"></i> Website</a>
                        <a href="https://wa.me/${lender.whatsapp}" target="_blank"><i class="fab fa-whatsapp"></i> WhatsApp</a>
                    </div>
                </div>
            `;
            resultsDisplay.appendChild(lenderCard);
        });
    }

    // Event listeners for tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            activeLoanType = button.dataset.tab;
            resultsDisplay.innerHTML = '<p>Masukkan data di atas untuk melihat perbandingan pinjaman.</p>';
            if (jumlahPinjamanInput.value > 0 && tenorBulanInput.value > 0) {
                 renderResults(parseFloat(jumlahPinjamanInput.value), parseInt(tenorBulanInput.value)); 
            }
        });
    });

    // Event listener for calculation button
    calculateButton.addEventListener('click', () => {
        const jumlahPinjaman = parseFloat(jumlahPinjamanInput.value); 
        const tenorBulan = parseInt(tenorBulanInput.value);
        renderResults(jumlahPinjaman, tenorBulan);
    });

    // Optional: Trigger calculation on Enter key in input fields (restored to original)
    jumlahPinjamanInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateButton.click();
    });
    tenorBulanInput.addEventListener('keypress', (e) => { // Adding this for consistency if it was desired.
        if (e.key === 'Enter') calculateButton.click();
    });

    // Event listener for Load Archive Button
    loadArchiveBtn.addEventListener('click', fetchArchivedArticles);


    // Initial data fetch when the page loads
    fetchArticles(); // Fetch new articles
    fetchAllLenderData(); 
});
