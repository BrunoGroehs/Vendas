// Expenses module - Gerencia despesas e cálculos financeiros
const ExpensesModule = (() => {
  // Inicialização
  const init = () => {
    // Nada a fazer por enquanto
  };

  // Registra uma nova despesa
  const addExpense = () => {
    // Categorias disponíveis
    const categories = ['MATERIAL', 'FUEL', 'OTHER'];
    const categoryOptions = categories.map((cat, idx) => `${idx+1}: ${cat}`).join('\n');
    
    const categoryIdx = parseInt(prompt(`Categoria da despesa:\n${categoryOptions}`)) - 1;
    if (isNaN(categoryIdx) || categoryIdx < 0 || categoryIdx >= categories.length) {
      alert('Categoria inválida!');
      return;
    }
    
    const category = categories[categoryIdx];
    const amount = parseFloat(prompt('Valor da despesa (R$):'));
    
    if (isNaN(amount) || amount <= 0) {
      alert('Valor inválido!');
      return;
    }
    
    const description = prompt('Descrição da despesa:') || '';
    
    // Por simplicidade, atribuímos ao funcionário 2 (José Operador)
    const employeeId = 2;
    
    // Criar novo ID
    const newId = Math.max(...window.mockDB.expenses.map(e => e.id)) + 1;
    
    // Data atual
    const today = new Date().toISOString().split('T')[0];
    
    // Criar nova despesa
    const newExpense = {
      id: newId,
      category,
      amount,
      paidAt: today,
      description,
      employeeId
    };
    
    // Adicionar ao mock DB
    window.mockDB.expenses.push(newExpense);
    
    alert(`Despesa de R$ ${amount.toFixed(2)} registrada com sucesso!`);
    
    // Disparar evento
    document.dispatchEvent(new CustomEvent('expenseAdded', { detail: newExpense }));
    
    return newExpense;
  };

  // Calcular todas as despesas em um período
  const calculateExpensesByPeriod = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return window.mockDB.expenses
      .filter(e => {
        const paidDate = new Date(e.paidAt);
        return paidDate >= start && paidDate <= end;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  // Calcular todas as receitas em um período
  const calculateRevenueByPeriod = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return window.mockDB.services
      .filter(s => {
        const serviceDate = new Date(s.serviceDate);
        return serviceDate >= start && serviceDate <= end;
      })
      .reduce((sum, s) => sum + s.price, 0);
  };

  // Calcular comissões em um período
  const calculateCommissionsByPeriod = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return window.mockDB.services
      .filter(s => {
        const serviceDate = new Date(s.serviceDate);
        return serviceDate >= start && serviceDate <= end;
      })
      .reduce((sum, s) => sum + (s.price * s.commissionPct / 100), 0);
  };

  // Obter despesas agrupadas por categoria para um período
  const getExpensesByCategory = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Filtra despesas pelo período
    const filteredExpenses = window.mockDB.expenses
      .filter(e => {
        const paidDate = new Date(e.paidAt);
        return paidDate >= start && paidDate <= end;
      });
    
    // Agrupa por categoria
    const byCategory = {};
    
    filteredExpenses.forEach(e => {
      if (!byCategory[e.category]) {
        byCategory[e.category] = 0;
      }
      byCategory[e.category] += e.amount;
    });
    
    return byCategory;
  };

  // Gerar relatório financeiro
  const generateFinancialReport = (startDate, endDate) => {
    const revenue = calculateRevenueByPeriod(startDate, endDate);
    const expenses = calculateExpensesByPeriod(startDate, endDate);
    const commissions = calculateCommissionsByPeriod(startDate, endDate);
    const expensesByCategory = getExpensesByCategory(startDate, endDate);
    
    return {
      period: { startDate, endDate },
      summary: {
        revenue,
        expenses,
        commissions,
        profit: revenue - expenses - commissions
      },
      expensesByCategory
    };
  };

  // API pública
  return {
    init,
    addExpense,
    calculateExpensesByPeriod,
    calculateRevenueByPeriod,
    calculateCommissionsByPeriod,
    getExpensesByCategory,
    generateFinancialReport
  };
})();

// Exporta módulo
window.ExpensesModule = ExpensesModule;
