const fs = require('fs');
const file = 'D:/HelpVerse Projects/Portal HelpVerse/src/components/CRMPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update imports
content = content.replace(
  /updateLeadStatusAction, addFollowUpAction/,
  'updateLeadStatusAction, addFollowUpAction, deleteLeadAction, updateLeadAction'
);

// 2. Add handlers
const handlers = `
  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) return;
    setLoading(true);
    const res = await deleteLeadAction(leadId);
    if (res.success) {
      setActivePane('board');
      fetchLeads();
    } else {
      alert(res.error || 'Failed to delete lead');
      setLoading(false);
    }
  };

  const handleUpdateLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg('');
    const fd = new FormData(e.currentTarget);
    const res = await updateLeadAction(leadDetails.id, fd);
    if (res.success) {
      setActivePane('details');
      fetchDetails(leadDetails.id);
      fetchLeads();
    } else {
      setErrorMsg(res.error || 'Failed to update lead');
    }
    setFormLoading(false);
  };
`;
content = content.replace(/(const handleCreateLead = async.*?};)/s, '$1\n' + handlers);

// 3. Add edit form
const editForm = `
  const renderEditLead = () => {
    if (!leadDetails) return null;
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm animate-in fade-in duration-500">
        <button onClick={() => setActivePane('details')} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Details
        </button>
  
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center"><Target className="mr-2 text-purple-600" /> Edit Lead</h2>
  
        {errorMsg && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">{errorMsg}</div>}
  
        <form onSubmit={handleUpdateLead} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Client Information</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Company Name *</label>
                <input type="text" name="company_name" defaultValue={leadDetails.company_name} required className="w-full form-input text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact Person *</label>
                <input type="text" name="contact_person" defaultValue={leadDetails.contact_person} required className="w-full form-input text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</label>
                  <input type="email" name="email" defaultValue={leadDetails.email} className="w-full form-input text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone *</label>
                  <input type="text" name="phone_number" defaultValue={leadDetails.phone_number} required className="w-full form-input text-sm" />
                </div>
              </div>
            </div>
  
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Lead Qualification</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Interested Service *</label>
                <input type="text" name="interested_service" defaultValue={leadDetails.interested_service} required className="w-full form-input text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Est. Budget *</label>
                <input type="number" name="estimated_budget" defaultValue={leadDetails.estimated_budget} required className="w-full form-input text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Initial Notes</label>
                <textarea name="notes" defaultValue={leadDetails.notes} rows={3} className="w-full form-input text-sm resize-none" />
              </div>
            </div>
          </div>
  
          <button type="submit" disabled={formLoading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-md transition-all mt-4 cursor-pointer">
            {formLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Update Lead'}
          </button>
        </form>
      </div>
    );
  };
`;

content = content.replace(/(const renderLeadDetails = \(\) => \{)/, editForm + '\n  $1');

// 4. Update UI in renderLeadDetails
const uiTarget = `<div className="flex items-center gap-4">
              <div className="text-sm font-bold text-slate-500">Pipeline Stage:</div>`;
const uiReplacement = `<div className="flex items-center gap-4">
              {user?.role === 'super_admin' && (
                <div className="flex items-center gap-2 mr-2 border-r border-slate-200 pr-4">
                  <button onClick={() => setActivePane('edit')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-colors">Edit</button>
                  <button onClick={() => handleDeleteLead(lead.id)} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-bold transition-colors">Delete</button>
                </div>
              )}
              <div className="text-sm font-bold text-slate-500">Pipeline Stage:</div>`;

content = content.replace(uiTarget, uiReplacement);

// 5. Add rendering pane logic
content = content.replace(
  /\{activePane === 'details' && renderLeadDetails\(\)\}/,
  "{activePane === 'details' && renderLeadDetails()}\n          {activePane === 'edit' && renderEditLead()}"
);

fs.writeFileSync(file, content);
console.log('CRMPortal updated successfully.');
