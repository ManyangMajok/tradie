import MapPinPicker from '../../../Components/MapPinPicker';
import { ActionIcon } from '../../../Components/ui/ActionIcon';
import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import MemberLayout from '../../../Layouts/MemberLayout';
import { FormField } from '../../../Components/ui/FormField';
import { Input } from '../../../Components/ui/Input';
import { Button } from '../../../Components/ui/Button';
interface Property { latitude: number|null; longitude:number|null; id: number; label:string; address_line_1:string; address_line_2:string|null; suburb_id:number; property_type:string; access_notes:string|null }
export default function PropertyForm({property,locations}:{property:Property|null;locations:{id:number;name:string}[]}) {
    const form=useForm({latitude:property?.latitude?.toString()??'',longitude:property?.longitude?.toString()??'',label:property?.label??'',address_line_1:property?.address_line_1??'',address_line_2:property?.address_line_2??'',suburb_id:property?.suburb_id?.toString()??'',property_type:property?.property_type??'house',access_notes:property?.access_notes??''});
    return <MemberLayout><Head title={property?'Edit property':'Add property'}/><Link href="/properties" className="text-brand-700 underline"><ActionIcon name="back" inline />Back to properties</Link><h1 className="mt-4 text-balance text-2xl font-semibold">{property?'Edit property':'Add property'}</h1>
        <form className="mt-6 max-w-xl space-y-4 rounded-xl border border-gray-200 bg-white p-6" onSubmit={e=>{e.preventDefault();if(property) form.put(`/properties/${property.id}`);else form.post('/properties');}}>
            {Object.keys(form.errors).length>0 && <p role="alert" className="text-red-700">Please check the highlighted fields.</p>}
            <FormField label="Property label" error={form.errors.label} required><Input value={form.data.label} onChange={e=>form.setData('label',e.target.value)} maxLength={60}/></FormField>
            <FormField label="Street address" error={form.errors.address_line_1} required><Input value={form.data.address_line_1} onChange={e=>form.setData('address_line_1',e.target.value)} maxLength={200}/></FormField>
            <FormField label="Additional address (optional)" error={form.errors.address_line_2}><Input value={form.data.address_line_2} onChange={e=>form.setData('address_line_2',e.target.value)} maxLength={200}/></FormField>
            <FormField label="Location" error={form.errors.suburb_id} required><select value={form.data.suburb_id} onChange={e=>form.setData('suburb_id',e.target.value)} className="w-full rounded-lg border border-gray-300 p-2"><option value="">Choose location</option>{locations.map(location=><option key={location.id} value={location.id}>{location.name}</option>)}</select></FormField>
            <FormField label="Property type" error={form.errors.property_type} required><select value={form.data.property_type} onChange={e=>form.setData('property_type',e.target.value)} className="w-full rounded-lg border border-gray-300 p-2">{['house','apartment','townhouse','duplex','commercial','other'].map(type=><option key={type} value={type}>{type}</option>)}</select></FormField>
            <FormField label="Access notes (optional)" error={form.errors.access_notes}><textarea value={form.data.access_notes} onChange={e=>form.setData('access_notes',e.target.value)} rows={3} maxLength={2000} className="w-full rounded-lg border border-gray-300 p-2"/></FormField>
            <MapPinPicker title="Property pin" help="Optional: pin this property for more accurate distance estimates." latitude={form.data.latitude} longitude={form.data.longitude} errors={form.errors} onChange={(latitude,longitude)=>form.setData(data=>({...data,latitude,longitude}))} />
            <Button icon="save" type="submit" loading={form.processing}>Save property</Button>
        </form>
    </MemberLayout>;
}
