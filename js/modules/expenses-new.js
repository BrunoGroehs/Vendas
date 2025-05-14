// filepath: c:\Users\I753372\Desktop\projetos\TesteGPT\js\modules\expenses.js
// Expenses module - Gerencia despesas e relatórios financeiros
const ExpensesModule = (() => {
  // Cache de elementos DOM
  let expensesTable;
  let addExpenseBtn;
  let filterForm;
  
  // Formatação de moeda e datas
  const formatCurrency = (value) => `R$ ${value.toFixed(2)}`;
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };
  
  // Inicialização do módulo
  const init = () => {
    const isDespesasPage = window.location.pathname.includes('despesas.html');
    
    if (isDespesasPage) {
      expensesTable = document.querySelector('.expenses-table tbody');
      addExpenseBtn = document.querySelector('.btn--add-expense');
      filterForm = document.querySelector('.filter-form');
      
      if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', showAddExpenseModal);
      }
      
      if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
          e.preventDefault();
          applyFilters();
        });
        
        // Botão limpar filtros
        const resetBtn = filterForm.querySelector('.btn--reset');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            filterForm.reset();
            renderExpensesTable();
          });
        }
      }
      
      renderExpensesTable();
    }
  };
  
  // Aplicar filtros de pesquisa
  const applyFilters = () => {
    if (!filterForm) return;
    
    const category = filterForm.querySelector('#category').value;
    const employeeId = filterForm.querySelector('#employee').value;
    const fromDate = filterForm.querySelector('#fromDate').value;
    const toDate = filterForm.querySelector('#toDate').value;
    
    renderExpensesTable(category, employeeId, fromDate, toDate);
  };
  
  // Renderiza tabela de despesas
  const renderExpensesTable = (category = '', employeeId = '', fromDate = '', toDate = '') => {
    if (!expensesTable) return;
    
    const db = window.mockDB;
    if (!db) return;
    
    // Filtrar despesas
    let filteredExpenses = [...db.expenses];
    
    if (category) {
      filteredExpenses = filteredExpenses.filter(e => e.category === category);
    }
    
    if (employeeId) {
      filteredExpenses = filteredExpenses.filter(e => e.employeeId === parseInt(employeeId));
    }
    
    if (fromDate) {
      const from = new Date(fromDate);
      filteredExpenses = filteredExpenses.filter(e => new Date(e.paidAt) >= from);
    }
    
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59); // Fim do dia
      filteredExpenses = filteredExpenses.filter(e => new Date(e.paidAt) <= to);
    }
    
    // Ordenar por data (mais recentes primeiro)
    filteredExpenses.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
    
    // Limpar tabela
    expensesTable.innerHTML = '';
    
    // Valor total filtrado
    let totalAmount = 0;
    
    // Adicionar despesas na tabela
    filteredExpenses.forEach(expense => {
      // Encontrar funcionário
      const employee = db.users.find(u => u.id === expense.employeeId);
      
      // Categoria traduzida
      const categoryLabels = {
        'FUEL': 'Combustível',
        'MATERIAL': 'Material',
        'OTHER': 'Outros'
      };
      
      // Incrementar total
      totalAmount += expense.amount;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDate(expense.paidAt)}</td>
        <td>${categoryLabels[expense.category] || expense.category}</td>
        <td>${formatCurrency(expense.amount)}</td>
        <td>${employee ? employee.name : 'Funcionário não encontrado'}</td>
        <td>${expense.description}</td>
        <td>
          <button class="btn btn--small btn--details" data-expense-id="${expense.id}">Detalhes</button>
        </td>
      `;
      
      // Evento de clique para o botão de detalhes
      const detailsBtn = tr.querySelector('.btn--details');
      detailsBtn.addEventListener('click', () => {
        showExpenseDetails(expense.id);
      });
      
      expensesTable.appendChild(tr);
    });
    
    // Adicionar linha de total
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row';
    totalRow.innerHTML = `
      <td colspan="2"><strong>Total:</strong></td>
      <td colspan="4"><strong>${formatCurrency(totalAmount)}</strong></td>
    `;
    expensesTable.appendChild(totalRow);
    
    // Mensagem se não houver resultados
    if (filteredExpenses.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.textContent = 'Nenhuma despesa encontrada';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      expensesTable.insertBefore(tr, totalRow);
    }
    
    // Atualizar contador de resultados se existir
    const resultCounter = document.querySelector('.results-count');
    if (resultCounter) {
      resultCounter.textContent = `${filteredExpenses.length} despesa(s) encontrada(s)`;
    }
  };
  
  // Exibe modal com detalhes da despesa
  const showExpenseDetails = (expenseId) => {
    const db = window.mockDB;
    if (!db) return;
    
    const expense = db.expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    // Encontrar funcionário
    const employee = db.users.find(u => u.id === expense.employeeId);
    
    // Categoria traduzida
    const categoryLabels = {
      'FUEL': 'Combustível',
      'MATERIAL': 'Material',
      'OTHER': 'Outros'
    };
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Conteúdo do modal
    modal.innerHTML = `
      <div class="modal__content">
        <div class="modal__header">
          <h2>Detalhes da Despesa</h2>
          <button class="modal__close">&times;</button>
        </div>
        <div class="modal__body">
          <div class="expense-details">
            <p><strong>Data:</strong> ${formatDate(expense.paidAt)}</p>
            <p><strong>Categoria:</strong> ${categoryLabels[expense.category] || expense.category}</p>
            <p><strong>Valor:</strong> ${formatCurrency(expense.amount)}</p>
            <p><strong>Funcionário:</strong> ${employee ? employee.name : 'Funcionário não encontrado'}</p>
            <p><strong>Descrição:</strong> ${expense.description}</p>
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--primary" id="editExpenseBtn">Editar</button>
          <button class="btn btn--danger" id="deleteExpenseBtn">Excluir</button>
          <button class="btn" id="closeModalBtn">Fechar</button>
        </div>
      </div>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.modal__close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#closeModalBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Botão editar
    modal.querySelector('#editExpenseBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
      showEditExpenseModal(expense.id);
    });
    
    // Botão excluir
    modal.querySelector('#deleteExpenseBtn').addEventListener('click', () => {
      if (confirm('Tem certeza que deseja excluir esta despesa?')) {
        deleteExpense(expense.id);
        document.body.removeChild(modal);
      }
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  };
  
  // Exibe modal para adicionar despesa
  const showAddExpenseModal = () => {
    const db = window.mockDB;
    if (!db) return;
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Opções de funcionários
    const employeeOptions = db.users.map(user => 
      `<option value="${user.id}">${user.name}</option>`
    ).join('');
    
    // Data de hoje formatada para o input
    const today = new Date().toISOString().split('T')[0];
    
    // Conteúdo do modal
    modal.innerHTML = `
      <div class="modal__content">
        <div class="modal__header">
          <h2>Nova Despesa</h2>
          <button class="modal__close">&times;</button>
        </div>
        <div class="modal__body">
          <form id="expenseForm">
            <div class="form-group">
              <label for="category">Categoria*:</label>
              <select id="category" class="form-select" required>
                <option value="">Selecione</option>
                <option value="FUEL">Combustível</option>
                <option value="MATERIAL">Material</option>
                <option value="OTHER">Outros</option>
              </select>
            </div>
            <div class="form-group">
              <label for="amount">Valor (R$)*:</label>
              <input type="number" id="amount" class="form-input" min="0.01" step="0.01" required>
            </div>
            <div class="form-group">
              <label for="paidAt">Data*:</label>
              <input type="date" id="paidAt" class="form-input" required value="${today}">
            </div>
            <div class="form-group">
              <label for="employee">Funcionário*:</label>
              <select id="employee" class="form-select" required>
                <option value="">Selecione</option>
                ${employeeOptions}
              </select>
            </div>
            <div class="form-group">
              <label for="description">Descrição*:</label>
              <textarea id="description" class="form-textarea" required></textarea>
            </div>
          </form>
        </div>
        <div class="modal__footer">
          <button class="btn btn--primary" id="saveExpenseBtn">Salvar</button>
          <button class="btn" id="cancelBtn">Cancelar</button>
        </div>
      </div>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.modal__close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#cancelBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Salvar despesa
    modal.querySelector('#saveExpenseBtn').addEventListener('click', () => {
      // Validação manual
      const form = modal.querySelector('#expenseForm');
      const categoryInput = form.querySelector('#category');
      const amountInput = form.querySelector('#amount');
      const paidAtInput = form.querySelector('#paidAt');
      const employeeInput = form.querySelector('#employee');
      const descriptionInput = form.querySelector('#description');
      
      if (!categoryInput.value) {
        window.showToast('Por favor, selecione uma categoria', 'error');
        categoryInput.focus();
        return;
      }
      
      if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
        window.showToast('Por favor, informe um valor válido', 'error');
        amountInput.focus();
        return;
      }
      
      if (!paidAtInput.value) {
        window.showToast('Por favor, informe a data', 'error');
        paidAtInput.focus();
        return;
      }
      
      if (!employeeInput.value) {
        window.showToast('Por favor, selecione um funcionário', 'error');
        employeeInput.focus();
        return;
      }
      
      if (!descriptionInput.value.trim()) {
        window.showToast('Por favor, informe uma descrição', 'error');
        descriptionInput.focus();
        return;
      }
      
      // Coletar dados do form
      const newExpense = {
        id: generateId(),
        category: categoryInput.value,
        amount: parseFloat(amountInput.value),
        paidAt: paidAtInput.value,
        employeeId: parseInt(employeeInput.value),
        description: descriptionInput.value.trim()
      };
      
      // Adicionar ao banco de dados
      if (addExpense(newExpense)) {
        window.showToast('Despesa registrada com sucesso!');
        renderExpensesTable(); // Atualizar tabela
        document.body.removeChild(modal);
      } else {
        window.showToast('Erro ao registrar despesa', 'error');
      }
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  };
  
  // Exibe modal para editar despesa
  const showEditExpenseModal = (expenseId) => {
    const db = window.mockDB;
    if (!db) return;
    
    const expense = db.expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Opções de funcionários
    const employeeOptions = db.users.map(user => 
      `<option value="${user.id}" ${user.id === expense.employeeId ? 'selected' : ''}>${user.name}</option>`
    ).join('');
    
    // Conteúdo do modal
    modal.innerHTML = `
      <div class="modal__content">
        <div class="modal__header">
          <h2>Editar Despesa</h2>
          <button class="modal__close">&times;</button>
        </div>
        <div class="modal__body">
          <form id="expenseForm">
            <div class="form-group">
              <label for="category">Categoria*:</label>
              <select id="category" class="form-select" required>
                <option value="">Selecione</option>
                <option value="FUEL" ${expense.category === 'FUEL' ? 'selected' : ''}>Combustível</option>
                <option value="MATERIAL" ${expense.category === 'MATERIAL' ? 'selected' : ''}>Material</option>
                <option value="OTHER" ${expense.category === 'OTHER' ? 'selected' : ''}>Outros</option>
              </select>
            </div>
            <div class="form-group">
              <label for="amount">Valor (R$)*:</label>
              <input type="number" id="amount" class="form-input" min="0.01" step="0.01" required value="${expense.amount}">
            </div>
            <div class="form-group">
              <label for="paidAt">Data*:</label>
              <input type="date" id="paidAt" class="form-input" required value="${expense.paidAt}">
            </div>
            <div class="form-group">
              <label for="employee">Funcionário*:</label>
              <select id="employee" class="form-select" required>
                <option value="">Selecione</option>
                ${employeeOptions}
              </select>
            </div>
            <div class="form-group">
              <label for="description">Descrição*:</label>
              <textarea id="description" class="form-textarea" required>${expense.description}</textarea>
            </div>
          </form>
        </div>
        <div class="modal__footer">
          <button class="btn btn--primary" id="saveExpenseBtn">Salvar</button>
          <button class="btn" id="cancelBtn">Cancelar</button>
        </div>
      </div>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.modal__close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#cancelBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Salvar despesa
    modal.querySelector('#saveExpenseBtn').addEventListener('click', () => {
      // Validação manual
      const form = modal.querySelector('#expenseForm');
      const categoryInput = form.querySelector('#category');
      const amountInput = form.querySelector('#amount');
      const paidAtInput = form.querySelector('#paidAt');
      const employeeInput = form.querySelector('#employee');
      const descriptionInput = form.querySelector('#description');
      
      if (!categoryInput.value) {
        window.showToast('Por favor, selecione uma categoria', 'error');
        categoryInput.focus();
        return;
      }
      
      if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
        window.showToast('Por favor, informe um valor válido', 'error');
        amountInput.focus();
        return;
      }
      
      if (!paidAtInput.value) {
        window.showToast('Por favor, informe a data', 'error');
        paidAtInput.focus();
        return;
      }
      
      if (!employeeInput.value) {
        window.showToast('Por favor, selecione um funcionário', 'error');
        employeeInput.focus();
        return;
      }
      
      if (!descriptionInput.value.trim()) {
        window.showToast('Por favor, informe uma descrição', 'error');
        descriptionInput.focus();
        return;
      }
      
      // Coletar dados do form
      const updatedExpense = {
        ...expense,
        category: categoryInput.value,
        amount: parseFloat(amountInput.value),
        paidAt: paidAtInput.value,
        employeeId: parseInt(employeeInput.value),
        description: descriptionInput.value.trim()
      };
      
      // Atualizar no banco de dados
      if (updateExpense(updatedExpense)) {
        window.showToast('Despesa atualizada com sucesso!');
        renderExpensesTable(); // Atualizar tabela
        document.body.removeChild(modal);
      } else {
        window.showToast('Erro ao atualizar despesa', 'error');
      }
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  };
  
  // Adiciona uma nova despesa ao banco de dados
  const addExpense = (expense) => {
    const db = window.mockDB;
    if (!db) return false;
    
    try {
      db.expenses.push(expense);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar despesa:', error);
      return false;
    }
  };
  
  // Atualiza uma despesa existente
  const updateExpense = (expense) => {
    const db = window.mockDB;
    if (!db) return false;
    
    try {
      const index = db.expenses.findIndex(e => e.id === expense.id);
      if (index !== -1) {
        db.expenses[index] = expense;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      return false;
    }
  };
  
  // Exclui uma despesa
  const deleteExpense = (expenseId) => {
    const db = window.mockDB;
    if (!db) return false;
    
    try {
      const index = db.expenses.findIndex(e => e.id === expenseId);
      if (index !== -1) {
        db.expenses.splice(index, 1);
        window.showToast('Despesa excluída com sucesso!');
        renderExpensesTable();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      return false;
    }
  };
  
  // Gera um ID único para uma nova despesa
  const generateId = () => {
    const db = window.mockDB;
    if (!db || !db.expenses) return 1;
    
    return db.expenses.length > 0 
      ? Math.max(...db.expenses.map(e => e.id)) + 1
      : 1;
  };
  
  // API pública do módulo
  return {
    init,
    renderExpensesTable,
    showAddExpenseModal,
    showExpenseDetails,
    addExpense
  };
})();

// Expor globalmente
window.ExpensesModule = ExpensesModule;
