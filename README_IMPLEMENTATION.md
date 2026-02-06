# Chai POS - Tea Shop Billing App

A complete MVP POS/billing application for small tea shops in India, built with Expo, React Navigation, React Native Paper, and Supabase.

## Overview

**Chai POS** is a dark-mode POS system designed specifically for tea shop owners in Chennai and similar Indian markets. Single-user authentication, quick billing, product management, daily reports, and bulk order tracking—all optimized for fast counter operations.

### Key Features

✅ **Authentication**: Supabase email/password login with session persistence  
✅ **Quick Bill Screen**: Ad-hoc amount entry with calculator number pad  
✅ **Item Wise Bill**: Product catalog with category filters, quantity management  
✅ **Daily Report**: Real-time statistics (sales, cash vs GPay), transaction history  
✅ **Products CRUD**: Add/edit/delete menu items with categories and pricing  
✅ **Customers & Bulk Orders**: Track bulk customers and pending settlements  
✅ **Dark Theme**: Warm saffron/orange & teal colors (chai-inspired)  
✅ **Realtime Updates**: Supabase subscriptions for live transaction feed  
✅ **Settings**: Printer configuration, user account management  

---

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Bottom Tabs + Drawer)
- **UI Components**: React Native Paper (Material Design 3)
- **Database**: Supabase (PostgreSQL + Auth)
- **Language**: TypeScript
- **Forms**: React Hook Form + Yup (ready for future use)
- **Dates**: date-fns + date-fns-tz (Asia/Kolkata timezone)
- **State**: React hooks + local state

---

## Project Structure

```
tea-pos/
├── app/                           # Expo Router entry point
│   ├── _layout.tsx              # Root layout with Auth Provider
│   └── (tabs)/                  # Old tab structure (unused, kept for reference)
├── navigation/                    # Navigation structure
│   ├── RootNavigator.tsx        # Main stack navigator (Auth → Main)
│   ├── MainTabNavigator.tsx     # Drawer + Bottom Tabs
│   └── DrawerContent.tsx        # Drawer menu component
├── screens/                       # Application screens
│   ├── LoginScreen.tsx          # Email/password authentication
│   ├── DashboardScreen.tsx      # Home with daily stats
│   ├── QuickBillScreen.tsx      # Quick amount entry + number pad
│   ├── ItemWiseBillScreen.tsx   # Product-based billing
│   ├── BillReportScreen.tsx     # Daily transactions & reconciliation
│   ├── ProductsScreen.tsx       # Product CRUD
│   ├── CustomersScreen.tsx      # Customers & bulk settlement
│   └── SettingsScreen.tsx       # Printer & account settings
├── components/
│   ├── NumberPad.tsx            # Calculator number pad (0-9, +, -, ×, ÷)
│   └── ...                       # Other shared components
├── contexts/
│   └── AuthContext.tsx          # Supabase auth context
├── services/
│   └── supabase.ts              # Supabase client
├── types/
│   └── database.ts              # TypeScript types for Supabase tables
├── utils/
│   └── dateUtils.ts            # Date formatting & timezone helpers
├── constants/
│   └── theme.ts                 # Colors, spacing, typography (chai theme)
└── package.json                 # Dependencies
```

---

## Installation & Setup

### 1. Prerequisites

- Node.js 16+ with npm/yarn
- Supabase account with project created
- Expo CLI: `npm install -g expo-cli`

### 2. Clone & Install

```bash
cd /Users/tamilvedha/tea-pos-app/tea-pos
npm install
```

### 3. Configure Supabase

Update `.env` with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Database Schema

Ensure these tables exist in Supabase:

```sql
-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  category TEXT,
  unit TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  bulk_ledger_type TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table (bills)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_type TEXT NOT NULL, -- 'quick', 'products', 'mixed'
  total_amount DECIMAL NOT NULL,
  payment_mode TEXT NOT NULL, -- 'cash', 'gpay'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transaction items
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id),
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  rate DECIMAL NOT NULL,
  total DECIMAL NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bulk ledger (for bulk customers)
CREATE TABLE bulk_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  quantity INT NOT NULL,
  price_per_unit DECIMAL NOT NULL,
  total_amount DECIMAL NOT NULL,
  settled BOOLEAN DEFAULT FALSE,
  settled_on TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Run the App

```bash
npm start

