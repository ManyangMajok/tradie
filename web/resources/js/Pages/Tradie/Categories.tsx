import React from 'react';
import TradieLayout from '../../Layouts/TradieLayout';
import { router } from '@inertiajs/react';
import { Card, CardBody } from '../../Components/ui/Card';
import { CheckCircle2, X } from 'lucide-react';

interface MyCategory { id: number; category_id: number; name: string; slug: string; }
interface Category { id: number; slug: string; name: string; }

interface Props {
    my_categories: MyCategory[];
    all_categories: Category[];
}

export default function Categories({ my_categories, all_categories }: Props) {
    const myIds = new Set(my_categories.map((c) => c.category_id));

    function add(categoryId: number) {
        router.post('/tradie/categories', { category_id: categoryId });
    }

    function remove(id: number) {
        router.delete(`/tradie/categories/${id}`);
    }

    return (
        <div className="max-w-lg">
            <h1 className="text-2xl font-bold text-gray-900">Trade Categories</h1>
            <p className="mt-1 text-sm text-gray-500">You'll only receive leads for the categories you select.</p>

            <Card className="mt-6">
                <CardBody>
                    <div className="grid grid-cols-2 gap-2">
                        {all_categories.map((cat) => {
                            const active = myIds.has(cat.id);
                            const myEntry = my_categories.find((c) => c.category_id === cat.id);
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => active && myEntry ? remove(myEntry.id) : add(cat.id)}
                                    className={`flex items-center justify-between gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors ${
                                        active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <span>{cat.name}</span>
                                    {active ? <X className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5 text-gray-300" />}
                                </button>
                            );
                        })}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}

Categories.layout = (page: React.ReactNode) => <TradieLayout>{page}</TradieLayout>;
