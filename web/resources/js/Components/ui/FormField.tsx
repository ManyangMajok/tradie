import React, {useId} from 'react';
interface FormFieldProps { label:string; error?:string; required?:boolean; children:React.ReactNode; hint?:string }
interface ControlProps {id?:string;required?:boolean;'aria-invalid'?:boolean;'aria-describedby'?:string}
export function FormField({label,error,required,children,hint}:FormFieldProps) {
    const generatedId=useId();
    const child=React.isValidElement<ControlProps>(children)?children:null;
    const id=child?.props.id??generatedId;
    const description=[child?.props['aria-describedby'],error?`${id}-error`:hint?`${id}-hint`:null].filter(Boolean).join(' ')||undefined;
    return <div className="space-y-1"><label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}{required&&<span className="ml-1 text-red-700" aria-hidden="true">*</span>}</label>{child?React.cloneElement(child,{id,required:required??child.props.required,'aria-invalid':!!error,'aria-describedby':description}):children}{hint&&!error&&<p id={`${id}-hint`} className="text-xs text-gray-600">{hint}</p>}{error&&<p id={`${id}-error`} role="alert" className="text-xs text-red-700">{error}</p>}</div>;
}
