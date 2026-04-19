import { Request, Response } from 'express';
import { AddAddressUseCase, GetCustomerAddressesUseCase } from '../../../application/use-cases/address.use-case';

export class AddressController {
  constructor(
    private readonly addAddressUseCase: AddAddressUseCase,
    private readonly getCustomerAddressesUseCase: GetCustomerAddressesUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const address = await this.addAddressUseCase.execute(id, req.body, req.user?.userId);
      res.status(201).json(address);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('not found')) {
        res.status(404).json({ error: message });
        return;
      }
      res.status(400).json({ error: message });
    }
  };

  getByCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const addresses = await this.getCustomerAddressesUseCase.execute(id);
      res.status(200).json(addresses);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };
}
