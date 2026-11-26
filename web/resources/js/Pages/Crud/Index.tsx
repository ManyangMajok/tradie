import { ActionIcon } from '../../Components/ui/ActionIcon';
import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from './Layout';
import { ResourceProps, Value, display, buttonClass, linkClass } from './types';
interface Props extends ResourceProps { search: string; records: {data: ({id:number} & Record<string,Value>)[]; total: number; current_page: number; last_page: number; prev_page_url: string|null; next_page_url:string|null} }
export default function Index(props: Props) {
    const {resource,label,singular,fields,navigation,records,search}=props;
    const [query,setQuery]=useState(search);
    const columns=fields.filter(field=>field.type!=='password' && field.type!=='textarea').slice(0,4);
    return <Layout navigation={navigation}>
        <Head title={label} />
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-balance text-3xl font-semibold">{label}</h1><p className="mt-2 text-gray-600 tabular-nums">{records.total} records</p></div><Link href={`/admin/${resource}/create`} className={buttonClass}><ActionIcon name="add" inline />Add {singular}</Link></div>
        <form className="my-6 flex flex-wrap items-end gap-3" onSubmit={event=>{event.preventDefault();router.get(`/admin/${resource}`,{q:query});}}>
            <div className="min-w-0 flex-1"><label htmlFor="search" className="mb-1 block text-sm font-medium">Search {label.toLowerCase()}</label><input id="search" type="search" maxLength={100} value={query} onChange={e=>setQuery(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-brand-600" /></div>
            <button className={buttonClass}><ActionIcon name="search" inline />Search</button>{search && <Link href={`/admin/${resource}`} className={linkClass}><ActionIcon name="cancel" inline />Clear</Link>}
        </form>
        <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white">
            <table className="w-full text-left text-sm"><caption className="sr-only">{label} records</caption><thead className="border-b border-gray-200 bg-gray-50"><tr>{columns.map(field=><th scope="col" className="px-4 py-3" key={field.name}>{field.label}</th>)}<th scope="col" className="px-4 py-3">Actions</th></tr></thead><tbody>
                {records.data.map(record=><tr key={record.id} className="border-b border-gray-100 last:border-0">{columns.map(field=><td key={field.name} className="px-4 py-4 tabular-nums">{display(field,record[field.name])}</td>)}<td className="whitespace-nowrap px-4 py-4"><Link className={linkClass} href={`/admin/${resource}/${record.id}`} aria-label={`View ${singular} ${record.id}`}><ActionIcon name="view" inline />View</Link><Link className={'ml-4 '+linkClass} href={`/admin/${resource}/${record.id}/edit`} aria-label={`Edit ${singular} ${record.id}`}><ActionIcon name="edit" inline />Edit</Link></td></tr>)}
            </tbody></table>
            {!records.data.length && <div className="p-8 text-center"><p className="text-gray-600">{search ? 'No records match your search.' : 'No records yet.'}</p><Link className={'mt-3 inline-block '+linkClass} href={search ? `/admin/${resource}` : `/admin/${resource}/create`}><ActionIcon name={search ? 'cancel' : 'add'} inline />{search ? 'Clear search' : `Add ${singular}`}</Link></div>}
        </div>
        <nav aria-label="Pagination" className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm"><span className="text-gray-600 tabular-nums">Page {records.current_page} of {records.last_page}</span><div className="flex gap-4">{records.prev_page_url && <Link href={records.prev_page_url} className={linkClass}><ActionIcon name="back" inline />Previous</Link>}{records.next_page_url && <Link href={records.next_page_url} className={linkClass}><ActionIcon name="next" inline />Next</Link>}</div></nav>
    </Layout>;
}
