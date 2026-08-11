<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StepResource;
use App\Models\Step;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StepController extends Controller
{
    /**
     * The flow's shape - enough for the client to route between steps and
     * know what each one is. Question content is left in the database (see
     * StepResource); the columns are named explicitly so it cannot be
     * re-introduced by accident.
     */
    public function index(): AnonymousResourceCollection
    {
        return StepResource::collection(
            Step::orderBy('order')->get(['id', 'order', 'slug', 'type', 'title', 'time_limit_seconds'])
        );
    }
}
