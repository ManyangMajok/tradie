import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from './Layout';
import { ResourceProps, Value, buttonClass, linkClass } from './types';
interface Props extends ResourceProps {record: Record<string,Value>; recordId:number|null}
export default function Form({resource,singular,fields,navigation,record,recordId}: Props) {
    const {data,setData,post,put,processing,errors}=useForm<Record<string,Value>>(record);
    const title=`${recordId ? 'Edit' : 'Add'} ${singular}`;
    const controlClass='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-brand-600';
    return <Layout navigation={navigation}>
        <Head title={title} /><Link href={`/admin/${resource}`} className={linkClass}>← Back to list</Link><h1 className="mt-4 text-balance text-3xl font-semibold">{title}</h1>
        <form className="mt-6 max-w-3xl space-y-5 rounded-3xl border border-gray-100 bg-white p-5 sm:p-6" aria-busy={processing} onSubmit={event=>{event.preventDefault();if (recordId) put(`/admin/${resource}/${recordId}`); else post(`/admin/${resource}`);}}>
            {Object.keys(errors).length>0 && <div role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">Please correct the errors below.{errors.record && <p>{errors.record}</p>}</div>}
            {fields.map((field,index)=>{
                const required=field.required || (field.type==='password' && !recordId);
                const describedBy=[field.help ? `${field.name}-help` : '',errors[field.name] ? `${field.name}-error` : ''].filter(Boolean).join(' ') || undefined;
                const common={id:field.name,name:field.name,required,'aria-invalid':!!errors[field.name],'aria-describedby':describedBy};
                return <div key={field.name}>
                    {field.section && fields[index-1]?.section !== field.section && <h2 className="mb-4 border-t border-gray-200 pt-5 text-balance text-lg font-semibold">{field.section}</h2>}
                    <label htmlFor={field.name} className="mb-1 block text-sm font-medium">{field.label}{required ? ' *' : ' (optional)'}</label>
                    {field.type==='select' ? <select {...common} value={String(data[field.name] ?? '')} onChange={event=>setData(field.name,event.target.value)} className={controlClass}><option value="">Select {field.label.toLowerCase()}</option>{field.options?.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>
                    : field.type==='textarea' ? <textarea {...common} value={String(data[field.name] ?? '')} onChange={event=>setData(field.name,event.target.value)} maxLength={field.max} rows={4} className={controlClass} />
                    : field.type==='checkbox' ? <input {...common} type="checkbox" checked={Boolean(data[field.name])} onChange={event=>setData(field.name,event.target.checked)} className="size-5 accent-orange-600" />
                    : <input {...common} type={field.type} value={String(data[field.name] ?? '')} onChange={event=>setData(field.name,event.target.value)} maxLength={field.type==='number' ? undefined : field.max} min={field.min} max={field.type==='number' ? field.max : undefined} autoComplete={field.type==='password' ? 'new-password' : undefined} className={controlClass} />}
                    {field.help && <p id={`${field.name}-help`} className="mt-1 text-pretty text-sm text-gray-600">{field.help}</p>}
                    {errors[field.name] && <p id={`${field.name}-error`} className="mt-1 text-sm text-red-700">{errors[field.name]}</p>}
                </div>;
            })}
            <div className="flex items-center gap-5 border-t border-gray-200 pt-5"><button type="submit" disabled={processing} className={buttonClass}>{processing ? 'Saving…' : 'Save record'}</button><Link href={`/admin/${resource}`} className={linkClass}>Cancel</Link></div>
        </form>
    </Layout>;
}
