import app from '../server/src/index.js';
import { initialiseInfrastructure } from '../server/src/startup/init.js';

export default async function handler(req, res) {
  await initialiseInfrastructure();
  return app(req, res);
}
