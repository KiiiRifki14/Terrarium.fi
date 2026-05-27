-- 1. Tabel Dompet (Wallets/Accounts)
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  initial_balance DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Budgeting (Tanaman Keuangan)
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL,
  monthly_limit DECIMAL(12, 2) NOT NULL,
  month_year DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, month_year)
);

-- 3. Tabel Transaksi
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) NOT NULL,
  batch_id UUID NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50),
  raw_input_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes untuk mempercepat query
CREATE INDEX idx_transactions_date ON transactions(created_at);
CREATE INDEX idx_budgets_date ON budgets(month_year);
