# Admin Dashboard Setup Guide

## ✅ Database Schema Created

The following tables and functions have been created:

- **`user_roles`** - Stores user role assignments (admin, free, pro, business)
- **`admin_logs`** - Audit trail for admin actions
- **`app_role`** enum - Role types
- Security functions: `has_role()`, `get_user_role()`
- Automatic role assignment trigger on user signup

## 🔐 Creating Your First Admin User

### Option 1: Using SQL (Recommended)

1. Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/nflwheveqglnxgfmimpq/sql/new)

2. Run this SQL query (replace `YOUR_USER_EMAIL@example.com` with your actual email):

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'YOUR_USER_EMAIL@example.com';

-- Copy the ID from above, then insert admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('PASTE_USER_ID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### Option 2: Update Existing User

If you already have an account and want to make it admin:

```sql
-- Replace with your actual user ID
DELETE FROM public.user_roles WHERE user_id = 'YOUR_USER_ID';
INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR_USER_ID', 'admin');
```

## 🚀 Accessing the Admin Dashboard

1. Sign in to your FixSense account at `/auth`
2. You will be automatically redirected to `/admin/users` (instead of `/dashboard`)
3. The admin panel has a distinct dark sidebar with 4 sections:
   - **Users** - Manage all users
   - **Subscriptions** - View revenue and transactions
   - **Analytics** - Growth metrics and insights
   - **Settings** - Feature controls and audit logs

## 🛡️ Security Features

### Role-Based Access Control
- Non-admin users CANNOT access `/admin/*` routes
- Attempts to access admin pages redirect to `/unauthorized`
- All admin actions are server-side validated (never trust the UI)

### Audit Trail
Every admin action is logged in the `admin_logs` table:
- User upgrades/downgrades
- Status changes (suspend/activate)
- Usage limit resets
- Emergency kill switch activations

### Row Level Security (RLS)
- Admins can view/modify all user profiles
- Regular users can only see their own data
- All queries use `has_role()` security definer function (prevents privilege escalation)

## 📊 Admin Capabilities

### User Management
- Search by email or name
- Filter by plan type (Free/Pro/Business)
- Filter by country
- **Actions per user:**
  - Upgrade to Pro or Business
  - Downgrade to Free
  - Suspend or Activate account
  - Reset usage limits

### Subscription Management
- View Monthly Recurring Revenue (MRR)
- Track active subscriptions by plan
- View Paystack transaction history
- See payment status breakdown

### Analytics Dashboard
- Total users and growth metrics
- New users today and this month
- Conversion rate (Free → Paid)
- Diagnostics usage statistics
- Top countries by user count

### System Settings
- **Feature Controls:**
  - Enable/disable video diagnostics
  - Enable/disable audio diagnostics
  - Enable/disable AI predictive maintenance
- **Emergency Kill Switch:**
  - Globally disable all diagnostics
  - Critical emergency control

## 🧪 Testing the Admin Dashboard

### Test User Management
1. Create a test free user account
2. Login as admin
3. Go to Admin → Users
4. Find the test user
5. Upgrade them to Pro
6. Check that the action is logged in Admin → Settings

### Test Emergency Controls
1. Go to Admin → Settings
2. Toggle feature switches
3. Activate Emergency Kill Switch (test mode)
4. Verify all diagnostics are disabled
5. Re-enable and verify functionality restored

## 🔒 Production Security Checklist

- [ ] Enable [Leaked Password Protection](https://supabase.com/dashboard/project/nflwheveqglnxgfmimpq/auth/policies)
- [ ] Rotate service role keys periodically
- [ ] Monitor `admin_logs` table regularly
- [ ] Review RLS policies before production launch
- [ ] Set up LogRocket for admin action monitoring
- [ ] Enable 2FA for admin accounts (Supabase Auth settings)
- [ ] Restrict admin IP addresses if possible

## 📝 Role Definitions

| Role | Description | Automatic Assignment |
|------|-------------|---------------------|
| **free** | Default tier, limited diagnostics | ✅ On signup |
| **pro** | Paid tier, unlimited diagnostics | Admin upgrade |
| **business** | Enterprise tier, multi-property | Admin upgrade |
| **admin** | Full system access, god mode | Manual SQL only |

## 🚨 Troubleshooting

### "Access Denied" when accessing admin pages
- Check that your user has the `admin` role in `user_roles` table
- Clear browser cache and log out/in again
- Verify RLS policies are enabled

### Admin actions not working
- Check browser console for errors
- Verify you're authenticated (not in incognito mode)
- Check Supabase logs for RLS policy violations

### Can't see certain users in admin panel
- Verify RLS policies allow admins to view all profiles
- Check if search/filter is hiding users
- Refresh the page

## 📚 Next Steps

1. Create your first admin account using SQL
2. Login and explore the admin dashboard
3. Test user management features
4. Review analytics and subscription data
5. Configure feature controls as needed
6. Set up monitoring and alerts

For questions or issues, check the Supabase logs and admin_logs table for debugging information.
