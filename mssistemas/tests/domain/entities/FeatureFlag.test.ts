import { FeatureFlag } from '../../src/domain/entities/FeatureFlag';

describe('FeatureFlag Entity', () => {
  it('should create a feature flag with default values', () => {
    const flag = new FeatureFlag('new-feature', 'New Feature');

    expect(flag.key).toBe('new-feature');
    expect(flag.name).toBe('New Feature');
    expect(flag.description).toBeNull();
    expect(flag.enabled).toBe(false);
    expect(flag.strategy).toBe('simple');
    expect(flag.percentage).toBeNull();
    expect(flag.targetUsers).toEqual([]);
    expect(flag.targetGroups).toEqual([]);
    expect(flag.scheduleStart).toBeNull();
    expect(flag.scheduleEnd).toBeNull();
    expect(flag.id).toBeDefined();
    expect(flag.createdAt).toBeInstanceOf(Date);
  });

  it('should create a feature flag with custom values', () => {
    const scheduleStart = new Date('2024-01-01');
    const flag = new FeatureFlag(
      'beta-feature',
      'Beta Feature',
      'Beta feature description',
      true,
      'percentage',
      10,
      ['user1', 'user2'],
      ['beta-testers'],
      scheduleStart,
      null,
      'admin'
    );

    expect(flag.key).toBe('beta-feature');
    expect(flag.enabled).toBe(true);
    expect(flag.strategy).toBe('percentage');
    expect(flag.percentage).toBe(10);
    expect(flag.targetUsers).toEqual(['user1', 'user2']);
    expect(flag.targetGroups).toEqual(['beta-testers']);
  });

  it('should update feature flag fields', () => {
    const flag = new FeatureFlag('test', 'Test');
    
    flag.update({
      name: 'Updated Name',
      enabled: true,
      percentage: 50
    });

    expect(flag.name).toBe('Updated Name');
    expect(flag.enabled).toBe(true);
    expect(flag.percentage).toBe(50);
  });

  it('should toggle enabled state', () => {
    const flag = new FeatureFlag('test', 'Test');
    
    flag.toggle();
    expect(flag.enabled).toBe(true);
    
    flag.toggle();
    expect(flag.enabled).toBe(false);
  });

  describe('evaluate', () => {
    it('should return false for disabled flag with simple strategy', () => {
      const flag = new FeatureFlag('test', 'Test');
      flag.enabled = false;
      expect(flag.evaluate()).toBe(false);
    });

    it('should return true for enabled flag with simple strategy', () => {
      const flag = new FeatureFlag('test', 'Test');
      flag.enabled = true;
      expect(flag.evaluate()).toBe(true);
    });

    it('should evaluate percentage strategy deterministically', () => {
      const flag = new FeatureFlag('test', 'Test', null, true, 'percentage', 50);
      
      // Should be consistent for the same userId
      const result1 = flag.evaluate('user-123');
      const result2 = flag.evaluate('user-123');
      expect(result1).toBe(result2);
    });

    it('should evaluate user_target strategy', () => {
      const flag = new FeatureFlag('test', 'Test', null, true, 'user_target', null, ['user-123']);
      
      expect(flag.evaluate('user-123')).toBe(true);
      expect(flag.evaluate('user-456')).toBe(false);
    });

    it('should evaluate group_target strategy', () => {
      const flag = new FeatureFlag('test', 'Test', null, true, 'group_target', null, [], ['admins']);
      
      expect(flag.evaluate('user-1', ['admins'])).toBe(true);
      expect(flag.evaluate('user-2', ['users'])).toBe(false);
    });

    it('should return false when schedule has not started', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const flag = new FeatureFlag('test', 'Test', null, true, 'schedule', null, [], [], futureDate);
      
      expect(flag.evaluate()).toBe(false);
    });

    it('should return false when schedule has ended', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      
      const flag = new FeatureFlag('test', 'Test', null, true, 'schedule', null, [], [], null, pastDate);
      
      expect(flag.evaluate()).toBe(false);
    });
  });
});
