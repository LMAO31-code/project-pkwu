// DOM Elements
const expenseForm = document.getElementById('expenseForm');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const descriptionInput = document.getElementById('description');
const expenseTypeRadio = document.getElementById('expenseType');
const incomeTypeRadio = document.getElementById('incomeType');
const expenseHistory = document.getElementById('expenseHistory');
const totalBalance = document.getElementById('totalBalance');
const totalIncome = document.getElementById('totalIncome');
const totalExpenses = document.getElementById('totalExpenses');
const expenseChartCtx = document.getElementById('expenseChart').getContext('2d');

// Format currency as Rp with thousand separators
function formatCurrency(amount) {
    return 'Rp' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&.');
}

// Transaction Class
class Transaction {
    constructor(id, type, amount, category, description, date) {
        this.id = id;
        this.type = type;
        this.amount = amount;
        this.category = category;
        this.description = description;
        this.date = date;
    }
}

// App State
let transactions = [];
let expenseChart = null;
let negativeBalanceWarningShown = false;

// Initialize the app
function init() {
    loadTransactions();
    renderTransactions();
    updateSummary();
    renderChart();
    setupEventListeners();
}

// Load transactions from localStorage
function loadTransactions() {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    }
}

// Save transactions to localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Add a new transaction
function addTransaction(type, amount, category, description) {
    const newTransaction = new Transaction(
        Date.now().toString(),
        type,
        parseFloat(amount),
        category,
        description,
        new Date().toLocaleDateString()
    );
    
    transactions.push(newTransaction);
    saveTransactions();
    renderTransactions();
    updateSummary();
    renderChart();
}

// Delete a transaction
function deleteTransaction(id) {
   
    
    transactions = transactions.filter(transaction => transaction.id !== id);
    saveTransactions();
    renderTransactions();
    updateSummary();
    renderChart();
}

// Render transactions to the table
function renderTransactions() {
    expenseHistory.innerHTML = '';
    
    if (transactions.length === 0) {
        expenseHistory.innerHTML = '<tr><td colspan="5" class="text-center py-4">No transactions yet</td></tr>';
        return;
    }
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${transaction.date}</td>
            <td class="px-6 py-4 whitespace-nowrap">${transaction.category}</td>
            <td class="px-6 py-4 whitespace-nowrap">${transaction.description || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap ${transaction.type === 'income' ? 'income' : 'expense'}">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount))}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button data-id="${transaction.id}" class="delete-btn text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        expenseHistory.appendChild(row);
    });
}

// Show negative balance warning
function showNegativeBalanceWarning() {
    if (!negativeBalanceWarningShown) {
        const warning = document.createElement('div');
        warning.id = 'balance-warning';
        warning.className = 'bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 animate-fade-in';
        warning.innerHTML = `
            <p class="font-bold">Peringatan!</p>
            <p>Saldo Anda negatif. Harap tambahkan pemasukan atau kurangi pengeluaran.</p>
        `;
        document.querySelector('.container').prepend(warning);
        negativeBalanceWarningShown = true;
    }
}

// Hide negative balance warning
function hideNegativeBalanceWarning() {
    const warning = document.getElementById('balance-warning');
    if (warning) {
        warning.remove();
        negativeBalanceWarningShown = false;
    }
}

// Update the summary cards
function updateSummary() {
    const incomes = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = incomes - expenses;
    
    totalIncome.textContent = formatCurrency(incomes);
    totalExpenses.textContent = formatCurrency(expenses);
    totalBalance.textContent = formatCurrency(balance);
    
    // Update balance color and warning
    if (balance < 0) {
        totalBalance.classList.add('expense');
        totalBalance.classList.remove('income');
        showNegativeBalanceWarning();
    } else {
        totalBalance.classList.add('income');
        totalBalance.classList.remove('expense');
        hideNegativeBalanceWarning();
    }
}

// Render the pie chart
function renderChart() {
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    const expenseData = transactions.filter(t => t.type === 'expense');
    
    if (expenseData.length === 0) {
        return;
    }
    
    // Group expenses by category
    const categories = {};
    expenseData.forEach(t => {
        if (!categories[t.category]) {
            categories[t.category] = 0;
        }
        categories[t.category] += t.amount;
    });
    
    const labels = Object.keys(categories);
    const data = Object.values(categories);
    
    // Generate colors for each category
    const backgroundColors = labels.map((_, i) => {
        const hue = (i * 137.508) % 360; // Golden angle approximation
        return `hsl(${hue}, 70%, 60%)`;
    });
    
    expenseChart = new Chart(expenseChartCtx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Use event delegation for delete buttons
    expenseHistory.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            const button = e.target.classList.contains('delete-btn') ? e.target : e.target.closest('.delete-btn');
            deleteTransaction(button.dataset.id);
        }
    });

    expenseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const type = expenseTypeRadio.checked ? 'expense' : 'income';
        const amount = amountInput.value;
        const category = type === 'expense' ? categorySelect.value : 'Income';
        const description = descriptionInput.value;
        
        if (!amount || (type === 'expense' && !category)) {
            alert('Harap isi semua field yang diperlukan');
            return;
        }
        
        addTransaction(type, amount, category, description);
        
        // Reset form
        amountInput.value = '';
        descriptionInput.value = '';
        if (type === 'expense') {
            categorySelect.value = '';
        }
        amountInput.focus();
    });
    
    // Toggle category required based on transaction type
    expenseTypeRadio.addEventListener('change', function() {
        categorySelect.required = true;
    });
    
    incomeTypeRadio.addEventListener('change', function() {
        categorySelect.required = false;
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
