import React from 'react';
import {Head,useForm} from '@inertiajs/react';
import MemberLayout from '../../Layouts/MemberLayout';
import {FormField} from '../../Components/ui/FormField';
import {Input} from '../../Components/ui/Input';
import {Button} from '../../Components/ui/Button';
export default function Settings({profile}:{profile:{first_name:string;last_name:string;phone:string;email:string}}) {
    const details=useForm({first_name:profile.first_name,last_name:profile.last_name,phone:profile.phone});
    const password=useForm({current_password:'',password:'',password_confirmation:''});
    return <MemberLayout><Head title="Settings"/><h1 className="text-balance text-2xl font-semibold">Settings</h1><div className="mt-6 max-w-xl space-y-6">
        <form className="space-y-4 rounded-xl border border-gray-200 bg-white p-6" onSubmit={e=>{e.preventDefault();details.patch('/settings/profile');}}><h2 className="text-lg font-semibold">Personal details</h2><p className="text-sm text-gray-600">{profile.email}</p>{(['first_name','last_name','phone'] as const).map(name=><FormField key={name} label={name==='first_name'?'First name':name==='last_name'?'Last name':'Phone'} error={details.errors[name]} required><Input value={details.data[name]} onChange={e=>details.setData(name,e.target.value)}/></FormField>)}<Button icon="save" type="submit" loading={details.processing}>Save details</Button></form>
        <form className="space-y-4 rounded-xl border border-gray-200 bg-white p-6" onSubmit={e=>{e.preventDefault();password.patch('/settings/password',{onSuccess:()=>password.reset()});}}><h2 className="text-lg font-semibold">Change password</h2>{(['current_password','password','password_confirmation'] as const).map(name=><FormField key={name} label={name==='current_password'?'Current password':name==='password'?'New password':'Confirm new password'} error={password.errors[name]} required><Input type="password" autoComplete={name==='current_password'?'current-password':'new-password'} value={password.data[name]} onChange={e=>password.setData(name,e.target.value)}/></FormField>)}<Button icon="password" type="submit" loading={password.processing}>Change password</Button></form>
    </div></MemberLayout>;
}
