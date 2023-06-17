import * as fs from 'fs';
import dayjs from 'dayjs';
require('dotenv').config({ path: __dirname + '/../config.env' });

import { authLibreView, transferLibreView } from './functions/libre';
import {
  getNightscoutBasalInsulinEntries,
  getNightscoutBolusInsulinEntries,
} from './functions/nightscout';

const CONFIG_NAME = 'config.json';
const DEFAULT_CONFIG = {};

if (!fs.existsSync(CONFIG_NAME)) {
  fs.writeFileSync(CONFIG_NAME, JSON.stringify(DEFAULT_CONFIG));
}

const rawConfig = fs.readFileSync(CONFIG_NAME, 'utf8');
let config = JSON.parse(rawConfig);

console.log(config);

fs.writeFileSync(CONFIG_NAME, JSON.stringify(config));

(async () => {
  const fromDate = dayjs(`2022-01-01`).format('YYYY-MM-DD');

  const toDate = dayjs(`2023-06-18`).format('YYYY-MM-DD');

  console.log('transfer time span', fromDate, toDate);

  const glucoseEntries = []; // await getNightscoutGlucoseEntries(config.nightscoutUrl, config.nightscoutToken, fromDate, toDate);
  const foodEntries = []; //await getNightscoutFoodEntries(config.nightscoutUrl, config.nightscoutToken,fromDate,toDate);
  const insulinBolusEntries = await getNightscoutBolusInsulinEntries(
    config.nightscoutUrl,
    config.nightscoutToken,
    fromDate,
    toDate
  );

  const insulinBasalEntries = await getNightscoutBasalInsulinEntries(
    config.nightscoutUrl,
    config.nightscoutToken,
    fromDate,
    toDate
  );

  const insulinEntries = [...insulinBolusEntries, ...insulinBasalEntries];

  if (
    glucoseEntries.length > 0 ||
    foodEntries.length > 0 ||
    insulinEntries.length > 0
  ) {
    const auth = await authLibreView(
      config.libreUsername,
      config.librePassword,
      config.libreDevice,
      true
    );
    if (!!!auth) {
      console.log('libre auth failed!');

      return;
    }

    await transferLibreView(
      config.libreDevice,
      auth,
      glucoseEntries,
      foodEntries,
      insulinEntries
    );
  }
})();
