document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const calculateButton = document.getElementById('calculate-button');
    const jumlahPinjamanInput = document.getElementById('jumlah-pinjaman');
    const tenorBulanInput = document.getElementById('tenor-bulan');
    const resultsDisplay = document.getElementById('results-display');

    let activeLoanType = 'pinjol'; // Default active tab

    // Placeholder Lender Data (replace with actual data from Google Drive/API)
    // In a real application, this would be fetched dynamically from your backend,
    // which in turn reads from your Google Drive source.
    const lenderData = {
        pinjol: [
            {
                name: 'Kredit Kilat',
                logo: 'https://via.placeholder.com/60?text=KK', // Replace with actual logo URL
                interestRatePerMonth: 0.03, // 3% per month
                adminFeePercentage: 0.02,   // 2% of loan amount
                contactWeb: 'https://kreditkilat.com',
                contactWhatsapp: '6281234567890'
            },
            {
                name: 'Dana Express',
                logo: 'https://via.placeholder.com/60?text=DE',
                interestRatePerMonth: 0.025, // 2.5% per month
                adminFeePercentage: 0.015,
                contactWeb: 'https://danaexpress.co.id',
                contactWhatsapp: '6287654321098'
            }
        ],
        kpr: [
            {
                name: 'Bank Properti',
                logo: 'https://via.placeholder.com/60?text=BP',
                interestRatePerMonth: 0.005, // 0.5% per month (approx 6% annually)
                adminFeePercentage: 0.005, // 0.5% of loan amount
                contactWeb: 'https://bankproperti.com',
                contactWhatsapp: '6281122334455'
            },
            {
                name: 'Mortgage Solutions',
                logo: 'https://via.placeholder.com/60?text=MS',
                interestRatePerMonth: 0.0048, // 0.48% per month (approx 5.76% annually)
                adminFeePercentage: 0.006,
                contactWeb: 'https://mortgagesolutions.id',
                contactWhatsapp: '6285566778899'
            }
        ],
        kmg: [
            {
                name: 'Dana Jaminan',
                logo: 'https://via.placeholder.com/60?text=DJ',
                interestRatePerMonth: 0.012, // 1.2% per month
                adminFeePercentage: 0.01,
                contactWeb: 'https://danajaminan.com',
                contactWhatsapp: '6281987654321'
            },
            {
                name: 'Kredit Multiguna',
                logo: 'https://via.placeholder.com/60?text=KM',
                interestRatePerMonth: 0.011, // 1.1% per month
                adminFeePercentage: 0.008,
                contactWeb: 'https://kreditmultiguna.id',
                contactWhatsapp: '6282345678901'
            }
        ]
    };

    // Function to calculate monthly installment (simplified)
    // Uses the fixed annuity formula: M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
    // M = Monthly Payment
    // P = Principal Loan Amount
    // i = Monthly Interest Rate (decimal)
    // n = Number of Months (Tenor)
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

        if (loanAmount <= 0 || tenorMonths <= 0) {
            resultsDisplay.innerHTML = '<p style="color: red;">Mohon masukkan jumlah pinjaman dan tenor yang valid.</p>';
            return;
        }

        const lenders = lenderData[activeLoanType];

        if (!lenders || lenders.length === 0) {
            resultsDisplay.innerHTML = '<p>Tidak ada data pemberi pinjaman untuk kategori ini.</p>';
            return;
        }

        lenders.forEach(lender => {
            const adminFee = loanAmount * lender.adminFeePercentage;
            const receivedAmount = loanAmount - adminFee;
            const monthlyPayment = calculateMonthlyPayment(loanAmount, lender.interestRatePerMonth, tenorMonths);

            const lenderCard = document.createElement('div');
            lenderCard.classList.add('lender-card');

            lenderCard.innerHTML = `
                <img src="${lender.logo}" alt="${lender.name} Logo" class="lender-logo">
                <div class="lender-info">
                    <p class="lender-name">${lender.name}</p>
                    <div class="lender-details">
                        <p>Cicilan/Bulan: <span class="highlight">Rp ${monthlyPayment.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span></p>
                        <p>Pinjaman Diterima: <span class="highlight">Rp ${receivedAmount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span></p>
                        <p>Suku Bunga: ${ (lender.interestRatePerMonth * 100).toFixed(2) }% per bulan</p>
                        <p>Biaya Admin: ${ (lender.adminFeePercentage * 100).toFixed(2) }% (${adminFee.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })})</p>
                    </div>
                    <div class="lender-contact">
                        <a href="${lender.contactWeb}" target="_blank"><i class="fas fa-globe"></i> Website</a>
                        <a href="https://wa.me/${lender.contactWhatsapp}" target="_blank"><i class="fab fa-whatsapp"></i> WhatsApp</a>
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
});
