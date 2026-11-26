<?php

namespace App\Http\Controllers\Admin;

use App\Actions\SaveCrudRecord;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DeleteRecordRequest;
use App\Http\Requests\Admin\SaveRecordRequest;
use App\Support\CrudResources;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CrudController extends Controller
{
    private function props(string $resource): array
    {
        $definition = CrudResources::definition($resource);

        return ['resource' => $resource, 'label' => $definition['label'], 'singular' => $definition['singular'], 'fields' => CrudResources::fields($resource), 'navigation' => CrudResources::navigation()];
    }

    public function dashboard()
    {
        return Inertia::render('Crud/Dashboard', ['navigation' => CrudResources::navigation(), 'counts' => collect(CrudResources::definitions())->map(fn ($definition, $key) => CrudResources::query($key)->count())]);
    }

    public function index(Request $request, string $resource)
    {
        $search = mb_substr((string) $request->query('q', ''), 0, 100);
        $query = CrudResources::query($resource);
        if ($search !== '') {
            $query->where(function ($query) use ($resource, $search) {
                foreach (CrudResources::definition($resource)['search'] as $column) {
                    $query->orWhere($column, 'like', '%'.$search.'%');
                }
            });
        }
        $records = $query->orderByDesc('id')->paginate(15)->withQueryString()->through(fn ($record) => ['id' => $record->id] + CrudResources::values($resource, $record));

        return Inertia::render('Crud/Index', $this->props($resource) + ['records' => $records, 'search' => $search]);
    }

    public function create(string $resource)
    {
        return Inertia::render('Crud/Form', $this->props($resource) + ['record' => CrudResources::values($resource, null), 'recordId' => null]);
    }

    public function show(string $resource, int $record)
    {
        $model = CrudResources::query($resource)->findOrFail($record);

        return Inertia::render('Crud/Show', $this->props($resource) + ['record' => CrudResources::values($resource, $model), 'recordId' => $record]);
    }

    public function edit(string $resource, int $record)
    {
        $model = CrudResources::query($resource)->findOrFail($record);

        return Inertia::render('Crud/Form', $this->props($resource) + ['record' => CrudResources::values($resource, $model), 'recordId' => $record]);
    }

    public function store(SaveRecordRequest $request, string $resource, SaveCrudRecord $save)
    {
        return $this->persist($request, $resource, $save);
    }

    public function update(SaveRecordRequest $request, string $resource, int $record, SaveCrudRecord $save)
    {
        return $this->persist($request, $resource, $save, $record);
    }

    private function persist(SaveRecordRequest $request, string $resource, SaveCrudRecord $save, ?int $record = null)
    {
        try {
            $model = $save->execute($resource, $request->validated(), $record);
        } catch (QueryException $exception) {
            if ($exception->getCode() !== '23000') {
                throw $exception;
            }
            throw ValidationException::withMessages(['record' => 'The record conflicts with existing data. Check unique values and selected related records.']);
        }

        return redirect("/admin/$resource/$model->id")->with('success', $record ? 'Changes saved.' : 'Record created.');
    }

    public function destroy(DeleteRecordRequest $request, string $resource, int $record)
    {
        try {
            DB::transaction(function () use ($resource, $record) {
                $model = CrudResources::query($resource)->lockForUpdate()->findOrFail($record);
                // Physical deletes allow the database's foreign keys to reject removal
                // of referenced records instead of hiding parents of existing records.
                method_exists($model, 'forceDelete') ? $model->forceDelete() : $model->delete();
            });
        } catch (QueryException $exception) {
            if ($exception->getCode() !== '23000') {
                throw $exception;
            }
            throw ValidationException::withMessages(['record' => 'This record is still in use. Remove its related records first.']);
        }

        return redirect("/admin/$resource")->with('success','Record deleted.');
    }
}
