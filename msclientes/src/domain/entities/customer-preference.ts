export interface CustomerPreferenceProps {
  id: string;
  customerId: string;
  category: string;
  key: string;
  value?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerPreference {
  private props: CustomerPreferenceProps;

  constructor(props: CustomerPreferenceProps) {
    this.props = props;
    this.validate();
  }

  private validate(): void {
    if (!this.props.id) throw new Error('Preference ID is required');
    if (!this.props.customerId) throw new Error('Customer ID is required');
    if (!this.props.category) throw new Error('Category is required');
    if (!this.props.key) throw new Error('Key is required');
  }

  get id(): string { return this.props.id; }
  get customerId(): string { return this.props.customerId; }
  get category(): string { return this.props.category; }
  get key(): string { return this.props.key; }
  get value(): string | undefined { return this.props.value; }
  get isActive(): boolean { return this.props.isActive; }

  updateValue(value: string): void {
    this.props.value = value;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      category: this.category,
      key: this.key,
      value: this.value,
      isActive: this.isActive,
    };
  }
}
