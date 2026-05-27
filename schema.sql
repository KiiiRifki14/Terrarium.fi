-- 1. Tabel Dompet (Wallets/Accounts)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  initial_balance DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Budgeting (Tanaman Keuangan)
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL,
  monthly_limit DECIMAL(12, 2) NOT NULL,
  month_year DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, month_year)
);

-- 3. Tabel Transaksi
CREATE TABLE IF NOT EXISTS transactions (
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
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_budgets_date ON budgets(month_year);

-- FITUR 1 & 2: Pembaruan Skema Transfer & Wallet Investasi
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS transfer_pair_id UUID REFERENCES transactions(id);

ALTER TABLE wallets
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'regular' CHECK (type IN ('regular', 'investasi'));

-- FITUR 3: Hutang & Piutang
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(10) CHECK (type IN ('hutang', 'piutang')) NOT NULL,
  contact_name VARCHAR(100) NOT NULL,
  description TEXT,
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  wallet_id UUID REFERENCES wallets(id),
  is_installment BOOLEAN DEFAULT false,
  installment_amount DECIMAL(12,2),
  installment_months INT,
  installment_due_day INT CHECK (installment_due_day BETWEEN 1 AND 31),
  start_date DATE,
  end_date DATE,
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'lunas')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  note TEXT,
  wallet_id UUID REFERENCES wallets(id),
  transaction_id UUID REFERENCES transactions(id)
);

-- FITUR 4: Push Notification Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON debt_payments(debt_id);

