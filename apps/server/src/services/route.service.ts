import { IRoutingAdapter } from '../routing/routing.interface';
import { RoutePlanRepository } from '../repositories/route-plan.repository';
import { CalculateRouteRequestSchema, OptimizeTripRequestSchema, SaveRoutePlanSchema, CalculateRouteRequest, OptimizeTripRequest } from '@equipnav/contracts';

export class RouteService {
  constructor(
    private routingAdapter: IRoutingAdapter,
    private routePlanRepo: RoutePlanRepository
  ) {}

  public getEngineInfo() {
    return {
      available: this.routingAdapter.isAvailable(),
      engine: this.routingAdapter.getEngineName(),
    };
  }

  public async calculateRoute(input: unknown) {
    const req = CalculateRouteRequestSchema.parse(input);
    const coordinates = [req.origin, ...(req.waypoints || []), req.destination];
    return this.routingAdapter.calculateRoute({ coordinates });
  }

  public async optimizeTrip(input: unknown) {
    const req = OptimizeTripRequestSchema.parse(input);
    const coordinates = [
      req.origin,
      ...req.stops.map(s => s.coordinate),
      req.destination
    ];

    const result = await this.routingAdapter.optimizeTrip({
      coordinates,
      source: req.fix_origin ? 'first' : 'any',
      destination: req.fix_destination ? 'last' : 'any',
    });

    return {
      ...result,
      stops: req.stops,
      disclaimer: 'Calculated visit order based on road distance network heuristic (Not absolute mathematical global optimum).'
    };
  }

  public saveRoutePlan(input: unknown) {
    const validated = SaveRoutePlanSchema.parse(input);
    return this.routePlanRepo.create(validated);
  }

  public getAllRoutePlans() {
    return this.routePlanRepo.findAll();
  }

  public getRoutePlanById(id: number) {
    const plan = this.routePlanRepo.findById(id);
    if (!plan) {
      throw new Error(`ID가 ${id}인 방문 계획을 찾을 수 없습니다.`);
    }
    return plan;
  }

  public deleteRoutePlan(id: number) {
    const ok = this.routePlanRepo.delete(id);
    if (!ok) {
      throw new Error(`ID가 ${id}인 방문 계획을 삭제할 수 없습니다.`);
    }
    return true;
  }
}
