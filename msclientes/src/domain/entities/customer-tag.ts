export interface CustomerTagProps {
  id: string;
  customerId: string;
  tagName: string;
  tagValue?: string;
  tagCategory?: string;
  color?: string;
  createdAt: Date;
}

export class CustomerTag {
  private props: CustomerTagProps;

  constructor(props: CustomerTagProps) {
    this.props = props;
    this.validate();
  }

  private validate(): void {
    if (!this.props.id) throw new Error('Tag ID is required');
    if (!this.props.customerId) throw new Error('Customer ID is required');
    if (!this.props.tagName || this.props.tagName.trim().length === 0) {
      throw new Error('Tag name is required');
    }
  }

  get id(): string { return this.props.id; }
  get customerId(): string { return this.props.customerId; }
  get tagName(): string { return this.props.tagName; }
  get tagValue(): string | undefined { return this.props.tagValue; }
  get tagCategory(): string | undefined { return this.props.tagCategory; }
  get color(): string | undefined { return this.props.color; }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      tagName: this.tagName,
      tagValue: this.tagValue,
      tagCategory: this.tagCategory,
      color: this.color,
    };
  }
}
