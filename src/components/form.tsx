'use client';
import {useActionState} from 'react';
import {useFormStatus} from 'react-dom';
import type {ActionResult} from '@/app/actions';
export function Submit({children='Save',className='button'}:{children?:React.ReactNode;className?:string}){const {pending}=useFormStatus();return <button className={className} disabled={pending} type="submit">{pending?'Working…':children}</button>;}
export function ActionForm({action,children,className='form',submit='Save'}:{action:(state:ActionResult,form:FormData)=>Promise<ActionResult>;children:React.ReactNode;className?:string;submit?:string}){const [state,formAction]=useActionState(action,{});return <form action={formAction} className={className}>{children}{state.error&&<p className="notice error" role="alert">{state.error}</p>}{state.success&&<p className="notice" role="status">{state.success}</p>}<Submit>{submit}</Submit></form>;}
