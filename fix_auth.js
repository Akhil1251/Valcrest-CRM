const fs = require('fs');
const file = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/actions/auth.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace forgotPasswordAction
const regex = /export async function forgotPasswordAction.*?return \{[^}]*success: true[^}]*\};\s*\}/s;
const newAction = `export async function forgotPasswordAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const otpInput = formData.get('otp') as string;
  
  if (!email) {
    return { success: false, error: 'Email address is required.' };
  }
  if (!otpInput) {
    return { success: false, error: 'Authy verification code is required.' };
  }

  const { data: user } = await supabase.from('users').select('*').ilike('email', email).single();

  if (!user) {
    return { success: false, error: 'You are not registered in the system.' };
  }

  // Rate Limiting Check (Prevent Brute Force)
  const now = Date.now();
  if (user.role !== 'super_admin' && user.locked_until && new Date(user.locked_until).getTime() > now) {
    const remainingMins = Math.ceil((new Date(user.locked_until).getTime() - now) / 60000);
    return { success: false, error: \`Account locked. Try again in \${remainingMins} minute(s).\` };
  }

  // Verify OTP
  if (!user.totp_secret) {
    return { success: false, error: 'MFA configuration missing on this account.' };
  }

  const { valid: isValid } = await verify({ token: otpInput, secret: user.totp_secret });

  if (!isValid) {
    const newCount = (user.failed_login_count || 0) + 1;
    let lockedUntil = null;
    if (user.role !== 'super_admin' && newCount >= LOCKOUT_LIMIT) {
      lockedUntil = new Date(now + LOCKOUT_TIME_MS).toISOString();
    }
    await supabase.from('users').update({ 
      failed_login_count: newCount, 
      locked_until: lockedUntil 
    }).eq('id', user.id);

    if (user.role !== 'super_admin' && newCount >= LOCKOUT_LIMIT) {
      return { success: false, error: 'Account locked due to 5 failed attempts.' };
    }
    return { success: false, error: 'Invalid authenticator code. Try again.' };
  }

  // Reset failures on success
  await supabase.from('users').update({ failed_login_count: 0, locked_until: null }).eq('id', user.id);

  // Clear existing pending requests for this user
  await supabase.from('password_reset_requests').delete().eq('user_id', user.id).eq('status', 'pending');

  // Insert new pending request
  const { error } = await supabase.from('password_reset_requests').insert({ user_id: user.id, status: 'pending' });
  if (error) {
    console.error('Insert error', error);
    return { success: false, error: 'Failed to create reset request. Try again.' };
  }

  return { 
    success: true, 
    message: 'Password reset request securely sent to the Super Admin for approval.'
  };
}

export async function checkResetStatusAction(email: string) {
  const { data: user } = await supabase.from('users').select('id').ilike('email', email).single();
  if (!user) return { approved: false };

  // Delete expired approved requests (older than 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('password_reset_requests')
    .delete()
    .eq('status', 'approved')
    .lt('approved_at', twentyFourHoursAgo);

  const { data: req } = await supabase.from('password_reset_requests')
    .select('status, id')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return { approved: req?.status === 'approved', requestId: req?.id };
}

export async function resetPasswordSecureAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const otpInput = formData.get('otp') as string;
  const password = formData.get('password') as string;
  const requestId = formData.get('requestId') as string;

  if (!email || !otpInput || !password || !requestId) {
    return { success: false, error: 'All fields are required.' };
  }

  const { data: user } = await supabase.from('users').select('*').ilike('email', email).single();
  if (!user || !user.totp_secret) return { success: false, error: 'Invalid user or MFA config.' };

  // Verify OTP again!
  const { valid: isValid } = await verify({ token: otpInput, secret: user.totp_secret });
  if (!isValid) return { success: false, error: 'Invalid authenticator code.' };

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Update password & wipe MFA secret
  await supabase.from('users').update({ 
    password_hash: hashedPassword,
    totp_secret: null,
    totp_enabled: false
  }).eq('id', user.id);

  // Mark request completed
  await supabase.from('password_reset_requests').update({ status: 'completed' }).eq('id', requestId);

  return { success: true };
}

export async function approveResetRequestAction(requestId: string) {
  const currentUser = await getSessionUser();
  if (!currentUser || currentUser.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized.' };
  }

  const { error } = await supabase.from('password_reset_requests').update({ 
    status: 'approved', 
    approved_by: currentUser.id,
    approved_at: new Date().toISOString()
  }).eq('id', requestId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}`;

if (content.match(regex)) {
  content = content.replace(regex, newAction);
  fs.writeFileSync(file, content);
  console.log('Successfully updated auth.ts');
} else {
  console.log('Regex failed to match forgotPasswordAction');
}
