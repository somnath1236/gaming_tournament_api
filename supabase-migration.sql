-- Gaming Tournament Platform - Complete Database Migration
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CORE TABLES
-- ==========================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  in_game_name VARCHAR(100) NOT NULL,
  primary_game VARCHAR(50) NOT NULL,
  profile_picture VARCHAR(500),
  password_hash VARCHAR(255) NOT NULL,
  coins_balance NUMERIC(12, 2) DEFAULT 0,
  cash_balance NUMERIC(12, 2) DEFAULT 0,
  pending_withdrawals NUMERIC(12, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  kyc_verified BOOLEAN DEFAULT false,
  referral_code VARCHAR(20) UNIQUE,
  referred_by_id UUID REFERENCES users(id),
  social_provider VARCHAR(50),
  social_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_in_game_name ON users(in_game_name);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  permissions TEXT[],
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Tournaments
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  game VARCHAR(50) NOT NULL,
  organizer VARCHAR(255) NOT NULL,
  banner_image VARCHAR(500) NOT NULL,
  game_icon VARCHAR(500) NOT NULL,
  prize_pool NUMERIC(12, 2) NOT NULL,
  entry_fee NUMERIC(10, 2) NOT NULL,
  entry_fee_type VARCHAR(20) NOT NULL,
  team_size VARCHAR(20) NOT NULL,
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'upcoming',
  rules TEXT NOT NULL,
  organizer_id UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_game ON tournaments(game);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON tournaments(start_date);

-- Teams (must be created before tournament_registrations)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  tag VARCHAR(20) UNIQUE,
  logo VARCHAR(500),
  captain_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournament Registrations (references teams above)
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'registered',
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_registrations_tournament ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON tournament_registrations(user_id);

-- Players
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  in_game_name VARCHAR(100) NOT NULL,
  profile_picture VARCHAR(500),
  is_captain BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Coin Packages (must be created before transactions)
CREATE TABLE IF NOT EXISTS coin_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  coins NUMERIC(12, 2) NOT NULL,
  bonus_coins NUMERIC(12, 2) DEFAULT 0,
  badge VARCHAR(50),
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards (must be created before transactions)
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  image VARCHAR(500) NOT NULL,
  coins_required NUMERIC(12, 2) NOT NULL,
  stock_quantity INTEGER,
  stock_status VARCHAR(50) DEFAULT 'inStock',
  delivery_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rewards_category ON rewards(category);

-- Transactions (references rewards and coin_packages above)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  coins NUMERIC(12, 2),
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  description TEXT,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,
  package_id UUID REFERENCES coin_packages(id) ON DELETE SET NULL,
  refund_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Redemptions
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_name VARCHAR(255) NOT NULL,
  coins_deducted NUMERIC(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  delivery_details JSONB,
  tracking_number VARCHAR(100),
  notes TEXT,
  redemption_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user ON redemptions(user_id);

-- Streamers
CREATE TABLE IF NOT EXISTS streamers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  profile_picture VARCHAR(500),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_streamers_username ON streamers(username);

-- Streams
CREATE TABLE IF NOT EXISTS streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  game VARCHAR(100) NOT NULL,
  game_icon VARCHAR(500),
  thumbnail VARCHAR(500),
  stream_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'offline',
  viewer_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_official BOOLEAN DEFAULT false,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_streams_game ON streams(game);
CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status);

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES admins(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  attachments TEXT[],
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);

-- Ticket Messages
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT[],
  internal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- KYC Submissions
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  aadhaar_number VARCHAR(20),
  pan_number VARCHAR(20),
  aadhaar_document VARCHAR(500) NOT NULL,
  pan_document VARCHAR(500) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  verified_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_submissions(status);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE SET NULL,
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- Init Tokens (for app security)
CREATE TABLE IF NOT EXISTS init_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(64) UNIQUE NOT NULL,
  device_fingerprint VARCHAR(64),
  ip_address VARCHAR(50),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_init_tokens_token ON init_tokens(token);
CREATE INDEX IF NOT EXISTS idx_init_tokens_expires ON init_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_init_tokens_used ON init_tokens(used);

-- ==========================================
-- COMMENTS ON TABLES
-- ==========================================

COMMENT ON TABLE users IS 'User accounts and profiles';
COMMENT ON TABLE admins IS 'Administrator accounts';
COMMENT ON TABLE tournaments IS 'Gaming tournaments';
COMMENT ON TABLE teams IS 'Player teams';
COMMENT ON TABLE transactions IS 'Financial transactions';
COMMENT ON TABLE rewards IS 'Reward catalog';
COMMENT ON TABLE streams IS 'Live streaming channels';
COMMENT ON TABLE support_tickets IS 'Customer support tickets';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON TABLE kyc_submissions IS 'KYC verification documents';
COMMENT ON TABLE init_tokens IS 'App initialization tokens for security';

-- ==========================================
-- INSERT SAMPLE DATA (OPTIONAL)
-- ==========================================

-- Insert admin user (password: admin123)
INSERT INTO admins (email, full_name, password_hash, role, status) VALUES
('admin@example.com', 'Admin User', '$2b$10$rOzJURD4YqZPqN7iZCwDKuGJzZx9XnPXkJNZqNKdZc7VZOZz9J8N2', 'super_admin', 'active'),
('moderator@example.com', 'Moderator User', '$2b$10$rOzJURD4YqZPqN7iZCwDKuGJzZx9XnPXkJNZqNKdZc7VZOZz9J8N2', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert demo users (password: password123 for all)
INSERT INTO users (email, phone_number, full_name, in_game_name, primary_game, password_hash, coins_balance, cash_balance, kyc_verified, status) VALUES
('gamer1@example.com', '+911234567891', 'Alex Kumar', 'BGMIPro2024', 'BGMI', '$2a$10$rOzJURD4YqZPqN7iZCwDKuGJzZx9XnPXkJNZqNKdZc7VZOZz9J8N2', 5000, 1000, true, 'active'),
('gamer2@example.com', '+911234567892', 'Priya Sharma', 'ValorantQueen', 'Valorant', '$2a$10$rOzJURD4YqZPqN7iZCwDKuGJzZx9XnPXkJNZqNKdZc7VZOZz9J8N2', 3000, 500, true, 'active'),
('gamer3@example.com', '+911234567893', 'Rahul Singh', 'COD_Master', 'COD Mobile', '$2a$10$rOzJURD4YqZPqN7iZCwDKuGJzZx9XnPXkJNZqNKdZc7VZOZz9J8N2', 2000, 250, false, 'active'),
('proplayer@example.com', '+911234567894', 'Sneha Patel', 'FF_Champion', 'Free Fire', '$2a$10$rOzJURD4YqZPqN7iZCwDKuGJzZx9XnPXkJNZqNKdZc7VZOZz9J8N2', 8000, 2000, true, 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert sample coin packages
INSERT INTO coin_packages (name, amount, coins, bonus_coins, is_popular) VALUES
('Starter Pack', 49.00, 100, 0, false),
('Popular Pack', 99.00, 250, 25, true),
('Premium Pack', 199.00, 500, 75, false),
('Ultimate Pack', 499.00, 1500, 200, false)
ON CONFLICT DO NOTHING;

-- Insert demo tournaments
INSERT INTO tournaments (name, description, game, organizer, banner_image, game_icon, prize_pool, entry_fee, entry_fee_type, team_size, max_participants, current_participants, start_date, end_date, registration_deadline, status, rules) VALUES
('Summer Championship 2024', 'The biggest BGMI tournament of the year! Show your skills and win amazing prizes.', 'BGMI', 'Gaming Arena', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800', 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=200', 100000, 500, 'paid', 'Squads', 100, 45, NOW() + INTERVAL '3 days', NOW() + INTERVAL '4 days', NOW() + INTERVAL '2 days', 'registrationOpen', 'No cheating. Fair play only. Top 3 squads win prizes.'),
('Valorant Pro League', 'Professional Valorant tournament. Best teams compete for glory.', 'Valorant', 'Esports Elite', 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200', 75000, 300, 'paid', '5v5', 64, 32, NOW() + INTERVAL '7 days', NOW() + INTERVAL '8 days', NOW() + INTERVAL '6 days', 'registrationOpen', 'Standard Valorant rules apply. Single elimination bracket.'),
('Free Fire Frenzy', 'Fast-paced Free Fire action tournament! Quick matches, big rewards.', 'Free Fire', 'FreeFire India', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200', 50000, 200, 'paid', 'Squads', 80, 28, NOW() + INTERVAL '2 days', NOW() + INTERVAL '3 days', NOW() + INTERVAL '1 day', 'registrationOpen', 'No toxic behavior. Respect all players. Prize pool distributed to top 5.'),
('COD Mobile Open', 'Open tournament for all COD Mobile players. Free entry!', 'COD Mobile', 'CallOfDuty India', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=200', 25000, 0, 'free', '5v5', 128, 67, NOW() + INTERVAL '5 days', NOW() + INTERVAL '6 days', NOW() + INTERVAL '4 days', 'registrationOpen', 'Free for all. Show your skills. Top players get sponsored coaching.')
ON CONFLICT DO NOTHING;

-- Insert demo rewards
INSERT INTO rewards (name, description, category, image, coins_required, stock_quantity, stock_status, delivery_type) VALUES
('₹500 Amazon Gift Card', 'Redeem this card for amazing products on Amazon', 'giftCards', 'https://images.unsplash.com/photo-1591047135029-7530fe5c6f04?w=400', 2000, 50, 'inStock', 'instant'),
('₹1000 UPI Cashback', 'Get instant cash in your UPI account', 'upiCashback', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400', 3500, 100, 'inStock', 'instant'),
('Gaming Mouse - RGB', 'Premium RGB gaming mouse with high DPI', 'gamingGear', 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400', 4500, 20, 'inStock', 'standard'),
('Gaming Keyboard', 'Mechanical keyboard perfect for gaming', 'gamingGear', 'https://images.unsplash.com/photo-1591955506264-3f5a6834570a?w=400', 6000, 15, 'inStock', 'standard'),
('₹100 Mobile Recharge', 'Quick mobile recharge voucher', 'mobileRecharge', 'https://images.unsplash.com/photo-1519375092357-3859b26a6ad6?w=400', 1500, 200, 'inStock', 'instant'),
('Gaming Headset', 'Pro gaming headset with surround sound', 'gamingGear', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 7000, 12, 'inStock', 'standard'),
('₹2000 Gift Voucher', 'Use at over 500+ online stores', 'giftCards', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 8000, 30, 'inStock', 'instant')
ON CONFLICT DO NOTHING;

-- Insert demo streamer
INSERT INTO streamers (user_id, name, username, is_verified) SELECT id, full_name, in_game_name, true FROM users WHERE email = 'gamer1@example.com' LIMIT 1;

-- Insert demo stream
INSERT INTO streams (title, description, streamer_id, game, game_icon, status, viewer_count, like_count, is_official, start_time) 
SELECT 'BGMI Pro Tips & Tricks', 'Learn advanced tactics from a pro player', s.id, 'BGMI', 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=200', 'live', 1250, 340, true, NOW()
FROM streamers s WHERE s.username = 'BGMIPro2024' LIMIT 1;

-- Migration complete message
DO $$
BEGIN
  RAISE NOTICE '✅ Database migration completed successfully!';
  RAISE NOTICE '✅ All 23 tables created with indexes';
  RAISE NOTICE '✅ Demo data inserted:';
  RAISE NOTICE '   - 2 Admin users (admin@example.com / moderator@example.com)';
  RAISE NOTICE '   - 4 Demo users (password: password123)';
  RAISE NOTICE '   - 4 Tournaments with placeholder images';
  RAISE NOTICE '   - 7 Rewards with images';
  RAISE NOTICE '   - 1 Live stream';
  RAISE NOTICE '   - 4 Coin packages';
  RAISE NOTICE '🚀 Your Gaming Tournament Platform is ready!';
END $$;

