import { Request, Response } from 'express';
import { CreateCustomerUseCase } from '../../../application/use-cases/create-customer.use-case';
import { UpdateCustomerUseCase, DeleteCustomerUseCase, AnonymizeCustomerUseCase } from '../../../application/use-cases/update-customer.use-case';
import { GetCustomerUseCase, GetCustomerByCodeUseCase, ListCustomersUseCase } from '../../../application/use-cases/get-customer.use-case';
import { CustomerFilter } from '../../../domain/repositories/customer-repository.interface';

export class CustomerController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly deleteCustomerUseCase: DeleteCustomerUseCase,
    private readonly anonymizeCustomerUseCase: AnonymizeCustomerUseCase,
    private readonly getCustomerUseCase: GetCustomerUseCase,
    private readonly getCustomerByCodeUseCase: GetCustomerByCodeUseCase,
    private readonly listCustomersUseCase: ListCustomersUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const customer = await this.createCustomerUseCase.execute({
        ...req.body,
        createdBy: req.user?.userId,
      });
      res.status(201).json(customer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const customer = await this.updateCustomerUseCase.execute(id, {
        ...req.body,
        updatedBy: req.user?.userId,
      });
      res.status(200).json(customer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('not found')) {
        res.status(404).json({ error: message });
        return;
      }
      res.status(400).json({ error: message });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.deleteCustomerUseCase.execute(id, req.user?.userId || 'system');
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('not found')) {
        res.status(404).json({ error: message });
        return;
      }
      res.status(400).json({ error: message });
    }
  };

  anonymize = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const customer = await this.anonymizeCustomerUseCase.execute(
        id, 
        reason || 'GDPR Right to be Forgotten',
        req.user?.userId || 'system'
      );
      res.status(200).json(customer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('not found')) {
        res.status(404).json({ error: message });
        return;
      }
      res.status(400).json({ error: message });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const customer = await this.getCustomerUseCase.execute(id);
      
      if (!customer) {
        res.status(404).json({ error: 'Customer not found' });
        return;
      }
      
      res.status(200).json(customer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };

  getByCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.params;
      const customer = await this.getCustomerByCodeUseCase.execute(code);
      
      if (!customer) {
        res.status(404).json({ error: 'Customer not found' });
        return;
      }
      
      res.status(200).json(customer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const filters: CustomerFilter = {};
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.customerType) filters.customerType = req.query.customerType as string;
      if (req.query.country) filters.country = req.query.country as string;
      if (req.query.search) filters.search = req.query.search as string;
      if (req.query.tags) filters.tags = (req.query.tags as string).split(',');
      if (req.query.createdAfter) filters.createdAfter = new Date(req.query.createdAfter as string);
      if (req.query.createdBefore) filters.createdBefore = new Date(req.query.createdBefore as string);

      const result = await this.listCustomersUseCase.execute(page, limit, filters);
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };
}