# Or directly for iOS/Android
npm run ios
npm run android
```

Scan QR code with Expo Go app on your phone.

---

## User Guide

### Login
1. Use your Supabase auth credentials
2. Session persists via AsyncStorage

### Dashboard
- View today's sales total, cash, GPay
- Transaction count and items sold
- Quick access to billing screens

### Quick Bill (Tab 1)
- Add ad-hoc items with amount entry
- Use number pad (0-9, +, -, ×, ÷, .)
- Clear calculator with C button
- ✓ button to add to bill
- Select Cash or GPay payment mode
- Save bill (inserts to `transactions` table)

### Item Wise Bill (Tab 2)
- Filter products by category (Tea, Biscuit, Lunch, Milk, All)
- Tap product card to add to cart (auto-increments quantity)
- Edit quantities via stepper
- View cart table below
- Save bill with payment selection

### Bill Report (Tab 3)
- Real-time daily summary (sales, cash, GPay difference)
- All transactions for today (sortable by time)
- GPay reconciliation note
- Pull-to-refresh for live updates

### Products (Drawer → Products)
- List all products with name, category, price
- Add new product: tap "+ Add Product" button
- Edit: tap pencil icon, modifies in modal
- Delete: tap delete icon (confirmation required)

### Customers & Bulk (Drawer → Customers & Bulk)
- **Customers Tab**: Add customers (name, phone, email optional)
- **Settlement Tab**: 
  - Select customer, enter quantity & price per unit
  - Add bulk entry (saves to `bulk_ledger` with settled=false)
  - View pending entries with settle button (✓)
  - Settling updates settled=true and settled_on timestamp

### Settings (Drawer → Settings)
- Show logged-in user email
- Logout button (with confirmation)
- Placeholder for thermal printer configuration
- App information

---

## Theme

**Color Palette** (Chai-inspired):
- **Primary**: `#FF6B35` (Saffron/Orange)
- **Secondary**: `#00695C` (Teal)
- **Background**: `#121212` (Dark)
- **Surface**: `#1E1E1E` (Surface cards)
- **Text**: `#F5F5F5` (Light text)
- **Text Secondary**: `#E0E0E0` (Dimmed text)

All screens auto-dark mode; no light mode implemented.

---

## API Endpoints

All data flows via Supabase tables (no REST API built; direct table access via supabase-js client).

### Realtime Features
- **BillReportScreen**: Subscribes to `transactions` table for live updates
- Automatic refresh when new bills are saved

---

## Timezone Handling

Using `date-fns-tz` with **Asia/Kolkata** timezone:
- All dates formatted for IST locale
- `getTodayStartEnd()` returns today's midnight-to-midnight range in IST

---

## Error Handling

- Try-catch blocks on all Supabase operations
- Snackbar feedback for errors, successes
- Alert dialogs for critical actions (delete, logout, clear bill)
- Loading states on buttons and activity indicators

---

## Future Enhancements

- [ ] Thermal printer integration (ESC/POS)
- [ ] Bulk import products from CSV
- [ ] Expense tracking & P&L
- [ ] Multi-user support (manager/cashier roles)
- [ ] Offline mode with local SQLite
- [ ] QR code product entry
- [ ] WhatsApp order integration

---

## Testing Credentials

```
Email: tamil@teashop.com
Password: Test@123
```

Create this user in Supabase Auth if it doesn't exist.

---

## Build for Production

```bash
npm run build:ios
npm run build:android
```

Follow Expo documentation for app store deployment.

---

## Support

For issues or improvements:
1. Check Supabase console for data integrity
2. Review TypeScript types in `types/database.ts`
3. Verify `.env` configuration
4. Check network connectivity and Supabase status

---

## License

Private - Tea Shop POS System

---

**Built with ❤️ for Tamil's tea shop in Chennai** ☕
