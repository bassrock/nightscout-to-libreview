import dayjs from 'dayjs'
import axios from 'axios';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(tz);

const getNightscoutToken = function (token) {
  if (token.trim() !== '') {
    return `&token=${token.trim()}`;
  }

  return '';
};

export const getNightscoutFoodEntries = async function (
  baseUrl,
  token,
  fromDate,
  toDate
) {
  const url1 = `${baseUrl}/api/v1/treatments.json?find[created_at][$gte]=${fromDate}&find[created_at][$lte]=${toDate}&find[eventType]=Meal%20Bolus&count=131072${getNightscoutToken(
    token
  )}`;
  console.log('entries url', url1);

  const response1 = await axios.get(url1, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data1 = response1.data.map((d) => {
    return {
      id: parseInt(`2${dayjs(d['created_at']).format('YYYYMMDDHHmmss')}`),
      timestamp: d['created_at'],
      carbs: d.carbs,
      absorptionTime: d.absorptionTime,
      foodType: d.foodType,
    };
  });

  const url2 = `${baseUrl}/api/v1/treatments.json?find[created_at][$gte]=${fromDate}&find[created_at][$lte]=${toDate}&find[eventType]=Carb%20Correction&count=131072${getNightscoutToken(
    token
  )}`;
  console.log('entries url', url2);

  const response2 = await axios.get(url2, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data2 = response2.data.map((d) => {
    return {
      id: parseInt(`2${dayjs(d['created_at']).format('YYYYMMDDHHmmss')}`),
      timestamp: d['created_at'],
      carbs: d.carbs,
      absorptionTime: d.absorptionTime,
      foodType: d.foodType,
    };
  });

  return [...data1, ...data2].map((e) => {
    return {
      extendedProperties: {
        factoryTimestamp: e.timestamp,
      },
      recordNumber: e.id,
      timestamp: e.timestamp,
      gramsCarbs: e.carbs,
      foodType: 'Unknown',
    };
  });
};

export const getNightscoutGlucoseEntries = async function (
  baseUrl,
  token,
  fromDate,
  toDate
) {
  const url = `${baseUrl}/api/v1/entries.json?find[dateString][$gte]=${fromDate}&find[dateString][$lte]=${toDate}&count=131072${getNightscoutToken(
    token
  )}`;
  console.log('glucose entries url', url);

  const response = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = response.data
    .filter((value, index, Arr) => index % 3 == 0)
    .map((d) => {
      return {
        id: parseInt(`1${dayjs(d.dateString).format('YYYYMMDDHHmmss')}`),
        sysTime: d.sysTime,
        dateString: d.dateString,
        sgv: d.sgv,
        delta: d.delta,
        direction: d.direction,
      };
    });

  return data.map((e) => {
    return {
      extendedProperties: {
        highOutOfRange: e.sgv >= 400 ? 'true' : 'false',
        canMerge: 'true',
        isFirstAfterTimeChange: false,
        factoryTimestamp: e.sysTime,
        lowOutOfRange: e.sgv <= 40 ? 'true' : 'false',
      },
      recordNumber: e.id,
      timestamp: e.dateString,
      valueInMgPerDl: e.sgv,
    };
  });
};

export const getNightscoutBolusInsulinEntries = async function (
  baseUrl,
  token,
  fromDate,
  toDate
) {
  const url1 = `${baseUrl}/api/v1/treatments.json?find[created_at][$gte]=${fromDate}&find[created_at][$lte]=${toDate}&find[eventType]=Correction%20Bolus&count=131072${getNightscoutToken(
    token
  )}`;
  const url2 = `${baseUrl}/api/v1/treatments.json?find[created_at][$gte]=${fromDate}&find[created_at][$lte]=${toDate}&find[eventType]=Meal%20Bolus&count=131072${getNightscoutToken(
    token
  )}`;
  

  const [response1, response2] = await Promise.all([
      axios.get(url1, {
      headers: {
        'Content-Type': 'application/json',
      },
    }), 
    axios.get(url2, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  ]);

  const responseData = [...response1.data, ...response2.data];

  return responseData.map((d) => {
    if (d.utcOffset !== 0) {
      throw Error("Not utcOffset 0")
    }

    let id = parseInt(`4${dayjs(d['created_at']).format('YYYYMMDDHHmmss')}`);
    let timestamp =  dayjs.tz(d['created_at'], "UTC");

    return {
      extendedProperties: {
        factoryTimestamp: `${timestamp.format('YYYY-MM-DDTHH:mm:ss.SSS')}Z`,
 //       action: "deleted"
      },
      recordNumber: id,
      timestamp: timestamp.tz("America/Los_Angeles").format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
      units: d.insulin,
      insulinType: 'RapidActing',
    };
  });
};

export const getNightscoutBasalInsulinEntries = async function (
  baseUrl,
  token,
  fromDate,
  toDate
) {
  const url1 = `${baseUrl}/api/v1/treatments.json?find[created_at][$gte]=${fromDate}&find[created_at][$lte]=${toDate}&find[eventType]=Temp%20Basal&count=131072${getNightscoutToken(
    token
  )}`;
  console.log('insulin entries url', url1);

  const response1 = await axios.get(url1, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response1.data.map((d) => {
    if (d.utcOffset !== 0) {
      throw Error("Not utcOffset 0")
    }

    let id = parseInt(`4${dayjs(d['created_at']).format('YYYYMMDDHHmmss')}`);
    let timestamp =  dayjs.tz(d['created_at'], "UTC");

    return {
      extendedProperties: {
        factoryTimestamp: `${timestamp.format('YYYY-MM-DDTHH:mm:ss.SSS')}Z`,
 //       action: "deleted"
      },
      recordNumber: id,
      timestamp: timestamp.tz("America/Los_Angeles").format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
      units: d.absolute,
      insulinType: 'LongActing',
      // duration: d.duration,
    };
  });
};
