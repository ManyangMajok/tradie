import { ActionIcon } from '../../../Components/ui/ActionIcon';
import React, {useRef,useState} from 'react';
import {Head,Link,useForm} from '@inertiajs/react';
import MemberLayout from '../../../Layouts/MemberLayout';
import {Button} from '../../../Components/ui/Button';
interface Property {id:number;label:string;address_line_1:string;suburb:{name:string}}
export default function Properties({properties}:{properties:Property[]}) {
    const dialog=useRef<HTMLDialogElement>(null);const [selected,setSelected]=useState<Property|null>(null);
    const form=useForm({property:''});
    return <MemberLayout><Head title="My properties"/><div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-balance text-2xl font-semibold">My properties</h1><Link href="/properties/create" className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white"><ActionIcon name="add" inline />Add property</Link></div>
        <div className="mt-6 space-y-4">{properties.map(property=><article key={property.id} className="rounded-xl border border-gray-200 bg-white p-5"><h2 className="text-balance font-semibold">{property.label}</h2><p className="mt-1 text-gray-600">{property.address_line_1}, {property.suburb.name}</p><div className="mt-4 flex gap-5"><Link href={`/properties/${property.id}/edit`} className="text-brand-700 underline"><ActionIcon name="edit" inline />Edit</Link><button className="text-red-700 underline" onClick={()=>{setSelected(property);form.clearErrors();dialog.current?.showModal();}}><ActionIcon name="delete" inline />Delete</button></div></article>)}</div>
        {!properties.length && <p className="mt-6 text-gray-600">Add your first property to request a fundi in your location.</p>}
        <dialog ref={dialog} role="alertdialog" aria-labelledby="delete-property-title" aria-describedby="delete-property-description" className="m-auto max-w-md rounded-xl bg-white p-6 shadow-lg backdrop:bg-black/40" onCancel={e=>{if(form.processing)e.preventDefault();}}><h2 id="delete-property-title" className="text-lg font-semibold">Delete {selected?.label}?</h2><p id="delete-property-description" className="mt-3 text-gray-600">Properties with existing jobs cannot be deleted.</p>{form.errors.property && <p role="alert" className="mt-3 text-red-700">{form.errors.property}</p>}<div className="mt-5 flex justify-end gap-3"><Button icon="cancel" autoFocus variant="secondary" disabled={form.processing} onClick={()=>dialog.current?.close()}>Cancel</Button><Button icon="delete" loading={form.processing} onClick={()=>{if(selected)form.delete(`/properties/${selected.id}`,{onSuccess:()=>dialog.current?.close()});}}>Delete property</Button></div></dialog>
    </MemberLayout>;
}
