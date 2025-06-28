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
            articleCard.innerHTML = `
                <h3>${article.title}</h3>
                <p>${article.content.substring(0, 150)}...</p> 
                <a href="#">Baca Selengkapnya</a>
            `;
            articlesFeed.appendChild(articleCard);

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
        if (monthlyInterestRate === 0) {
            return principal / tenorMonths;
        }
        const i = monthlyInterestRate;
        const n = tenorMonths;
        const numerator = principal * i * Math.pow((1 + i), n);
        const denominator = Math.pow((1 + i), n) - 1;
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
            const receivedAmount = loanAmount - (lender.adminFee || 0); 

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
                    interest_rate: lender.interestRate,
                    admin_fee: lender.adminFee || 0
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
                        <p>Suku Bunga: ${ (calc.interest_rate * 100).toFixed(2) }% per bulan</p>
                        <p>Biaya Admin: ${ Math.round(calc.admin_fee).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })})</p>
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
            resultsDisplay.innerHTML = '<p>Masukkan data di atas untuk melihat perbandingan pinjaman.</p>'; // Clear results when tab changes
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

    // Optional: Trigger calculation on Enter key in input fields
    jumlahPinjamanInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateButton.click();
    });
    tenorBulanInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateButton.click();
    });

    // Initial data fetch when the page loads
    fetchArticles(); 
    fetchAllLenderData(); 
});
