import { ActionIcon } from '../../Components/ui/ActionIcon';
import React, { useRef } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Layout from './Layout';
import { ResourceProps, Value, display, buttonClass, linkClass } from './types';
interface Props extends ResourceProps {record:Record<string,Value>; recordId:number}
export default function Show({resource,singular,fields,navigation,record,recordId}: Props) {
    const {flash}=usePage().props as {flash?: {setup_url?:string}};
    const access=useForm({});
    const dialog=useRef<HTMLDialogElement>(null);
    const {delete:destroy,processing,errors,clearErrors}=useForm({record:''});
    const title=`${singular.charAt(0).toUpperCase()+singular.slice(1)} #${recordId}`;
    return <Layout navigation={navigation}>
        <Head title={title} /><Link href={`/admin/${resource}`} className={linkClass}><ActionIcon name="back" inline />Back to list</Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><h1 className="text-balance text-3xl font-semibold">{title}</h1><div className="flex items-center gap-5"><Link href={`/admin/${resource}/${recordId}/edit`} className={buttonClass}><ActionIcon name="edit" inline />Edit record</Link><button type="button" onClick={()=>{clearErrors();dialog.current?.showModal();}} className="font-medium text-red-700 underline-offset-4 hover:underline focus-visible:outline-2"><ActionIcon name="delete" inline />Delete</button></div></div>
        {(resource==='people' || resource==='fundis') && <section className="mt-5 rounded-3xl border border-gray-100 bg-white p-5"><h2 className="text-lg font-semibold">Account access</h2><p className="mt-2 text-sm text-gray-600">Create a private link for this person to set their password, then sign in to their own dashboard. The link expires in 60 minutes.</p><button type="button" className={'mt-3 '+buttonClass} disabled={access.processing} onClick={()=>access.post(`/admin/${resource}/${recordId}/password-link`)}><ActionIcon name="password" inline />{access.processing?'Creating link…':'Create password setup link'}</button>{flash?.setup_url && <div className="mt-4"><label htmlFor="setup-link" className="block text-sm font-medium">Share this link privately</label><input id="setup-link" readOnly value={flash.setup_url} onFocus={event=>event.target.select()} className="mt-1 w-full rounded-lg border border-gray-300 p-2"/></div>}</section>}
        <dl className="mt-6 max-w-3xl divide-y divide-gray-100 rounded-3xl border border-gray-100 bg-white px-5 sm:px-6">{fields.filter(field=>field.type!=='password').map(field=><div key={field.name} className="grid gap-2 py-4 sm:grid-cols-3"><dt className="font-medium text-gray-600">{field.label}</dt><dd className="whitespace-pre-wrap break-words tabular-nums sm:col-span-2">{display(field,record[field.name])}</dd></div>)}</dl>
        <dialog ref={dialog} role="alertdialog" aria-labelledby="delete-title" aria-describedby="delete-description" className="m-auto w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-lg backdrop:bg-black/40" onCancel={event=>{if(processing) event.preventDefault();}}>
            <h2 id="delete-title" className="text-balance text-xl font-semibold">Delete this {singular}?</h2><p id="delete-description" className="mt-3 text-pretty text-gray-600">{resource === 'fundis' ? 'This permanently removes the fundi and their business, if present. Records still used elsewhere cannot be deleted.' : 'This permanently removes the record. Records still used elsewhere cannot be deleted.'}</p>
            {errors.record && <p role="alert" className="mt-4 text-red-700">{errors.record}</p>}
            <div className="mt-6 flex justify-end gap-4"><button autoFocus disabled={processing} onClick={()=>dialog.current?.close()} className="rounded-lg border border-gray-300 px-4 py-2 focus-visible:outline-2"><ActionIcon name="cancel" inline />Cancel</button><button disabled={processing} onClick={()=>destroy(`/admin/${resource}/${recordId}`,{onSuccess:()=>dialog.current?.close()})} className="rounded-lg bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800 focus-visible:outline-2 disabled:opacity-50"><ActionIcon name="delete" inline />{processing ? 'Deleting…' : 'Delete record'}</button></div>
        </dialog>
    </Layout>;
}
