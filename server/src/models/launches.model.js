const axios = require('axios');

const launches = require('./launches.mongo');
const planets = require('./planets.mongo');

const DEFAULT_FLIGHT_NUMBER = 100;
const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function findLaunch(filter) {

    return await launches.findOne(filter);

}

async function hasLaunchById(flightNumber) {
    return await findLaunch({
        flightNumber: flightNumber
    });
}

async function populateLanches() {

    console.log('Downloading launch data...');

    const responce = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: 'rocket',
                    select: {
                        name: 1
                    }
                }, 
                {
                    path: 'payloads',
                    select: {
                        customers: 1
                    }
                }
            ]
        } 
    });

    if (responce.status != 200) {
        console.log('Problem downloading launch data');
        throw new Error('Launch data download failed ');
    };

    const launchDocs = responce.data.docs;
    launchDocs.forEach(launchDoc => {

        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => {
            return payload.customers;
        })

        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['namr'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers: customers 
        };

        saveLaunch(launch);

    });

}

async function loadLaunchData() {
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        mission: 'FalconSat',
    });
    if (firstLaunch) {
        console.log('Launch data already loaded');
        return;
    } else {
        populateLanches();
    };

}

async function getLatestFlightNumber() {
    const latestLunch = await launches
        .findOne()
        .sort('-flightNumber');

    if (!latestLunch) {
        return DEFAULT_FLIGHT_NUMBER; 
    } else {
        return latestLunch.flightNumber;
    }
}

async function getAllLaunches(skip, limit) {
    return await launches.find({}, 
        { '_id':0, '__v':0})
        .sort({ flightNumber:1 })
        .skip(skip)
        .limit(limit);
}

async function addNewLaunch(launch) {

    const planet = await planets.findOne({
        keplerName: launch.target,
    })

    if (!planet) {
        throw new Error('No matching planet find');
    }

    latestFlightNumber = await getLatestFlightNumber() + 1;
    
    const newLaunch = Object.assign(launch, {
        flightNumber: latestFlightNumber,
        customers: ['ZTM', 'NASA'],
        upcoming: true,
        success: true,
        });

    await saveLaunch(newLaunch);

    return newLaunch;
}

async function saveLaunch(launch) {

    await launches.findOneAndUpdate({
        flightNumber: launch.flightNumber
    }, launch, {
        upsert: true
    })
}

async function abortLaunches(flightNumber) {

    const aborted = await launches.updateOne({
        flightNumber: flightNumber
    },{
        upcoming: false,
        success: false
    });

    console.log(aborted);

    return aborted.modifiedCount === 1;

}

module.exports = {
    getAllLaunches,
    addNewLaunch,
    abortLaunches,
    hasLaunchById,
    loadLaunchData,
};