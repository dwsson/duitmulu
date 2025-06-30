// script.js - Fixed version with proper error handling
const API_BASE_URL = 'https://sandy-adaptable-pomelo.glitch.me';

// Global variables
let lenderData = {};
let currentCalculations = [];

// DOM elements
const loanTypeSelect = document.getElementById('loanType');
const loanAmountInput = document.getElementById('loanAmount');
const loanTermInput = document.getElementById('loanTerm');
const calculateButton = document.getElementById('calculateButton');
const resultsContainer = document.getElementById('results');
const loadingIndicator = document.getElementById('loading');
const errorContainer = document.getElementById('error');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeApp();
});

async function initializeApp() {
    try {
        showLoading(true);
        await fetchAllLenderData();
        setupEventListeners();
        showLoading(false);
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showError('Failed to initialize application. Please refresh the page.');
        showLoading(false);
    }
}

// Fetch all lender data from the API
async function fetchAllLenderData() {
    console.log('Fetching all lender data...');
    const loanTypes = ['pinjol', 'kpr', 'kmg'];
    
    try {
        const promises = loanTypes.map(async (type) => {
            const url = `${API_BASE_URL}/api/lenders/${type}`;
            console.log(`Fetching ${type} data from: ${url}`);
            
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    mode: 'cors'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log(`${type} response:`, data);

                if (data.success && Array.isArray(data.data)) {
                    lenderData[type] = data.data;
                    console.log(`Successfully loaded ${data.data.length} ${type} lenders`);
                } else {
                    console.warn(`Invalid data format for ${type}:`, data);
                    lenderData[type] = [];
                }
            } catch (error) {
                console.error(`Error fetching ${type} data:`, error);
                lenderData[type] = [];
            }
        });

        await Promise.all(promises);
        console.log('All lender data loaded:', lenderData);
        
        // Validate that we have some data
        const totalLenders = Object.values(lenderData).reduce((sum, arr) => sum + arr.length, 0);
        if (totalLenders === 0) {
            throw new Error('No lender data available');
        }
        
    } catch (error) {
        console.error('Error fetching lender data:', error);
        throw error;
    }
}

// Set up event listeners
function setupEventListeners() {
    calculateButton.addEventListener('click', handleCalculate);
    
    // Add input validation
    loanAmountInput.addEventListener('input', validateInputs);
    loanTermInput.addEventListener('input', validateInputs);
    loanTypeSelect.addEventListener('change', validateInputs);
    
    // Enable calculate button initially if inputs are valid
    validateInputs();
}

// Validate form inputs
function validateInputs() {
    const loanAmount = parseFloat(loanAmountInput.value);
    const loanTerm = parseInt(loanTermInput.value);
    const loanType = loanTypeSelect.value;
    
    const isValid = loanAmount > 0 && loanTerm > 0 && loanType && 
                   lenderData[loanType] && lenderData[loanType].length > 0;
    
    calculateButton.disabled = !isValid;
    
    if (!isValid) {
        hideError();
    }
}

// Handle calculate button click
async function handleCalculate() {
    try {
        hideError();
        showLoading(true);
        
        const loanAmount = parseFloat(loanAmountInput.value);
        const loanTerm = parseInt(loanTermInput.value);
        const loanType = loanTypeSelect.value;
        
        // Validate inputs
        if (!loanAmount || loanAmount <= 0) {
            throw new Error('Please enter a valid loan amount');
        }
        
        if (!loanTerm || loanTerm <= 0) {
            throw new Error('Please enter a valid loan term');
        }
        
        if (!loanType) {
            throw new Error('Please select a loan type');
        }
        
        // Check if we have lender data for this type
        if (!lenderData[loanType] || lenderData[loanType].length === 0) {
            throw new Error(`No lenders available for ${loanType}`);
        }
        
        console.log('Calculating with:', { loanAmount, loanTerm, loanType });
        
        const calculations = await calculateLoanComparisons(loanAmount, loanTerm, loanType);
        currentCalculations = calculations;
        renderResults(calculations);
        
    } catch (error) {
        console.error('Error during calculation:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// Calculate loan comparisons
async function calculateLoanComparisons(loanAmount, loanTerm, loanType) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            body: JSON.stringify({
                loanAmount: loanAmount,
                loanTerm: loanTerm,
                loanType: loanType
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Calculation response:', data);

        if (data.success && Array.isArray(data.data)) {
            return data.data;
        } else {
            throw new Error('Invalid response format from server');
        }
    } catch (error) {
        console.error('Error calling calculate API:', error);
        throw error;
    }
}

// Render calculation results
function renderResults(calculations) {
    console.log('Rendering results:', calculations);
    
    if (!Array.isArray(calculations) || calculations.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No calculations available</div>';
        return;
    }

    let html = '<div class="results-header"><h3>Loan Comparison Results</h3></div>';
    
    calculations.forEach((item, index) => {
        const { lender, calculation } = item;
        const isRecommended = index === 0; // First item is the cheapest
        
        html += `
            <div class="result-card ${isRecommended ? 'recommended' : ''}">
                ${isRecommended ? '<div class="recommended-badge">Recommended</div>' : ''}
                
                <div class="lender-info">
                    <div class="lender-logo">${lender.logo}</div>
                    <div class="lender-details">
                        <h4>${lender.name}</h4>
                        <div class="lender-contacts">
                            ${lender.website ? `<a href="${lender.website}" target="_blank" class="website-link">Website</a>` : ''}
                            ${lender.whatsapp ? `<a href="https://wa.me/${lender.whatsapp}" target="_blank" class="whatsapp-link">WhatsApp</a>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="calculation-details">
                    <div class="detail-row">
                        <span class="label">Loan Amount:</span>
                        <span class="value">${formatCurrency(calculation.loanAmount)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Interest Rate:</span>
                        <span class="value">${(calculation.interestRate * 100).toFixed(2)}% per year</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Admin Fee:</span>
                        <span class="value">${formatCurrency(calculation.adminFee)}</span>
                    </div>
                    <div class="detail-row highlight">
                        <span class="label">Monthly Payment:</span>
                        <span class="value">${formatCurrency(calculation.monthlyPayment)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Total Interest:</span>
                        <span class="value">${formatCurrency(calculation.totalInterest)}</span>
                    </div>
                    <div class="detail-row total">
                        <span class="label">Total Cost:</span>
                        <span class="value">${formatCurrency(calculation.totalCost)}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    resultsContainer.innerHTML = html;
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function showLoading(show) {
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    }
    
    if (calculateButton) {
        calculateButton.disabled = show;
        calculateButton.textContent = show ? 'Calculating...' : 'Calculate';
    }
}

function showError(message) {
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }
    console.error('Error:', message);
}

function hideError() {
    if (errorContainer) {
        errorContainer.style.display = 'none';
    }
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchAllLenderData,
        calculateLoanComparisons,
        formatCurrency,
        validateInputs
    };
}
