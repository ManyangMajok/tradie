import { client } from './client';

export interface AvailableTradie { id: number; business_name: string; about_text?: string | null; rating_average: number | null; rating_count: number; }
export interface ChoiceQuery { property_id: number; tradie_category_id: number; urgency: string; }
export interface JobSubmission extends ChoiceQuery { custom_issue: string; description: string; selected_tradie_company_id: number; }
export function apiError(error: unknown): string {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
  return data?.errors ? Object.values(data.errors).flat().join('\n') : data?.message ?? 'Unable to connect. Check the demo server and try again.';
}
const propertyView = (p: any) => ({ ...p, type: p.property_type, address: p.address_line_1, city: p.suburb?.name, state: p.suburb?.state, postcode: p.suburb?.postcode });
const jobView = (j: any) => ({ ...j, title: j.issue_type?.name ?? j.custom_issue ?? j.category?.name, created_at: j.submitted_at, property: j.property ? propertyView(j.property) : null, tradie: j.assigned_company ? { ...j.assigned_company, company_name: j.assigned_company.business_name } : null, reviewed: Boolean(j.review) });
export const memberApi = {
  getRequestData: async () => (await client.get('/api/v1/member/jobs/create')).data,
  getLocations: async () => (await client.get('/api/v1/member/locations')).data.data,
  getAvailableTradies: async (params: ChoiceQuery): Promise<{ location: string; tradies: AvailableTradie[] }> => (await client.get('/api/v1/member/jobs/available-tradies', { params })).data,
  chooseTradie: (id: string, companyId: number) => client.post(`/api/v1/member/jobs/${id}/choose-tradie`, { selected_tradie_company_id: companyId }),
  submitJob: async (data: JobSubmission): Promise<{ public_id: string }> => (await client.post('/api/v1/member/jobs', data)).data,
  getJobs: async () => (await client.get('/api/v1/member/jobs')).data.data.map(jobView),
  getJob: async (id: string) => { const res = (await client.get(`/api/v1/member/jobs/${id}`)).data; return { ...jobView(res.data), available_tradies: res.available_tradies ?? [] }; },
  cancelJob: (id: string) => client.post(`/api/v1/member/jobs/${id}/cancel`, { reason: 'Cancelled by member' }),
  reviewJob: (id: string, data: { stars: number; review_text: string; work_completed_status: string; no_callout_fee_honoured: boolean; discount_honoured: string }) => client.post(`/api/v1/member/jobs/${id}/review`, data),
  getProperties: async () => (await client.get('/api/v1/member/properties')).data.data.map(propertyView),
  getProperty: async (id: number) => (await client.get(`/api/v1/member/properties/${id}`)).data.data,
  addProperty: (data: Record<string, unknown>) => client.post('/api/v1/member/properties', data),
  updateProperty: (id: number, data: Record<string, unknown>) => client.patch(`/api/v1/member/properties/${id}`, data),
  getMembership: async () => { const m = (await client.get('/api/v1/member/membership')).data.membership; return m ? { ...m, plan: m.plan.name, property_limit: m.plan.max_properties ?? 'Unlimited', renews_at: m.end_date } : null; },
  getSavedTradies: async () => (await client.get('/api/v1/member/saved-tradies')).data.data.map((s: any) => ({ ...s, company_name: s.company?.business_name, rating: s.company?.rating_average ?? 'Unrated', reviews_count: s.company?.rating_count ?? 0 })),
  removeSavedTradie: (id: number) => client.delete(`/api/v1/member/saved-tradies/${id}`),
  getDashboard: async () => {
    const [response, saved] = await Promise.all([client.get('/api/v1/member/dashboard'), memberApi.getSavedTradies()]);
    const d = response.data;
    return { stats: { active_jobs: d.stats.active_jobs, pending_reviews: d.stats.pending_reviews, saved_tradies: saved.length, total_properties: d.stats.properties }, recent_jobs: d.active_jobs.map(jobView) };
  },
};
