const axios = require("axios");

const launches = require("./launches.mongo");
const planets = require("./planets.mongo");

const SPACEX_API_URL = `https://api.spacexdata.com/v4/launches/query`;
const DEFAULT_LAUNCH_NUMBER = 100;

async function getLatestFlightNumber() {
  const latestLaunch = await launches.findOne().sort("-flightNumber");

  if (!latestLaunch) {
    return DEFAULT_LAUNCH_NUMBER;
  }
  return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
  return await launches
    .find({}, "-_id -__v")
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

async function saveLaunch(launch) {
  try {
    await launches.findOneAndUpdate(
      {
        flightNumber: launch.flightNumber,
      },
      launch,
      {
        upsert: true,
      }
    );
  } catch (err) {
    console.log(err);
  }
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error("No planet with that name");
  }

  const newFlightNumber = (await getLatestFlightNumber()) + 1;
  const newLaunch = Object.assign(launch, {
    succes: true,
    upcoming: true,
    customers: ["ZTM", "NASA"],
    flightNumber: newFlightNumber,
  });

  await saveLaunch(newLaunch);
}

async function findLaunch(filter) {
  return await launches.findOne(filter);
}

async function existsLaunchWithId(launchId) {
  return await findLaunch({ flightNumber: launchId });
}

async function abortLaunch(launchId) {
  const aborted = await launches.updateOne(
    { flightNumber: launchId },
    {
      success: false,
      upcoming: false,
    }
  );
  return aborted.modifiedCount === 1;
}

async function populateLaunches() {
  console.log("downloading launch data...");
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log("Problem downloading launch data");
    throw new Error("Launch data download failed");
  }

  const launchDocs = response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });
    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers,
    };
    await saveLaunch(launch);
  }
}

async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });
  if (firstLaunch) {
    console.log("Launch data already loaded!");
  } else {
    await populateLaunches();
  }
}

module.exports = {
  getAllLaunches,
  scheduleNewLaunch,
  abortLaunch,
  existsLaunchWithId,
  loadLaunchData,
};
