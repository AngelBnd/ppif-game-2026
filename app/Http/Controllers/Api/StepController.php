<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Step;
use Illuminate\Http\Resources\Json\JsonResource;

class StepController extends Controller
{
    public function index(): JsonResource
    {
        return JsonResource::collection(
            Step::orderBy('order')->get()
        );
    }
}
