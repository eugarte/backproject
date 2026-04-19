import { Express } from 'express';
import catalogRoutes from './catalogRoutes';
import serviceRoutes from './serviceRoutes';
import configurationRoutes from './configurationRoutes';
import secretRoutes from './secretRoutes';
import featureFlagRoutes from './featureFlagRoutes';

export const setupRoutes = (app: Express): void => {
  const apiPrefix = '/api/v1';

  app.use(`${apiPrefix}/catalogs`, catalogRoutes);
  app.use(`${apiPrefix}/services`, serviceRoutes);
  app.use(`${apiPrefix}/configurations`, configurationRoutes);
  app.use(`${apiPrefix}/secrets`, secretRoutes);
  app.use(`${apiPrefix}/feature-flags`, featureFlagRoutes);
};