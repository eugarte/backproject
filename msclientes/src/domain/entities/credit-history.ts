import { RiskLevel } from '../value-objects/customer-enums';

export interface CreditHistoryProps {
  id: string;
  customerId: string;
  creditBureau: string;
  score?: number;
  scoreDate: Date;
  reportReference?: string;
  reportData?: Record<string, unknown>;
  riskLevel?: RiskLevel;
  recommendations?: string;
  checkedBy?: string;
  checkedAt: Date;
}

export class CreditHistory {
  private props: CreditHistoryProps;

  constructor(props: CreditHistoryProps) {
    this.props = props;
    this.validate();
  }

  private validate(): void {
    if (!this.props.id) throw new Error('Credit history ID is required');
    if (!this.props.customerId) throw new Error('Customer ID is required');
    if (!this.props.creditBureau) throw new Error('Credit bureau is required');
    if (!this.props.scoreDate) throw new Error('Score date is required');
  }

  get id(): string { return this.props.id; }
  get customerId(): string { return this.props.customerId; }
  get creditBureau(): string { return this.props.creditBureau; }
  get score(): number | undefined { return this.props.score; }
  get scoreDate(): Date { return this.props.scoreDate; }
  get riskLevel(): RiskLevel | undefined { return this.props.riskLevel; }
  get recommendations(): string | undefined { return this.props.recommendations; }

  isGoodCredit(): boolean {
    if (!this.props.score) return false;
    return this.props.score >= 700;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      creditBureau: this.creditBureau,
      score: this.score,
      scoreDate: this.scoreDate,
      riskLevel: this.riskLevel,
      recommendations: this.recommendations,
      checkedAt: this.props.checkedAt,
    };
  }
}
