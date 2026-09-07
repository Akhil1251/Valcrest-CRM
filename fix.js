const fs = require('fs');
const file = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/actions/crm.ts';
let content = fs.readFileSync(file, 'utf8');

const newActions = `
export async function deleteLeadAction(leadId: string) {
  const user = await getSessionUser();
  if (!user || user.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Only Super Admins can delete leads.' };
  }

  const { error } = await supabase.from('leads').delete().eq('id', leadId);
  if (error) {
    console.error('Error deleting lead:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function updateLeadAction(leadId: string, formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Only Super Admins can edit leads.' };
  }

  const updates = {
    company_name: formData.get('company_name'),
    contact_person: formData.get('contact_person'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    interested_service: formData.get('interested_service'),
    estimated_budget: formData.get('estimated_budget') ? parseFloat(formData.get('estimated_budget') as string) : null,
    notes: formData.get('notes'),
  };

  const { error } = await supabase.from('leads').update(updates).eq('id', leadId);
  if (error) {
    console.error('Error updating lead:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
`;

fs.appendFileSync(file, newActions);
console.log('Appended actions to crm.ts');
