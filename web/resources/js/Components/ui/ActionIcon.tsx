import React from 'react';
import { Plus, Pencil, Trash2, Save, Search, Eye, X, ArrowLeft, ArrowRight, KeyRound, LogIn, LogOut, Send, RefreshCw, CreditCard, Check, CircleCheck, Truck, Play, FileCheck, Phone, Calendar, MapPin, Wrench, House, Star, Clock } from 'lucide-react';

const icons = {
    add: Plus, edit: Pencil, delete: Trash2, save: Save, search: Search,
    view: Eye, cancel: X, back: ArrowLeft, next: ArrowRight, password: KeyRound,
    login: LogIn, logout: LogOut, send: Send, refresh: RefreshCw, billing: CreditCard,
    accept: Check, complete: CircleCheck, travel: Truck, start: Play, report: FileCheck,
    phone: Phone, calendar: Calendar, location: MapPin, trade: Wrench, property: House, review: Star, urgency: Clock,
};
export type ActionIconName = keyof typeof icons;

/** Decorative icons accompany visible action labels; they never replace them. */
export function ActionIcon({ name, inline = false }: { name: ActionIconName; inline?: boolean }) {
    const Icon = icons[name];
    return <Icon aria-hidden="true" focusable="false" className={inline ? 'mr-2 inline-block size-4 shrink-0 align-middle' : 'size-4 shrink-0'} />;
}
