document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const calculateButton = document.getElementById('calculate-button');
    const jumlahPinjamanInput = document.getElementById('jumlah-pinjaman');
    const tenorBulanInput = document.getElementById('tenor-bulan');
    const resultsDisplay = document.getElementById('results-display');
    const articlesFeed = document.getElementById('articles-feed'); // Get articles feed element

    let activeLoanType = 'pinjol'; // Default active tab
    let allLenderData = {}; // To store fetched lender data

    // >>>>> IMPORTANT: REPLACE THIS WITH YOUR LIVE GLITCH BACKEND URL <<<<<
    const BACKEND_URL = 'https://sandy-adaptable-pomelo.glitch.me'; 
    // Example: const BACKEND_URL = 'https://your-backend-project-name.glitch.me';
    // Make sure this matches the URL you found for your Glitch project.

    // Function to fetch daily article from backend
    async function fetchArticles() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/article/daily`); // Endpoint for daily article
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json(); 
            const article = data.data; 

            if (!article) {
                 articlesFeed.innerHTML = '<p>Gagal memuat artikel. Tidak ada data.</p>';
                 return;
            }

            articlesFeed.innerHTML = ''; // Clear previous articles
            const articleCard = document.createElement('div');
            articleCard.classList.add('article-card');

            // --- ARTICLE CONTENT HANDLING FOR JUSTIFICATION AND EXPANSION ---
            // Replace newlines with <br> tags for proper paragraph breaks in HTML
            const formattedContent = article.content.replace(/\n/g, '<br>'); 
            const snippet = formattedContent.substring(0, 200); // Display first 200 characters
            const fullContent = formattedContent;

            articleCard.innerHTML = `
                <h3>${article.title}</h3>
                <p class="article-content-wrapper">
                    <span class="article-snippet">${snippet}</span><span class="article-ellipsis">...</span>
                    <span class="article-full" style="display: none;">${fullContent}</span>
                </p>
                <a href="#" class="read-more-btn">Baca Selengkapnya</a>
            `;
            articlesFeed.appendChild(articleCard);

            // Add event listener for the new "Baca Selengkapnya" button
            const readMoreBtn = articleCard.querySelector('.read-more-btn');
            readMoreBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default link behavior (page jump)
                const contentWrapper = readMoreBtn.previousElementSibling; // The <p> tag
                const snippetSpan = contentWrapper.querySelector('.article-snippet');
                const ellipsisSpan = contentWrapper.querySelector('.article-ellipsis');
                const fullSpan = contentWrapper.querySelector('.article-full');

                if (fullSpan.style.display === 'none') {
                    // Expand: show full content, hide snippet/ellipsis
                    snippetSpan.style.display = 'none';
                    ellipsisSpan.style.display = 'none';
                    fullSpan.style.display = 'inline'; // Or 'block' depending on desired layout
                    readMoreBtn.textContent = 'Sembunyikan'; // Change button text
                } else {
                    // Collapse: show snippet, hide full content
                    snippetSpan.style.display = 'inline';
                    ellipsisSpan.style.display = 'inline';
                    fullSpan.style.display = 'none';
                    readMoreBtn.textContent = 'Baca Selengkapnya'; // Change button text
                }
            });
            // --- END ARTICLE CONTENT HANDLING ---


        } catch (error) {
            console.error('Error fetching articles:', error);
            articlesFeed.innerHTML = '<p>Gagal memuat artikel dari backend. (Pastikan backend berjalan dan URL benar).</p>';
        }
    }

    // Function to fetch lender data for all types from backend
    async function fetchAllLenderData() {
        try {
            const [pinjolRes, kprRes, kmgRes] = await Promise.all([
                fetch(`${BACKEND_URL}/api/lenders/pinjol`),
                fetch(`${BACKEND_URL}/api/lenders/kpr`),
                fetch(`${BACKEND_URL}/api/lenders/kmg`)
            ]);

            const pinjolData = await pinjolRes.json();
            const kprData = await kprRes.json();
            const kmgData = await kmgRes.json();

            allLenderData = {
                pinjol: pinjolData.data || [], 
                kpr: kprData.data || [],
                kmg: kmgData.data || []
            };
            console.log('Lender data fetched:', allLenderData);

            if (jumlahPinjamanInput.value > 0 && tenorBulanInput.value > 0) {
                 // No cleanNumber needed here after rollback
                 renderResults(parseFloat(jumlahPinjamanInput.value), parseInt(tenorBulanInput.value)); 
            } else {
                 resultsDisplay.innerHTML = '<p>Masukkan jumlah pinjaman dan tenor untuk melihat perbandingan.</p>';
            }

        } catch (error) {
            console.error('Error fetching all lender data:', error);
            resultsDisplay.innerHTML = '<p style="color: red;">Gagal memuat data pemberi pinjaman dari backend. (Pastikan server backend berjalan dan URL benar).</p>';
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
            const monthlyRate = lender.interestRate; // This is the 0.03 (decimal) from backend
            const monthlyPayment = calculateMonthlyPayment(loanAmount, monthlyRate, tenorMonths);
            const totalPayment = monthlyPayment * tenorMonths;
            const totalInterest = totalPayment - loanAmount;
            
            // Calculate actual admin fee amount for display using percentage from backend
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


    // Initial data fetch when the page loads
    fetchArticles(); 
    fetchAllLenderData(); 
});
