import { FeatureFlag, FeatureFlagStrategy } from '../../src/domain/entities/FeatureFlag';

describe('FeatureFlag', () => {
  it('should create a feature flag with default values', () => {
    const flag = new FeatureFlag({
      key: 'new-feature',
      name: 'New Feature',
    });

    expect(flag.id).toBeDefined();
    expect(flag.key).toBe('new-feature');
    expect(flag.name).toBe('New Feature');
    expect(flag.enabled).toBe(false);
    expect(flag.strategy).toBe(FeatureFlagStrategy.SIMPLE);
    expect(flag.percentage).toBe(0);
    expect(flag.targetUsers).toEqual([]);
    expect(flag.targetGroups).toEqual([]);
  });

  it('should toggle enabled state', () => {
    const flag = new FeatureFlag({
      key: 'test',
      name: 'Test',
      enabled: false,
    });

    flag.toggle();
    expect(flag.enabled).toBe(true);

    flag.toggle();
    expect(flag.enabled).toBe(false);
  });

  it('should evaluate simple flag', () => {
    const enabledFlag = new FeatureFlag({
      key: 'enabled',
      name: 'Enabled',
      enabled: true,
      strategy: FeatureFlagStrategy.SIMPLE,
    });

    const disabledFlag = new FeatureFlag({
      key: 'disabled',
      name: 'Disabled',
      enabled: false,
      strategy: FeatureFlagStrategy.SIMPLE,
    });

    expect(enabledFlag.evaluate()).toBe(true);
    expect(disabledFlag.evaluate()).toBe(false);
  });

  it('should evaluate percentage-based flag', () => {
    const flag = new FeatureFlag({
      key: 'rollout',
      name: 'Rollout',
      enabled: true,
      strategy: FeatureFlagStrategy.PERCENTAGE,
      percentage: 50,
    });

    // Consistent hashing - same user should always get same result
    const userId1 = 'user-123';
    const userId2 = 'user-456';
    
    const result1 = flag.evaluate(userId1);
    const result2 = flag.evaluate(userId1);
    expect(result1).toBe(result2); // Consistent

    // Different user might get different result
    const result3 = flag.evaluate(userId2);
    // We can't assert specific values due to hashing, but we can verify consistency
    expect(flag.evaluate(userId2)).toBe(result3);
  });

  it('should evaluate user-targeted flag', () => {
    const flag = new FeatureFlag({
      key: 'beta',
      name: 'Beta',
      enabled: true,
      strategy: FeatureFlagStrategy.USER_TARGET,
      targetUsers: ['user-123', 'user-456'],
    });

    expect(flag.evaluate('user-123')).toBe(true);
    expect(flag.evaluate('user-789')).toBe(false);
  });

  it('should evaluate group-targeted flag', () => {
    const flag = new FeatureFlag({
      key: 'beta',
      name: 'Beta',
      enabled: true,
      strategy: FeatureFlagStrategy.GROUP_TARGET,
      targetGroups: ['beta-testers', 'admins'],
    });

    expect(flag.evaluate('user-123', ['beta-testers'])).toBe(true);
    expect(flag.evaluate('user-123', ['regular-users'])).toBe(false);
  });

  it('should respect schedule', () => {
    const futureFlag = new FeatureFlag({
      key: 'future',
      name: 'Future',
      enabled: true,
      strategy: FeatureFlagStrategy.SCHEDULE,
      scheduleStart: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
    });

    const pastFlag = new FeatureFlag({
      key: 'past',
      name: 'Past',
      enabled: true,
      strategy: FeatureFlagStrategy.SCHEDULE,
      scheduleStart: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      scheduleEnd: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
    });

    const expiredFlag = new FeatureFlag({
      key: 'expired',
      name: 'Expired',
      enabled: true,
      strategy: FeatureFlagStrategy.SCHEDULE,
      scheduleEnd: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    });

    expect(futureFlag.evaluate()).toBe(false);
    expect(pastFlag.evaluate()).toBe(true);
    expect(expiredFlag.evaluate()).toBe(false);
  });

  it('should handle service overrides', () => {
    const flag = new FeatureFlag({
      key: 'test',
      name: 'Test',
      enabled: true,
    });

    flag.addServiceOverride('service-1', false);
    flag.addServiceOverride('service-2', true);

    const override1 = flag.getServiceOverride('service-1');
    expect(override1?.isEnabled).toBe(false);

    const override2 = flag.getServiceOverride('service-2');
    expect(override2?.isEnabled).toBe(true);
  });
});