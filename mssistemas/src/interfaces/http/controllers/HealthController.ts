import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../../infrastructure/persistence/config/data-source';
import { ServiceEntity } from '../../infrastructure/persistence/entities/ServiceEntity';
import { ServiceHeartbeatEntity } from '../../infrastructure/persistence/entities/ServiceHeartbeatEntity';

export class HealthController {
  private serviceRepository: Repository<ServiceEntity>;
  private heartbeatRepository: Repository<ServiceHeartbeatEntity>;

  constructor() {
    this.serviceRepository = AppDataSource.getRepository(ServiceEntity);
    this.heartbeatRepository = AppDataSource.getRepository(ServiceHeartbeatEntity);
  }

  health = async (_req: Request, res: Response): Promise<void> => {
    try {
      // Check database
      await AppDataSource.query('SELECT 1');
      
      res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        checks: {
          database: 'healthy'
        }
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: (error as Error).message
      });
    }
  };

  dashboard = async (_req: Request, res: Response): Promise<void> => {
    try {
      const services = await this.serviceRepository.find();
      
      const serviceStatuses = await Promise.all(
        services.map(async (service) => {
          const lastHeartbeat = await this.heartbeatRepository.findOne({
            where: { service_id: service.id },
            order: { reported_at: 'DESC' }
          });
          
          let status = 'unknown';
          if (lastHeartbeat) {
            const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
            status = new Date(lastHeartbeat.reported_at) > twoMinutesAgo 
              ? lastHeartbeat.status 
              : 'unknown';
          }
          
          return {
            id: service.id,
            name: service.name,
            displayName: service.display_name,
            status,
            version: service.version,
            lastHeartbeat: lastHeartbeat?.reported_at
          };
        })
      );

      const total = services.length;
      const healthy = serviceStatuses.filter(s => s.status === 'up').length;
      const degraded = serviceStatuses.filter(s => s.status === 'degraded').length;
      const down = serviceStatuses.filter(s => s.status === 'down').length;
      const unknown = serviceStatuses.filter(s => s.status === 'unknown').length;

      res.json({
        totalServices: total,
        healthyServices: healthy,
        degradedServices: degraded,
        downServices: down,
        unknownServices: unknown,
        services: serviceStatuses
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  cleanup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { olderThanMinutes } = req.query;
      const minutes = parseInt(olderThanMinutes as string) || 60;
      const cutoff = new Date(Date.now() - minutes * 60 * 1000);
      
      const result = await this.heartbeatRepository
        .createQueryBuilder()
        .delete()
        .where('reported_at < :cutoff', { cutoff })
        .execute();
      
      res.json({ deleted: result.affected || 0 });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };
}
