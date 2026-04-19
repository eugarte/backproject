export interface DomainEvent {
  eventName: string;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  correlationId?: string;
}

export class CustomerCreatedEvent implements DomainEvent {
  eventName = 'customer.created';
  occurredAt = new Date();

  constructor(
    public aggregateId: string,
    public aggregateType: string,
    public payload: {
      customerId: string;
      customerCode: string;
      firstName: string;
      lastName: string;
      email?: string;
      createdBy?: string;
    },
    public correlationId?: string
  ) {}
}

export class CustomerUpdatedEvent implements DomainEvent {
  eventName = 'customer.updated';
  occurredAt = new Date();

  constructor(
    public aggregateId: string,
    public aggregateType: string,
    public payload: {
      customerId: string;
      changes: string[];
      updatedBy?: string;
    },
    public correlationId?: string
  ) {}
}

export class CustomerAnonymizedEvent implements DomainEvent {
  eventName = 'customer.anonymized';
  occurredAt = new Date();

  constructor(
    public aggregateId: string,
    public aggregateType: string,
    public payload: {
      customerId: string;
      reason: string;
      anonymizedAt: Date;
    },
    public correlationId?: string
  ) {}
}

export class CustomerDeletedEvent implements DomainEvent {
  eventName = 'customer.deleted';
  occurredAt = new Date();

  constructor(
    public aggregateId: string,
    public aggregateType: string,
    public payload: {
      customerId: string;
      deletedBy: string;
      deletedAt: Date;
    },
    public correlationId?: string
  ) {}
}

export class AddressAddedEvent implements DomainEvent {
  eventName = 'customer.address.added';
  occurredAt = new Date();

  constructor(
    public aggregateId: string,
    public aggregateType: string,
    public payload: {
      customerId: string;
      addressId: string;
      addressType: string;
      countryCode: string;
    },
    public correlationId?: string
  ) {}
}

export class DocumentUploadedEvent implements DomainEvent {
  eventName = 'customer.document.uploaded';
  occurredAt = new Date();

  constructor(
    public aggregateId: string,
    public aggregateType: string,
    public payload: {
      customerId: string;
      documentId: string;
      documentType: string;
      fileName: string;
    },
    public correlationId?: string
  ) {}
}

export class GdprExportRequestedEvent implements DomainEvent {
  eventName = 'gdpr.export.requested';
  occurredAt = new Date();

  constructor(
    public aggregateId: string,
    public aggregateType: string,
    public payload: {
      customerId: string;
      requestedBy: string;
      format: string;
    },
    public correlationId?: string
  ) {}
}
