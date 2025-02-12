
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

function addTransaction() {
    let type = document.getElementById('transaction-type').value;
    let name = document.getElementById('transaction-name').value;
    let amount = parseFloat(document.getElementById('transaction-amount').value);
    let date = new Date().toLocaleDateString();
    
    if (name && !isNaN(amount) && amount > 0) {
        let transaction = { type, name, amount, date };
        transactions.push(transaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        renderTransactions();
    }
}

function deleteTransaction(index) {
    transactions.splice(index, 1);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    renderTransactions();
}

function renderTransactions() {
    let expenseList = document.getElementById('expense-list');
    expenseList.innerHTML = '';
    let total = 0;
    
    transactions.forEach((transaction, index) => {
        let entry = document.createElement('div');
        entry.classList.add('expense-item');
        entry.innerHTML = `${transaction.date} - ${transaction.type.toUpperCase()} - ${transaction.name}: $${transaction.amount.toFixed(2)} <button class="delete-btn" onclick="deleteTransaction(${index})">Delete</button>`;
        expenseList.appendChild(entry);
        
        if (transaction.type === "income") {
            total += transaction.amount;
        } else {
            total -= transaction.amount;
        }
    });
    
    document.getElementById('total-balance').innerText = `Total Balance: Rp${total.toFixed(2)}`;
}

renderTransactions();
